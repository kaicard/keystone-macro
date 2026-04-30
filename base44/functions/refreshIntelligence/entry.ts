import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JBLANKED_API_KEY = Deno.env.get('JBLANKED_API_KEY');

// Generate a stable slug from the SOURCE event (not LLM headline) — prevents duplicates across runs
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

// Map currency → beat/category
function currencyToBeat(currency) {
  if (currency === 'USD') return { beat: 'us_economy', category: 'US Economy' };
  if (currency === 'GBP') return { beat: 'uk_economy', category: 'UK Economy' };
  if (currency === 'EUR') return { beat: 'eu_economy', category: 'EU Economy' };
  if (currency === 'CAD') return { beat: 'macro', category: 'Macro' };
  if (currency === 'JPY') return { beat: 'macro', category: 'Macro' };
  return { beat: 'macro', category: 'Macro' };
}

// Sentiment from Quality/Outcome
function deriveSentiment(event) {
  const quality = (event.Quality || '').toLowerCase();
  const outcome = (event.Outcome || '').toLowerCase();
  if (quality.includes('good')) return 'positive';
  if (quality.includes('bad')) return 'negative';
  if (outcome.includes('actual > forecast') || outcome.includes('actual > previous')) return 'positive';
  if (outcome.includes('actual < forecast') || outcome.includes('actual < previous')) return 'negative';
  return 'neutral';
}

