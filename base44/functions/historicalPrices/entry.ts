import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Yahoo Finance symbol map for the PerformanceChart instruments
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
  '5Y': '1wk',
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
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { keys = ['sp500', 'nasdaq', 'ftse', 'dax'], tf = '1M' } = body;

    const range = TF_RANGE[tf] || '1mo';
    const interval = TF_INTERVAL[tf] || '1d';

    // Check cache
    const cacheKey = `historicalPrices_${tf}_${keys.sort().join('_')}`;
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache for historical data
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: cacheKey });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (age < CACHE_TTL && entry.payload) {
        return Response.json({ ok: true, data: JSON.parse(entry.payload), cached: true });
      }
    }

    // Fetch all instruments in parallel
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        const symbol = INSTRUMENT_MAP[key];
        if (!symbol) return { key, series: [] };
        const { timestamps, closes } = await fetchHistory(symbol, range, interval);
        // Normalise to base 100
        const validCloses = closes.filter(c => c != null);
        if (!validCloses.length) return { key, series: [] };
        const base = validCloses[0];
        const series = closes.map((c, i) => ({
          ts: timestamps[i],
          v: c != null ? +((c / base) * 100).toFixed(3) : null,
        })).filter(p => p.v != null);
        return { key, series };
      })
    );

    // Build aligned dataset: find common timestamps
    const seriesMap = {};
    let allTimestamps = null;

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.series.length > 0) {
        const { key, series } = r.value;
        seriesMap[key] = series;
        const tsSet = series.map(p => p.ts);
        if (!allTimestamps) {
          allTimestamps = tsSet;
        } else {
          // intersect
          const set = new Set(tsSet);
          allTimestamps = allTimestamps.filter(t => set.has(t));
        }
      }
    }

    if (!allTimestamps || allTimestamps.length === 0) {
      // Fallback: use all timestamps from first available series
      const first = Object.values(seriesMap)[0];
      allTimestamps = first ? first.map(p => p.ts) : [];
    }

    // Build chart data array
    const data = allTimestamps.map(ts => {
      const row = { ts, label: new Date(ts * 1000).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) };
      for (const key of keys) {
        const series = seriesMap[key];
        if (!series) continue;
        const point = series.find(p => p.ts === ts);
        if (point) row[key] = point.v;
      }
      return row;
    });

    const payload = JSON.stringify(data);
    const fetched_at = new Date().toISOString();
    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: cacheKey, payload, fetched_at });
    }

    return Response.json({ ok: true, data, cached: false });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});