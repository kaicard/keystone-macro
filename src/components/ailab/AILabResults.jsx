import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Lightbulb, BarChart2 } from 'lucide-react';

const COLORS = [
  'hsl(38, 80%, 55%)',
  'hsl(210, 60%, 50%)',
  'hsl(160, 50%, 45%)',
  'hsl(280, 50%, 55%)',
  'hsl(340, 60%, 55%)',
  'hsl(45, 70%, 50%)',
  'hsl(200, 50%, 50%)',
  'hsl(15, 70%, 55%)',
];

function AllocationBar({ item, index, total }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/20 rounded-lg overflow-hidden">
      <button
        className="w-full text-left p-3 hover:bg-muted/20 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">{item.asset_class}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: COLORS[index % COLORS.length] }}>{item.weight}%</span>
            {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
            initial={{ width: 0 }}
            animate={{ width: `${item.weight}%` }}
            transition={{ duration: 0.8, delay: index * 0.08 }}
          />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/20"
          >
            <div className="p-3 pt-2 space-y-3 bg-muted/10">
              <p className="text-xs text-muted-foreground leading-relaxed">{item.rationale}</p>

              {item.illustrative_instruments?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3 h-3 text-primary" />
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Illustrative Exposures</p>
                  </div>
                  <div className="space-y-1.5">
                    {item.illustrative_instruments.map((inst, ii) => (
                      <div key={ii} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-foreground w-28 shrink-0">{inst.name}</span>
                        <span className="text-xs text-muted-foreground">{inst.reason}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-2 italic">
                    These are illustrative examples only — not recommendations to invest in any specific instrument.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AILabResults({ result }) {
  if (!result) return null;

  const chartData = (result.saa || []).map(a => ({
    name: a.asset_class,
    value: a.weight,
  }));

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Portfolio name & rationale */}
      <div className="glass rounded-xl p-6">
        <Badge className="bg-primary/10 text-primary border-0 mb-3">Illustrative Suggestion</Badge>
        <h2 className="font-display text-2xl font-semibold mb-2">{result.portfolio_name}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.overall_rationale}</p>
      </div>

      {/* SAA + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Allocation Bars */}
        <div className="md:col-span-3 glass rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Strategic Asset Allocation
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Click any row to expand illustrative instruments and rationale.</p>
          <div className="space-y-2">
            {(result.saa || []).map((a, i) => (
              <AllocationBar key={a.asset_class} item={a} index={i} total={(result.saa || []).length} />
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="md:col-span-2 glass rounded-xl p-5 flex flex-col">
          <h3 className="font-semibold mb-3 text-center text-sm">Allocation</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value">
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: 'hsl(222 25% 9%)', border: '1px solid hsl(222 20% 16%)', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2 flex-1">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TAA Tilts */}
      {result.taa_tilts?.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">Tactical Tilts (TAA)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.taa_tilts.map(t => (
              <div key={t.asset_class} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium">{t.asset_class}</span>
                  <Badge variant="outline" className="text-xs">{t.tilt}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance context */}
      {result.performance_context && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm">Performance Context</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.performance_context}</p>
        </div>
      )}

      {/* Scenario Sensitivity */}
      {result.scenario_sensitivity && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-sm">Scenario Sensitivity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.scenario_sensitivity.map((s, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                s.impact === 'positive' ? 'bg-emerald-400/5 border-emerald-400/20' :
                s.impact === 'negative' ? 'bg-red-400/5 border-red-400/20' :
                'bg-muted/20 border-border/30'
              }`}>
                <p className="text-xs font-semibold mb-1">{s.scenario}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.effect}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm">Strengths</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.strengths}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-sm">Weaknesses</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.weaknesses}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Risk Considerations</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.risk_considerations}</p>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">If Conditions Change</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.if_conditions_change}</p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl p-4 border border-border/30 bg-muted/10">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          <strong className="text-muted-foreground">Disclaimer:</strong> AI-generated illustrative portfolio for educational purposes only. Not financial advice, not a recommendation to invest. All instruments mentioned are illustrative examples only. Consult a regulated adviser for personal investment decisions.
        </p>
      </div>
    </motion.div>
  );
}