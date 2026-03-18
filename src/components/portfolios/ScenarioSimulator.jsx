import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const scenarios = [
  {
    name: 'Rising Inflation',
    description: 'Persistent above-target inflation squeezes real returns. Central banks forced to maintain tight policy.',
    winners: ['Commodities', 'Gold', 'TIPS', 'Value Equities', 'Real Assets'],
    losers: ['Long Duration Bonds', 'Growth Equities', 'Cash (real terms)'],
    regime: 'Inflation-sensitive',
    regimeColor: 'bg-red-400/10 text-red-400',
  },
  {
    name: 'Rate Cuts',
    description: 'Central banks pivot to easing as growth slows. Markets reprice lower yields across the curve.',
    winners: ['Long Duration Bonds', 'Growth Equities', 'REITs', 'Small Caps'],
    losers: ['Cash Yield', 'Short Duration', 'USD'],
    regime: 'Policy pivot',
    regimeColor: 'bg-emerald-400/10 text-emerald-400',
  },
  {
    name: 'Recession',
    description: 'Economic contraction leads to rising unemployment, falling corporate earnings, and risk-off sentiment.',
    winners: ['Government Bonds', 'Gold', 'Defensive Equities', 'Cash'],
    losers: ['Cyclical Equities', 'High Yield', 'Commodities', 'EM Debt'],
    regime: 'Risk-off',
    regimeColor: 'bg-blue-400/10 text-blue-400',
  },
  {
    name: 'Soft Landing',
    description: 'Economy decelerates gently without recession. Goldilocks scenario for risk assets.',
    winners: ['Equities (broad)', 'Credit', 'EM Assets', 'Balanced Portfolios'],
    losers: ['Volatility Products', 'Gold (opportunity cost)', 'Defensive positioning'],
    regime: 'Risk-on',
    regimeColor: 'bg-emerald-400/10 text-emerald-400',
  },
  {
    name: 'Commodity Shock',
    description: 'Supply-side disruption drives energy and commodity prices sharply higher.',
    winners: ['Energy Equities', 'Commodities', 'Gold', 'Inflation Linkers'],
    losers: ['Consumer Discretionary', 'Airlines', 'Long Bonds', 'Growth'],
    regime: 'Inflation-sensitive',
    regimeColor: 'bg-amber-400/10 text-amber-400',
  },
  {
    name: 'Tech-Led Rally',
    description: 'AI and technology innovation drives outsized returns in tech-heavy indices.',
    winners: ['Tech Equities', 'NASDAQ', 'Growth Factor', 'US Large Cap'],
    losers: ['Value', 'Emerging Markets', 'Commodities', 'Defensives'],
    regime: 'Growth leadership',
    regimeColor: 'bg-purple-400/10 text-purple-400',
  },
];

export default function ScenarioSimulator() {
  const [selected, setSelected] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">Educational scenario analysis — Illustrative only, not predictive</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {scenarios.map((s) => (
          <Button
            key={s.name}
            variant={selected?.name === s.name ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-start gap-2 text-left ${selected?.name === s.name ? '' : 'glass border-border/30'}`}
            onClick={() => setSelected(s)}
          >
            <span className="font-semibold text-sm">{s.name}</span>
            <Badge className={`${s.regimeColor} border-0 text-xs`}>{s.regime}</Badge>
          </Button>
        ))}
      </div>

      {selected && (
        <motion.div
          key={selected.name}
          className="glass rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="font-display text-2xl font-semibold mb-2">{selected.name}</h3>
          <Badge className={`${selected.regimeColor} border-0 mb-4`}>{selected.regime}</Badge>
          <p className="text-muted-foreground leading-relaxed mb-8">{selected.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="font-medium text-emerald-400 text-sm">Likely Beneficiaries</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.winners.map(w => (
                  <Badge key={w} variant="outline" className="bg-emerald-400/5 text-emerald-400 border-emerald-400/20 text-xs">{w}</Badge>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h4 className="font-medium text-red-400 text-sm">Likely Under Pressure</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.losers.map(l => (
                  <Badge key={l} variant="outline" className="bg-red-400/5 text-red-400 border-red-400/20 text-xs">{l}</Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!selected && (
        <div className="text-center py-12 text-muted-foreground">
          <Minus className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p>Select a macro scenario above to explore potential market impacts.</p>
        </div>
      )}
    </motion.div>
  );
}