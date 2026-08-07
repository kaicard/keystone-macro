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

const PORTFOLIO_SCHEMA = {
  type: "object",
  properties: {
    portfolio_name: { type: "string" },
    saa: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_class: { type: "string" },
          weight: { type: "number" },
          rationale: { type: "string" },
          illustrative_instruments: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, reason: { type: "string" } }
            }
          }
        }
      }
    },
    taa_tilts: {
      type: "array",
      items: {
        type: "object",
        properties: { asset_class: { type: "string" }, tilt: { type: "string" }, reason: { type: "string" } }
      }
    },
    overall_rationale: { type: "string" },
    performance_context: { type: "string" },
    scenario_sensitivity: {
      type: "array",
      items: {
        type: "object",
        properties: { scenario: { type: "string" }, effect: { type: "string" }, impact: { type: "string" } }
      }
    },
    risk_considerations: { type: "string" },
    strengths: { type: "string" },
    weaknesses: { type: "string" },
    if_conditions_change: { type: "string" }
  }
};

export default function PortfolioLab() {
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
    setLoading(true);
    setResult(null);
    const prefLabels = preferences.map(id => preferenceOptions.find(p => p.id === id)?.label).filter(Boolean);
    const selectedCurrency = currencyOptions.find(c => c.code === currency);
    const capitalNum = parseFloat(capital.replace(/[^0-9.]/g, ''));
    const capitalFormatted = `${selectedCurrency?.symbol}${Number(capitalNum).toLocaleString()}`;

    const prompt = `You are an institutional portfolio construction expert. Generate a detailed educational portfolio for:

Capital to Invest: ${capitalFormatted} ${currency}
Risk Tolerance: ${risk}
Time Horizon: ${horizon}
Objective: ${objective}
Market Regime: ${regime}
Preferences: ${prefLabels.join(', ') || 'None specified'}

CRITICAL CAPITAL CONSTRAINTS - You MUST apply these rules based on the capital amount (${capitalFormatted}):
- Under ${selectedCurrency?.symbol}10,000: Focus on liquid ETFs and index funds only. No direct property, private equity, hedge funds, or alternatives. Keep it simple with 3-4 asset classes max.
- ${selectedCurrency?.symbol}10,000–${selectedCurrency?.symbol}50,000: ETFs, index funds, and liquid securities. Minimal alternatives. No direct real estate or private assets.
- ${selectedCurrency?.symbol}50,000–${selectedCurrency?.symbol}250,000: Can include diversified equities, bonds, some liquid alternatives (REITs, commodity ETFs). No direct property or private equity.
- ${selectedCurrency?.symbol}250,000–${selectedCurrency?.symbol}1,000,000: Can include a broader alternatives sleeve. Possibly some direct property exposure. Modest illiquid allocation.
- Above ${selectedCurrency?.symbol}1,000,000: Full institutional toolkit available — private equity, hedge funds, direct real estate, infrastructure, private credit.

All instrument examples must be appropriate for this capital level. Express all monetary examples in ${currency} (${selectedCurrency?.symbol}). All weights must sum to exactly 100%.

For the Strategic Asset Allocation (SAA), each asset class must include:
- asset_class name
- weight (percentage, all weights must sum to 100)
- rationale (clear explanation of why this weight)
- illustrative_instruments: array of 3-4 example instruments/ETFs/securities with name and reason

Also provide tactical tilts (TAA), overall portfolio rationale, performance context, scenario sensitivity (3 scenarios), risk considerations, strengths, weaknesses, and if conditions change narrative.

This is for EDUCATIONAL purposes. Frame all instruments as illustrative examples only.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: PORTFOLIO_SCHEMA
    });
    setResult(res);
    setLoading(false);
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