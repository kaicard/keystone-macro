import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCacheKey() {
  const d = new Date();
  const slot = Math.floor(d.getUTCMinutes() / 15);
  return `marketData_${d.toISOString().split('T')[0]}_${d.getUTCHours()}_${slot}`;
}

async function loadFromCache() {
  try {
    const key = getCacheKey();
    const results = await base44.entities.MarketCache.filter({ key });
    if (results?.length) {
      const age = Date.now() - new Date(results[0].fetched_at).getTime();
      if (age < CACHE_TTL) {
        return { data: JSON.parse(results[0].payload), recordId: results[0].id };
      }
      return { data: null, recordId: results[0].id };
    }
  } catch (_) {}
  return { data: null, recordId: null };
}

async function saveToCache(data, recordId) {
  try {
    const key = getCacheKey();
    const payload = JSON.stringify(data);
    const fetched_at = new Date().toISOString();
    if (recordId) {
      await base44.entities.MarketCache.update(recordId, { payload, fetched_at, key });
    } else {
      // Check first to avoid duplicates
      const existing = await base44.entities.MarketCache.filter({ key });
      if (existing?.length) {
        await base44.entities.MarketCache.update(existing[0].id, { payload, fetched_at, key });
      } else {
        await base44.entities.MarketCache.create({ key, payload, fetched_at });
      }
    }
  } catch (_) {}
}

// ─── PARALLEL LLM FETCHES ─────────────────────────────────────────────────────
async function fetchTopMovers() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a markets data provider. Today is ${today}.

Provide today's top 5 gainers and top 5 losers across US equities (S&P 500 / NASDAQ constituents).
Use real approximate figures based on today's trading session.

For each item:
- ticker: stock ticker (e.g. "NVDA")
- name: company name (e.g. "NVIDIA")
- change_pct: percentage change as string with sign (e.g. "+4.2%" or "-3.1%")
- direction: "up" or "down"`,
    response_json_schema: {
      type: 'object',
      properties: {
        gainers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ticker:     { type: 'string' },
              name:       { type: 'string' },
              change_pct: { type: 'string' },
              direction:  { type: 'string' },
            }
          }
        },
        losers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ticker:     { type: 'string' },
              name:       { type: 'string' },
              change_pct: { type: 'string' },
              direction:  { type: 'string' },
            }
          }
        }
      }
    }
  });
  return result;
}

async function fetchSectors() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a markets data provider. Today is ${today}.

Provide today's sector performance for all 11 S&P 500 sectors.
Use real approximate figures based on today's trading session.

For each sector:
- name: sector name (e.g. "Technology", "Energy", "Financials")
- change_pct: percentage change as number (e.g. 1.2 or -0.8)
- direction: "up", "down", or "flat"
- etf: sector ETF ticker (e.g. "XLK", "XLE", "XLF")`,
    response_json_schema: {
      type: 'object',
      properties: {
        sectors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:       { type: 'string' },
              change_pct: { type: 'number' },
              direction:  { type: 'string' },
              etf:        { type: 'string' },
            }
          }
        }
      }
    }
  });
  return result?.sectors || [];
}

async function fetchBondsAndCredit() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a markets data provider. Today is ${today}.

Provide current government bond yields, yield curve shape, and credit spreads.

bonds: US 2Y, US 10Y, US 30Y, UK 10Y, Germany 10Y, Japan 10Y — each with:
- name: bond name
- yield: yield as string with % (e.g. "4.52%")
- change_bps: change in basis points as string (e.g. "+3bp" or "-2bp")
- direction: "up" or "down"

yield_curve:
- spread_2s10s: US 2s10s spread in bps as number
- shape: "normal", "flat", or "inverted"
- commentary: one sentence on what the curve is signalling

