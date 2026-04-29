import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JBLANKED_API_KEY = Deno.env.get('JBLANKED_API_KEY');

function generateSlug(headline, eventTime) {
  const base = (headline || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .trim();
  const suffix = (eventTime || '').replace(/[^0-9]/g, '').slice(0, 8);
  return suffix ? `${base}-${suffix}` : base;
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

    // Merge, deduplicate by Name+Currency, keep High impact only
    const seen = new Set();
    const allEvents = [...(Array.isArray(mql5Data) ? mql5Data : []), ...(Array.isArray(ffData) ? ffData : [])]
      .filter(e => {
        if (!e.Name || !e.Currency) return false;
        if ((e.Impact || '').toLowerCase() !== 'high') return false;
        const key = `${e.Name}-${e.Currency}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    // Only include events that have actually been released (have real Actual data)
    const releasedEvents = allEvents.filter(e => {
      if (e.Actual === null || e.Actual === undefined || e.Actual === '') return false;
      // Skip if Outcome/Strength suggest no data loaded yet
      const outcome = (e.Outcome || '').toLowerCase();
      const name = (e.Name || '').toLowerCase();
      if (outcome === '' && e.Actual === 0 && e.Forecast === 0) return false;
      if (name.includes('press conference') || name.includes('speech') || name.includes('statement')) return false;
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

The following are REAL economic data releases from today, sourced from MQL5 and Forex Factory. These are the only events you are allowed to write about. Do NOT invent additional context, stories, or events not present in this data.

${eventList}

For EACH event above, write a Keystone Macro intelligence item. Use the actual numbers exactly as given. Write in a sharp, authoritative institutional voice — like Bloomberg Terminal or FT Markets Desk. No filler, no speculation beyond what the data implies.

For each item return:
- headline: punchy Keystone headline (max 15 words) including the specific figure and currency
- sentiment: positive / negative / neutral based on the Quality/Outcome fields above (good data = positive, bad data = negative)
- impact: 2 sentences — what the data showed (preserve exact figures vs forecast) and the immediate market implication for the relevant currency/asset
- desk_view: 3 sentences — what this means structurally, cross-asset read-through (FX, rates, equities), what to monitor next
- what_to_watch: 3-4 specific instruments, format: "INSTRUMENT (reason); INSTRUMENT (reason)"
- event_time: the Date field from the event in ISO format`,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                headline:      { type: 'string' },
                sentiment:     { type: 'string' },
                impact:        { type: 'string' },
                desk_view:     { type: 'string' },
                what_to_watch: { type: 'string' },
                event_time:    { type: 'string' },
              }
            }
          }
        }
      }
    });

    const items = rewriteResult?.items || [];
    let created = 0;
    let skipped = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const sourceEvent = releasedEvents[idx];
      if (!item.headline || item.headline.length < 10) { skipped++; continue; }

      const slug = generateSlug(item.headline, item.event_time || sourceEvent?.Date);
      if (!slug || existingSlugs.has(slug)) { skipped++; continue; }

      const headlineKey = item.headline.toLowerCase().slice(0, 50);
      if (existingHeadlines.has(headlineKey)) { skipped++; continue; }

      // Derive category/beat from the source event's currency
      const { beat, category } = currencyToBeat(sourceEvent?.Currency || 'USD');

      // Parse published time
      let publishedAt = parseJBDate(sourceEvent?.Date) || now.toISOString();
      let publishedDate = new Date(publishedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

      // Validate date isn't in the future
      if (new Date(publishedAt) > now) {
        publishedAt = now.toISOString();
        publishedDate = todayStr;
      }

      const sentiment = item.sentiment || deriveSentiment(sourceEvent || {});

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