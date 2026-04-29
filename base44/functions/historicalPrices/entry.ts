import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INSTRUMENT_MAP = {
  sp500:      '^GSPC',
  nasdaq:     '^NDX',
  ftse:       '^FTSE',
  dax:        '^GDAXI',
  cac40:      '^FCHI',
  nikkei:     '^N225',
  hangseng:   '^HSI',
  bitcoin:    'BTC-USD',
  ethereum:   'ETH-USD',
  gold:       'GC=F',
  silver:     'SI=F',
  wticrude:   'CL=F',
  gbpusd:     'GBPUSD=X',
  eurusd:     'EURUSD=X',
  usdjpy:     'USDJPY=X',
  apple:      'AAPL',
  nvidia:     'NVDA',
  tesla:      'TSLA',
  microsoft:  'MSFT',
  amazon:     'AMZN',
  vix:        '^VIX',
  tlt:        'TLT',
  hyg:        'HYG',
  naturalgas: 'NG=F',
  copper:     'HG=F',
};

const TF_RANGE = {
  '1W': '5d',
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  'YTD': 'ytd',
  '1Y': '1y',
  '5Y': '5y',
};

const TF_INTERVAL = {
  '1W': '1d',
  '1M': '1d',
  '3M': '1d',
  '6M': '1wk',
  'YTD': '1d',
  '1Y': '1wk',
  '5Y': '1mo', // monthly for 5Y keeps data small
};

// Max data points per series to keep payload manageable
const MAX_POINTS = {
  '1W': 7,
  '1M': 31,
  '3M': 65,
  '6M': 54,
  'YTD': 120,
  '1Y': 54,
  '5Y': 60,
};

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com/',
};

async function fetchHistory(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`YF ${symbol} HTTP ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);
  const timestamps = result.timestamps || result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  return { timestamps, closes };
}

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req); // auth check
    const body = await req.json();
    const { keys = ['sp500', 'nasdaq', 'ftse', 'dax'], tf = '1M' } = body;

    const range = TF_RANGE[tf] || '1mo';
    const interval = TF_INTERVAL[tf] || '1d';
    const maxPts = MAX_POINTS[tf] || 60;

    // Fetch all instruments in parallel — no caching (avoids payload size limit)
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        const symbol = INSTRUMENT_MAP[key];
        if (!symbol) return { key, series: [] };
        const { timestamps, closes } = await fetchHistory(symbol, range, interval);
        const validCloses = closes.filter(c => c != null);
        if (!validCloses.length) return { key, series: [] };
        const base = validCloses[0];

        // Thin out to maxPts evenly
        const step = Math.max(1, Math.floor(timestamps.length / maxPts));
        const series = [];
        for (let i = 0; i < timestamps.length; i += step) {
          const c = closes[i];
          if (c != null) {
            series.push({ ts: timestamps[i], v: +((c / base) * 100).toFixed(3) });
          }
        }
        // Always include last point
        const last = timestamps.length - 1;
        if (closes[last] != null && (series.length === 0 || series[series.length - 1].ts !== timestamps[last])) {
          series.push({ ts: timestamps[last], v: +((closes[last] / base) * 100).toFixed(3) });
        }
        return { key, series };
      })
    );

    // Build union of timestamps
    const seriesMap = {};
    const tsUnion = new Set();

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.series.length > 0) {
        const { key, series } = r.value;
        seriesMap[key] = new Map(series.map(p => [p.ts, p.v]));
        series.forEach(p => tsUnion.add(p.ts));
      }
    }

    const allTimestamps = Array.from(tsUnion).sort((a, b) => a - b);

    const data = allTimestamps.map(ts => {
      const row = { ts, label: new Date(ts * 1000).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) };
      for (const key of keys) {
        const sd = seriesMap[key];
        if (!sd) continue;
        const v = sd.get(ts);
        if (v != null) row[key] = v;
      }
      return row;
    });

    return Response.json({ ok: true, data, cached: false });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});