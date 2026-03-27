import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useLiveQuotes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError] = useState(null);
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

    // Re-fetch real prices every 5 minutes
    fetchRef.current = setInterval(fetchReal, 5 * 60 * 1000);

    return () => {
      clearInterval(fetchRef.current);
    };
  }, []);

  return { data, loading, lastFetched, error, refresh: fetchReal };
}