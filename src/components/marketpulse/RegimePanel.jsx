import React from 'react';
import { Activity, TrendingUp, BarChart3, Shield, Zap, Target } from 'lucide-react';

const REGIME_COLORS = {
  'Risk-On': { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  'Risk-Off': { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  'Inflation Pressure': { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  'Growth Slowdown': { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  'Liquidity Expansion': { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  'Stagflation': { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
};

const SIGNAL_COLORS = {
  positive: 'text-emerald-400',
  expanding: 'text-emerald-400',
  easing: 'text-emerald-400',
  low: 'text-emerald-400',
  accelerating: 'text-emerald-400',
  neutral: 'text-amber-400',
  moderating: 'text-amber-400',
  stable: 'text-amber-400',
  negative: 'text-red-400',
  contracting: 'text-red-400',
  restrictive: 'text-red-400',
  high: 'text-red-400',
  elevated: 'text-amber-400',
};

function getSignalColor(val) {
  if (!val) return 'text-muted-foreground';
  const key = val.toLowerCase().split(' ')[0];
  return SIGNAL_COLORS[key] || 'text-muted-foreground';
}

export default function RegimePanel({ regime, loading }) {
  const regimeStyle = regime?.label ? (REGIME_COLORS[regime.label] || REGIME_COLORS['Risk-On']) : REGIME_COLORS['Risk-On'];

  const signals = regime ? [
    { icon: TrendingUp, label: 'Growth Signal', value: regime.growth },
    { icon: BarChart3, label: 'Inflation Signal', value: regime.inflation },
    { icon: Shield, label: 'Policy Stance', value: regime.policy },
    { icon: Activity, label: 'Volatility', value: regime.volatility },
    { icon: Zap, label: 'Leadership', value: regime.leadership },
  ] : [];

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">Regime Monitor</h2>
      </div>

      {loading && !regime ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted/30 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted/30 rounded-lg" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Regime Badge */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${regimeStyle.bg} border ${regimeStyle.border}`}>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Regime</p>
              <p className={`text-xl font-bold ${regimeStyle.color}`}>{regime?.label || 'Risk-On'}</p>
            </div>
            <div className="max-w-xs">
              <p className="text-xs text-muted-foreground text-right leading-relaxed">{regime?.description}</p>
            </div>
          </div>

          {/* Signal Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {signals.map(s => (
              <div key={s.label} className="p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <p className={`text-sm font-semibold ${getSignalColor(s.value)}`}>{s.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}