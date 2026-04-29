import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generateSlug(headline, eventTime) {
  const base = (headline || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .trim();
  // Add time suffix to avoid same-headline collisions across days
  const suffix = (eventTime || '').replace(/[^0-9]/g, '').slice(0, 8);
  return suffix ? `${base}-${suffix}` : base;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const londonDate = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
    const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD in London time
    const batchId = `batch_${now.toISOString()}`;

    // ── Fetch existing slugs from the last 7 days to avoid duplicates ─────────
    const cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const existing = await base44.asServiceRole.entities.IntelligenceItem.list('-published_at', 500);
    const recentExisting = (existing || []).filter(i => (i.published_date || '') >= cutoffDate);
    const existingSlugs = new Set(recentExisting.map(i => i.slug));
    const existingHeadlines = new Set(recentExisting.map(i => (i.headline || '').toLowerCase().slice(0, 60)));

    // ── Search for real, verified stories ─────────────────────────────────────
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a financial newswire editor at Keystone Macro. The current time is ${londonTime} London time on ${londonDate}.

YOUR ONLY JOB: Search the internet RIGHT NOW and find REAL, VERIFIED news stories that have actually been published today or in the last 6 hours. Do not fabricate, invent, or extrapolate ANY story.

VERIFICATION REQUIREMENT: Only include a story if you can confirm it appears in real search results from Bloomberg, Reuters, FT, WSJ, CNBC, AP, BBC, Sky News, Guardian, or similar authoritative sources. If you are not confident a story is real, omit it entirely. It is MUCH better to return 5 real stories than 12 invented ones.

For each confirmed real story:
- event_time: the ACTUAL time the event happened or was reported, in ISO format (e.g. "2026-04-29T14:30:00Z"). Use the article's actual publication timestamp — NOT the current time. This is critical for accurate timelines.
- headline: sharp, specific (max 15 words), must include a specific figure, name, or level
- category: one of: Macro, Equities, Rates, Commodities, FX, Geopolitics, Credit, Technology, US Economy, UK Economy, EU Economy
- beat: one of: macro, equities, us_economy, uk_economy, eu_economy, rates, commodities, fx, geopolitics, credit, tech
- sentiment: positive / negative / neutral (from an investor perspective)
- impact: 2 sentences — what specifically happened (with exact numbers/names) and the immediate market reaction
- desk_view: 3 sentences — structural context, cross-asset implications, what to monitor in the next 24-48 hours
- what_to_watch: 3-4 specific instruments, format: "INSTRUMENT (reason); INSTRUMENT (reason)"
- top_story: true for the 3 most market-moving stories, false otherwise

STRICT RULES:
- NO fabricated or hallucinated stories — only confirmed real events
- NO URLs, links, or source domain names in any field
- event_time must be the ACTUAL event/publication time, not the current time
- Cover diverse topics: equities, bonds, FX, commodities, geopolitics, central banks, corporate news

Return between 5 and 15 stories — quality over quantity.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
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
                top_story:     { type: 'boolean' },
                event_time:    { type: 'string' },
              }
            }
          }
        }
      }
    });

    const items = result?.items || [];
    let created = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.headline || item.headline.length < 10) { skipped++; continue; }

      const slug = generateSlug(item.headline, item.event_time);
      if (!slug) { skipped++; continue; }

      // Deduplicate by slug AND by headline similarity
      if (existingSlugs.has(slug)) { skipped++; continue; }
      const headlineKey = item.headline.toLowerCase().slice(0, 60);
      if (existingHeadlines.has(headlineKey)) { skipped++; continue; }

      // Parse actual event time — fall back to batch time only if truly unknown
      let publishedAt = now.toISOString();
      let publishedDate = todayStr;
      if (item.event_time) {
        try {
          const parsed = new Date(item.event_time);
          if (!isNaN(parsed.getTime()) && parsed <= now) {
            publishedAt = parsed.toISOString();
            publishedDate = parsed.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
          }
        } catch (_) {}
      }

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline:      item.headline,
        category:      item.category || 'Macro',
        beat:          item.beat || 'macro',
        sentiment:     item.sentiment || 'neutral',
        impact:        item.impact || '',
        desk_view:     item.desk_view || '',
        what_to_watch: item.what_to_watch || '',
        slug,
        published_at:   publishedAt,
        published_date: publishedDate,
        is_top_story:   item.top_story === true,
        batch_id:       batchId,
      });

      existingSlugs.add(slug);
      existingHeadlines.add(headlineKey);
      created++;
    }

    // ── Prune items older than 7 days ─────────────────────────────────────────
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const old = (existing || []).filter(i => (i.published_date || '') < sevenDaysAgo);
    for (const oldItem of old) {
      await base44.asServiceRole.entities.IntelligenceItem.delete(oldItem.id);
    }

    return Response.json({
      ok: true,
      created,
      skipped,
      pruned: old.length,
      total_in_db: recentExisting.length + created,
      batch_id: batchId,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});