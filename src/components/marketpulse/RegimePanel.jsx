import React from 'react';
import { Activity, TrendingUp, BarChart3, Shield, Zap, Target } from 'lucide-react';
import { cleanMarketCopy, compactSignal, truncateWords } from '@/lib/cleanMarketCopy';

const REGIME_COLORS = {
  'Risk-On': { color: 'text-emerald-400', dot: 'bg-emerald-400', line: 'from-emerald-400/50' },
  'Risk-Off': { color: 'text-red-400', dot: 'bg-red-400', line: 'from-red-400/50' },
  'Inflation Pressure': { color: 'text-amber-400', dot: 'bg-amber-400', line: 'from-amber-400/50' },
  'Growth Slowdown': { color: 'text-orange-400', dot: 'bg-orange-400', line: 'from-orange-400/50' },
  'Liquidity Expansion': { color: 'text-blue-400', dot: 'bg-blue-400', line: 'from-blue-400/50' },
  'Stagflation': { color: 'text-red-400', dot: 'bg-red-400', line: 'from-red-400/50' },
};

export default function RegimePanel({ regime, loading }) {
  const style = REGIME_COLORS[regime?.label] || REGIME_COLORS['Risk-On'];
  const signals = regime ? [
    { icon: TrendingUp, label: 'Growth', value: regime.growth },
    { icon: BarChart3, label: 'Inflation', value: regime.inflation },
    { icon: Shield, label: 'Policy', value: regime.policy },
    { icon: Activity, label: 'Volatility', value: regime.volatility },
    { icon: Zap, label: 'Leadership', value: regime.leadership },
  ] : [];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/55 backdrop-blur-xl p-6 sm:p-7 h-full">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${style.line} via-primary/20 to-transparent`} />
      <header className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Target className="w-4 h-4 text-primary" /></div>
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/55 font-semibold">Macro framework</p><h2 className="text-base font-semibold">Regime Monitor</h2></div>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/45 border border-border/30 rounded-full px-2.5 py-1">Model view</span>
      </header>

      {loading && !regime ? (
        <div className="animate-pulse grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="h-32 rounded-xl bg-muted/25" />
          <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted/25" />)}</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-6 lg:gap-7 items-stretch">
          <div className="lg:border-r lg:border-border/25 lg:pr-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3"><span className={`w-2 h-2 rounded-full ${style.dot}`} /><span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/55 font-semibold">Current regime</span></div>
            <p className={`font-display text-3xl sm:text-4xl font-semibold tracking-tight ${style.color}`}>{cleanMarketCopy(regime?.label) || 'Awaiting signal'}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground/75 max-w-md">{truncateWords(regime?.description, 28) || 'The model is waiting for sufficient market context.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-1 content-center">
            {signals.map(({ icon: Icon, label, value }, index) => (
              <div key={label} className={`py-3.5 ${index < 3 ? 'border-b border-border/20' : ''}`}>
                <div className="flex items-center gap-1.5 mb-1.5"><Icon className="w-3.5 h-3.5 text-muted-foreground/50" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">{label}</span></div>
                <p className="text-sm font-semibold text-foreground/85 leading-snug">{compactSignal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
