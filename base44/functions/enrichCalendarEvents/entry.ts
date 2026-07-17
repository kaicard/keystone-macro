import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
      prompt: `You are a senior macro strategist at a top investment bank. Today is ${today}.

Analyse each economic calendar event below. For EACH event return:
- key: the exact key provided
- verdict: For data releases with an actual value — "beat" (better than forecast), "miss" (worse), "in_line" (close to forecast), or "pending" (no actual yet). For speeches — "delivered" (finished), "scheduled" (upcoming), or "in_progress" (happening now).
- analysis: 2-3 sharp sentences. For released data: what the number means, what drove any surprise, and the immediate market reaction. For speeches: the core message and market reaction. For upcoming: what markets will be watching for.
- key_points: 2-4 concise bullet points. For speeches: specific quotes, policy shifts, or tone changes. For data: components that drove the headline or context for the beat/miss. For upcoming: what to watch for.

Rules:
- Use real numbers from the event data and from web search. NEVER fabricate.
- For speeches, search the web to find what was actually said. If the speech hasn't happened yet, describe what markets expect.
- Be concise, specific, and authoritative. No filler.

Events (JSON):
${JSON.stringify(eventList)}`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
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