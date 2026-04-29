import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generateSlug(headline) {
  return (headline || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
    .trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const londonDate = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
    const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const todayStr = now.toISOString().split('T')[0];
    const batchId = `batch_${now.toISOString()}`;

    // ── Fetch all existing slugs from today to avoid duplicates ──────────────
    const existing = await base44.asServiceRole.entities.IntelligenceItem.filter({ published_date: todayStr });
    const existingSlugs = new Set((existing || []).map(i => i.slug));

    // ── Generate headlines + enrichment in one LLM call ──────────────────────
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the senior editor of Keystone Macro, an institutional macro intelligence platform. Today is ${londonDate}, ${londonTime} London time.

Search the internet RIGHT NOW for the 12 most important financial market and geopolitical stories published TODAY. Cover: US equities, rates/bonds, FX, commodities, UK/EU macro, geopolitics, central banks, corporate earnings, credit. No two items should cover the same topic.

For each story, write in Keystone Macro's editorial voice — sharp, precise, analytical. Like Bloomberg or FT. Include specific levels, percentages, named companies or policymakers.

STRICT RULES:
- Only include stories confirmed to exist in your search results — do NOT fabricate
- Only include stories from the last 12 hours
- Flag the 3 most important stories as top_story: true
- Do NOT include any URLs, links, source domains, or citations in any field
- Write ALL fields fresh in Keystone Macro's voice — do not copy-paste from source material

For each story:
- headline: punchy, specific headline (max 15 words) with a number or name
- category: one of: Macro, Equities, Rates, Commodities, FX, Geopolitics, Credit, Technology, US Economy, UK Economy, EU Economy
- beat: one of: macro, equities, us_economy, uk_economy, eu_economy, rates, commodities, fx, geopolitics, credit, tech
- sentiment: positive / negative / neutral
- impact: 2 specific sentences on what happened and the immediate market effect
- desk_view: 3 sentences of original analysis — structural context, cross-asset implication, what to watch in the next 48 hours
- what_to_watch: 3-4 instruments with brief reason, format: "INSTRUMENT (reason); INSTRUMENT (reason)"
- top_story: boolean — true for the 3 most market-moving stories, false otherwise`,
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
              }
            }
          }
        }
      }
    });

    const items = result?.items || [];
    let created = 0;

    for (const item of items) {
      const slug = generateSlug(item.headline);
      if (!slug || existingSlugs.has(slug)) continue;

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline:      item.headline,
        category:      item.category || 'Macro',
        beat:          item.beat || 'macro',
        sentiment:     item.sentiment || 'neutral',
        impact:        item.impact || '',
        desk_view:     item.desk_view || '',
        what_to_watch: item.what_to_watch || '',
        slug,
        published_at:   now.toISOString(),
        published_date: todayStr,
        is_top_story:   item.top_story === true,
        batch_id:       batchId,
      });

      existingSlugs.add(slug);
      created++;
    }

    return Response.json({ ok: true, created, total_today: existing.length + created, batch_id: batchId });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});