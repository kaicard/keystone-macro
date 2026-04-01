import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'forexCalendar';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check cache
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    const age = cached?.[0] ? Date.now() - new Date(cached[0].fetched_at).getTime() : Infinity;

    if (cached?.length > 0 && age < CACHE_TTL_MS && cached[0].payload) {
      const events = JSON.parse(cached[0].payload);
      return Response.json({ ok: true, events, cached: true, fetched_at: cached[0].fetched_at });
    }

    // Use LLM to scrape ForexFactory since HTML is JS-rendered
    const now = new Date();
    const currentWeek = now.toISOString().split('T')[0];
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const prompt = `Search the web for the economic calendar events from forexfactory.com for the weeks of ${currentWeek} and ${nextWeek}.

Extract and return ONLY the raw calendar data in JSON array format with these exact fields for each event:
[
  {
    "id": "unique-id",
    "date": "YYYY-MM-DD",
    "utcTime": "HH:MM" or "All Day",
    "country": "2-letter code (US, UK, EU, JP, etc)",
    "event": "event name",
    "importance": "high", "medium", or "low",
    "previous": "previous value",
    "forecast": "forecast value",
    "actual": null or "actual value if released",
    "category": "Central Bank, Inflation, Labour, GDP, PMI, Consumer, Housing, or Holiday",
    "outcome": null
  }
]

RULES:
- Only include events from forexfactory.com
- Times must be in UTC (24-hour format)
- Do NOT include made-up events
- Do NOT include descriptions, only the structured data
- If actual is not yet released, set to null
- Sort by date ascending, then by time ascending`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                date: { type: 'string' },
                utcTime: { type: 'string' },
                country: { type: 'string' },
                event: { type: 'string' },
                importance: { type: 'string' },
                previous: { type: 'string' },
                forecast: { type: 'string' },
                actual: { type: ['string', 'null'] },
                category: { type: 'string' },
                outcome: { type: ['string', 'null'] }
              }
            }
          }
        }
      }
    });

    const events = response?.events || [];

    const payload = JSON.stringify(events);
    const fetched_at = new Date().toISOString();

    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, events, cached: false, fetched_at });
  } catch (error) {
    console.error('Error fetching calendar:', error.message);
    return Response.json({ ok: false, error: error.message, events: [] }, { status: 200 });
  }
});