import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TRADING_ECONOMICS_API_KEY = Deno.env.get('TRADING_ECONOMICS_API_KEY');
const BASE_URL = 'https://api.tradingeconomics.com';

// High-impact events only
const MARKET_MOVING_EVENTS = [
  'CPI', 'PCE', 'Inflation Rate', 'Unemployment Rate', 'NFP', 'Jobless Claims',
  'GDP', 'Industrial Production', 'Retail Sales', 'Consumer Confidence',
  'PMI Manufacturing', 'PMI Services', 'ISM Manufacturing', 'ISM Services',
  'Fed Interest Rate Decision', 'ECB Interest Rate Decision', 'BoE Interest Rate Decision',
  'FOMC', 'Fed', 'BoE', 'ECB', 'Tankan Manufacturing Index',
  'Factory Orders', 'Building Permits', 'Housing Starts', 'Durable Goods Orders',
  'Trade Balance', 'Current Account', 'Mortgage Applications'
];

async function fetchCalendarData() {
  try {
    const url = `${BASE_URL}/calendar?c=${TRADING_ECONOMICS_API_KEY}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    // Filter for high-impact events only
    return data
      .filter(event => {
        const eventName = event.Event || '';
        return MARKET_MOVING_EVENTS.some(keyword => eventName.includes(keyword));
      })
      .filter(event => {
        // Only future events or released today
        const now = new Date();
        const eventDate = new Date(event.Date);
        const daysDiff = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
        return daysDiff >= -1 && daysDiff <= 30;
      })
      .map(event => {
        const now = new Date();
        const eventDate = new Date(event.Date);
        const released = eventDate < now;

        return {
          id: `${event.Country}-${event.Event}-${event.Date}`,
          country: event.Country || 'N/A',
          countryCode: event.CountryCode || 'N/A',
          event: event.Event || 'N/A',
          impact: event.Importance === 3 ? 'High' : event.Importance === 2 ? 'Medium' : 'Low',
          previous: event.Previous || null,
          forecast: event.Forecast || null,
          actual: event.Actual || null,
          releaseTime: eventDate.toISOString(),
          released,
          source: event.Source || '',
        };
      })
      .sort((a, b) => {
        // Sort by impact first, then by time
        const impactOrder = { High: 0, Medium: 1, Low: 2 };
        const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
        if (impactDiff !== 0) return impactDiff;
        return new Date(a.releaseTime) - new Date(b.releaseTime);
      });
  } catch (error) {
    console.error('Trading Economics API error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache
    const cacheKey = 'te_calendar_cache';
    let cache = await base44.asServiceRole.entities.MarketCache.filter({ key: cacheKey });

    const now = Date.now();
    let events;
    let fromCache = false;

    if (cache.length > 0 && cache[0].fetched_at) {
      const fetchedTime = new Date(cache[0].fetched_at).getTime();
      if (now - fetchedTime < 60 * 1000) { // 60 second cache
        events = JSON.parse(cache[0].payload);
        fromCache = true;
      }
    }

    if (!fromCache) {
      events = await fetchCalendarData();

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
    }

    return Response.json({ events, fromCache });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});