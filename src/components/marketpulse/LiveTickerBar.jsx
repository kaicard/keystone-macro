import React, { useRef, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function fmt(price, name) {
  if (price == null) return '—';
  if (name?.includes('/')) return price.toFixed(4);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const SPEED = 40; // px/s

export default function LiveTickerBar({ data }) {
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const halfRef = useRef(0);
  const itemsRef = useRef([]);

  const buildItems = useCallback((data) => [
    ...(data?.indices || []),
    ...(data?.equities || []),
    ...(data?.fx || []),
    ...(data?.commodities || []),
    ...(data?.crypto || []),
    ...(data?.etfs || []),
    ...(data?.vix ? [data.vix] : []),
    ...(data?.dxy ? [data.dxy] : []),
  ].filter(i => i?.price != null), []);

  // Render items into DOM imperatively so we never remount the track
  const renderItems = useCallback((items) => {
    const track = trackRef.current;
    if (!track) return;
    const doubled = [...items, ...items];

    // Reuse existing spans or create new ones
    while (track.children.length > doubled.length) track.removeChild(track.lastChild);
    doubled.forEach((item, idx) => {
      let span = track.children[idx];
      if (!span) {
        span = document.createElement('span');
        span.className = 'inline-flex items-center gap-2 px-5 whitespace-nowrap select-none';
        track.appendChild(span);
      }
      const isUp = item.direction === 'up';
      const isDown = item.direction === 'down';
      const color = isUp ? '#34d399' : isDown ? '#f87171' : '#6b7280';
      const arrow = isUp ? '▲' : isDown ? '▼' : '—';
      const changePct = item.change_pct != null
        ? `${item.change_pct > 0 ? '+' : ''}${item.change_pct.toFixed(2)}%`
        : '';
      span.innerHTML = `
        <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85)">${item.name || item.ticker}</span>
        <span style="font-size:11px;font-family:monospace;font-weight:700">${fmt(item.price, item.name)}</span>
        <span style="font-size:11px;font-weight:600;color:${color}">${arrow} ${changePct}</span>
        <span style="color:#334155;margin-left:4px">·</span>
      `;
    });

    halfRef.current = track.scrollWidth / 2;
  }, []);

  // RAF loop — mounts once, never resets
  useEffect(() => {
    const step = (ts) => {
      if (lastTsRef.current != null) {
        const dt = (ts - lastTsRef.current) / 1000;
        posRef.current += SPEED * dt;
        const half = halfRef.current;
        if (half > 0 && posRef.current >= half) posRef.current -= half;
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
        }
      }
      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Update displayed data without touching the animation
  useEffect(() => {
    const items = buildItems(data);
    if (!items.length) return;
    itemsRef.current = items;
    renderItems(items);
  }, [data, buildItems, renderItems]);

  return (
    <div className="w-full bg-card/80 border-y border-border/40 overflow-hidden py-2 relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />
      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{ width: 'max-content' }}
      />
    </div>
  );
}