import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'liveQuotes';

function getCacheTTL() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcDay = now.getUTCDay();
  const isWeekend = utcDay === 0 || utcDay === 6;
  if (isWeekend) return 10 * 60 * 1000;
  if (utcH >= 0 && utcH < 7) return 90 * 1000;    // Asia hours — 90s
  if (utcH >= 7 && utcH < 21) return 60 * 1000;   // EU/UK/US hours — 60s
  return 5 * 60 * 1000; // overnight
}

// Stale threshold: when to kick off background refresh (before TTL expires)
function getStaleTTL() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcDay = now.getUTCDay();
  const isWeekend = utcDay === 0 || utcDay === 6;
  if (isWeekend) return 8 * 60 * 1000;
  if (utcH >= 7 && utcH < 21) return 45 * 1000;  // refresh after 45s during market hours
  return 3 * 60 * 1000;
}

function getMarketStatuses() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcMins = utcH * 60 + utcM;
  const isWeekend = utcDay === 0 || utcDay === 6;

  return {
    US: !isWeekend && utcMins >= 13 * 60 + 30 && utcMins < 20 * 60,
    UK: !isWeekend && utcMins >= 8 * 60 && utcMins < 16 * 60 + 30,
    EU: !isWeekend && utcMins >= 8 * 60 && utcMins < 17 * 60 + 30,
    JP: !isWeekend && (utcMins >= 0 && utcMins < 6 * 60 + 30),
    HK: !isWeekend && utcMins >= 1 * 60 + 30 && utcMins < 8 * 60,
  };
}

