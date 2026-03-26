import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TopMovers({ topMovers, loading }) {
  if (loading || !topMovers) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gainers */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Top Gainers</h3>
        </div>
        <div className="space-y-2">
          {(topMovers.gainers || []).map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <div>
                <span className="text-sm font-medium">{m.ticker || m.name}</span>
                {m.name && m.ticker && <span className="text-xs text-muted-foreground ml-2">{m.name}</span>}
              </div>
              <span className="text-sm font-bold text-emerald-400">{m.change_pct}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Losers */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Top Losers</h3>
        </div>
        <div className="space-y-2">
          {(topMovers.losers || []).map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <div>
                <span className="text-sm font-medium">{m.ticker || m.name}</span>
                {m.name && m.ticker && <span className="text-xs text-muted-foreground ml-2">{m.name}</span>}
              </div>
              <span className="text-sm font-bold text-red-400">{m.change_pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}