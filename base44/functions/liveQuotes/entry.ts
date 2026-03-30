import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'liveQuotes';

// During market hours use a short TTL; outside use a longer one
function getCacheTTL() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcDay = now.getUTCDay(); // 0=Sun
  // US market: 13:30–20:00 UTC; UK: 08:00–16:30 UTC; EU: 08:00–17:30 UTC; JP: 00:00–06:30 UTC
  const isWeekend = utcDay === 0 || utcDay === 6;
  if (isWeekend) return 15 * 60 * 1000;
  // Very rough combined window: 00:00–06:30 (JP), 07:00–17:30 (EU/UK), 13:00–21:00 (US)
  if (utcH >= 0 && utcH < 7) return 2 * 60 * 1000;   // Asia hours
  if (utcH >= 7 && utcH < 21) return 90 * 1000;       // EU/UK/US hours — 90s
  return 10 * 60 * 1000; // overnight
}

function getMarketStatuses() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcMins = utcH * 60 + utcM;
  const isWeekend = utcDay === 0 || utcDay === 6;

  const isUSOpen = !isWeekend && utcMins >= 13 * 60 + 30 && utcMins < 20 * 60;
  const isUKOpen = !isWeekend && utcMins >= 8 * 60 && utcMins < 16 * 60 + 30;
  const isEUOpen = !isWeekend && utcMins >= 8 * 60 && utcMins < 17 * 60 + 30;
  const isJPOpen = !isWeekend && (utcMins >= 0 && utcMins < 6 * 60 + 30);
  const isHKOpen = !isWeekend && utcMins >= 1 * 60 + 30 && utcMins < 8 * 60;

  return { US: isUSOpen, UK: isUKOpen, EU: isEUOpen, JP: isJPOpen, HK: isHKOpen };
}

const TICKERS = [
  { sym: '^GSPC',    name: 'S&P 500',       cat: 'indices' },
  { sym: '^NDX',     name: 'NASDAQ 100',    cat: 'indices' },
  { sym: '^DJI',     name: 'Dow Jones',     cat: 'indices' },
  { sym: '^FTSE',    name: 'FTSE 100',      cat: 'indices' },
  { sym: '^GDAXI',   name: 'DAX',           cat: 'indices' },
  { sym: '^FCHI',    name: 'CAC 40',        cat: 'indices' },
  { sym: '^N225',    name: 'Nikkei 225',    cat: 'indices' },
  { sym: '^HSI',     name: 'Hang Seng',     cat: 'indices' },
  { sym: 'AAPL',     name: 'Apple',         cat: 'equities' },
  { sym: 'MSFT',     name: 'Microsoft',     cat: 'equities' },
  { sym: 'NVDA',     name: 'NVIDIA',        cat: 'equities' },
  { sym: 'AMZN',     name: 'Amazon',        cat: 'equities' },
  { sym: 'GOOGL',    name: 'Alphabet',      cat: 'equities' },
  { sym: 'TSLA',     name: 'Tesla',         cat: 'equities' },
  { sym: 'META',     name: 'Meta',          cat: 'equities' },
  { sym: 'JPM',      name: 'JPMorgan',      cat: 'equities' },
  { sym: 'GS',       name: 'Goldman Sachs', cat: 'equities' },
  { sym: 'SPY',      name: 'SPY',           cat: 'etfs' },
  { sym: 'QQQ',      name: 'QQQ',           cat: 'etfs' },
  { sym: 'GLD',      name: 'GLD',           cat: 'etfs' },
  { sym: 'TLT',      name: 'TLT',           cat: 'etfs' },
  { sym: 'HYG',      name: 'HYG',           cat: 'etfs' },
  { sym: 'GBPUSD=X', name: 'GBP/USD',       cat: 'fx' },
  { sym: 'EURUSD=X', name: 'EUR/USD',       cat: 'fx' },
  { sym: 'USDJPY=X', name: 'USD/JPY',       cat: 'fx' },
  { sym: 'USDCHF=X', name: 'USD/CHF',       cat: 'fx' },
  { sym: 'AUDUSD=X', name: 'AUD/USD',       cat: 'fx' },
  { sym: 'EURGBP=X', name: 'EUR/GBP',       cat: 'fx' },
  { sym: 'GC=F',     name: 'Gold',          cat: 'commodities' },
  { sym: 'SI=F',     name: 'Silver',        cat: 'commodities' },
  { sym: 'CL=F',     name: 'WTI Crude',     cat: 'commodities' },
  { sym: 'BZ=F',     name: 'Brent Crude',   cat: 'commodities' },
  { sym: 'NG=F',     name: 'Natural Gas',   cat: 'commodities' },
  { sym: 'HG=F',     name: 'Copper',        cat: 'commodities' },
  { sym: 'BTC-USD',  name: 'Bitcoin',       cat: 'crypto' },
  { sym: 'ETH-USD',  name: 'Ethereum',      cat: 'crypto' },
  { sym: 'SOL-USD',  name: 'Solana',        cat: 'crypto' },
  { sym: '^VIX',     name: 'VIX',           cat: 'vix' },
  { sym: 'DX-Y.NYB', name: 'DXY',           cat: 'dxy' },
];

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
  'Cache-Control': 'no-cache',
};

