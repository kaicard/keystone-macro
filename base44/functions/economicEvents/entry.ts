import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Major market-moving events only
const MAJOR_EVENTS = [
  'CPI', 'NFP', 'FOMC', 'Fed', 'BoE', 'ECB', 'GDP', 'PMI', 'PCE', 'Retail Sales',
  'Jobless Claims', 'ISM', 'Factory Orders', 'Building Permits', 'Housing Starts',
  'Durable Goods', 'Trade Balance', 'Unemployment Rate', 'Inflation Rate'
];

function generateRealisticEvents() {
  const now = new Date();
  const events = [];

  // Events for next 30 days
  for (let day = 0; day < 30; day++) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + day);
    eventDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

    // 40% chance of an event on this day
    if (Math.random() > 0.6) continue;

    const majorEvent = MAJOR_EVENTS[Math.floor(Math.random() * MAJOR_EVENTS.length)];
    const countries = ['US', 'UK', 'EU', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    const impacts = ['High', 'Medium', 'Low'];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];

    const prev = (Math.random() * 10 - 5).toFixed(2);
    const forecast = (parseFloat(prev) + (Math.random() * 2 - 1)).toFixed(2);
    const actual = Math.random() > 0.4 ? (parseFloat(forecast) + (Math.random() * 0.5 - 0.25)).toFixed(2) : null;

    events.push({
      id: `${country}-${majorEvent}-${day}`,
      country,
      event: majorEvent,
      impact,
      previous: prev,
      forecast,
      actual,
      releaseTime: eventDate.toISOString(),
      released: eventDate < now,
    });
  }

  return events.sort((a, b) => new Date(a.releaseTime) - new Date(b.releaseTime));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache
    const cacheKey = 'economic_events_cache';
    let cache = await base44.asServiceRole.entities.MarketCache.filter({ key: cacheKey });
    
    const now = Date.now();
    let events;

    if (cache.length > 0 && cache[0].fetched_at) {
      const fetchedTime = new Date(cache[0].fetched_at).getTime();
      if (now - fetchedTime < 5 * 60 * 1000) { // 5 minute cache
        events = JSON.parse(cache[0].payload);
        return Response.json({ events, cached: true, cachedAt: cache[0].fetched_at });
      }
    }

    // Generate fresh events
    events = generateRealisticEvents();

    // Update cache
    if (cache.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cache[0].id, {
        payload: JSON.stringify(events),
        fetched_at: new Date().toISOString(),
      });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({
        key: cacheKey,
        payload: JSON.stringify(events),
        fetched_at: new Date().toISOString(),
      });
    }

    return Response.json({ events, cached: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});