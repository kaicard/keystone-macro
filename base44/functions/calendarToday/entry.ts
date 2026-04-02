import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = Deno.env.get('JBLANKED_API_KEY');

  const response = await fetch('https://www.jblanked.com/news/api/mql5/calendar/today/', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Api-Key ${apiKey}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return Response.json({ error: `API error ${response.status}`, details: err }, { status: response.status });
  }

  const data = await response.json();

  // Normalise to the shape the calendar UI expects
  // API date format: "2026.04.02 15:30:00"
  const events = data.map((item, idx) => {
    const rawDate = item.Date ?? item.date ?? '';
    // Replace dots in date portion: "2026.04.02 15:30:00" -> "2026-04-02 15:30:00"
    const normalised = rawDate.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3');
    const [datePart, timePart] = normalised.split(' ');
    const utcTime = timePart ? timePart.slice(0, 5) : '00:00';

    const rawActual = item.Actual ?? item.actual;
    const actual = (rawActual === 0 || rawActual === '0') ? null : rawActual != null ? String(rawActual) : null;

    return {
      id: item.EventID ?? item.eventID ?? idx,
      date: datePart ?? '',
      utcTime,
      country: mapCurrency(item.Currency ?? item.currency ?? ''),
      event: item.Name ?? item.name ?? '',
      importance: mapImpact(item.Impact ?? item.impact),
      category: mapCategory(item.Category ?? item.category ?? ''),
      previous: item.Previous ?? item.previous != null ? String(item.Previous ?? item.previous) : '—',
      forecast: item.Forecast ?? item.forecast != null ? String(item.Forecast ?? item.forecast) : '—',
      actual,
      outcome: (item.Outcome === 'Data Not Loaded' || !item.Outcome) ? null : (item.Outcome ?? item.outcome ?? null),
    };
  });

  return Response.json({ events });
});

function mapCurrency(cur) {
  const map = { USD:'US', EUR:'EU', GBP:'UK', JPY:'JP', CNY:'CN', CAD:'CA', AUD:'AU', CHF:'CH', NZD:'NZ', SEK:'SE', NOK:'NO', DKK:'DK', HKD:'HK', SGD:'SG', KRW:'KR', INR:'IN', BRL:'BR', MXN:'MX', ZAR:'ZA' };
  return map[cur] ?? cur.slice(0,2);
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
  if (c.includes('gdp') || c.includes('growth') || c.includes('production') || c.includes('trade') || c.includes('current account') || c.includes('currency report')) return 'GDP';
  if (c.includes('pmi') || c.includes('manufacturing') || c.includes('services') || c.includes('business')) return 'PMI';
  if (c.includes('consumer') || c.includes('retail') || c.includes('sentiment') || c.includes('confidence') || c.includes('spending')) return 'Consumer';
  if (c.includes('housing') || c.includes('home') || c.includes('building') || c.includes('construction') || c.includes('mortgage')) return 'Housing';
  return 'GDP';
}