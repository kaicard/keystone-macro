import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Key countries to show (high-signal economies)
const KEY_COUNTRIES = new Set([
  'united states', 'united kingdom', 'euro area', 'germany', 'france',
  'japan', 'china', 'canada', 'australia', 'new zealand', 'switzerland',
  'italy', 'spain', 'sweden', 'norway'
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const range = body.range ?? 'today';

    const cacheKey = `calendar_te_${range}`;

    // Check cache — 15 min TTL so actuals appear promptly
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: cacheKey });
    if (cached?.length > 0) {
      const entry = cached[0];
      const ageMinutes = (Date.now() - new Date(entry.fetched_at).getTime()) / 60000;
      if (ageMinutes < 15) {
        const events = JSON.parse(entry.payload);
        return Response.json({ events, range, cached: true });
      }
    }

    const apiKey = Deno.env.get('TRADING_ECONOMICS_API_KEY');
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekEnd = new Date(now);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    // date range: today only, or today→+7 days for week view
    const startDate = todayStr;
    const endDate   = range === 'week' ? weekEndStr : todayStr;

    const url = `https://api.tradingeconomics.com/calendar/country/All/${startDate}/${endDate}?c=${apiKey}&f=json`;
    const response = await fetch(url);

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      return Response.json({ error: `TE API error ${response.status}`, details: txt }, { status: response.status });
    }

    const data = await response.json();

    // Normalise and filter
    const events = data
      .filter(item => {
        const country = (item.Country || '').toLowerCase();
        return KEY_COUNTRIES.has(country);
      })
      .map((item, idx) => normalise(item, idx))
      .filter(e => e.importance === 'high' || e.importance === 'medium');

    // Save to cache
    const payload = JSON.stringify(events);
    const fetched_at = new Date().toISOString();
    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: cacheKey, payload, fetched_at });
    }

    return Response.json({ events, range, cached: false });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

function normalise(item, idx) {
  // TE date format: "2023-03-30T00:00:00"
  const rawDate = item.Date || '';
  const [datePart, timePart] = rawDate.split('T');
  const utcTime = timePart ? timePart.slice(0, 5) : '00:00';

  const actual   = item.Actual   != null && item.Actual   !== '' ? String(item.Actual)   : null;
  const previous = item.Previous != null && item.Previous !== '' ? String(item.Previous) : '—';
  const forecast = item.Forecast != null && item.Forecast !== '' ? String(item.Forecast)
                 : item.TEForecast != null && item.TEForecast !== '' ? String(item.TEForecast) : '—';

  return {
    id:         item.CalendarId ?? idx,
    date:       datePart ?? '',
    utcTime,
    country:    mapCountry(item.Country || ''),
    event:      item.Event || '',
    importance: mapImpact(item.Importance),
    category:   mapCategory(item.Category || item.Event || ''),
    previous,
    forecast,
    actual,
    outcome:    null, // TE doesn't provide narrative outcome text
  };
}

function mapCountry(name) {
  const map = {
    'united states': 'US', 'united kingdom': 'UK', 'euro area': 'EU',
    'germany': 'DE', 'france': 'FR', 'japan': 'JP', 'china': 'CN',
    'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ',
    'switzerland': 'CH', 'italy': 'IT', 'spain': 'ES',
    'sweden': 'SE', 'norway': 'NO',
  };
  return map[name.toLowerCase()] ?? name.slice(0, 2).toUpperCase();
}

function mapImpact(importance) {
  const n = parseInt(importance, 10);
  if (n >= 3) return 'high';
  if (n === 2) return 'medium';
  return 'low';
}

function mapCategory(cat) {
  if (!cat) return 'Other';
  const c = cat.toLowerCase();
  if (c.includes('rate') || c.includes('central') || c.includes('bank') || c.includes('monetary') || c.includes('boj') || c.includes('fed') || c.includes('ecb') || c.includes('boe') || c.includes('fomc') || c.includes('rba') || c.includes('rbnz')) return 'Central Bank';
  if (c.includes('inflation') || c.includes('cpi') || c.includes('ppi') || c.includes('price')) return 'Inflation';
  if (c.includes('employ') || c.includes('job') || c.includes('labour') || c.includes('labor') || c.includes('payroll') || c.includes('claims') || c.includes('unemployment')) return 'Labour';
  if (c.includes('gdp') || c.includes('growth')) return 'GDP';
  if (c.includes('pmi') || c.includes('manufacturing') || c.includes('services') || c.includes('business confidence') || c.includes('ifo') || c.includes('zew')) return 'PMI';
  if (c.includes('consumer') || c.includes('retail') || c.includes('sentiment') || c.includes('confidence') || c.includes('spending')) return 'Consumer';
  if (c.includes('housing') || c.includes('home') || c.includes('building') || c.includes('construction') || c.includes('mortgage')) return 'Housing';
  if (c.includes('trade') || c.includes('export') || c.includes('import') || c.includes('current account')) return 'Trade';
  if (c.includes('speech') || c.includes('testimony') || c.includes('minutes') || c.includes('press conference')) return 'Speeches';
  return 'Other';
}