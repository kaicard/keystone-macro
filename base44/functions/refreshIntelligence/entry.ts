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

// Normalise a headline into a set of meaningful words for similarity checking
function headlineWords(headline) {
  const stopwords = new Set(['a','an','the','is','are','was','were','in','on','at','to','of','for','and','or','but','with','as','by','from','its','it','this','that','has','have','had','be','been','will','would','could','should','may','might','more','than','up','down','per','cent','vs']);
  return new Set(
    headline.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w))
  );
}

// Returns true if two headlines share enough key words to be considered duplicates
function isTooSimilar(headlineA, existingHeadlines) {
  const wordsA = headlineWords(headlineA);
  if (wordsA.size === 0) return false;
  for (const existing of existingHeadlines) {
    const wordsB = headlineWords(existing);
    let overlap = 0;
    for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
    // If >50% of the new headline's key words match an existing one → duplicate
    if (overlap / wordsA.size > 0.5) return true;
  }
  return false;
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
    // Store full headlines for similarity checking (not just 60-char prefix)
    const existingHeadlinesFull = recentExisting.map(i => i.headline || '');
    const existingHeadlineKeys = new Set(existingHeadlinesFull.map(h => h.toLowerCase().slice(0, 60)));

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
      // Must have an actual reading
      if (e.Actual === null || e.Actual === undefined || e.Actual === '') return false;
      // Skip speeches/conferences — no hard data
      const name = (e.Name || '').toLowerCase();
      if (name.includes('press conference') || name.includes('speech') || name.includes('statement') || name.includes('testimony')) return false;
      // Skip zero/empty non-events
      if (e.Actual === 0 && e.Forecast === 0 && (e.Outcome || '') === '') return false;
      // Skip already-saved slugs
      const slug = generateEventSlug(e);
      if (existingSlugs.has(slug)) return false;
      return true;
    });

    // ── TRACK 2: Broad geopolitics / macro news — only once per day ───────────
    // Check if we already have broad news items from today to avoid re-running every 15 min
    const todayBroadItems = recentExisting.filter(i =>
      i.published_date === todayStr &&
      (i.batch_id || '').startsWith('batch_') &&
      !i.slug.match(/^(usd|gbp|eur|cad|jpy|aud|chf|nzd)-/) // not a data release slug
    );
    const shouldRunBroadNews = todayBroadItems.length < 3;

    // Cut-off: only items published within the last 24 hours are considered "recent" for the feed
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Run both tracks — Track 2 conditional
    const [dataReleasesResult, broadNewsResult] = await Promise.all([
      // Track 1: LLM writes items for real data releases (only if any new ones exist)
      releasedEvents.length > 0
        ? base44.asServiceRole.integrations.Core.InvokeLLM({
            model: 'gemini_3_flash',
            add_context_from_internet: true,
            prompt: `You are the senior markets editor at Keystone Macro, an institutional macro intelligence platform. Today is ${londonDate}, ${londonTime} London time.

The following are REAL economic data releases sourced from MQL5 and Forex Factory. Write ONLY about these — do not invent or extrapolate.

CRITICAL RULES:
1. Use ONLY the Actual, Forecast, and Previous figures provided below — never invent numbers
2. Do NOT reference current asset prices, equity index levels, or FX spot rates
3. Headline must state the exact actual figure and whether it beat or missed (e.g. "US Core CPI 2.8% YoY — misses 3.0% forecast")
4. Write in Bloomberg terminal / FT Markets Desk style — factual, precise, no filler

${releasedEvents.slice(0, 6).map((e, i) => `EVENT ${i + 1}:
Name: ${e.Name}
Currency: ${e.Currency}
Date/Time: ${e.Date || ''}
Actual: ${e.Actual}
Forecast: ${e.Forecast !== undefined ? e.Forecast : 'N/A'}
Previous: ${e.Previous !== undefined ? e.Previous : 'N/A'}
Outcome: ${e.Outcome || ''}
Quality: ${e.Quality || ''}`).join('\n\n')}

For EACH event write one item:
- event_index: 1-based index matching EVENT number above
- headline: max 15 words, must include exact actual figure and beat/miss vs forecast
- sentiment: positive / negative / neutral (based on market impact of beat vs miss)
- impact: 2 sentences — what the data showed and the direct market implication
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

      // Track 2: Broad macro/geopolitics — ONLY runs if we don't already have today's broad coverage
      shouldRunBroadNews
        ? base44.asServiceRole.integrations.Core.InvokeLLM({
            model: 'gemini_3_flash',
            add_context_from_internet: true,
            prompt: `You are a senior correspondent at Keystone Macro. Today is ${londonDate}, ${londonTime} London time.

Search the internet RIGHT NOW and find the 2 most significant breaking macro or geopolitical stories from the PAST 24 HOURS that are NEW and verifiable. You must only write about stories that:
- Are CONFIRMED real events — you can cite specific named parties, figures, governments, companies, exact percentages
- Have occurred within the last 24 hours (between ${new Date(now - 24 * 60 * 60 * 1000).toLocaleString('en-GB', { timeZone: 'Europe/London' })} and ${londonTime} London time today, ${londonDate})
- Have direct, material financial market implications (FX, rates, equities, commodities)
- Are NOT generic economic data releases (CPI, GDP, PMI, NFP etc — those are covered by a separate data feed)

STRICT RULES:
- If a story occurred more than 24 hours ago, DO NOT include it — even if it is still in the news
- If you cannot verify a story happened within the last 24 hours, DO NOT include it
- Return ZERO items rather than fabricating, recycling, or using stale news
- Each headline must include a specific date/time cue, name, country, or figure that anchors it to today

For each item:
- headline: max 15 words — must include specific names, countries, figures — NO vague language
- category: Macro / Equities / Rates / Commodities / FX / Geopolitics / Credit / Technology / US Economy / UK Economy / EU Economy
- beat: macro / equities / us_economy / uk_economy / eu_economy / rates / commodities / fx / geopolitics / credit / tech
- sentiment: positive / negative / neutral (market impact)
- impact: 2 sentences — what happened (with specifics) and the direct market implication
- desk_view: 3 sentences — context, cross-asset read-through, key risks
- what_to_watch: 2-3 instruments, format: "INSTRUMENT (reason); INSTRUMENT (reason)"`,
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
          })
        : Promise.resolve({ items: [] }),
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

      // Similarity check against existing headlines
      if (isTooSimilar(item.headline, existingHeadlinesFull)) { skipped++; continue; }

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
      existingHeadlinesFull.push(item.headline);
      created++;
    }

    // ── Save Track 2: broad news items ───────────────────────────────────────
    const validBeats = ['macro','equities','us_economy','uk_economy','eu_economy','rates','commodities','fx','geopolitics','credit','tech'];
    const validCategories = ['Macro','Equities','Rates','Commodities','FX','Geopolitics','Credit','Technology','US Economy','UK Economy','EU Economy'];

    for (const item of (broadNewsResult?.items || [])) {
      if (!item.headline || item.headline.length < 10) continue;
      // Reject items that don't feel anchored to today — require meaningful content in impact/desk_view
      if (!item.impact || item.impact.length < 40) { skipped++; continue; }
      if (!item.desk_view || item.desk_view.length < 40) { skipped++; continue; }

      // Similarity check — the key defence against duplicates
      if (isTooSimilar(item.headline, existingHeadlinesFull)) { skipped++; continue; }

      // Use a date-specific slug so it won't re-collide across days, but WILL collide within same day
      const slug = `news-${slugify(item.headline)}-${todayStr.replace(/-/g, '')}`;
      if (existingSlugs.has(slug)) { skipped++; continue; }

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
      existingHeadlinesFull.push(item.headline);
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
      broad_news_ran: shouldRunBroadNews,
      data_events: releasedEvents.length,
      batch_id: batchId,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});