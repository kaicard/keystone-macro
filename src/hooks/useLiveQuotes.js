import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Nudge a price by a tiny realistic amount to simulate live market movement
function nudgePrice(price, changePct, isFx) {
  if (!price || price <= 0) return price;
  // FX and low-price instruments have smaller absolute moves
  const vol = isFx ? 0.00008 : Math.abs(changePct || 0) > 3 ? 0.0006 : 0.0003;
  const bias = (changePct || 0) > 0 ? 0.00003 : (changePct || 0) < 0 ? -0.00003 : 0;
  const delta = price * (bias + (Math.random() - 0.5) * vol);
  const newPrice = price + delta;
  // Keep decimals appropriate
  if (isFx || price < 5) return +newPrice.toFixed(4);
  if (price < 100) return +newPrice.toFixed(2);
  return +newPrice.toFixed(2);
}

function nudgeItems(arr) {
  return arr.map(item => {
    if (!item?.price) return item;
    const isFx = item.category === 'fx' || (item.name || '').includes('/');
    return { ...item, price: nudgePrice(item.price, item.change_pct, isFx) };
  });
}

function nudgeObj(obj) {
  if (!obj?.price) return obj;
  return { ...obj, price: nudgePrice(obj.price, obj.change_pct, false) };
}

export function useLiveQuotes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError] = useState(null);
  const tickRef = useRef(null);
  const fetchRef = useRef(null);

  const fetchReal = useCallback(async () => {
    try {
      setLoading(true);
      const res = await base44.functions.invoke('liveQuotes', {});
      const payload = res?.data;
      if (payload?.ok && payload?.data) {
        setData(payload.data);
        setLastFetched(new Date());
        setError(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReal();

    // Micro-tick every 1.5 seconds: nudge prices for live feel
    tickRef.current = setInterval(() => {
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          indices: nudgeItems(prev.indices || []),
          equities: nudgeItems(prev.equities || []),
          etfs: nudgeItems(prev.etfs || []),
          fx: nudgeItems(prev.fx || []),
          commodities: nudgeItems(prev.commodities || []),
          crypto: nudgeItems(prev.crypto || []),
          vix: nudgeObj(prev.vix),
          dxy: nudgeObj(prev.dxy),
        };
      });
    }, 1500);

    // Re-fetch real prices every 5 minutes
    fetchRef.current = setInterval(fetchReal, 5 * 60 * 1000);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(fetchRef.current);
    };
  }, []);

  return { data, loading, lastFetched, error, refresh: fetchReal };
}