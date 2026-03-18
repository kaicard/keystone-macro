import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(38, 80%, 55%)', 'hsl(210, 60%, 50%)', 'hsl(160, 50%, 45%)', 'hsl(280, 50%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(45, 70%, 50%)', 'hsl(200, 50%, 50%)', 'hsl(15, 70%, 55%)'];

const assetClasses = [
  { name: 'Equities', defaultValue: 50 },
  { name: 'Fixed Income', defaultValue: 25 },
  { name: 'Cash', defaultValue: 10 },
  { name: 'Gold', defaultValue: 5 },
  { name: 'Alternatives', defaultValue: 5 },
  { name: 'Commodities', defaultValue: 3 },
  { name: 'Property', defaultValue: 2 },
  { name: 'Crypto', defaultValue: 0 },
];

function getRiskScore(allocations) {
  const weights = { Equities: 1.0, Crypto: 1.2, Commodities: 0.7, Alternatives: 0.6, Property: 0.5, Gold: 0.3, 'Fixed Income': 0.2, Cash: 0 };
  let score = 0;
  allocations.forEach(a => { score += (weights[a.name] || 0.5) * a.value; });
  return Math.min(100, Math.round(score));
}

function getRiskLabel(score) {
  if (score < 25) return { label: 'Conservative', color: 'bg-blue-400/10 text-blue-400' };
  if (score < 50) return { label: 'Moderate', color: 'bg-amber-400/10 text-amber-400' };
  if (score < 75) return { label: 'Growth', color: 'bg-purple-400/10 text-purple-400' };
  return { label: 'Aggressive', color: 'bg-red-400/10 text-red-400' };
}

export default function PortfolioBuilder() {
  const [allocations, setAllocations] = useState(
    assetClasses.map(a => ({ name: a.name, value: a.defaultValue }))
  );

  const total = allocations.reduce((s, a) => s + a.value, 0);
  const riskScore = useMemo(() => getRiskScore(allocations), [allocations]);
  const risk = getRiskLabel(riskScore);

  const updateAllocation = (index, newValue) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], value: newValue[0] };
    setAllocations(updated);
  };

  const chartData = allocations.filter(a => a.value > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-muted-foreground">Educational Portfolio Builder — Illustrative only, not financial advice</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="font-semibold mb-6">Adjust Allocation</h3>
          <div className="space-y-5">
            {allocations.map((a, i) => (
              <div key={a.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{a.name}</span>
                  <span className="font-semibold text-primary">{a.value}%</span>
                </div>
                <Slider
                  value={[a.value]}
                  onValueChange={(v) => updateAllocation(i, v)}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </div>
          <div className={`mt-6 p-3 rounded-lg ${total === 100 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
            <p className="text-sm font-medium">
              Total: {total}% {total !== 100 && `(${total > 100 ? 'over' : 'under'} by ${Math.abs(100 - total)}%)`}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-center">Your Allocation</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
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

          <div className="glass rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Risk Score</p>
            <p className="text-3xl font-bold mb-2">{riskScore}</p>
            <Badge className={`${risk.color} border-0`}>{risk.label}</Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}