const TICKERS = [
  // Indices — global
  { sym: '^GSPC',    name: 'S&P 500',        cat: 'indices' },
  { sym: '^NDX',     name: 'NASDAQ 100',     cat: 'indices' },
  { sym: '^DJI',     name: 'Dow Jones',      cat: 'indices' },
  { sym: '^FTSE',    name: 'FTSE 100',       cat: 'indices' },
  { sym: '^GDAXI',   name: 'DAX',            cat: 'indices' },
  { sym: '^FCHI',    name: 'CAC 40',         cat: 'indices' },
  { sym: '^STOXX50E',name: 'Euro Stoxx 50',  cat: 'indices' },
  { sym: '^N225',    name: 'Nikkei 225',     cat: 'indices' },
  { sym: '^HSI',     name: 'Hang Seng',      cat: 'indices' },
  { sym: '^AXJO',    name: 'ASX 200',        cat: 'indices' },
  // US mega-cap equities
  { sym: 'AAPL',     name: 'Apple',          cat: 'equities' },
  { sym: 'MSFT',     name: 'Microsoft',      cat: 'equities' },
  { sym: 'NVDA',     name: 'NVIDIA',         cat: 'equities' },
  { sym: 'AMZN',     name: 'Amazon',         cat: 'equities' },
  { sym: 'GOOGL',    name: 'Alphabet',       cat: 'equities' },
  { sym: 'TSLA',     name: 'Tesla',          cat: 'equities' },
  { sym: 'META',     name: 'Meta',           cat: 'equities' },
  { sym: 'JPM',      name: 'JPMorgan',       cat: 'equities' },
  { sym: 'GS',       name: 'Goldman Sachs',  cat: 'equities' },
  { sym: 'BRK-B',    name: 'Berkshire B',    cat: 'equities' },
  { sym: 'UNH',      name: 'UnitedHealth',   cat: 'equities' },
  { sym: 'XOM',      name: 'ExxonMobil',     cat: 'equities' },
  // ETFs
  { sym: 'SPY',      name: 'SPY',            cat: 'etfs' },
  { sym: 'QQQ',      name: 'QQQ',            cat: 'etfs' },
  { sym: 'IWM',      name: 'IWM',            cat: 'etfs' },
  { sym: 'GLD',      name: 'GLD',            cat: 'etfs' },
  { sym: 'TLT',      name: 'TLT',            cat: 'etfs' },
  { sym: 'HYG',      name: 'HYG',            cat: 'etfs' },
  { sym: 'EEM',      name: 'EEM',            cat: 'etfs' },
  { sym: 'XLF',      name: 'XLF',            cat: 'etfs' },
  { sym: 'XLE',      name: 'XLE',            cat: 'etfs' },
  // FX majors + extras
  { sym: 'GBPUSD=X', name: 'GBP/USD',        cat: 'fx' },
  { sym: 'EURUSD=X', name: 'EUR/USD',        cat: 'fx' },
  { sym: 'USDJPY=X', name: 'USD/JPY',        cat: 'fx' },
  { sym: 'USDCHF=X', name: 'USD/CHF',        cat: 'fx' },
  { sym: 'AUDUSD=X', name: 'AUD/USD',        cat: 'fx' },
  { sym: 'EURGBP=X', name: 'EUR/GBP',        cat: 'fx' },
  { sym: 'USDCAD=X', name: 'USD/CAD',        cat: 'fx' },
  { sym: 'USDCNH=X', name: 'USD/CNH',        cat: 'fx' },
  // Commodities
  { sym: 'GC=F',     name: 'Gold',           cat: 'commodities' },
  { sym: 'SI=F',     name: 'Silver',         cat: 'commodities' },
  { sym: 'PL=F',     name: 'Platinum',       cat: 'commodities' },
  { sym: 'CL=F',     name: 'WTI Crude',      cat: 'commodities' },
  { sym: 'BZ=F',     name: 'Brent Crude',    cat: 'commodities' },
  { sym: 'NG=F',     name: 'Natural Gas',    cat: 'commodities' },
  { sym: 'HG=F',     name: 'Copper',         cat: 'commodities' },
  { sym: 'ZW=F',     name: 'Wheat',          cat: 'commodities' },
  { sym: 'ZC=F',     name: 'Corn',           cat: 'commodities' },
  // Crypto
  { sym: 'BTC-USD',  name: 'Bitcoin',        cat: 'crypto' },
  { sym: 'ETH-USD',  name: 'Ethereum',       cat: 'crypto' },
  { sym: 'SOL-USD',  name: 'Solana',         cat: 'crypto' },
  { sym: 'XRP-USD',  name: 'XRP',            cat: 'crypto' },
  // Volatility & Dollar
  { sym: '^VIX',     name: 'VIX',            cat: 'vix' },
  { sym: 'DX-Y.NYB', name: 'DXY',            cat: 'dxy' },
];

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
  'Cache-Control': 'no-cache',
};

// Batch fetch via v7 quote endpoint — most efficient, fetches all at once
async function fetchAllTickers(symbols) {
  const chunks = [];
  const CHUNK_SIZE = 20;
  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    chunks.push(symbols.slice(i, i + CHUNK_SIZE));
  }

  const results = {};
  await Promise.all(chunks.map(async (chunk) => {
    const syms = chunk.join(',');
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(syms)}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketChange,regularMarketChangePercent`;
      const res = await fetch(url, { headers: YF_HEADERS });
      if (res.ok) {
        const json = await res.json();
        for (const q of (json?.quoteResponse?.result || [])) {
          if (q?.regularMarketPrice && q?.regularMarketPreviousClose) {
            results[q.symbol] = {
              price: q.regularMarketPrice,
              change_pct: q.regularMarketChangePercent ?? ((q.regularMarketPrice - q.regularMarketPreviousClose) / q.regularMarketPreviousClose) * 100,
            };
          }
        }
      }
    } catch (_) {}

    // Fallback: individual v8 chart for any symbols that failed
    for (const sym of chunk) {
      if (results[sym]) continue;
      for (const host of ['query1', 'query2']) {
        try {
          const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1m&range=1d&includePrePost=false`;
          const res = await fetch(url, { headers: YF_HEADERS });
          if (!res.ok) continue;
          const json = await res.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (!meta) continue;
          const price = meta.regularMarketPrice;
          const prev = meta.regularMarketPreviousClose ?? meta.previousClose ?? meta.chartPreviousClose;
          if (price && prev) {
            results[sym] = { price, change_pct: ((price - prev) / prev) * 100 };
            break;
          }
        } catch (_) {}
      }
    }
  }));

  return results;
}

