import React, { useRef, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function fmt(price, name) {
  if (price == null) return '—';
  if (name?.includes('/')) return price.toFixed(4);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function TickerItem({ item }) {
  const isUp = item.direction === 'up';
  const isDown = item.direction === 'down';
  const color = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-muted-foreground';
  const changePct = item.change_pct != null
    ? `${item.change_pct > 0 ? '+' : ''}${item.change_pct.toFixed(2)}%`
    : '';

  return (
    <span className="inline-flex items-center gap-2 px-5 whitespace-nowrap select-none">
      <span className="text-xs font-semibold text-foreground/80">{item.name || item.ticker}</span>
      <span className="text-xs font-mono font-bold text-foreground">{fmt(item.price, item.name)}</span>
      <span className={`text-xs font-semibold flex items-center gap-0.5 ${color}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {changePct}
      </span>
      <span className="text-border/50 text-xs">·</span>
    </span>
  );
}

export default function LiveTickerBar({ data }) {
  // Only update items ref without causing animation resets
  const itemsRef = useRef([]);
  const [, forceRender] = useState(0);

  const newItems = [
    ...(data?.indices || []),
    ...(data?.equities || []),
    ...(data?.fx || []),
    ...(data?.commodities || []),
    ...(data?.crypto || []),
    ...(data?.etfs || []),
    ...(data?.vix ? [data.vix] : []),
    ...(data?.dxy ? [data.dxy] : []),
  ].filter(i => i?.price != null);

  // On first data load, store and render
  if (newItems.length > 0 && itemsRef.current.length === 0) {
    itemsRef.current = newItems;
  }

  // When data refreshes, update values in place without resetting animation
  useEffect(() => {
    if (newItems.length > 0) {
      itemsRef.current = newItems;
      forceRender(n => n + 1);
    }
  }, [JSON.stringify(newItems.map(i => i.price))]);

  const items = itemsRef.current;
  if (!items.length) return null;

  const duration = items.length * 3.5;

  return (
    <div className="w-full bg-card/80 border-y border-border/40 overflow-hidden py-2 relative">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card/90 to-transparent z-10 pointer-events-none" />

      {/* Two identical tracks offset by 50% — no key reset, animation runs continuously */}
      <div className="flex" style={{ width: 'max-content' }}>
        <div
          className="flex"
          style={{
            animation: `ticker-scroll ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        >
          {items.map((item, i) => <TickerItem key={item.ticker} item={item} />)}
          {items.map((item, i) => <TickerItem key={`${item.ticker}-2`} item={item} />)}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}