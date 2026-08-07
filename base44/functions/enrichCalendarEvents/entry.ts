import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public endpoint — accessible to anonymous visitors (no auth required)

    const body = await req.json().catch(() => ({}));
    const events = body.events || [];
    if (!events.length) return Response.json({ analyses: {} });

    const today = new Date().toISOString().split('T')[0];

    const eventList = events.map(e => ({
      key: e.key,
      event: e.event,
      country: e.country,
      date: e.date,
      time: e.utcTime,
      category: e.category,
      previous: e.previous,
      forecast: e.forecast,
      actual: e.actual,
    }));

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Senior macro strategist. Today is ${today}. For each event return key, verdict, analysis (exactly 2 sentences: what happened + market implication), and key_points (max 2 bullets). Verdict: "beat"/"miss"/"in_line"/"pending" for data; "delivered"/"scheduled"/"in_progress" for speeches. Use only the numbers provided. No fabrication.

Events: ${JSON.stringify(eventList)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                verdict: { type: 'string' },
                analysis: { type: 'string' },
                key_points: { type: 'array', items: { type: 'string' } }
              },
              required: ['key', 'verdict', 'analysis']
            }
          }
        }
      }
    });

    const analyses = {};
    for (const r of (result.results || [])) {
      if (r.key) analyses[r.key] = {
        verdict: r.verdict,
        analysis: r.analysis,
        key_points: r.key_points || []
      };
    }

    return Response.json({ analyses });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});