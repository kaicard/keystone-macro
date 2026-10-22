import React, { useState } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, FlaskConical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AILabResults from '@/components/ailab/AILabResults';

const currencyOptions = [
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'CHF', symbol: 'Fr', label: 'CHF (Fr)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
];

const riskOptions = ['Conservative', 'Moderate', 'Growth', 'Aggressive'];
const horizonOptions = ['Short (1-3 years)', 'Medium (3-7 years)', 'Long (7+ years)'];
const objectiveOptions = ['Growth', 'Income', 'Preservation', 'Inflation Protection', 'Diversification'];
const regimeOptions = [
  'Risk-on', 'Risk-off', 'Recession fear', 'Disinflation', 'Inflation shock',
  'Central bank easing', 'Higher-for-longer rates', 'AI / tech boom', 'Energy shock'
];
const preferenceOptions = [
  { id: 'no_crypto', label: 'Avoid crypto' },
  { id: 'low_vol', label: 'Lower volatility' },
  { id: 'global', label: 'Global diversification' },
  { id: 'uk_tilt', label: 'UK tilt' },
  { id: 'us_tilt', label: 'US tilt' },
  { id: 'income', label: 'Income preference' },
  { id: 'gold', label: 'Gold hedge' },
  { id: 'esg', label: 'ESG tilt' },
];

export default function AIPortfolioLab() {
  const [risk, setRisk] = useState('');
  const [horizon, setHorizon] = useState('');
  const [objective, setObjective] = useState('');
  const [regime, setRegime] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [capital, setCapital] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const togglePref = (id) => {
    setPreferences(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const canGenerate = risk && horizon && objective && regime && capital;

  const generate = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('generatePortfolio', {
      capital, currency, risk, horizon, objective, regime, preferences,
    });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="pt-24 lg:pt-28 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/15 bg-primary/[0.07] mb-4">
            <FlaskConical className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI Portfolio Constructor</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Portfolio Analytics</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Construct institutional-style multi-asset portfolios with strategic allocation, tactical tilts, scenario analysis, and capital-appropriate exposures.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
          {/* Input Panel */}
          <div className="space-y-5">
            <div className="rounded-xl border border-border/55 bg-card/55 p-5 space-y-5">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Configure Inputs</h3>

              {/* Capital Amount */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Capital to Invest</Label>
                <div className="flex gap-2">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-background/40 w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="e.g. 25000"
                    value={capital}
                    onChange={e => setCapital(e.target.value)}
                    className="bg-background/40 flex-1 [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:cursor-pointer [&::-webkit-outer-spin-button]:opacity-100"
                    style={{ colorScheme: 'dark' }}
                    min="0"
                  />
                </div>
                {capital && !isNaN(parseFloat(capital)) && (
                  <p className="text-xs text-primary/70">
                    {currencyOptions.find(c => c.code === currency)?.symbol}{Number(parseFloat(capital)).toLocaleString()} {currency}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Risk Tolerance</Label>
                <Select value={risk} onValueChange={setRisk}>
                  <SelectTrigger className="bg-background/40"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{riskOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Time Horizon</Label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger className="bg-background/40"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{horizonOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Objective</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger className="bg-background/40"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{objectiveOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Market Regime</Label>
                <Select value={regime} onValueChange={setRegime}>
                  <SelectTrigger className="bg-background/40"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{regimeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Preferences (Optional)</Label>
                {preferenceOptions.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox id={p.id} checked={preferences.includes(p.id)} onCheckedChange={() => togglePref(p.id)} />
                    <label htmlFor={p.id} className="text-sm cursor-pointer">{p.label}</label>
                  </div>
                ))}
              </div>

              <Button className="w-full gap-2" onClick={generate} disabled={!canGenerate || loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate Portfolio'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/30 text-center px-2">Illustrative exposures only. Not investment recommendations.</p>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  className="rounded-xl border border-border/55 bg-card/45 min-h-[520px] p-10 flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative mb-6">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/10 animate-ping" />
                  </div>
                  <p className="text-muted-foreground text-sm">Constructing illustrative portfolio...</p>
                  <p className="text-muted-foreground/50 text-xs mt-1">Analysing regime, objectives, and constraints</p>
                </motion.div>
              )}
              {!loading && result && <AILabResults key="results" result={result} />}
              {!loading && !result && (
                <motion.div
                  key="empty"
                  className="glass rounded-xl p-16 flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-12 h-12 rounded-xl border border-primary/15 bg-primary/[0.07] flex items-center justify-center mb-5">
                    <FlaskConical className="w-6 h-6 text-primary/70" />
                  </div>
                  <p className="text-foreground font-medium mb-2">Configure your portfolio parameters</p>
                  <p className="text-xs text-muted-foreground/60 max-w-xs">
                    Select risk tolerance, time horizon, objective, and regime to generate an illustrative allocation with real instrument examples.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}