function direction(change) {
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'flat';
}

// Sanity checks for price ranges (prevents garbage Yahoo Finance data)
function isValidPrice(ticker, price) {
  if (!price || typeof price !== 'number' || isNaN(price) || price <= 0) return false;
  
  // DXY: always 70-110
  if (ticker === 'DX-Y.NYB') return price >= 70 && price <= 130;
  
  // Indices: 100+
  if (['GSPC', 'NDX', 'DJI', 'FTSE', 'GDAXI', 'FCHI', 'STOXX50E', 'N225', 'HSI', 'AXJO'].some(t => ticker.includes(t))) return price >= 100;
  
  // FX: 0.5—2.5
  if (ticker.includes('=X')) return price >= 0.5 && price <= 3;
  
  // Commodities: GC, SI, CL usually 100-2000
  if (ticker === 'GC=F') return price >= 500 && price <= 3000;
  if (ticker === 'SI=F') return price >= 5 && price <= 100;
  if (['CL=F', 'BZ=F'].includes(ticker)) return price >= 20 && price <= 150;
  if (ticker === 'NG=F') return price >= 0.5 && price <= 10;
  if (ticker === 'HG=F') return price >= 1 && price <= 10;
  
  // Crypto: BTC usually 30k-80k, ETH 1k-5k
  if (ticker === 'BTC-USD') return price >= 10000 && price <= 200000;
  if (ticker === 'ETH-USD') return price >= 500 && price <= 50000;
  
  // VIX: 10-80
  if (ticker === '^VIX') return price >= 5 && price <= 100;
  
  // Stocks: most 5-500
  return price >= 0.1 && price <= 50000;
}

async function fetchAndCache(base44, existingCacheId) {
  const symbols = TICKERS.map(t => t.sym);
  const quoteMap = await fetchAllTickers(symbols);

  const organized = {
    indices: [], equities: [], etfs: [], fx: [], commodities: [], crypto: [],
    vix: null, dxy: null,
  };

  for (const t of TICKERS) {
    const q = quoteMap[t.sym];
    if (!q || !isValidPrice(t.sym, q.price)) continue;
    const item = {
      ticker: t.sym,
      name: t.name,
      price: q.price,
      change_pct: q.change_pct,
      direction: direction(q.change_pct),
      category: t.cat,
    };
    if (t.cat === 'vix') organized.vix = item;
    else if (t.cat === 'dxy') organized.dxy = item;
    else organized[t.cat]?.push(item);
  }

  organized.market_statuses = getMarketStatuses();

  const payload = JSON.stringify(organized);
  const fetched_at = new Date().toISOString();

  if (existingCacheId) {
    await base44.asServiceRole.entities.MarketCache.update(existingCacheId, { payload, fetched_at });
  } else {
    await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
  }

  return { organized, fetched_at };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const CACHE_TTL_MS = getCacheTTL();
    const STALE_TTL_MS = getStaleTTL();

    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });

    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();

      if (entry.payload && age < CACHE_TTL_MS) {
        const data = JSON.parse(entry.payload);
        // Background refresh if getting stale
        if (age >= STALE_TTL_MS) {
          fetchAndCache(base44, entry.id).catch(() => {});
        }
        return Response.json({ ok: true, data, cached: true, ts: new Date(entry.fetched_at).getTime() });
      }
    }

    // Cache miss or expired — blocking fetch
    const { organized, fetched_at } = await fetchAndCache(base44, cached?.[0]?.id || null);
    return Response.json({ ok: true, data: organized, cached: false, ts: new Date(fetched_at).getTime() });

  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});