// Primary: v6 quote endpoint (lighter, faster). Fallback: v8 chart.
async function fetchTicker(sym) {
  // Try v6 quote first
  try {
    const url = `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(sym)}&fields=regularMarketPrice,regularMarketPreviousClose`;
    const res = await fetch(url, { headers: YF_HEADERS });
    if (res.ok) {
      const json = await res.json();
      const q = json?.quoteResponse?.result?.[0];
      if (q?.regularMarketPrice && q?.regularMarketPreviousClose) {
        const price = q.regularMarketPrice;
        const prev = q.regularMarketPreviousClose;
        return { price, change_pct: ((price - prev) / prev) * 100 };
      }
    }
  } catch (_) { /* fall through */ }

  // Fallback: v8 chart on query1 then query2
  for (const host of ['query1', 'query2']) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1m&range=1d&includePrePost=false`;
      const res = await fetch(url, { headers: YF_HEADERS });
      if (!res.ok) continue;
      const json = await res.json();
      const result = extractMeta(json);
      if (result) return result;
    } catch (_) { /* try next */ }
  }
  return null;
}

function extractMeta(json) {
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) return null;

  const price = meta.regularMarketPrice;
  // regularMarketPreviousClose is the official previous session close — same as TradingView baseline
  const prev = meta.regularMarketPreviousClose ?? meta.previousClose ?? meta.chartPreviousClose;
  if (!price || !prev) return null;

  const change_pct = ((price - prev) / prev) * 100;
  return { price, change_pct };
}

function direction(change) {
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'flat';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check cache
    const CACHE_TTL_MS = getCacheTTL();
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (age < CACHE_TTL_MS && entry.payload) {
        const data = JSON.parse(entry.payload);
        return Response.json({ ok: true, data, cached: true, ts: new Date(entry.fetched_at).getTime() });
      }
    }

    // Fetch all tickers concurrently
    const results = await Promise.all(
      TICKERS.map(async (t) => {
        const q = await fetchTicker(t.sym);
        if (!q) return null;
        return {
          ticker: t.sym,
          name: t.name,
          price: q.price,
          change_pct: q.change_pct,
          direction: direction(q.change_pct),
          category: t.cat,
        };
      })
    );

    const organized = {
      indices: [], equities: [], etfs: [], fx: [], commodities: [], crypto: [],
      vix: null, dxy: null,
    };

    for (let i = 0; i < TICKERS.length; i++) {
      const r = results[i];
      if (!r) continue;
      const cat = TICKERS[i].cat;
      if (cat === 'vix') organized.vix = r;
      else if (cat === 'dxy') organized.dxy = r;
      else organized[cat]?.push(r);
    }

    organized.market_statuses = getMarketStatuses();

    const payload = JSON.stringify(organized);
    const fetched_at = new Date().toISOString();

    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, data: organized, cached: false, ts: Date.now() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});