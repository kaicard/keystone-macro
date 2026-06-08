import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function DirectionIcon({ direction }) {
  if (direction === 'tightening' || direction === 'up') return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
  if (direction === 'widening' || direction === 'down') return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function CreditAndCurve({ creditSpreads, yieldCurve, dxy, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl p-5 animate-pulse h-36" />)}
      </div>
    );
  }

  // creditSpreads is a flat object: { ig_spread, hy_spread, ig_direction, hy_direction, commentary }
  const cs = creditSpreads || {};
  // yieldCurve is a flat object: { spread_2s10s, shape, commentary }
  const yc = yieldCurve || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Credit Spreads */}
      <div className="glass rounded-xl p-5 flex flex-col">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Credit Spreads</h3>
        {cs.ig_spread != null || cs.hy_spread != null ? (
          <div className="space-y-3 flex-1">
            {cs.ig_spread != null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">US IG OAS</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tabular-nums">{cs.ig_spread}<span className="text-xs font-normal text-muted-foreground ml-0.5">bp</span></span>
                  <Badge variant="outline" className={`text-[10px] border-0 px-1.5 py-0.5 ${
                    cs.ig_direction === 'tightening' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                  }`}>{cs.ig_direction || '—'}</Badge>
                </div>
              </div>
            )}
            {cs.hy_spread != null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">US HY OAS</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tabular-nums">{cs.hy_spread}<span className="text-xs font-normal text-muted-foreground ml-0.5">bp</span></span>
                  <Badge variant="outline" className={`text-[10px] border-0 px-1.5 py-0.5 ${
                    cs.hy_direction === 'tightening' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                  }`}>{cs.hy_direction || '—'}</Badge>
                </div>
              </div>
            )}
            {cs.commentary && (
              <p className="text-xs text-muted-foreground/50 leading-relaxed mt-2 pt-2 border-t border-border/20">{cs.commentary}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">Awaiting data...</p>
        )}
      </div>

      {/* Yield Curve */}
      <div className="glass rounded-xl p-5 flex flex-col">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Yield Curve (2s10s)</h3>
        {yc.spread_2s10s != null ? (
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-muted-foreground">2s10s Spread</span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tabular-nums">
                  {yc.spread_2s10s}<span className="text-xs font-normal text-muted-foreground ml-0.5">bps</span>
                </span>
                <Badge variant="outline" className={`text-[10px] border-0 px-1.5 py-0.5 ${
                  yc.shape === 'inverted' ? 'bg-red-400/10 text-red-400' :
                  yc.shape === 'steepening' ? 'bg-emerald-400/10 text-emerald-400' :
                  'bg-muted/40 text-muted-foreground'
                }`}>{yc.shape || '—'}</Badge>
              </div>
            </div>
            {yc.commentary && (
              <p className="text-xs text-muted-foreground/50 leading-relaxed mt-2 pt-2 border-t border-border/20">{yc.commentary}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">Awaiting data...</p>
        )}
      </div>

      {/* DXY */}
      <div className="glass rounded-xl p-5 flex flex-col justify-center">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Dollar Index (DXY)</h3>
        {dxy ? (
          <div>
            <p className="text-3xl font-bold tracking-tight mb-2">{dxy.price}</p>
            <div className="flex items-center gap-2">
              <DirectionIcon direction={dxy.direction} />
              <span className={`text-sm font-semibold ${dxy.direction === 'up' ? 'text-emerald-400' : dxy.direction === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>
                {dxy.change_pct || '0%'}
              </span>
              <span className="text-xs text-muted-foreground">today</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">Awaiting data...</p>
        )}
      </div>
    </div>
  );
}