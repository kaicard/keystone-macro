import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getExchangeStatus } from '@/lib/marketHours';

function anyMajorMarketOpen() {
  const us = getExchangeStatus('US');
  const uk = getExchangeStatus('UK');
  const eu = getExchangeStatus('EU');
  const jp = getExchangeStatus('JP');
  return us.open || uk.open || eu.open || jp.open;
}

function getRefreshInterval() {
  if (anyMajorMarketOpen()) return 90; // seconds
  return 10 * 60; // 10 minutes off-hours
}

export function useLiveQuotes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(null);
  const [error, setError] = useState(null);
  const fetchRef = useRef(null);
  const countdownRef = useRef(null);
  const nextRefreshAt = useRef(null);

  const startCountdown = useCallback(() => {
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      if (!nextRefreshAt.current) return;
      const remaining = Math.max(0, Math.round((nextRefreshAt.current - Date.now()) / 1000));
      setSecondsUntilRefresh(remaining);
    }, 1000);
  }, []);

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

    function scheduleNext() {
      const intervalSecs = getRefreshInterval();
      nextRefreshAt.current = Date.now() + intervalSecs * 1000;
      startCountdown();
      fetchRef.current = setTimeout(async () => {
        await fetchReal();
        scheduleNext();
      }, intervalSecs * 1000);
    }

    scheduleNext();

    return () => {
      clearTimeout(fetchRef.current);
      clearInterval(countdownRef.current);
    };
  }, [fetchReal, startCountdown]);

  const refresh = useCallback(async () => {
    clearTimeout(fetchRef.current);
    clearInterval(countdownRef.current);
    await fetchReal();
    // reschedule
    const intervalSecs = getRefreshInterval();
    nextRefreshAt.current = Date.now() + intervalSecs * 1000;
    startCountdown();
    fetchRef.current = setTimeout(async function loop() {
      await fetchReal();
      const s = getRefreshInterval();
      nextRefreshAt.current = Date.now() + s * 1000;
      fetchRef.current = setTimeout(loop, s * 1000);
    }, intervalSecs * 1000);
  }, [fetchReal, startCountdown]);

  return { data, loading, lastFetched, secondsUntilRefresh, error, refresh };
}