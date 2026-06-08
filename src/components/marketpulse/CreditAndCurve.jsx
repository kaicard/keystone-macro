import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function DirectionBadge({ direction }) {
  const isPositive = direction === 'tightening' || direction === 'up' || direction === 'steepening' || direction === 'normal';
  const isNegative = direction === 'widening' || direction === 'down' || direction === 'inverted';
  const cls = isPositive
    ? 'bg-emerald-400/10 text-emerald-400'
    : isNegative
    ? 'bg-red-400/10 text-red-400'
    : 'bg-muted/40 text-muted-foreground';
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {direction || '—'}
    </span>
  );
}

function MetricRow({ label, value, unit, direction }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums">
          {value}
          {unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
        </span>
        {direction && <DirectionBadge direction={direction} />}
      </div>
    </div>
  );
}

export default function CreditAndCurve({ creditSpreads, yieldCurve, dxy, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl p-5 animate-pulse h-44" />)}
      </div>
    );
  }

  const cs = creditSpreads || {};
  const yc = yieldCurve || {};

  const dxyChange = dxy?.change_pct;
  const dxyDir = dxy?.direction;
  const DxyIcon = dxyDir === 'up' ? TrendingUp : dxyDir === 'down' ? TrendingDown : Minus;
  const dxyColor = dxyDir === 'up' ? 'text-emerald-400' : dxyDir === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Credit Spreads */}
      <div className="glass rounded-xl p-5 flex flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Credit Spreads</p>
        <div className="flex-1">
          {cs.ig_spread != null || cs.hy_spread != null ? (
            <>
              {cs.ig_spread != null && (
                <MetricRow label="US IG OAS" value={cs.ig_spread} unit="bp" direction={cs.ig_direction} />
              )}
              {cs.hy_spread != null && (
                <MetricRow label="US HY OAS" value={cs.hy_spread} unit="bp" direction={cs.hy_direction} />
              )}
              {cs.commentary && (
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed mt-3">{cs.commentary}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/40 mt-2">Awaiting data...</p>
          )}
        </div>
      </div>

      {/* Yield Curve */}
      <div className="glass rounded-xl p-5 flex flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Yield Curve (2s10s)</p>
        <div className="flex-1">
          {yc.spread_2s10s != null ? (
            <>
              <MetricRow label="2s10s Spread" value={yc.spread_2s10s} unit="bps" direction={yc.shape} />
              {yc.commentary && (
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed mt-3">{yc.commentary}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/40 mt-2">Awaiting data...</p>
          )}
        </div>
      </div>

      {/* DXY */}
      <div className="glass rounded-xl p-5 flex flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Dollar Index (DXY)</p>
        <div className="flex-1">
          {dxy ? (
            <>
              <MetricRow
                label="DXY"
                value={dxy.price}
                direction={dxyDir === 'up' ? 'up' : dxyDir === 'down' ? 'down' : undefined}
              />
              <div className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${dxyColor}`}>
                <DxyIcon className="w-3.5 h-3.5" />
                <span>{dxyChange}</span>
                <span className="text-muted-foreground font-normal">today</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground/40 mt-2">Awaiting data...</p>
          )}
        </div>
      </div>

    </div>
  );
}