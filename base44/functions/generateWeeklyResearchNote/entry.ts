import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduler calls (no session). If called from frontend, require admin.
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user !== null && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get current date info
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const publishDate = now.toISOString().split('T')[0];

    // Fetch existing notes to avoid duplication and get context on recent topics
    const existingNotes = await base44.asServiceRole.entities.ResearchNote.list('-publish_date', 5);
    const recentTitles = existingNotes.map(n => `- ${n.title} (${n.publish_date})`).join('\n');

    const prompt = `You are a senior macro research analyst at Keystone Macro. Today is ${dateStr}.

Generate a new institutional-grade research note for publication. It must be on a DIFFERENT topic than these recent notes:
${recentTitles}

Choose a topic that is timely and relevant to current macro, markets, or investment strategy. Options include (but are not limited to):
- Central bank policy (Fed, ECB, BOE, BOJ)
- Specific equity sectors or themes
- FX dynamics
- Commodities
- Fixed income / credit
- Geopolitics and market impact
- Portfolio construction / risk management
- Behavioural finance
- Specific regional economies

The note must be institutional-grade, data-driven, and written in the voice of a Goldman Sachs or BlackRock research publication. Be specific with levels, percentages, and catalysts.

Format:
- title: Sharp, specific (e.g. "ECB's June Decision: The Case for Staying on Hold")
- subtitle: One descriptive line expanding the angle
- category: One of: Macro, Equities, Fixed Income, Multi-Asset, Commodities, Wealth Strategy, Behavioural Finance, Risk Management, Trade Reviews
- tags: 4-6 relevant tags as array
- executive_summary: 2-3 sentences, institutional tone
- body: Full article in markdown. Include: ## H2 headers, bold key terms, specific data/levels. Minimum 600 words. 4-6 substantive sections.
- key_risks: Key risks paragraph
- takeaway: Concise actionable takeaway (2-4 sentences)
- what_would_change_mind: What evidence would alter this view
- read_time_minutes: Estimated read time (integer, 5-12)`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          title:                 { type: 'string' },
          subtitle:              { type: 'string' },
          category:              { type: 'string' },
          tags:                  { type: 'array', items: { type: 'string' } },
          executive_summary:     { type: 'string' },
          body:                  { type: 'string' },
          key_risks:             { type: 'string' },
          takeaway:              { type: 'string' },
          what_would_change_mind:{ type: 'string' },
          read_time_minutes:     { type: 'number' },
        }
      }
    });

    if (!result || !result.title) {
      return Response.json({ error: 'LLM returned no title — skipping' }, { status: 500 });
    }

    // Generate slug from title
    const slug = result.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);

    const note = await base44.asServiceRole.entities.ResearchNote.create({
      title:                  result.title,
      slug,
      subtitle:               result.subtitle,
      category:               result.category,
      tags:                   result.tags,
      executive_summary:      result.executive_summary,
      body:                   result.body,
      key_risks:              result.key_risks,
      takeaway:               result.takeaway,
      what_would_change_mind: result.what_would_change_mind,
      read_time_minutes:      result.read_time_minutes,
      publish_date:           publishDate,
      status:                 'published',
      is_featured:            false,
      is_premium:             false,
    });

    return Response.json({ success: true, note_id: note.id, title: result.title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});