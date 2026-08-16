import React from 'react';
import { FileText, Sparkles, ArrowUpRight } from 'lucide-react';
import { getSummaryParts } from '@/lib/cleanMarketCopy';

export default function MarketSummary({ summary, loading }) {
  const { headline, bullets } = getSummaryParts(summary);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/55 backdrop-blur-xl p-6 sm:p-7 h-full flex flex-col">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/50 via-primary/15 to-transparent" />
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/55 font-semibold">Market intelligence</p><h2 className="text-base font-semibold">Session Brief</h2></div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/45"><Sparkles className="w-3 h-3" /> AI-assisted</span>
      </header>

      {loading && !summary ? (
        <div className="animate-pulse space-y-3 flex-1"><div className="h-6 bg-muted/25 rounded w-5/6" /><div className="h-4 bg-muted/25 rounded" /><div className="h-4 bg-muted/25 rounded w-4/5" /></div>
      ) : (
        <div className="flex-1">
          <p className="font-display text-xl sm:text-2xl font-semibold leading-snug text-foreground mb-5">{headline || 'Market context is updating.'}</p>
          {bullets.length > 0 && <ul className="space-y-3">{bullets.map((item, index) => <li key={index} className="flex gap-3 text-sm leading-relaxed text-muted-foreground/75"><span className="mt-2 w-1 h-1 rounded-full bg-primary/70 shrink-0" /><span>{item}</span></li>)}</ul>}
        </div>
      )}

      <footer className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between gap-3">
        <span className="text-[10px] text-muted-foreground/40">Interpretation of delayed market data</span>
        <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors">Data source <ArrowUpRight className="w-3 h-3" /></a>
      </footer>
    </section>
  );
}
