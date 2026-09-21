import React from 'react';
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaginationControls({
  visible,
  total,
  pageSize,
  itemLabel = 'items',
  onShowMore,
  onHideMore,
  onShowAll,
  onHideAll,
  className = '',
}) {
  if (total <= pageSize) return null;

  const hasMore = visible < total;
  const canHide = visible > pageSize;
  const stepUp = Math.min(pageSize, total - visible);
  const stepDown = Math.min(pageSize, visible - pageSize);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="text-xs text-muted-foreground">Showing {visible} of {total} {itemLabel}</p>
      <div className="flex flex-wrap gap-2">
        {hasMore && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onShowMore}>
            <ChevronDown className="w-3.5 h-3.5" /> Show {stepUp} more
          </Button>
        )}
        {canHide && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onHideMore}>
            <ChevronUp className="w-3.5 h-3.5" /> Hide {stepDown}
          </Button>
        )}
        {hasMore && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onShowAll}>
            <ChevronsDown className="w-3.5 h-3.5" /> Show all
          </Button>
        )}
        {canHide && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onHideAll}>
            <ChevronsUp className="w-3.5 h-3.5" /> Hide all
          </Button>
        )}
      </div>
    </div>
  );
}