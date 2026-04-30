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

    // ── Fetch today's high-impact economic releases from jblanked ─────────────
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

    // Deduplicate across the two sources by name+currency
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

    // Only process events that have already released (have an Actual figure)
    const releasedEvents = allEvents.filter(e => {
      // Must have an actual reading
      if (e.Actual === null || e.Actual === undefined || e.Actual === '') return false;
      // Skip speeches/conferences — no hard data
      const name = (e.Name || '').toLowerCase();
      if (name.includes('press conference') || name.includes('speech') || name.includes('statement') || name.includes('testimony')) return false;
      // Skip zero/empty non-events
      if (e.Actual === 0 && e.Forecast === 0 && (e.Outcome || '') === '') return false;
      // Skip already-saved slugs — this is the primary dedup gate
      const slug = generateEventSlug(e);
      if (existingSlugs.has(slug)) return false;
      return true;
    });

    if (releasedEvents.length === 0) {
      // Nothing new to process — prune old items and return early
      const old = (existing || []).filter(i => (i.published_date || '') < cutoffDate);
      for (const oldItem of old) {
        await base44.asServiceRole.entities.IntelligenceItem.delete(oldItem.id);
      }
      return Response.json({ ok: true, created: 0, skipped: 0, pruned: old.length, data_events: 0, batch_id: batchId });
    }

    // ── LLM: Write analysis for each real data release ────────────────────────
    // We pass ONLY the raw data figures — the LLM may not hallucinate numbers
    const eventsPayload = releasedEvents.slice(0, 8).map((e, i) => `EVENT ${i + 1}:
Name: ${e.Name}
Currency: ${e.Currency}
Date/Time: ${e.Date || ''}
Actual: ${e.Actual}
Forecast: ${e.Forecast !== undefined && e.Forecast !== null ? e.Forecast : 'N/A'}
Previous: ${e.Previous !== undefined && e.Previous !== null ? e.Previous : 'N/A'}
Outcome: ${e.Outcome || ''}
Quality: ${e.Quality || ''}`).join('\n\n');

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: false,
      prompt: `You are the senior markets editor at Keystone Macro. Today is ${londonDate}, ${londonTime} London time.

Below are VERIFIED economic data releases sourced directly from MQL5 and Forex Factory. Your job is to write clean, analytical intelligence items for each one.

ABSOLUTE RULES — failure to follow these will make the output unusable:
1. Use ONLY the Actual, Forecast, and Previous figures provided — NEVER invent or modify any number
2. Do NOT reference current asset prices, equity index levels, or FX spot rates
3. Do NOT add context from outside these events — no "analysts expected", no market reactions
4. Headline must state the exact actual figure and beat/miss vs forecast
5. Write in Bloomberg terminal style — factual, precise, no filler phrases

${eventsPayload}

For EACH event provide:
- event_index: the 1-based integer matching EVENT number above
- headline: max 15 words — must include exact actual figure and beat/miss (e.g. "US Core PCE 2.6% — beats 2.7% forecast")
- sentiment: positive / negative / neutral (from market perspective: beat = positive for growth data)
- impact: exactly 2 sentences — what the data print showed and the direct market implication
- desk_view: exactly 3 sentences — structural context, cross-asset read-through, what to monitor next 48h
- what_to_watch: 3 instruments max, format: "INSTRUMENT (reason); INSTRUMENT (reason)"`,
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

    for (const item of (llmResult?.items || [])) {
      if (!item.headline || item.headline.length < 10) { skipped++; continue; }

      const sourceIdx = item.event_index != null ? item.event_index - 1 : null;
      const sourceEvent = (sourceIdx != null && releasedEvents[sourceIdx]) ? releasedEvents[sourceIdx] : null;
      if (!sourceEvent) { skipped++; continue; }

      const slug = generateEventSlug(sourceEvent);
      if (!slug || existingSlugs.has(slug)) { skipped++; continue; }

      const { beat, category } = currencyToBeat(sourceEvent.Currency || 'USD');
      let publishedAt = parseJBDate(sourceEvent.Date) || now.toISOString();
      let publishedDate = new Date(publishedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
      // Don't publish future-dated items
      if (new Date(publishedAt) > now) { publishedAt = now.toISOString(); publishedDate = todayStr; }

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline:      item.headline,
        category,
        beat,
        sentiment:     item.sentiment || deriveSentiment(sourceEvent),
        impact:        item.impact || '',
        desk_view:     item.desk_view || '',
        what_to_watch: item.what_to_watch || '',
        slug,
        published_at:  publishedAt,
        published_date: publishedDate,
        is_top_story:  false,
        batch_id:      batchId,
      });

      existingSlugs.add(slug);
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