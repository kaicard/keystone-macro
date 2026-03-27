import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'liveQuotes';

const TICKERS = [
  { sym: '^GSPC',     name: 'S&P 500',       cat: 'indices' },
  { sym: '^NDX',      name: 'NASDAQ 100',    cat: 'indices' },
  { sym: '^DJI',      name: 'Dow Jones',     cat: 'indices' },
  { sym: '^FTSE',     name: 'FTSE 100',      cat: 'indices' },
  { sym: '^GDAXI',    name: 'DAX',           cat: 'indices' },
  { sym: '^FCHI',     name: 'CAC 40',        cat: 'indices' },
  { sym: '^N225',     name: 'Nikkei 225',    cat: 'indices' },
  { sym: '^HSI',      name: 'Hang Seng',     cat: 'indices' },
  { sym: 'AAPL',      name: 'Apple',         cat: 'equities' },
  { sym: 'MSFT',      name: 'Microsoft',     cat: 'equities' },
  { sym: 'NVDA',      name: 'NVIDIA',        cat: 'equities' },
  { sym: 'AMZN',      name: 'Amazon',        cat: 'equities' },
  { sym: 'GOOGL',     name: 'Alphabet',      cat: 'equities' },
  { sym: 'TSLA',      name: 'Tesla',         cat: 'equities' },
  { sym: 'META',      name: 'Meta',          cat: 'equities' },
  { sym: 'JPM',       name: 'JPMorgan',      cat: 'equities' },
  { sym: 'GS',        name: 'Goldman Sachs', cat: 'equities' },
  { sym: 'SPY',       name: 'SPY',           cat: 'etfs' },
  { sym: 'QQQ',       name: 'QQQ',           cat: 'etfs' },
  { sym: 'GLD',       name: 'GLD',           cat: 'etfs' },
  { sym: 'TLT',       name: 'TLT',           cat: 'etfs' },
  { sym: 'HYG',       name: 'HYG',           cat: 'etfs' },
  { sym: 'GBPUSD=X',  name: 'GBP/USD',       cat: 'fx' },
  { sym: 'EURUSD=X',  name: 'EUR/USD',       cat: 'fx' },
  { sym: 'USDJPY=X',  name: 'USD/JPY',       cat: 'fx' },
  { sym: 'USDCHF=X',  name: 'USD/CHF',       cat: 'fx' },
  { sym: 'AUDUSD=X',  name: 'AUD/USD',       cat: 'fx' },
  { sym: 'EURGBP=X',  name: 'EUR/GBP',       cat: 'fx' },
  { sym: 'GC=F',      name: 'Gold',          cat: 'commodities' },
  { sym: 'SI=F',      name: 'Silver',        cat: 'commodities' },
  { sym: 'CL=F',      name: 'WTI Crude',     cat: 'commodities' },
  { sym: 'BZ=F',      name: 'Brent Crude',   cat: 'commodities' },
  { sym: 'NG=F',      name: 'Natural Gas',   cat: 'commodities' },
  { sym: 'HG=F',      name: 'Copper',        cat: 'commodities' },
  { sym: 'BTC-USD',   name: 'Bitcoin',       cat: 'crypto' },
  { sym: 'ETH-USD',   name: 'Ethereum',      cat: 'crypto' },
  { sym: 'SOL-USD',   name: 'Solana',        cat: 'crypto' },
  { sym: '^VIX',      name: 'VIX',           cat: 'vix' },
  { sym: 'DX-Y.NYB',  name: 'DXY',           cat: 'dxy' },
];

// Fetch a single ticker via Yahoo Finance chart endpoint (no auth required)
async function fetchChart(sym) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  if (!res.ok) return null;
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) return null;

  const price = meta.regularMarketPrice ?? meta.chartPreviousClose;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  const changePct = prev && price ? ((price - prev) / prev) * 100 : 0;

  return { price, change_pct: changePct };
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
        const q = await fetchChart(t.sym);
        if (!q || q.price == null) return null;
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