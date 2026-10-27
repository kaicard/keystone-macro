import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import KeystoneIcon from '@/components/ailab/KeystoneIcon';
import AILabResults from '@/components/ailab/AILabResults';
import { useAuth } from '@/lib/AuthContext';

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
const regimeOptions = ['Risk-on', 'Risk-off', 'Recession fear', 'Disinflation', 'Inflation shock', 'Central bank easing', 'Higher-for-longer rates', 'AI / tech boom', 'Energy shock'];
const preferenceOptions = [
  { id: 'no_crypto', label: 'Avoid crypto' }, { id: 'low_vol', label: 'Lower volatility' },
  { id: 'global', label: 'Global diversification' }, { id: 'uk_tilt', label: 'UK tilt' },
  { id: 'us_tilt', label: 'US tilt' }, { id: 'income', label: 'Income preference' },
  { id: 'gold', label: 'Gold hedge' }, { id: 'esg', label: 'ESG tilt' },
];

export default function PortfolioLab() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [generateError, setGenerateError] = useState('');
  const [risk, setRisk] = useState('');
  const [horizon, setHorizon] = useState('');
  const [objective, setObjective] = useState('');
  const [regime, setRegime] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [capital, setCapital] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const togglePref = (id) => setPreferences(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const canGenerate = risk && horizon && objective && regime && capital;

  const generate = async () => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    setGenerateError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('generatePortfolio', {
        capital, currency, risk, horizon, objective, regime, preferences,
      });
      setResult(res.data);
    } catch (error) {
      setGenerateError(error.response?.data?.error || 'Unable to generate a portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-5">
        <div className="glass rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Configure Inputs</h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Capital to Invest</Label>
            <div className="flex gap-2">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="glass border-border/30 w-28 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{currencyOptions.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="e.g. 25000" value={capital} onChange={e => setCapital(e.target.value)}
                className="glass border-border/30 flex-1" min="0" />
            </div>
            {capital && !isNaN(parseFloat(capital)) && (
              <p className="text-xs text-primary/70">{currencyOptions.find(c => c.code === currency)?.symbol}{Number(parseFloat(capital)).toLocaleString()} {currency}</p>
            )}
          </div>

          {[
            { label: 'Risk Tolerance', value: risk, set: setRisk, opts: riskOptions },
            { label: 'Time Horizon', value: horizon, set: setHorizon, opts: horizonOptions },
            { label: 'Objective', value: objective, set: setObjective, opts: objectiveOptions },
            { label: 'Market Regime', value: regime, set: setRegime, opts: regimeOptions },
          ].map(field => (
            <div key={field.label} className="space-y-2">
              <Label className="text-xs text-muted-foreground">{field.label}</Label>
              <Select value={field.value} onValueChange={field.set}>
                <SelectTrigger className="glass border-border/30"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{field.opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Preferences (Optional)</Label>
            {preferenceOptions.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Checkbox id={p.id} checked={preferences.includes(p.id)} onCheckedChange={() => togglePref(p.id)} />
                <label htmlFor={p.id} className="text-sm cursor-pointer">{p.label}</label>
              </div>
            ))}
          </div>

          {generateError && <p role="alert" className="text-xs text-destructive">{generateError}</p>}
          <Button className="w-full gap-2" onClick={generate} disabled={!canGenerate || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeystoneIcon className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate Portfolio'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/30 text-center px-2">Illustrative exposures only. Not investment recommendations.</p>
      </div>

      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" className="glass rounded-xl p-16 flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
            <motion.div key="empty" className="glass rounded-xl p-16 flex flex-col items-center justify-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <FlaskConical className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-foreground font-medium mb-2">Configure your portfolio parameters</p>
              <p className="text-xs text-muted-foreground/60 max-w-xs">Select risk tolerance, time horizon, objective, and regime to generate an illustrative allocation.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}