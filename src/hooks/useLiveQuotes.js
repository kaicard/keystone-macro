import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getExchangeStatus } from '@/lib/marketHours';

// Check if any major market is currently open
function anyMajorMarketOpen() {
  const us = getExchangeStatus('US');
  const uk = getExchangeStatus('UK');
  const eu = getExchangeStatus('EU');
  const jp = getExchangeStatus('JP');
  return us.open || uk.open || eu.open || jp.open;
}

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

    // During market hours: refresh every 90 seconds
    // Outside market hours: refresh every 10 minutes (for any late/extended data)
    function scheduleNext() {
      const interval = anyMajorMarketOpen() ? 90 * 1000 : 10 * 60 * 1000;
      fetchRef.current = setTimeout(async () => {
        await fetchReal();
        scheduleNext();
      }, interval);
    }

    scheduleNext();

    return () => {
      clearTimeout(fetchRef.current);
    };
  }, [fetchReal]);

  return { data, loading, lastFetched, error, refresh: fetchReal };
}