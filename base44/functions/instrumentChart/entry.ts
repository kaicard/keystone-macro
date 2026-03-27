import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Range → Yahoo Finance interval/range params
const RANGE_CONFIG = {
  '1d':  { interval: '5m',  range: '1d' },
  '5d':  { interval: '30m', range: '5d' },
  '1mo': { interval: '1d',  range: '1mo' },
  '3mo': { interval: '1d',  range: '3mo' },
  '1y':  { interval: '1wk', range: '1y' },
};

function formatLabel(ts, range) {
  const d = new Date(ts * 1000);
  if (range === '1d') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (range === '5d') return d.toLocaleDateString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req); // auth context (public ok)

    const body = await req.json();
    const ticker = body?.ticker;
    const range = body?.range || '1d';

    if (!ticker) return Response.json({ ok: false, error: 'ticker required' }, { status: 400 });

    const config = RANGE_CONFIG[range] || RANGE_CONFIG['1d'];
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${config.interval}&range=${config.range}&includePrePost=false`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/',
      }
    });

    if (!res.ok) {
      // Fallback to query2
      const url2 = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${config.interval}&range=${config.range}&includePrePost=false`;
      const res2 = await fetch(url2, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com/',
        }
      });
      if (!res2.ok) return Response.json({ ok: false, error: `Yahoo HTTP ${res2.status}` }, { status: 502 });
      const json2 = await res2.json();
      return Response.json({ ok: true, points: extractPoints(json2, range) });
    }

    const json = await res.json();
    return Response.json({ ok: true, points: extractPoints(json, range) });

  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});

function extractPoints(json, range) {
  const result = json?.chart?.result?.[0];
  if (!result) return [];
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const points = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null) continue;
    points.push({ t: formatLabel(timestamps[i], range), v: closes[i] });
  }
  return points;
}