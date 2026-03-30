import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';



export function useMarketData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await base44.functions.invoke('liveMarketContext', {});
    if (res?.data?.data) {
      setData(res.data.data);
      setLastUpdated(res.data.fetched_at ? new Date(res.data.fetched_at) : new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, lastUpdated, refresh: fetchData };
}

export function MarketTile({ name, value, change, direction, subtext, sparkData, closed }) {
  const isUp = direction === 'up';
  const isFlat = direction === 'flat' || !direction;
  const color = closed ? 'text-muted-foreground/40' : isFlat ? 'text-muted-foreground' : isUp ? 'text-emerald-400' : 'text-red-400';
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
    <div className={`glass rounded-xl p-4 hover:border-primary/20 transition-all group ${flashBg} ${closed ? 'opacity-70' : ''}`}
         style={{ transition: 'background-color 0.3s ease' }}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium leading-tight">{name}</span>
        {closed ? (
          <span className="text-[10px] font-medium text-muted-foreground/40 bg-muted/30 px-1.5 py-0.5 rounded">Closed</span>
        ) : (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${color}`}>
            {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className={`text-base font-bold tracking-tight mb-0.5 font-mono ${closed ? 'text-muted-foreground/50' : ''}`}>{value}</p>
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