import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BASE = 'https://www.jblanked.com/news/api';

const ENDPOINTS = {
  mql5:            { today: `${BASE}/mql5/calendar/today/`,          week: `${BASE}/mql5/calendar/week/`          },
  'forex-factory': { today: `${BASE}/forex-factory/calendar/today/`, week: `${BASE}/forex-factory/calendar/week/` },
  fxstreet:        { today: `${BASE}/fxstreet/calendar/today/`,      week: `${BASE}/fxstreet/calendar/week/`      },
};

Deno.serve(async (req) => {
  try {
    // Public endpoint — accessible to anonymous visitors (no auth required)
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
    category:   mapCategory(item.Category ?? item.category ?? '', item.Name ?? item.name ?? ''),
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
  const s = String(impact).toLowerCase().trim();
  if (s === '3' || s.includes('high')) return 'high';
  if (s === '2' || s.includes('medium') || s.includes('moderate')) return 'medium';
  const n = parseInt(s, 10);
  if (n === 3) return 'high';
  if (n === 2) return 'medium';
  return 'low';
}

function mapCategory(cat, name) {
  const combined = ((cat || '') + ' ' + (name || '')).toLowerCase();
  if (combined.includes('speak') || combined.includes('speech') || combined.includes('testimony') || combined.includes('press conference') || combined.includes('remarks')) return 'Speeches';
  if (combined.includes('rate') || combined.includes('central') || combined.includes('bank') || combined.includes('monetary') || combined.includes('boj') || combined.includes('fed') || combined.includes('ecb') || combined.includes('boe')) return 'Central Bank';
  if (combined.includes('inflation') || combined.includes('cpi') || combined.includes('ppi') || combined.includes('price')) return 'Inflation';
  if (combined.includes('employ') || combined.includes('job') || combined.includes('labour') || combined.includes('labor') || combined.includes('payroll') || combined.includes('claims')) return 'Labour';
  if (combined.includes('gdp') || combined.includes('growth') || combined.includes('production') || combined.includes('trade')) return 'GDP';
  if (combined.includes('pmi') || combined.includes('manufacturing') || combined.includes('services') || combined.includes('business')) return 'PMI';
  if (combined.includes('consumer') || combined.includes('retail') || combined.includes('sentiment') || combined.includes('confidence') || combined.includes('spending')) return 'Consumer';
  if (combined.includes('housing') || combined.includes('home') || combined.includes('building') || combined.includes('construction') || combined.includes('mortgage')) return 'Housing';
  return 'Other';
}