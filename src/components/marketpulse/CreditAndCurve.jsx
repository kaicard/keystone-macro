import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { cleanMarketCopy, compactSignal } from '@/lib/cleanMarketCopy';

function DirectionBadge({ direction }) {
  const value = cleanMarketCopy(direction).toLowerCase();
  const positive = ['tightening', 'up', 'steepening', 'normal'].includes(value);
  const negative = ['widening', 'down', 'inverted'].includes(value);
  const cls = positive ? 'text-emerald-400 bg-emerald-400/8' : negative ? 'text-red-400 bg-red-400/8' : 'text-muted-foreground bg-muted/30';
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}>{value || 'flat'}</span>;
}

function MetricRow({ label, value, direction }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground/70">{cleanMarketCopy(label)}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground/90">{cleanMarketCopy(String(value ?? '—'))}</span>
        {direction && <DirectionBadge direction={direction} />}
      </div>
    </div>
  );
}

function DataCard({ eyebrow, title, children, source }) {
  return (
    <section className="rounded-2xl border border-border/35 bg-card/45 p-5 min-h-[168px] flex flex-col">
      <header className="mb-3"><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/45 font-semibold">{eyebrow}</p><h3 className="text-sm font-semibold mt-1">{title}</h3></header>
      <div className="flex-1">{children}</div>
      {source?.source_url && <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start mt-3 text-[9px] text-muted-foreground/40 hover:text-primary">Source: {cleanMarketCopy(source.source_name || 'Open data')} <ArrowUpRight className="w-2.5 h-2.5" /></a>}
    </section>
  );
}

export default function CreditAndCurve({ creditSpreads, yieldCurve, dxy, loading }) {
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl border border-border/30 bg-card/40 animate-pulse h-44" />)}</div>;

  const creditRows = Array.isArray(creditSpreads)
    ? creditSpreads
    : [
        creditSpreads?.ig_spread != null && { name: 'US IG OAS', value_bps: `${creditSpreads.ig_spread} bp`, direction: creditSpreads.ig_direction },
        creditSpreads?.hy_spread != null && { name: 'US HY OAS', value_bps: `${creditSpreads.hy_spread} bp`, direction: creditSpreads.hy_direction },
      ].filter(Boolean);

  const curveRows = Array.isArray(yieldCurve)
    ? yieldCurve
    : yieldCurve?.spread_2s10s != null
      ? [{ name: 'US 2s10s', spread_bps: yieldCurve.spread_2s10s, shape: yieldCurve.shape }]
      : [];

  const dxyDirection = dxy?.direction;
  const DxyIcon = dxyDirection === 'up' ? TrendingUp : dxyDirection === 'down' ? TrendingDown : Minus;
  const dxyColor = dxyDirection === 'up' ? 'text-emerald-400' : dxyDirection === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DataCard eyebrow="Risk pricing" title="Credit Spreads" source={creditRows[0]}>
        {creditRows.length ? creditRows.slice(0, 3).map(row => <MetricRow key={row.name} label={row.name} value={row.value_bps} direction={row.direction || row.trend} />) : <p className="text-xs text-muted-foreground/40 py-3">No verified spread data available.</p>}
      </DataCard>

      <DataCard eyebrow="Rates structure" title="Yield Curve">
        {curveRows.length ? curveRows.map(row => <MetricRow key={row.name} label={row.name} value={`${row.spread_bps} bps`} direction={row.shape || row.direction} />) : <p className="text-xs text-muted-foreground/40 py-3">Curve data is updating.</p>}
      </DataCard>

      <DataCard eyebrow="FX benchmark" title="Dollar Index">
        {dxy ? (
          <div className="pt-2">
            <div className="flex items-end justify-between gap-4"><span className="font-display text-3xl font-semibold tabular-nums">{cleanMarketCopy(String(dxy.price ?? '—'))}</span><div className={`flex items-center gap-1 text-sm font-semibold ${dxyColor}`}><DxyIcon className="w-4 h-4" />{cleanMarketCopy(String(dxy.change_pct ?? '—'))}</div></div>
            <p className="text-xs text-muted-foreground/50 mt-3">{compactSignal(dxyDirection === 'up' ? 'Dollar firmer today' : dxyDirection === 'down' ? 'Dollar softer today' : 'Dollar broadly unchanged')}</p>
          </div>
        ) : <p className="text-xs text-muted-foreground/40 py-3">Dollar data is updating.</p>}
      </DataCard>
    </div>
  );
}
