import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'liveMarketContext';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const MARKET_SCHEMA = {
  type: "object",
  properties: {
    indices: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, change_abs: { type: "string" }, direction: { type: "string" } } } },
    bonds: { type: "array", items: { type: "object", properties: { name: { type: "string" }, yield: { type: "string" }, change_bps: { type: "string" }, direction: { type: "string" } } } },
    commodities: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    fx: { type: "array", items: { type: "object", properties: { pair: { type: "string" }, rate: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    sectors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    credit_spreads: { type: "array", items: { type: "object", properties: { name: { type: "string" }, value_bps: { type: "string" }, direction: { type: "string" }, trend: { type: "string" } } } },
    yield_curve: { type: "array", items: { type: "object", properties: { name: { type: "string" }, spread_bps: { type: "string" }, direction: { type: "string" }, shape: { type: "string" } } } },
    top_movers: { type: "object", properties: {
      gainers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, change_pct: { type: "string" } } } },
      losers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, change_pct: { type: "string" } } } }
    }},
    vix: { type: "object", properties: { value: { type: "string" }, change: { type: "string" }, direction: { type: "string" }, regime: { type: "string" } } },
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

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `You are a financial data aggregator. Using real-time web data, fetch ACTUAL current values for today (${today}) for:
- bonds: US 2Y, US 10Y, UK 10Y Gilt, German 10Y Bund, US 30Y, UK 2Y, Japan 10Y JGB, Italy 10Y BTP yields
- sectors: today's % change for all 11 GICS sectors (Technology, Financials, Healthcare, Energy, Consumer Discretionary, Consumer Staples, Industrials, Materials, Utilities, Real Estate, Communication Services)
- credit_spreads: US IG spread (bps), US HY spread (bps), EUR IG spread (bps), EUR HY spread (bps) with direction
- yield_curve: US 2Y10Y spread (bps), UK 2Y10Y spread (bps), direction
- top_movers: top 3 gainers and top 3 losers across major US equities today
- vix: current VIX value, change, direction, regime characterisation
- regime: based on current macro conditions, characterise the regime (label, description, growth/inflation/policy/volatility signals, leadership)
- market_summary: 3-4 sentence professional summary of today's actual market conditions
Return as structured JSON with real values only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: MARKET_SCHEMA,
    });

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