credit_spreads:
- ig_spread: Investment Grade OAS in bps as number
- hy_spread: High Yield OAS in bps as number
- ig_direction: "tightening" or "widening"
- hy_direction: "tightening" or "widening"
- commentary: one sentence on credit conditions`,
    response_json_schema: {
      type: 'object',
      properties: {
        bonds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:       { type: 'string' },
              yield:      { type: 'string' },
              change_bps: { type: 'string' },
              direction:  { type: 'string' },
            }
          }
        },
        yield_curve: {
          type: 'object',
          properties: {
            spread_2s10s: { type: 'number' },
            shape:        { type: 'string' },
            commentary:   { type: 'string' },
          }
        },
        credit_spreads: {
          type: 'object',
          properties: {
            ig_spread:    { type: 'number' },
            hy_spread:    { type: 'number' },
            ig_direction: { type: 'string' },
            hy_direction: { type: 'string' },
            commentary:   { type: 'string' },
          }
        }
      }
    }
  });
  return result;
}

async function fetchRegimeAndSummary() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior macro strategist at Keystone Macro. Today is ${today}.

Provide:

regime:
- label: current macro regime in 3-4 words (e.g. "Stagflationary Slowdown", "Risk-Off", "Goldilocks")
- description: 2 sentences describing the current macro environment
- risk_level: "low", "medium", or "high"
- key_drivers: array of 3 short strings (e.g. ["Tariff uncertainty", "Fed on hold", "Dollar strength"])

market_summary:
- headline: one sharp sentence summarising today's market tone
- detail: 2-3 sentences covering key moves across equities, bonds, FX, commodities
- sentiment: "bullish", "bearish", or "neutral"`,
    response_json_schema: {
      type: 'object',
      properties: {
        regime: {
          type: 'object',
          properties: {
            label:       { type: 'string' },
            description: { type: 'string' },
            risk_level:  { type: 'string' },
            key_drivers: { type: 'array', items: { type: 'string' } },
          }
        },
        market_summary: {
          type: 'object',
          properties: {
            headline:  { type: 'string' },
            detail:    { type: 'string' },
            sentiment: { type: 'string' },
          }
        }
      }
    }
  });
  return result;
}

// ─── MAIN HOOK ────────────────────────────────────────────────────────────────
export function useMarketData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const cacheIdRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Check cache first
      if (!forceRefresh) {
        const { data: cached, recordId } = await loadFromCache();
        cacheIdRef.current = recordId;
        if (cached) {
          setData(cached);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
      }

      // Fire all 3 requests in parallel — not sequential
      const [topMovers, sectors, bondsAndCredit, regimeAndSummary] = await Promise.all([
        fetchTopMovers().catch(() => ({ gainers: [], losers: [] })),
        fetchSectors().catch(() => []),
        fetchBondsAndCredit().catch(() => ({})),
        fetchRegimeAndSummary().catch(() => ({})),
      ]);

      const combined = {
        top_movers:    topMovers,
        sectors:       sectors,
        bonds:         bondsAndCredit?.bonds || [],
        yield_curve:   bondsAndCredit?.yield_curve || null,
        credit_spreads: bondsAndCredit?.credit_spreads || null,
        regime:        regimeAndSummary?.regime || null,
        market_summary: regimeAndSummary?.market_summary || null,
      };

      setData(combined);
      setLastUpdated(new Date());
      saveToCache(combined, cacheIdRef.current);
    } catch (err) {
      console.error('Market data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, lastUpdated, refresh: () => fetchData(true) };
}

// ─── MARKET TILE ──────────────────────────────────────────────────────────────
export function MarketTile({ name, value, change, direction, subtext, sparkData, closed }) {
  const isUp   = direction === 'up';
  const isFlat = direction === 'flat' || !direction;
  const color  = closed ? 'text-muted-foreground/40' : isFlat ? 'text-muted-foreground' : isUp ? 'text-emerald-400' : 'text-red-400';
  const strokeColor = isFlat ? '#888' : isUp ? '#34d399' : '#f87171';

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
    <div
      className={`glass rounded-xl p-4 hover:border-primary/20 transition-all duration-200 group ${flashBg} ${closed ? 'opacity-60' : ''}`}
      style={{ transition: 'background-color 0.3s ease' }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium leading-tight tracking-wide">{name}</span>
        {closed ? (
          <span className="text-[10px] font-medium text-muted-foreground/40 bg-muted/30 px-1.5 py-0.5 rounded tracking-wide uppercase">Closed</span>
        ) : (
          <span className={`text-xs font-semibold flex items-center gap-0.5 tabular-nums ${color}`}>
            {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className={`text-lg font-bold tracking-tight mb-0.5 font-mono tabular-nums ${closed ? 'text-muted-foreground/50' : ''}`}>{value}</p>
      {subtext && <p className="text-xs text-muted-foreground/50 tracking-wide">{subtext}</p>}
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