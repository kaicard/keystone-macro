import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BASE = 'https://www.jblanked.com/news/api';

const ENDPOINTS = {
  mql5:            { today: `${BASE}/mql5/calendar/today/`,          week: `${BASE}/mql5/calendar/week/`          },
  'forex-factory': { today: `${BASE}/forex-factory/calendar/today/`, week: `${BASE}/forex-factory/calendar/week/` },
  fxstreet:        { today: `${BASE}/fxstreet/calendar/today/`,      week: `${BASE}/fxstreet/calendar/week/`      },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const source = body.source ?? 'mql5';
    const range  = body.range  ?? 'today';

    // Fetch fresh from jblanked — no caching to avoid payload size limits
    const sourceMap = ENDPOINTS[source] ?? ENDPOINTS['mql5'];
    const url = range === 'week' ? sourceMap.week : sourceMap.today;
    const apiKey = Deno.env.get('JBLANKED_API_KEY');

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Api-Key ${apiKey}` },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return Response.json({ error: `API error ${response.status}`, details: err }, { status: response.status });
    }

    const data = await response.json();
    const events = data.map((item, idx) => normalise(item, idx));

    return Response.json({ events, source, range, cached: false });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

function normalise(item, idx) {
  const rawDate = item.Date ?? item.date ?? '';
  const normalised = rawDate.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3');
  const [datePart, timePart] = normalised.split(' ');
  const utcTime = timePart ? timePart.slice(0, 5) : '00:00';

  const rawActual = item.Actual ?? item.actual;
  const actual = rawActual != null && rawActual !== '' ? String(rawActual) : null;

  const prev = item.Previous ?? item.previous;
  const fore = item.Forecast ?? item.forecast;

  return {
    id:         item.EventID ?? item.eventID ?? idx,
    date:       datePart ?? '',
    utcTime,
    country:    mapCurrency(item.Currency ?? item.currency ?? ''),
    event:      item.Name ?? item.name ?? '',
    importance: mapImpact(item.Impact ?? item.impact),
    category:   mapCategory(item.Category ?? item.category ?? item.Name ?? item.name ?? ''),
    previous:   prev != null ? String(prev) : '—',
    forecast:   fore != null ? String(fore) : '—',
    actual,
    outcome:    (item.Outcome === 'Data Not Loaded' || !item.Outcome) ? null : (item.Outcome ?? item.outcome ?? null),
  };
}

function mapCurrency(cur) {
  const map = { USD:'US', EUR:'EU', GBP:'UK', JPY:'JP', CNY:'CN', CAD:'CA', AUD:'AU', CHF:'CH', NZD:'NZ', SEK:'SE', NOK:'NO', DKK:'DK', HKD:'HK', SGD:'SG', KRW:'KR', INR:'IN', BRL:'BR', MXN:'MX', ZAR:'ZA' };
  return map[cur] ?? (cur.length >= 2 ? cur.slice(0, 2) : cur);
}

function mapImpact(impact) {
  if (!impact) return 'low';
  const s = String(impact).toLowerCase();
  if (s === '3' || s === 'high')   return 'high';
  if (s === '2' || s === 'medium') return 'medium';
  return 'low';
}

function mapCategory(cat) {
  if (!cat) return 'Other';
  const c = cat.toLowerCase();
  if (c.includes('rate') || c.includes('central') || c.includes('bank') || c.includes('monetary') || c.includes('boj') || c.includes('fed') || c.includes('ecb') || c.includes('boe')) return 'Central Bank';
  if (c.includes('inflation') || c.includes('cpi') || c.includes('ppi') || c.includes('price')) return 'Inflation';
  if (c.includes('employ') || c.includes('job') || c.includes('labour') || c.includes('labor') || c.includes('payroll') || c.includes('claims')) return 'Labour';
  if (c.includes('gdp') || c.includes('growth') || c.includes('production') || c.includes('trade')) return 'GDP';
  if (c.includes('pmi') || c.includes('manufacturing') || c.includes('services') || c.includes('business')) return 'PMI';
  if (c.includes('consumer') || c.includes('retail') || c.includes('sentiment') || c.includes('confidence') || c.includes('spending')) return 'Consumer';
  if (c.includes('housing') || c.includes('home') || c.includes('building') || c.includes('construction') || c.includes('mortgage')) return 'Housing';
  return 'Other';
}