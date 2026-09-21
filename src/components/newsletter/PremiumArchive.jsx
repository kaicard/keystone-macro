import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Archive, Loader2, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EditionCard from '@/components/newsletter/EditionCard';

const PAGE_SIZE = 9;

export default function PremiumArchive({ isPaid, accessLoading }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ['premium-archive'],
    queryFn: async () => (await base44.functions.invoke('getPremiumArchive', {}))?.data || {},
    enabled: !!isPaid,
  });

  const editions = data?.editions || [];
  const loading = accessLoading || (isPaid && isLoading);
  const shown = editions.slice(0, visibleCount);
  const hasMore = visibleCount < editions.length;
  const canHide = visibleCount > PAGE_SIZE;

  return (
    <section className="rounded-xl border border-border/55 bg-card/35 p-6 mb-5">
      {isPaid ? (
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Archive className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Premium archive</h2>
              <p className="text-xs text-muted-foreground">Every published premium edition, available to your verified account.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading your archive…</span>
            </div>
          ) : editions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Archive className="h-5 w-5 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/60">No editions published yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shown.map((edition, index) => (
                  <EditionCard key={edition.id} edition={edition} index={index} />
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {shown.length} of {editions.length} editions
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasMore && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, editions.length))}>
                      <ChevronDown className="w-3.5 h-3.5" /> Show {Math.min(PAGE_SIZE, editions.length - visibleCount)} more
                    </Button>
                  )}
                  {canHide && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setVisibleCount(c => Math.max(c - PAGE_SIZE, PAGE_SIZE))}>
                      <ChevronUp className="w-3.5 h-3.5" /> Hide {Math.min(PAGE_SIZE, visibleCount - PAGE_SIZE)}
                    </Button>
                  )}
                  {hasMore && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setVisibleCount(editions.length)}>
                      <ChevronsDown className="w-3.5 h-3.5" /> Show all
                    </Button>
                  )}
                  {canHide && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setVisibleCount(PAGE_SIZE)}>
                      <ChevronsUp className="w-3.5 h-3.5" /> Hide all
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center">
          <Lock className="w-5 h-5 text-primary mx-auto mb-3" />
          <h2 className="font-display text-2xl font-semibold mb-2">Premium archive</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            {accessLoading ? 'Checking your access…' : 'Full edition bodies are available only after a paid subscription is verified.'}
          </p>
        </div>
      )}
    </section>
  );
}