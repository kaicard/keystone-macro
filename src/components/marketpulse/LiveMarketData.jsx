import React, { useState, useEffect, useCallback } from 'react';
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

const MARKET_DATA_PROMPT = `Generate realistic current market data for today (${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}). 
Return plausible values for these financial instruments. Make prices realistic and changes small (within normal daily ranges).
Return as structured JSON.`;

const MARKET_SCHEMA = {
  type: "object",
  properties: {
    indices: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, change_abs: { type: "string" }, direction: { type: "string" } } } },
    bonds: { type: "array", items: { type: "object", properties: { name: { type: "string" }, yield: { type: "string" }, change_bps: { type: "string" }, direction: { type: "string" } } } },
    commodities: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
    fx: { type: "array", items: { type: "object", properties: { pair: { type: "string" }, rate: { type: "string" }, change_pct: { type: "string" }, direction: { type: "string" } } } },
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

  return (
    <div className="glass rounded-xl p-4 hover:border-primary/20 transition-all group">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium leading-tight">{name}</span>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${color}`}>
          {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-base font-bold tracking-tight mb-0.5">{value}</p>
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
          ? `Last updated: ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
          : 'Loading market data...'}
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