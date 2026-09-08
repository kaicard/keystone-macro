import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CACHE_KEY = 'liveMarketContextV2';
const CACHE_TTL_MS = 35 * 60 * 1000;
const STALE_THRESHOLD_MS = 18 * 60 * 1000;

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com/',
};

// Bond yield tickers on Yahoo Finance
const BOND_TICKERS = [
  { sym: '^IRX',   name: 'US 3M T-Bill' },
  { sym: '^FVX',   name: 'US 5Y' },
  { sym: '^TNX',   name: 'US 10Y' },
  { sym: '^TYX',   name: 'US 30Y' },
  { sym: 'GB2Y=X', name: 'UK 2Y Gilt' },
  { sym: 'GB10Y=X',name: 'UK 10Y Gilt' },
  { sym: 'DE10Y=X',name: 'DE 10Y Bund' },
  { sym: 'JP10Y=X',name: 'JP 10Y JGB' },
];

// S&P 500 sector ETFs — real, tradeable tickers
const SECTOR_ETFS = [
  { sym: 'XLK',  name: 'Technology' },
  { sym: 'XLF',  name: 'Financials' },
  { sym: 'XLV',  name: 'Healthcare' },
  { sym: 'XLE',  name: 'Energy' },
  { sym: 'XLY',  name: 'Consumer Discretionary' },
  { sym: 'XLP',  name: 'Consumer Staples' },
  { sym: 'XLI',  name: 'Industrials' },
  { sym: 'XLB',  name: 'Materials' },
  { sym: 'XLU',  name: 'Utilities' },
  { sym: 'XLRE', name: 'Real Estate' },
  { sym: 'XLC',  name: 'Communication Services' },
];

// Large-cap S&P 500 components for top movers
const SP500_COMPONENTS = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','BRK-B','JPM','UNH',
  'XOM','V','LLY','AVGO','MA','JNJ','PG','HD','MRK','COST',
  'ABBV','CVX','BAC','PEP','KO','TMO','WMT','MCD','ORCL','ACN',
  'ADBE','NFLX','CRM','AMD','LIN','DHR','NEE','CMCSA','INTC','TXN',
  'VZ','PM','RTX','UPS','QCOM','HON','BMY','T','CAT','AMGN',
];

