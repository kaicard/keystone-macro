import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, Briefcase, Building2, Clock, Crown, Heart, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(38, 80%, 55%)', 'hsl(210, 60%, 50%)', 'hsl(160, 50%, 45%)', 'hsl(280, 50%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(45, 70%, 50%)'];

const cases = [
  {
    icon: GraduationCap, title: 'Young Professional', subtitle: 'Starting from £25,000', iconColor: 'text-cyan-400',
    client_snapshot: '28-year-old graduate, 2 years into career. Steady income growth expected. No dependants. High financial literacy.',
    objectives: 'Build long-term wealth. Maximise growth over 20+ year horizon. Use tax-efficient wrappers effectively.',
    constraints: 'Limited capital. Cannot afford illiquid investments. No inheritance expected.',
    risk_tolerance: 'Medium-High', time_horizon: '20+ years', investable_amount: '£25,000',
    liquidity_needs: 'Low — no planned large purchases in next 5 years',
    proposed_saa: [
      { asset_class: 'Global Equities', weight: 75 },
      { asset_class: 'Fixed Income', weight: 10 },
      { asset_class: 'Gold', weight: 5 },
      { asset_class: 'Cash', weight: 10 },
    ],
    rationale: 'With a very long time horizon, the portfolio is heavily equity-tilted. This maximises exposure to compounding equity returns while maintaining a small cash buffer for flexibility.',
    key_risks: 'High equity exposure means significant short-term volatility. A major drawdown early could be psychologically challenging despite the long time horizon.',
    behavioural_considerations: 'Key risk is panic selling during the first major drawdown. Education about volatility and drawdown expectations is critical.',
    regime_changes: 'In a recession, equity allocation would temporarily drag performance. However, regular contributions during drawdowns benefit long-term from pound-cost averaging.',
  },
  {
    icon: Briefcase, title: 'Mid-Career Executive', subtitle: '£250,000 investable', iconColor: 'text-emerald-400',
    client_snapshot: '42-year-old executive with £250k investable. Married, two children. Mortgage partially paid. Seeking diversified growth with some stability.',
    objectives: 'Grow wealth while managing downside risk. Balance growth with children\'s future education costs.',
    constraints: 'Education expenses in 8-12 years. Moderate income needs from portfolio unlikely but possible.',
    risk_tolerance: 'Medium', time_horizon: '10–15 years', investable_amount: '£250,000',
    liquidity_needs: 'Moderate — may need partial access for education costs',
    proposed_saa: [
      { asset_class: 'Global Equities', weight: 55 },
      { asset_class: 'Fixed Income', weight: 25 },
      { asset_class: 'Alternatives', weight: 10 },
      { asset_class: 'Gold', weight: 5 },
      { asset_class: 'Cash', weight: 5 },
    ],
    rationale: 'Classic balanced approach with meaningful equity growth exposure, tempered by bonds and alternatives. Gold provides inflation protection.',
    key_risks: 'Education funding timeline creates a soft constraint. May need to reduce equity closer to withdrawal dates.',
    behavioural_considerations: 'Balancing growth aspirations with family financial obligations. Avoid over-concentrating in employer stock.',
    regime_changes: 'Rising rates would help bond yields but pressure equity valuations. Recession risk would warrant increase in fixed income weighting.',
  },
  {
    icon: Building2, title: 'Entrepreneur Post-Exit', subtitle: 'Capital preservation & growth', iconColor: 'text-amber-400',
    client_snapshot: '50-year-old entrepreneur who sold business for £2M net. First time managing significant liquid wealth. Moderate financial literacy.',
    objectives: 'Preserve capital in real terms. Generate moderate growth. Establish sustainable income stream within 5 years.',
    constraints: 'Strong emotional attachment to wealth. Low tolerance for seeing capital decline. No other income source.',
    risk_tolerance: 'Low-Medium', time_horizon: '7–10 years', investable_amount: '£2,000,000',
    liquidity_needs: 'High initial liquidity, transitioning to income needs',
    proposed_saa: [
      { asset_class: 'Fixed Income', weight: 35 },
      { asset_class: 'Global Equities', weight: 30 },
      { asset_class: 'Alternatives', weight: 15 },
      { asset_class: 'Gold', weight: 10 },
      { asset_class: 'Cash', weight: 10 },
    ],
    rationale: 'Priority is capital preservation with moderate growth. Heavy bond allocation provides stability and income. Equity exposure is globally diversified.',
    key_risks: 'Concentration risk if overly anchored to previous business sector. Inflation eroding purchasing power if too conservative.',
    behavioural_considerations: 'May experience anxiety about wealth management decisions. Gradual deployment recommended rather than lump sum.',
    regime_changes: 'In a higher inflation environment, real returns could be challenged. Would consider increasing commodities and TIPS allocation.',
  },
  {
    icon: Clock, title: 'Near-Retirement', subtitle: 'Income planning focus', iconColor: 'text-blue-400',
    client_snapshot: '62-year-old planning retirement in 2 years. £500k in pensions and ISAs. Partner has small pension. Owns home outright.',
    objectives: 'Transition to sustainable income drawdown. Preserve capital to fund 25+ year retirement. Minimise sequence risk.',
    constraints: 'Cannot tolerate large drawdowns near retirement date. Income needs of approximately £30k per year.',
    risk_tolerance: 'Low', time_horizon: '3–5 years (to retirement), then 25+ years in drawdown',
    investable_amount: '£500,000',
    liquidity_needs: 'High — regular income drawdown needed',
    proposed_saa: [
      { asset_class: 'Fixed Income', weight: 45 },
      { asset_class: 'Global Equities', weight: 25 },
      { asset_class: 'Cash & Money Market', weight: 15 },
      { asset_class: 'Gold', weight: 10 },
      { asset_class: 'Alternatives', weight: 5 },
    ],
    rationale: 'Designed to manage sequence risk through heavy fixed income and cash allocation, while maintaining equity for long-term growth in later retirement years.',
    key_risks: 'Longevity risk — portfolio must last 25+ years. Inflation erosion in very conservative positioning.',
    behavioural_considerations: 'Strong loss aversion near retirement. Need clear framework for when to increase risk later in retirement.',
    regime_changes: 'Rate cuts would reduce income from bonds and cash. Would need to consider modest increase in equity or alternatives.',
  },
];

export default function WealthCases() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const chartData = selected.proposed_saa.map(a => ({ name: a.asset_class, value: a.weight }));
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => setSelected(null)} className="gap-2 mb-6 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </Button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <selected.icon className={`w-6 h-6 ${selected.iconColor}`} />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-semibold">{selected.title}</h1>
                  <p className="text-primary text-sm">{selected.subtitle}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{selected.client_snapshot}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">Objectives</h3>
                <p className="text-sm text-muted-foreground">{selected.objectives}</p>
              </div>
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">Constraints</h3>
                <p className="text-sm text-muted-foreground">{selected.constraints}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Risk Tolerance', value: selected.risk_tolerance },
                { label: 'Time Horizon', value: selected.time_horizon },
                { label: 'Investable Amount', value: selected.investable_amount },
                { label: 'Liquidity Needs', value: selected.liquidity_needs?.split('—')[0] },
              ].map(m => (
                <div key={m.label} className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="text-sm font-medium">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass rounded-xl p-6">
                <h3 className="font-semibold mb-4">Proposed Strategic Asset Allocation</h3>
                <div className="space-y-3">
                  {selected.proposed_saa.map((a, i) => (
                    <div key={a.asset_class} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-sm flex-1">{a.asset_class}</span>
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i] }}
                          initial={{ width: 0 }} animate={{ width: `${a.weight}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right">{a.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {[
              { title: 'Rationale', content: selected.rationale },
              { title: 'Key Risks', content: selected.key_risks },
              { title: 'Behavioural Considerations', content: selected.behavioural_considerations },
              { title: 'If Conditions Change', content: selected.regime_changes },
            ].map(s => (
              <div key={s.title} className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            ))}

            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground/60">
                <strong>Disclaimer:</strong> This is a hypothetical case study for educational purposes only. It does not constitute personal financial advice. Individual circumstances vary. Consult a regulated financial adviser for personal recommendations.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Wealth Case Studies</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Illustrative client scenarios demonstrating suitability-driven allocation. For educational purposes only.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              className="glass rounded-xl p-6 cursor-pointer hover:border-primary/20 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => setSelected(c)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className={`w-6 h-6 ${c.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{c.title}</h3>
                  <p className="text-sm text-primary/80 mb-2">{c.subtitle}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.client_snapshot}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/70">
                    <span>Risk: {c.risk_tolerance}</span>
                    <span>Horizon: {c.time_horizon}</span>
                    <span>{c.investable_amount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 mt-8 text-center">
          Hypothetical scenarios. Not personal financial advice.
        </p>
      </div>
    </div>
  );
}