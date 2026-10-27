import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { HOUSE_STYLE } from '../../shared/writingStyle.ts';
import { getCaller, signInRequired, limitRequests } from '../../shared/requestSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getCaller(base44);
    if (!user) return signInRequired();

    const body = await req.json().catch(() => ({}));
    const events = body.events || [];
    if (!Array.isArray(events) || events.length > 100 || JSON.stringify(events).length > 50000) {
      return Response.json({ error: 'Provide at most 100 calendar events.' }, { status: 400 });
    }
    if (!events.length) return Response.json({ analyses: {} });
    const limited = await limitRequests(base44, user, 'calendar-analysis', { minute: 4, day: 80 });
    if (limited) return limited;

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

${HOUSE_STYLE}

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
}