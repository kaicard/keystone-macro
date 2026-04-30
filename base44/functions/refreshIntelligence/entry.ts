import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JBLANKED_API_KEY = Deno.env.get('JBLANKED_API_KEY');

function generateEventSlug(event) {
  const name = (event.Name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .trim();
  const currency = (event.Currency || '').toLowerCase();
  const datePart = (event.Date || '').replace(/[^0-9]/g, '').slice(0, 8);
  return `${currency}-${name}-${datePart}`;
}

function currencyToBeat(currency) {
  if (currency === 'USD') return { beat: 'us_economy', category: 'US Economy' };
  if (currency === 'GBP') return { beat: 'uk_economy', category: 'UK Economy' };
  if (currency === 'EUR') return { beat: 'eu_economy', category: 'EU Economy' };
  if (currency === 'CAD') return { beat: 'macro', category: 'Macro' };
  if (currency === 'JPY') return { beat: 'macro', category: 'Macro' };
  return { beat: 'macro', category: 'Macro' };
}

function deriveSentiment(event) {
  const quality = (event.Quality || '').toLowerCase();
  const outcome = (event.Outcome || '').toLowerCase();
  if (quality.includes('good')) return 'positive';
  if (quality.includes('bad')) return 'negative';
  if (outcome.includes('actual > forecast') || outcome.includes('actual > previous')) return 'positive';
  if (outcome.includes('actual < forecast') || outcome.includes('actual < previous')) return 'negative';
  return 'neutral';
}

function parseJBDate(dateStr) {
  if (!dateStr) return null;
  try {
    const clean = dateStr.replace(/\./g, '-').replace(' ', 'T') + 'Z';
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (_) {}
  return null;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 70)
    .trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const londonDate = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
    const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const batchId = `batch_${now.toISOString()}`;

    // ── Fetch existing items for deduplication ────────────────────────────────
    const existing = await base44.asServiceRole.entities.IntelligenceItem.list('-published_at', 500);
    const cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const recentExisting = (existing || []).filter(i => (i.published_date || '') >= cutoffDate);
    const existingSlugs = new Set(recentExisting.map(i => i.slug));
    const existingHeadlines = new Set(recentExisting.map(i => (i.headline || '').toLowerCase().slice(0, 60)));

    // ── TRACK 1: Real economic data releases from jblanked ────────────────────
    const jbHeaders = {
      'Authorization': `Api-Key ${JBLANKED_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const [mql5Res, ffRes] = await Promise.all([
      fetch('https://www.jblanked.com/news/api/mql5/calendar/today/?impact=High', { headers: jbHeaders }),
      fetch('https://www.jblanked.com/news/api/forex-factory/calendar/today/?impact=High', { headers: jbHeaders }),
    ]);

    const [mql5Data, ffData] = await Promise.all([
      mql5Res.ok ? mql5Res.json() : [],
      ffRes.ok ? ffRes.json() : [],
    ]);

    const seen = new Set();
    const allEvents = [...(Array.isArray(mql5Data) ? mql5Data : []), ...(Array.isArray(ffData) ? ffData : [])]
      .filter(e => {
        if (!e.Name || !e.Currency) return false;
        if ((e.Impact || '').toLowerCase() !== 'high') return false;
        const key = `${e.Name.toLowerCase().trim()}-${e.Currency}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const releasedEvents = allEvents.filter(e => {
      if (e.Actual === null || e.Actual === undefined || e.Actual === '') return false;
      const name = (e.Name || '').toLowerCase();
      if (name.includes('press conference') || name.includes('speech') || name.includes('statement')) return false;
      if (e.Actual === 0 && e.Forecast === 0 && (e.Outcome || '') === '') return false;
      const slug = generateEventSlug(e);
      if (existingSlugs.has(slug)) return false;
      return true;
    });

    // ── TRACK 2: Geopolitics / macro / markets news via LLM web search ────────
    // Run both tracks in parallel
    const [dataReleasesResult, broadNewsResult] = await Promise.all([
      // Track 1: LLM writes items for real data releases (only if any)
      releasedEvents.length > 0
        ? base44.asServiceRole.integrations.Core.InvokeLLM({
            model: 'gemini_3_flash',
            add_context_from_internet: true,
            prompt: `You are the senior markets editor at Keystone Macro, an institutional macro intelligence platform. Today is ${londonDate}, ${londonTime} London time.

The following are REAL economic data releases from today, sourced from MQL5 and Forex Factory. These are the ONLY events you are allowed to write about in this batch.

CRITICAL RULES:
1. ONLY use the Actual, Forecast, and Previous figures provided — do NOT invent any numbers
2. Do NOT reference current asset prices, equity levels, commodity prices, or FX rates
3. Headlines must state the actual figure and beat/miss (e.g. "US Core CPI prints 2.8% YoY, below 3.0% forecast")
4. Write in Bloomberg terminal / FT Markets Desk style — factual, concise, no filler

${releasedEvents.slice(0, 6).map((e, i) => `EVENT ${i + 1}:
Name: ${e.Name}
Currency: ${e.Currency}
Date/Time: ${e.Date || ''}
Actual: ${e.Actual}
Forecast: ${e.Forecast !== undefined ? e.Forecast : 'N/A'}
Previous: ${e.Previous !== undefined ? e.Previous : 'N/A'}
Outcome: ${e.Outcome || ''}
Quality: ${e.Quality || ''}`).join('\n\n')}

For EACH event, write one intelligence item:
- event_index: EVENT number (1-based)
- headline: max 15 words, include actual figure and beat/miss
- sentiment: positive / negative / neutral
- impact: 2 sentences — what data showed and direct market implication
- desk_view: 3 sentences — structural context, cross-asset read-through, what to monitor next 48h
- what_to_watch: 3-4 instruments, format: "INSTRUMENT (reason); INSTRUMENT (reason)"`,
            response_json_schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      event_index:   { type: 'number' },
                      headline:      { type: 'string' },
                      sentiment:     { type: 'string' },
                      impact:        { type: 'string' },
                      desk_view:     { type: 'string' },
                      what_to_watch: { type: 'string' },
                    }
                  }
                }
              }
            }
          })
        : Promise.resolve({ items: [] }),

      // Track 2: Broad geopolitics / macro / markets coverage
      base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        add_context_from_internet: true,
        prompt: `You are a senior correspondent at Keystone Macro, covering global macro, geopolitics, financial markets, and economic policy — in the style of the Financial Times, Bloomberg, and BBC News.

Today is ${londonDate}, ${londonTime} London time.

Search the internet RIGHT NOW for the most important breaking and developing stories across:
- Geopolitics (wars, trade disputes, sanctions, elections, diplomatic developments)
- Global macro (central bank decisions/speeches, IMF/World Bank, sovereign debt)
- Financial markets (major moves, corporate earnings surprises, M&A, IPOs)
- Economic policy (tariffs, fiscal policy, regulatory changes)
- Energy & commodities (OPEC, supply shocks, key price moves with % context)

Write 4 intelligence items on the most significant real stories happening RIGHT NOW. Each must:
- Be based on a REAL, VERIFIABLE story from today or the past 48 hours
- NOT duplicate any of these already-covered topics: GDP, CPI, FOMC, ECB, BOE rate decisions (those are covered separately)
- Include the specific facts, figures, and named parties involved
- Be written in authoritative institutional style — no fluff, no speculation

For each item:
- headline: max 15 words — specific, factual, include key figures/names
- category: one of Macro / Equities / Rates / Commodities / FX / Geopolitics / Credit / Technology / US Economy / UK Economy / EU Economy
- beat: one of macro / equities / us_economy / uk_economy / eu_economy / rates / commodities / fx / geopolitics / credit / tech
- sentiment: positive / negative / neutral (for markets)
- impact: 2 sentences — what happened and the direct financial/market implication
- desk_view: 3 sentences — broader context, cross-asset implications, key risks or catalysts ahead
- what_to_watch: 3-4 specific instruments, format: "INSTRUMENT (reason); INSTRUMENT (reason)"`,
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  headline:      { type: 'string' },
                  category:      { type: 'string' },
                  beat:          { type: 'string' },
                  sentiment:     { type: 'string' },
                  impact:        { type: 'string' },
                  desk_view:     { type: 'string' },
                  what_to_watch: { type: 'string' },
                }
              }
            }
          }
        }
      }),
    ]);

    let created = 0;
    let skipped = 0;

    // ── Save Track 1: data release items ─────────────────────────────────────
    for (const item of (dataReleasesResult?.items || [])) {
      if (!item.headline || item.headline.length < 10) continue;
      const sourceIdx = (item.event_index != null ? item.event_index - 1 : null);
      const sourceEvent = (sourceIdx != null && releasedEvents[sourceIdx]) ? releasedEvents[sourceIdx] : null;
      if (!sourceEvent) { skipped++; continue; }

      const slug = generateEventSlug(sourceEvent);
      if (!slug || existingSlugs.has(slug)) { skipped++; continue; }
      const headlineKey = item.headline.toLowerCase().slice(0, 60);
      if (existingHeadlines.has(headlineKey)) { skipped++; continue; }

      const { beat, category } = currencyToBeat(sourceEvent.Currency || 'USD');
      let publishedAt = parseJBDate(sourceEvent.Date) || now.toISOString();
      let publishedDate = new Date(publishedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
      if (new Date(publishedAt) > now) { publishedAt = now.toISOString(); publishedDate = todayStr; }

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline: item.headline, category, beat,
        sentiment: item.sentiment || deriveSentiment(sourceEvent),
        impact: item.impact || '', desk_view: item.desk_view || '',
        what_to_watch: item.what_to_watch || '',
        slug, published_at: publishedAt, published_date: publishedDate,
        is_top_story: false, batch_id: batchId,
      });
      existingSlugs.add(slug);
      existingHeadlines.add(headlineKey);
      created++;
    }

    // ── Save Track 2: broad news items ───────────────────────────────────────
    for (const item of (broadNewsResult?.items || [])) {
      if (!item.headline || item.headline.length < 10) continue;
      const headlineKey = item.headline.toLowerCase().slice(0, 60);
      if (existingHeadlines.has(headlineKey)) { skipped++; continue; }

      const slug = `news-${slugify(item.headline)}-${now.toISOString().slice(0, 10).replace(/-/g, '')}`;
      if (existingSlugs.has(slug)) { skipped++; continue; }

      const validBeats = ['macro','equities','us_economy','uk_economy','eu_economy','rates','commodities','fx','geopolitics','credit','tech'];
      const validCategories = ['Macro','Equities','Rates','Commodities','FX','Geopolitics','Credit','Technology','US Economy','UK Economy','EU Economy'];
      const beat = validBeats.includes(item.beat) ? item.beat : 'macro';
      const category = validCategories.includes(item.category) ? item.category : 'Macro';

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline: item.headline, category, beat,
        sentiment: item.sentiment || 'neutral',
        impact: item.impact || '', desk_view: item.desk_view || '',
        what_to_watch: item.what_to_watch || '',
        slug, published_at: now.toISOString(), published_date: todayStr,
        is_top_story: false, batch_id: batchId,
      });
      existingSlugs.add(slug);
      existingHeadlines.add(headlineKey);
      created++;
    }

    // ── Prune items older than 7 days ─────────────────────────────────────────
    const old = (existing || []).filter(i => (i.published_date || '') < cutoffDate);
    for (const oldItem of old) {
      await base44.asServiceRole.entities.IntelligenceItem.delete(oldItem.id);
    }

    return Response.json({
      ok: true, created, skipped,
      pruned: old.length,
      data_events: releasedEvents.length,
      batch_id: batchId,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});