// Parse jblanked date "YYYY.MM.DD HH:MM:SS" → ISO
function parseJBDate(dateStr) {
  if (!dateStr) return null;
  try {
    // Format: "2026.04.29 13:30:00"
    const clean = dateStr.replace(/\./g, '-').replace(' ', 'T') + 'Z';
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (_) {}
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const londonDate = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
    const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const batchId = `batch_${now.toISOString()}`;

    // ── Fetch existing items to deduplicate ───────────────────────────────────
    const existing = await base44.asServiceRole.entities.IntelligenceItem.list('-published_at', 500);
    const cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const recentExisting = (existing || []).filter(i => (i.published_date || '') >= cutoffDate);
    const existingSlugs = new Set(recentExisting.map(i => i.slug));
    const existingHeadlines = new Set(recentExisting.map(i => (i.headline || '').toLowerCase().slice(0, 50)));

    // ── STEP 1: Pull today's real economic events from jblanked (3 sources) ──
    const headers = {
      'Authorization': `Api-Key ${JBLANKED_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const [mql5Res, ffRes] = await Promise.all([
      fetch('https://www.jblanked.com/news/api/mql5/calendar/today/?impact=High', { headers }),
      fetch('https://www.jblanked.com/news/api/forex-factory/calendar/today/?impact=High', { headers }),
    ]);

    const [mql5Data, ffData] = await Promise.all([
      mql5Res.ok ? mql5Res.json() : [],
      ffRes.ok ? ffRes.json() : [],
    ]);

    // Merge API events, deduplicate by normalized Name+Currency
    const seen = new Set();
    const allEvents = [...(Array.isArray(mql5Data) ? mql5Data : []), ...(Array.isArray(ffData) ? ffData : [])]
      .filter(e => {
        if (!e.Name || !e.Currency) return false;
        if ((e.Impact || '').toLowerCase() !== 'high') return false;
        const normalized = (e.Name || '')
          .toLowerCase()
          .replace(/\s+(rate|holds?|held|steady|unchanged|adjusts?|changed?|maintains?|maintained|decision|expected|forecast|actual|previous)\s*/gi, ' ')
          .replace(/\s+at\s+[\d.%\-]+.*$/i, '')
          .replace(/[()].*$/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        const key = `${normalized}-${e.Currency}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    
    // Build set of events already in DB (normalized)
    const dbEventKeys = new Set();
    for (const item of recentExisting) {
      const normalized = (item.headline || '')
        .toLowerCase()
        .replace(/\s+(held?|holds?|steady|unchanged|adjusts?|changed?|maintains?|decision)\s*/gi, ' ')
        .replace(/\s+at\s+[\d.%\-]+.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      const beat = item.beat || 'macro';
      const currency = beat.includes('us') ? 'USD' : beat.includes('uk') ? 'GBP' : beat.includes('eu') ? 'EUR' : 'XXX';
      dbEventKeys.add(`${normalized}-${currency}`);
    }
    
    // Filter to released events only, excluding those already in DB
    const releasedEvents = allEvents.filter(e => {
      if (e.Actual === null || e.Actual === undefined || e.Actual === '') return false;
      const outcome = (e.Outcome || '').toLowerCase();
      const name = (e.Name || '').toLowerCase();
      if (outcome === '' && e.Actual === 0 && e.Forecast === 0) return false;
      if (name.includes('press conference') || name.includes('speech') || name.includes('statement')) return false;
      
      const normalized = (e.Name || '')
        .toLowerCase()
        .replace(/\s+(rate|holds?|held|steady|unchanged|adjusts?|changed?|maintains?|maintained|decision)\s*/gi, ' ')
        .replace(/\s+at\s+[\d.%\-]+.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      const key = `${normalized}-${e.Currency}`;
      if (dbEventKeys.has(key)) return false;
      
      return true;
    });

    if (releasedEvents.length === 0) {
      // No high-impact data releases today yet — skip
      return Response.json({ ok: true, created: 0, skipped: 0, reason: 'no released high-impact events today', batch_id: batchId });
    }

    // ── STEP 2: LLM writes Keystone intelligence ONLY for these real events ───
    const eventList = releasedEvents.slice(0, 15).map((e, i) => {
      return `EVENT ${i + 1}:
Name: ${e.Name}
Currency: ${e.Currency}
Category: ${e.Category || ''}
Date/Time: ${e.Date || ''}
Actual: ${e.Actual}
Forecast: ${e.Forecast !== undefined ? e.Forecast : 'N/A'}
Previous: ${e.Previous !== undefined ? e.Previous : 'N/A'}
Outcome: ${e.Outcome || ''}
Strength: ${e.Strength || ''}
Quality: ${e.Quality || ''}`;
    }).join('\n\n');

    const rewriteResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the senior markets editor at Keystone Macro, an institutional macro intelligence platform. Today is ${londonDate}, ${londonTime} London time.

The following are REAL economic data releases from today, sourced from MQL5 and Forex Factory. These are the ONLY events you are allowed to write about.

CRITICAL RULES — failure to follow these means the output is rejected:
1. ONLY use the Actual, Forecast, and Previous figures provided below — do NOT invent, estimate, or reference any price levels, rates, or data points not in the source data (e.g. do NOT say "Brent at $63" or "S&P at 5,200" unless that number is in the data below)
2. Do NOT reference current asset prices, equity levels, commodity prices, or FX rates — you do not have live market data
3. Headlines must be grounded ONLY in the data event itself (e.g. "US Core CPI prints 2.8% YoY, below 3.0% forecast" — not a commentary on markets)
4. No duplication — each item must cover a distinct event; do not write two items about the same release
5. Write in the style of Bloomberg terminal alerts or FT Markets Desk — factual, concise, zero filler

${eventList}

For EACH event above, write one Keystone Macro intelligence item:
- event_index: the EVENT number (1-based integer) so we can match it to the source
- headline: max 15 words, must include the actual figure and beat/miss vs forecast where relevant
- sentiment: positive / negative / neutral (use Quality/Outcome fields — good = positive, bad = negative)
- impact: 2 sentences — state exactly what the data showed (actual vs forecast vs previous) and the direct market implication for the relevant currency/rates/asset class
- desk_view: 3 sentences — structural context, cross-asset read-through (FX, rates, equities), what to monitor in the next 48h
- what_to_watch: 3-4 specific instruments, format: "INSTRUMENT (reason); INSTRUMENT (reason)"`,
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
    });

    let created = 0;
    let skipped = 0;

    for (const item of (rewriteResult?.items || [])) {
      if (!item.headline || item.headline.length < 10) continue;

      // Match back to source event by index (1-based), fall back to sequential
      const sourceIdx = (item.event_index != null ? item.event_index - 1 : null);
      const sourceEvent = (sourceIdx != null && releasedEvents[sourceIdx]) ? releasedEvents[sourceIdx] : null;
      if (!sourceEvent) { skipped++; continue; }

      // Use stable source-event slug — this is the primary dedup key
      const slug = generateEventSlug(sourceEvent);
      if (!slug || existingSlugs.has(slug)) { skipped++; continue; }

      const headlineKey = item.headline.toLowerCase().slice(0, 50);
      if (existingHeadlines.has(headlineKey)) { skipped++; continue; }

      const { beat, category } = currencyToBeat(sourceEvent.Currency || 'USD');

      let publishedAt = parseJBDate(sourceEvent.Date) || now.toISOString();
      let publishedDate = new Date(publishedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
      if (new Date(publishedAt) > now) {
        publishedAt = now.toISOString();
        publishedDate = todayStr;
      }

      const sentiment = item.sentiment || deriveSentiment(sourceEvent);

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline:      item.headline,
        category,
        beat,
        sentiment,
        impact:        item.impact || '',
        desk_view:     item.desk_view || '',
        what_to_watch: item.what_to_watch || '',
        slug,
        published_at:   publishedAt,
        published_date: publishedDate,
        is_top_story:   false,
        batch_id:       batchId,
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
      ok: true,
      created,
      skipped,
      pruned: old.length,
      events_from_api: releasedEvents.length,
      batch_id: batchId,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});