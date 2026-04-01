import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'forexCalendar';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const EVENT_SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD" },
          utcTime: { type: "string", description: "HH:MM in UTC, or 'All Day'" },
          country: { type: "string", description: "2-letter country code e.g. US, UK, EU, JP, CN, CA, AU, CH, DE, FR" },
          event: { type: "string" },
          importance: { type: "string", description: "high, medium, or low" },
          previous: { type: "string" },
          forecast: { type: "string" },
          actual: { type: "string", description: "null if not yet released" },
          category: { type: "string", description: "One of: Central Bank, Inflation, Labour, GDP, PMI, Consumer, Housing, Holiday" },
          outcome: { type: "string", description: "Brief market outcome/analysis, null if not yet released" }
        }
      }
    }
  }
};

async function fetchCalendarFromForexFactory(base44) {
  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 7); // last 7 days
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + 60); // next 60 days

  const fromStr = fromDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const toStr = toDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const nowStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const nowUTC = now.toISOString();

  const prompt = `You are a macro economic calendar data extractor. Today is ${nowStr} (${nowUTC} UTC).

Go to https://www.forexfactory.com/calendar and extract ALL economic events from ${fromStr} to ${toStr}.

For each event extract:
- id: a unique string (use country+date+short event name, e.g. "US-2026-04-10-CPI")
- date: in YYYY-MM-DD format
- utcTime: event time in UTC as HH:MM (convert from Eastern Time shown on ForexFactory — ET is UTC-4 in summer/EDT, UTC-5 in winter/EST). If "All Day" or "Tentative", write "All Day".
- country: 2-letter code (US, UK, EU, JP, CN, CA, AU, CH, DE, FR, NZ)
- event: full event name as shown on ForexFactory
- importance: map ForexFactory's color to: red=high, orange=medium, yellow=low, grey=low
- previous: previous reading as shown (include % or units)
- forecast: forecast/consensus as shown (include % or units, "—" if blank)
- actual: actual result if already released, null if not yet released
- category: classify as one of: Central Bank, Inflation, Labour, GDP, PMI, Consumer, Housing, Holiday
- outcome: if actual is released, write a 1-2 sentence market impact summary; otherwise null

Focus on HIGH and MEDIUM importance events. Include ALL central bank decisions, CPI/PPI/PCE releases, NFP/employment data, GDP releases, and major PMI prints.

Return events sorted by date ascending, then time ascending within each day.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: EVENT_SCHEMA,
  });

  return res?.events || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check cache
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (entry.payload && age < CACHE_TTL_MS) {
        const events = JSON.parse(entry.payload);
        return Response.json({ ok: true, events, cached: true, fetched_at: entry.fetched_at });
      }
    }

    // Fetch fresh from ForexFactory via LLM web search
    const events = await fetchCalendarFromForexFactory(base44);

    const payload = JSON.stringify(events);
    const fetched_at = new Date().toISOString();

    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, events, cached: false, fetched_at });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, events: [] }, { status: 200 });
  }
});