import { useEffect, useState } from 'react';

/**
 * Progressive reveal state for long lists.
 * Starts at `pageSize` visible items and exposes step/all controls.
 * `resetKey` collapses back to the first page whenever it changes
 * (e.g. when a search term or category filter changes).
 */
export default function usePagination(total, pageSize, resetKey) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  const visible = Math.min(visibleCount, total);

  return {
    visible,
    hasMore: visible < total,
    canHide: visible > pageSize,
    showMore: () => setVisibleCount(c => Math.min(c + pageSize, total)),
    hideMore: () => setVisibleCount(c => Math.max(c - pageSize, pageSize)),
    showAll: () => setVisibleCount(total),
    hideAll: () => setVisibleCount(pageSize),
  };
}