import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function DirectionIcon({ direction }) {
  if (direction === 'tightening' || direction === 'steepening' || direction === 'up') return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
  if (direction === 'widening' || direction === 'flattening' || direction === 'inverted' || direction === 'down') return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function trendColor(direction) {
  if (direction === 'tightening' || direction === 'steepening') return 'text-emerald-400';
  if (direction === 'widening' || direction === 'flattening' || direction === 'inverted') return 'text-red-400';
  return 'text-muted-foreground';
}

export default function CreditAndCurve({ creditSpreads, yieldCurve, dxy, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl p-5 animate-pulse h-36" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Credit Spreads */}
      <div className="glass rounded-xl p-5 min-h-[140px] flex flex-col">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Credit Spreads</h3>
        <div className="space-y-3 flex-1">
          {(creditSpreads || []).length > 0 ? (
            creditSpreads.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">{c.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-bold">{c.value_bps}<span className="text-xs font-normal text-muted-foreground ml-0.5">bps</span></span>
                  <span className={`text-xs font-medium ${trendColor(c.direction)}`}>{c.trend || c.direction}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground/50">Awaiting data...</p>
          )}
        </div>
      </div>

      {/* Yield Curve */}
      <div className="glass rounded-xl p-5 min-h-[140px] flex flex-col">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Yield Curve (2s10s)</h3>
        <div className="space-y-3 flex-1">
          {(yieldCurve || []).length > 0 ? (
            yieldCurve.map((y, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">{y.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-bold">{y.spread_bps}<span className="text-xs font-normal text-muted-foreground ml-0.5">bps</span></span>
                  <Badge variant="outline" className={`text-xs border-0 px-1.5 py-0.5 ${
                    y.shape === 'inverted' ? 'bg-red-400/10 text-red-400' :
                    y.shape === 'steepening' ? 'bg-emerald-400/10 text-emerald-400' :
                    'bg-muted/40 text-muted-foreground'
                  }`}>{y.shape || y.direction}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground/50">Awaiting data...</p>
          )}
        </div>
      </div>

      {/* DXY */}
      <div className="glass rounded-xl p-5 min-h-[140px] flex flex-col justify-center">
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