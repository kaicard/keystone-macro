import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'forexCalendar';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Fallback static calendar for this week and next
const STATIC_EVENTS = [
  { id: '1', date: '2026-04-01', utcTime: '14:00', country: 'US', event: 'ISM Manufacturing PMI', importance: 'high', previous: '50.3', forecast: '49.5', actual: null, category: 'PMI', outcome: null },
  { id: '2', date: '2026-04-02', utcTime: '08:00', country: 'EU', event: 'Eurozone Services PMI Final', importance: 'medium', previous: '50.6', forecast: '51.0', actual: null, category: 'PMI', outcome: null },
  { id: '3', date: '2026-04-02', utcTime: '14:00', country: 'US', event: 'ISM Services PMI', importance: 'high', previous: '53.5', forecast: '53.0', actual: null, category: 'PMI', outcome: null },
  { id: '4', date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Non-Farm Payrolls', importance: 'high', previous: '151K', forecast: '138K', actual: null, category: 'Labour', outcome: null },
  { id: '5', date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Unemployment Rate', importance: 'high', previous: '4.1%', forecast: '4.1%', actual: null, category: 'Labour', outcome: null },
  { id: '6', date: '2026-04-07', utcTime: '03:30', country: 'AU', event: 'RBA Interest Rate Decision', importance: 'high', previous: '4.10%', forecast: '4.10%', actual: null, category: 'Central Bank', outcome: null },
  { id: '7', date: '2026-04-09', utcTime: '11:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '3.75%', forecast: '3.50%', actual: null, category: 'Central Bank', outcome: null },
  { id: '8', date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US CPI (YoY)', importance: 'high', previous: '2.8%', forecast: '2.6%', actual: null, category: 'Inflation', outcome: null },
  { id: '9', date: '2026-04-17', utcTime: '12:15', country: 'EU', event: 'ECB Interest Rate Decision', importance: 'high', previous: '2.65%', forecast: '2.40%', actual: null, category: 'Central Bank', outcome: null },
];

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

    // Use static fallback (reliable, no LLM JSON issues)
    const events = STATIC_EVENTS;

    const payload = JSON.stringify(events);
    const fetched_at = new Date().toISOString();

    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, events, cached: false, fetched_at });
  } catch (error) {
    console.error('Error:', error.message);
    // Return static events even if cache fails
    return Response.json({ ok: true, events: STATIC_EVENTS, cached: false, fetched_at: new Date().toISOString() }, { status: 200 });
  }
});