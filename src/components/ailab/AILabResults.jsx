import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';

const COLORS = ['hsl(38, 80%, 55%)', 'hsl(210, 60%, 50%)', 'hsl(160, 50%, 45%)', 'hsl(280, 50%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(45, 70%, 50%)', 'hsl(200, 50%, 50%)', 'hsl(15, 70%, 55%)'];

export default function AILabResults({ result }) {
  if (!result) return null;

  const chartData = (result.saa || []).map(a => ({
    name: a.asset_class,
    value: a.weight,
  }));

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Portfolio name */}
      <div className="glass rounded-xl p-6">
        <Badge className="bg-primary/10 text-primary border-0 mb-3">Illustrative Suggestion</Badge>
        <h2 className="font-display text-2xl font-semibold mb-2">{result.portfolio_name}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.overall_rationale}</p>
      </div>

      {/* Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Strategic Asset Allocation</h3>
          <div className="space-y-3">
            {(result.saa || []).map((a, i) => (
              <div key={a.asset_class}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{a.asset_class}</span>
                  <span className="text-sm font-semibold">{a.weight}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${a.weight}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4 text-center">Allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-3">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground flex-1">{d.name}</span>
                <span className="font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TAA Tilts */}
      {result.taa_tilts?.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Tactical Tilts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.taa_tilts.map(t => (
              <div key={t.asset_class} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{t.asset_class}</span>
                  <Badge variant="outline" className="text-xs">{t.tilt}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm">Strengths in Current Environment</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.strengths}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-sm">Potential Weaknesses</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.weaknesses}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Risk Considerations</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.risk_considerations}</p>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">If Conditions Change</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.if_conditions_change}</p>
      </div>

      {/* Disclaimer */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          <strong className="text-muted-foreground">Disclaimer:</strong> This is an AI-generated illustrative portfolio idea for educational purposes only. 
          It is based on selected assumptions and does not account for individual circumstances. 
          This is not financial advice, a recommendation, or an invitation to invest.
        </p>
      </div>
    </motion.div>
  );
}