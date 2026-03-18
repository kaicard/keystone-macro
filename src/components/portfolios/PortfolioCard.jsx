import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(38, 80%, 55%)', 'hsl(210, 60%, 50%)', 'hsl(160, 50%, 45%)', 'hsl(280, 50%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(45, 70%, 50%)'];

export default function PortfolioCard({ portfolio, riskColors, onBack }) {
  const chartData = portfolio.allocation.map(a => ({
    name: a.asset_class,
    value: a.weight,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Button variant="ghost" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Portfolios
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-3xl font-semibold">{portfolio.name}</h2>
              <Badge className={`${riskColors[portfolio.risk]} border-0`}>{portfolio.risk}</Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">{portfolio.objective}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Investor Profile</p>
                <p className="text-sm font-medium">{portfolio.suitable_investor?.split(',')[0]}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Time Horizon</p>
                <p className="text-sm font-medium">{portfolio.time_horizon}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Volatility Est.</p>
                <p className="text-sm font-medium">{portfolio.volatility_estimate}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Max Drawdown Est.</p>
                <p className="text-sm font-medium">{portfolio.max_drawdown_estimate}</p>
              </div>
            </div>
          </div>

          {/* Allocation table */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-4">Asset Allocation</h3>
            <div className="space-y-3">
              {portfolio.allocation.map((a, i) => (
                <div key={a.asset_class} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{a.asset_class}</span>
                      <span className="text-sm font-semibold">{a.weight}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
                </div>
              ))}
            </div>
          </div>

          {/* Commentary */}
          {portfolio.commentary && (
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-3">Current Positioning Commentary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{portfolio.commentary}</p>
            </div>
          )}
        </div>

        {/* Sidebar chart */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-center">Allocation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 25% 12%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(210 20% 92%)' }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground flex-1">{d.name}</span>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              <strong className="text-muted-foreground">Disclaimer:</strong> This is an illustrative model portfolio for educational purposes only. 
              It does not constitute financial advice, a recommendation, or an invitation to invest. 
              Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}