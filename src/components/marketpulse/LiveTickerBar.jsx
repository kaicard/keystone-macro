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
  const changePct = item.change_pct != null ? `${item.change_pct > 0 ? '+' : ''}${item.change_pct.toFixed(2)}%` : '';

  return (
    <span className="inline-flex items-center gap-2 px-5 whitespace-nowrap select-none">
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

const SPEED = 40; // px per second

export default function LiveTickerBar({ data }) {
  const outerRef = useRef(null);
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const halfWidthRef = useRef(0);

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

  // Capture half-width after render so the loop point is always correct
  useEffect(() => {
    if (trackRef.current) {
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    }
  });

  // Run RAF loop once on mount — never restart it
  useEffect(() => {
    const step = (ts) => {
      if (lastTimeRef.current != null) {
        const dt = (ts - lastTimeRef.current) / 1000;
        posRef.current += SPEED * dt;
        const half = halfWidthRef.current;
        if (half > 0 && posRef.current >= half) {
          posRef.current -= half;
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
        }
      }
      lastTimeRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // empty — runs once, never resets

  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div ref={outerRef} className="w-full bg-card/80 border-y border-border/40 overflow-hidden py-2 relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{ width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <TickerItem key={`${item.ticker}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}