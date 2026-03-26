import React, { useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function fmt(price, name) {
  if (price == null) return '—';
  // FX pairs use more decimals
  if (name?.includes('/')) return price.toFixed(4);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function TickerItem({ item }) {
  const isUp = item.direction === 'up';
  const isDown = item.direction === 'down';
  const color = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-muted-foreground';
  const changePct = item.change_pct != null ? `${item.change_pct > 0 ? '+' : ''}${item.change_pct.toFixed(2)}%` : '';

  return (
    <span className="inline-flex items-center gap-2 px-5 whitespace-nowrap">
      <span className="text-xs font-semibold text-foreground/90">{item.name || item.ticker}</span>
      <span className="text-xs font-mono font-bold text-foreground">{fmt(item.price, item.name)}</span>
      <span className={`text-xs font-semibold flex items-center gap-0.5 ${color}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {changePct}
      </span>
      <span className="text-border/60">·</span>
    </span>
  );
}

export default function LiveTickerBar({ data }) {
  const trackRef = useRef(null);

  // Combine all items for the ticker
  const items = [
    ...(data?.indices || []),
    ...(data?.equities || []),
    ...(data?.fx || []),
    ...(data?.commodities || []),
    ...(data?.crypto || []),
    ...(data?.etfs || []),
    ...(data?.vix ? [data.vix] : []),
    ...(data?.dxy ? [data.dxy] : []),
  ].filter(i => i?.price != null);

  if (!items.length) return null;

  // Double items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="w-full bg-card/80 border-y border-border/40 overflow-hidden py-2 relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex animate-ticker"
        style={{
          animation: `ticker ${items.length * 4}s linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((item, i) => (
          <TickerItem key={`${item.ticker}-${i}`} item={item} />
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}