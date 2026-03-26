import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Generate realistic-looking sparkline path variation
function generateSparkline(base, count = 12, volatility = 0.015) {
  const data = [];
  let val = base;
  for (let i = 0; i < count; i++) {
    val = val * (1 + (Math.random() - 0.5) * volatility * 2);
    data.push({ v: val });
  }
  return data;
}

const MARKET_DATA_PROMPT = `You are a financial data aggregator. Using real-time web data, fetch the ACTUAL current prices and changes for today (${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}) for all of the following instruments. Use live market data from sources like Yahoo Finance, Google Finance, MarketWatch, or Bloomberg. Return ONLY real current values — do not fabricate or estimate.

Instruments to fetch:
- indices: S&P 500, NASDAQ 100, Dow Jones, FTSE 100, DAX, CAC 40, Nikkei 225, Hang Seng (8 entries)
- bonds: US 2Y Treasury yield, US 10Y Treasury yield, UK 10Y Gilt yield, German 10Y Bund yield, US 30Y Treasury yield, UK 2Y Gilt yield, Japan 10Y JGB yield, Italy 10Y BTP yield (8 entries)
- commodities: Brent Crude, WTI Crude, Gold spot, Silver spot, Copper, Natural Gas, Wheat, Platinum (8 entries)
- fx: GBP/USD, EUR/USD, USD/JPY, USD/CHF, AUD/USD, EUR/GBP, USD/CNH, USD/CAD (8 entries)
- equities: Apple (AAPL), Microsoft (MSFT), NVIDIA (NVDA), Amazon (AMZN), Alphabet (GOOGL), Tesla (TSLA), Meta (META), JPMorgan (JPM), Goldman Sachs (GS), Shell (SHEL.L), HSBC (HSBA.L), BP (BP.L), AstraZeneca (AZN.L), Barclays (BARC.L) (14 entries)
- etfs: SPY, QQQ, VOO, IEF, GLD, EEM, LQD (IG Corporate Bond ETF), HYG (High Yield Bond ETF), TLT (Long-Term Treasury ETF), IEMG (EM ETF), VNQ (REIT ETF) (11 entries)
- crypto: Bitcoin (BTC), Ethereum (ETH), Solana (SOL) (3 entries)
- sectors: provide current day performance (% change) for each GICS sector: Technology, Financials, Healthcare, Energy, Consumer Discretionary, Consumer Staples, Industrials, Materials, Utilities, Real Estate, Communication Services (11 entries)
- credit_spreads: US Investment Grade spread (bps), US High Yield spread (bps), EUR Investment Grade spread (bps), EUR High Yield spread (bps) — with direction (tightening/widening)
- dxy: Dollar Index value, change_pct, direction
- yield_curve: US 2Y10Y spread (bps), UK 2Y10Y spread (bps), direction (steepening/flattening/inverted)
- top_movers: top 3 gainers and top 3 losers across all equities and ETFs today (name, ticker, change_pct, direction)
- vix: current VIX value, change, direction, and regime characterisation
- regime: based on current macro conditions, characterise the regime (label, description, growth/inflation/policy/volatility signals, leadership)
- market_summary: 3-4 sentence professional summary of today's actual market conditions based on real data
Return as structured JSON.`;

const MARKET_SCHEMA = {
  type: "object",
  properties: {
    indices: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, change_abs: { type: "string" }, direction: { type: "string" } } } },
    bonds: { type: "array", items: { type: "object", properties: { name: { type: "string" }, yield: { type: "string" }, change_bps: { type: "string" }, direction: { type: "string" } } } },
    commodities: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    fx: { type: "array", items: { type: "object", properties: { pair: { type: "string" }, rate: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    equities: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    etfs: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    sectors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    credit_spreads: { type: "array", items: { type: "object", properties: { name: { type: "string" }, value_bps: { type: "string" }, direction: { type: "string" }, trend: { type: "string" } } } },
    dxy: { type: "object", properties: { value: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } },
    yield_curve: { type: "array", items: { type: "object", properties: { name: { type: "string" }, spread_bps: { type: "string" }, direction: { type: "string" }, shape: { type: "string" } } } },
    top_movers: { type: "object", properties: {
      gainers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, change_pct: { type: "string" } } } },
      losers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, ticker: { type: "string" }, change_pct: { type: "string" } } } }
    }},
    vix: { type: "object", properties: { value: { type: "string" }, change: { type: "string" }, direction: { type: "string" }, regime: { type: "string" } } },
    crypto: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    regime: { type: "object", properties: { label: { type: "string" }, description: { type: "string" }, growth: { type: "string" }, inflation: { type: "string" }, policy: { type: "string" }, volatility: { type: "string" }, leadership: { type: "string" } } },
    market_summary: { type: "string" }
  }
};

export function useMarketData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: MARKET_DATA_PROMPT,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: MARKET_SCHEMA,
    });
    if (res) {
      setData(res);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15 * 60 * 1000); // every 15 min
    return () => clearInterval(interval);
  }, []);

  return { data, loading, lastUpdated, refresh: fetch };
}

export function MarketTile({ name, value, change, direction, subtext, sparkData }) {
  const isUp = direction === 'up';
  const isFlat = direction === 'flat' || !direction;
  const color = isFlat ? 'text-muted-foreground' : isUp ? 'text-emerald-400' : 'text-red-400';
  const strokeColor = isFlat ? '#888' : isUp ? '#34d399' : '#f87171';

  // Flash animation on price change
  const prevValue = useRef(value);
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (prevValue.current !== value && prevValue.current != null) {
      setFlash(isUp ? 'up' : isFlat ? null : 'down');
      const t = setTimeout(() => setFlash(null), 600);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  const flashBg = flash === 'up' ? 'bg-emerald-400/10' : flash === 'down' ? 'bg-red-400/10' : '';

  return (
    <div className={`glass rounded-xl p-4 hover:border-primary/20 transition-all group ${flashBg}`}
         style={{ transition: 'background-color 0.3s ease' }}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium leading-tight">{name}</span>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${color}`}>
          {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-base font-bold tracking-tight mb-0.5 font-mono">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground/60">{subtext}</p>}
      {sparkData && (
        <div className="h-8 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function RefreshBar({ lastUpdated, loading, onRefresh }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
      <span>
        {lastUpdated
          ? `Live data · Updated ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
          : 'Fetching live market data...'}
      </span>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}