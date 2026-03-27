import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'liveMarketContext';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes — contextual data changes slower

// Bond yield tickers on Yahoo Finance
const BOND_TICKERS = [
  { sym: '^IRX',  name: 'US 3M T-Bill',  cat: 'bonds' },
  { sym: '^FVX',  name: 'US 5Y',         cat: 'bonds' },
  { sym: '^TNX',  name: 'US 10Y',        cat: 'bonds' },
  { sym: '^TYX',  name: 'US 30Y',        cat: 'bonds' },
  { sym: 'GB2Y=X', name: 'UK 2Y Gilt',   cat: 'bonds' },
  { sym: 'GB10Y=X', name: 'UK 10Y Gilt', cat: 'bonds' },
  { sym: 'DE10Y=X', name: 'DE 10Y Bund', cat: 'bonds' },
  { sym: 'JP10Y=X', name: 'JP 10Y JGB',  cat: 'bonds' },
];

async function fetchYahooQuotes(symbols) {
  const symsParam = symbols.join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symsParam)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent&lang=en-US&region=US`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MarketData/1.0)',
      'Accept': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
  const json = await res.json();
  return json?.quoteResponse?.result || [];
}

function direction(change) {
  if (change > 0.01) return 'up';
  if (change < -0.01) return 'down';
  return 'flat';
}

const CONTEXT_SCHEMA = {
  type: "object",
  properties: {
    sectors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    credit_spreads: { type: "array", items: { type: "object", properties: { name: { type: "string" }, value_bps: { type: "string" }, direction: { type: "string" }, trend: { type: "string" } } } },
    yield_curve: { type: "array", items: { type: "object", properties: { name: { type: "string" }, spread_bps: { type: "string" }, direction: { type: "string" }, shape: { type: "string" } } } },
    top_movers: { type: "object", properties: {
      gainers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, change_pct: { type: "string" } } } },
      losers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, change_pct: { type: "string" } } } }
    }},
    regime: { type: "object", properties: { label: { type: "string" }, description: { type: "string" }, growth: { type: "string" }, inflation: { type: "string" }, policy: { type: "string" }, volatility: { type: "string" }, leadership: { type: "string" } } },
    market_summary: { type: "string" }
  }
};

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
        return Response.json({ ok: true, data, cached: true, fetched_at: entry.fetched_at });
      }
    }

    // Fetch bond yields directly from Yahoo Finance
    const bondSyms = BOND_TICKERS.map(t => t.sym);
    let bonds = [];
    try {
      const bondRaw = await fetchYahooQuotes(bondSyms);
      const bondMap = {};
      for (const q of bondRaw) bondMap[q.symbol] = q;

      bonds = BOND_TICKERS.map(t => {
        const q = bondMap[t.sym];
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
    } catch (e) {
      // bonds fetch failed, continue without them
    }

    // Use LLM for contextual data that can't be easily scraped (sectors, credit spreads, regime)
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `Today is ${today}. Using live web data, fetch REAL current values for:
- sectors: today's % change for all 11 GICS sectors (Technology, Financials, Healthcare, Energy, Consumer Discretionary, Consumer Staples, Industrials, Materials, Utilities, Real Estate, Communication Services). Use real numbers from Yahoo Finance sector screener or equivalent.
- credit_spreads: US IG OAS (bps), US HY OAS (bps), EUR IG spread (bps), EUR HY spread (bps). Use ICE BofA indices or similar. Include direction (tightening/widening).
- yield_curve: US 2Y10Y spread (bps), UK 2Y10Y (bps). Calculate from real live yields.
- top_movers: top 3 gainers and top 3 losers in the S&P 500 today with actual % changes.
- regime: based on today's actual market conditions, describe the macro regime.
- market_summary: 3-4 sentence professional summary of today's actual market action with real numbers.
Only return real data. Do not fabricate. If you cannot find a real value, omit it.`;

    const contextData = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: CONTEXT_SCHEMA,
    });

    const data = { ...contextData, bonds };

    const fetched_at = new Date().toISOString();
    const payload = JSON.stringify(data);

    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, data, cached: false, fetched_at });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});