async function fetchYahooQuotes(symbols) {
  const chunks = [];
  for (let i = 0; i < symbols.length; i += 20) chunks.push(symbols.slice(i, i + 20));
  const results = {};
  await Promise.all(chunks.map(async (chunk) => {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(','))}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketChange,regularMarketChangePercent`;
      const res = await fetch(url, { headers: YF_HEADERS });
      if (!res.ok) return;
      const json = await res.json();
      for (const q of (json?.quoteResponse?.result || [])) {
        if (q?.regularMarketPrice != null) results[q.symbol] = q;
      }
    } catch (_) {}
  }));
  return results;
}

function direction(change) {
  if (change > 0.01) return 'up';
  if (change < -0.01) return 'down';
  return 'flat';
}

async function refreshInBackground(base44, existingId) {
  // Fetch bonds, sectors, and S&P components in parallel
  const allSymbols = [
    ...BOND_TICKERS.map(t => t.sym),
    ...SECTOR_ETFS.map(t => t.sym),
    ...SP500_COMPONENTS,
  ];

  const quoteMap = await fetchYahooQuotes(allSymbols);

  // ── Bonds ──────────────────────────────────────────────────────────────────
  const bonds = BOND_TICKERS.map(t => {
    const q = quoteMap[t.sym];
    if (!q || q.regularMarketPrice == null) return null;
    const chg = q.regularMarketChange ?? 0;
    const chg_bps = (chg * 100).toFixed(1);
    return {
      name: t.name,
      yield: `${q.regularMarketPrice.toFixed(2)}%`,
      change_bps: `${chg >= 0 ? '+' : ''}${chg_bps}bps`,
      direction: direction(chg),
    };
  }).filter(Boolean);

  // ── Sector Heatmap (real SPDR ETF data) ───────────────────────────────────
  const sectors = SECTOR_ETFS.map(t => {
    const q = quoteMap[t.sym];
    if (!q || q.regularMarketChangePercent == null) return null;
    const pct = q.regularMarketChangePercent;
    return {
      name: t.name,
      change_pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      direction: direction(pct),
    };
  }).filter(Boolean);

  // ── Top Movers (real S&P 500 components) ──────────────────────────────────
  const movers = SP500_COMPONENTS
    .map(sym => {
      const q = quoteMap[sym];
      if (!q || q.regularMarketChangePercent == null) return null;
      return { ticker: sym, name: q.shortName || sym, change_pct: q.regularMarketChangePercent };
    })
    .filter(Boolean)
    .sort((a, b) => b.change_pct - a.change_pct);

  const top_movers = {
    gainers: movers.slice(0, 5).map(m => ({
      ticker: m.ticker,
      name: m.name,
      change_pct: `+${m.change_pct.toFixed(2)}%`,
    })),
    losers: movers.slice(-5).reverse().map(m => ({
      ticker: m.ticker,
      name: m.name,
      change_pct: `${m.change_pct.toFixed(2)}%`,
    })),
  };

  // ── Yield Curve from real bond data ───────────────────────────────────────
  const us2y  = quoteMap['^FVX']?.regularMarketPrice;  // closest available: 5Y (^FVX)
  const us10y = quoteMap['^TNX']?.regularMarketPrice;
  const uk2y  = quoteMap['GB2Y=X']?.regularMarketPrice;
  const uk10y = quoteMap['GB10Y=X']?.regularMarketPrice;

  const yield_curve = [];
  if (us10y != null && us2y != null) {
    const spread = ((us10y - us2y) * 100).toFixed(0);
    yield_curve.push({
      name: 'US 5s10s',
      spread_bps: spread,
      shape: parseFloat(spread) < 0 ? 'inverted' : parseFloat(spread) < 30 ? 'flat' : 'normal',
      direction: parseFloat(spread) > 0 ? 'steepening' : 'inverted',
    });
  }
  if (uk10y != null && uk2y != null) {
    const spread = ((uk10y - uk2y) * 100).toFixed(0);
    yield_curve.push({
      name: 'UK 2s10s',
      spread_bps: spread,
      shape: parseFloat(spread) < 0 ? 'inverted' : parseFloat(spread) < 30 ? 'flat' : 'normal',
      direction: parseFloat(spread) > 0 ? 'steepening' : 'inverted',
    });
  }

  // ── Regime & Market Summary — LLM with real bond/sector data as context ───
  const bondSummary = bonds.map(b => `${b.name}: ${b.yield} (${b.change_bps})`).join(', ');
  const sectorSummary = sectors.map(s => `${s.name}: ${s.change_pct}`).join(', ');
  const moverSummary = `Gainers: ${top_movers.gainers.map(m => `${m.ticker} ${m.change_pct}`).join(', ')}. Losers: ${top_movers.losers.map(m => `${m.ticker} ${m.change_pct}`).join(', ')}`;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const REGIME_SCHEMA = {
    type: 'object',
    properties: {
      regime: { type: 'object', properties: { label: { type: 'string' }, description: { type: 'string' }, growth: { type: 'string' }, inflation: { type: 'string' }, policy: { type: 'string' }, volatility: { type: 'string' }, leadership: { type: 'string' } } },
      market_summary: { type: 'object', properties: { headline: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } } } },
      credit_spreads: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value_bps: { type: 'string' }, direction: { type: 'string' }, trend: { type: 'string' }, source_name: { type: 'string' }, source_url: { type: 'string' } } } },
    }
  };

  const llmData = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Today is ${today}. Here are REAL market data points just fetched from Yahoo Finance:

BOND YIELDS: ${bondSummary}
SECTORS (SPDR ETFs): ${sectorSummary}
TOP MOVERS: ${moverSummary}

Based on this real data, return concise dashboard copy.

DISPLAY RULES:
- Never include citations, markdown links, URLs, brackets, or source titles inside any narrative field.
- Do not repeat the inputs or turn a signal into a paragraph.
- Use neutral institutional language. No hype and no unsupported claims.

1. Regime label must be one of: Risk-On, Risk-Off, Inflation Pressure, Growth Slowdown, Liquidity Expansion, Stagflation.
2. Regime description: one sentence, maximum 22 words.
3. growth, inflation, policy, volatility, and leadership: each 2-5 words maximum.
4. market_summary.headline: maximum 12 words.
5. market_summary.bullets: exactly 2 bullets, each maximum 18 words, using only the real inputs above.
6. For credit_spreads, use web context for current US IG OAS and US HY OAS. If verified values are unavailable, return an empty array. Put source details only in source_name and source_url.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: REGIME_SCHEMA,
  });

  const data = {
    bonds,
    sectors,
    top_movers,
    yield_curve,
    regime: llmData?.regime || null,
    market_summary: llmData?.market_summary || '',
    credit_spreads: llmData?.credit_spreads || [],
  };

  const fetched_at = new Date().toISOString();
  const payload = JSON.stringify(data);
  if (existingId) {
    await base44.asServiceRole.entities.MarketCache.update(existingId, { payload, fetched_at });
  } else {
    await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (entry.payload) {
        const data = JSON.parse(entry.payload);
        // Serve any cached data immediately and refresh in the background.
        // This avoids a slow blocking fetch when the cache is merely stale.
        if (age >= STALE_THRESHOLD_MS) {
          refreshInBackground(base44, entry.id).catch(() => {});
        }
        return Response.json({ ok: true, data, cached: true, fetched_at: entry.fetched_at });
      }
    }

    // Truly first-ever fetch — no choice but to block
    await refreshInBackground(base44, cached?.[0]?.id || null);
    const fresh = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    const freshEntry = fresh?.[0];
    const data = freshEntry?.payload ? JSON.parse(freshEntry.payload) : {};
    return Response.json({ ok: true, data, cached: false, fetched_at: freshEntry?.fetched_at || new Date().toISOString() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});