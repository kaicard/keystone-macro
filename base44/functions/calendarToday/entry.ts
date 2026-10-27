import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getJBlankedCalendar } from '../../shared/jblankedCalendar.ts';
import { getCaller } from '../../shared/requestSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const source = body.source ?? 'mql5';
    const range = body.range ?? 'today';
    if (!['mql5', 'forex-factory', 'fxstreet'].includes(source) || !['today', 'week'].includes(range)) {
      return Response.json({ error: 'Unsupported calendar source or range' }, { status: 400 });
    }
    const user = await getCaller(base44);
    const result = await getJBlankedCalendar(base44, source, { allowRefresh: Boolean(user) });
    const today = new Date().toISOString().slice(0, 10);
    const events = result.events.map(normalise).filter(event => range === 'week' || event.date === today);
    return Response.json({ events, source, range, cached: result.cached, stale: result.stale, fetched_at: result.fetchedAt });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 503 });
  }
}

function normalise(item, idx) {
  const rawDate = item.Date ?? item.date ?? '';
  const normalised = String(rawDate).replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3');
  const [datePart, timePart] = normalised.split(/[T ]/);
  const utcTime = timePart ? timePart.slice(0, 5) : 'All Day';

  const hasValue = (v) => v != null && v !== '';

  const rawActual = item.Actual ?? item.actual;
  const outcome = item.Outcome ?? item.outcome;
  const releasedAt = new Date(`${datePart}T${utcTime}:00Z`).getTime();
  const pending = outcome === 'Data Not Loaded' || releasedAt > Date.now();
  const actual = !pending && hasValue(rawActual) ? String(rawActual) : null;

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
    previous:   hasValue(prev) ? String(prev) : '-',
    forecast:   hasValue(fore) ? String(fore) : '-',
    actual,
    outcome:    [undefined, null, '', 'Data Not Loaded'].includes(item.Outcome ?? item.outcome) ? null : (item.Outcome ?? item.outcome),
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
  if (combined.includes('holiday')) return 'Holiday';
  if (combined.includes('interest rate') || combined.includes('policy rate') || combined.includes('central') || combined.includes('bank') || combined.includes('monetary') || combined.includes('boj') || combined.includes('fed') || combined.includes('ecb') || combined.includes('boe')) return 'Central Bank';
  if (combined.includes('inflation') || combined.includes('cpi') || combined.includes('ppi') || combined.includes('price')) return 'Inflation';
  if (combined.includes('employ') || combined.includes('job') || combined.includes('labour') || combined.includes('labor') || combined.includes('payroll') || combined.includes('claims')) return 'Labour';
  if (combined.includes('gdp') || combined.includes('growth') || combined.includes('production') || combined.includes('trade')) return 'GDP';
  if (combined.includes('pmi') || combined.includes('manufacturing') || combined.includes('services') || combined.includes('business')) return 'PMI';
  if (combined.includes('consumer') || combined.includes('retail') || combined.includes('sentiment') || combined.includes('confidence') || combined.includes('spending')) return 'Consumer';
  if (combined.includes('housing') || combined.includes('home') || combined.includes('building') || combined.includes('construction') || combined.includes('mortgage')) return 'Housing';
  return 'Other';
}