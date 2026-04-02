import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'keystone_watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback((item) => {
    setWatchlist(prev => {
      if (prev.find(w => w.ticker === item.ticker)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFromWatchlist = useCallback((ticker) => {
    setWatchlist(prev => prev.filter(w => w.ticker !== ticker));
  }, []);

  const isWatched = useCallback((ticker) => {
    return watchlist.some(w => w.ticker === ticker);
  }, [watchlist]);

  const toggleWatchlist = useCallback((item) => {
    if (isWatched(item.ticker)) {
      removeFromWatchlist(item.ticker);
    } else {
      addToWatchlist(item);
    }
  }, [isWatched, addToWatchlist, removeFromWatchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isWatched, toggleWatchlist };
}