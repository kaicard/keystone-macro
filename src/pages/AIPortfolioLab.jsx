import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AILabResults from '@/components/ailab/AILabResults';

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const togglePref = (id) => {
    setPreferences(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const canGenerate = risk && horizon && objective && regime;

  const generate = async () => {
    setLoading(true);
    setResult(null);
    const prefLabels = preferences.map(id => preferenceOptions.find(p => p.id === id)?.label).filter(Boolean);
    
    const prompt = `You are an investment portfolio construction expert. Generate an ILLUSTRATIVE educational portfolio suggestion based on these inputs:

Risk Tolerance: ${risk}
Time Horizon: ${horizon}
Objective: ${objective}
Market Regime: ${regime}
Preferences: ${prefLabels.join(', ') || 'None specified'}

Generate a Strategic Asset Allocation (SAA) and optional Tactical Asset Allocation (TAA) tilt. For each asset class provide a weight percentage and brief rationale. Also provide:
- Overall portfolio rationale
- Risk considerations
- Expected strengths in current environment
- Expected weaknesses in current environment
- What would change if conditions shift

IMPORTANT: All weights must sum to 100. This is for EDUCATIONAL purposes only, not financial advice.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
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
                rationale: { type: "string" }
              }
            }
          },
          taa_tilts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                asset_class: { type: "string" },
                tilt: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          overall_rationale: { type: "string" },
          risk_considerations: { type: "string" },
          strengths: { type: "string" },
          weaknesses: { type: "string" },
          if_conditions_change: { type: "string" }
        }
      }
    });

    setResult(res);
    setLoading(false);
  };

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered Educational Tool</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">AI Portfolio Lab</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Generate illustrative portfolio suggestions based on your selected market conditions and preferences.
          </p>
        </motion.div>

        {/* Disclaimer */}
        <div className="glass rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Important:</strong> This tool generates illustrative portfolio ideas for educational purposes only. 
            Outputs are based on selected assumptions and do not constitute financial advice, recommendations, or invitations to invest. 
            Always consult a regulated financial adviser for personal investment decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="glass rounded-xl p-6 space-y-5">
            <h3 className="font-semibold">Configure Inputs</h3>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Risk Tolerance</Label>
              <Select value={risk} onValueChange={setRisk}>
                <SelectTrigger className="glass border-border/30"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {riskOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Time Horizon</Label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger className="glass border-border/30"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {horizonOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Objective</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger className="glass border-border/30"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {objectiveOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Market Regime</Label>
              <Select value={regime} onValueChange={setRegime}>
                <SelectTrigger className="glass border-border/30"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {regimeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Preferences (Optional)</Label>
              {preferenceOptions.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <Checkbox
                    id={p.id}
                    checked={preferences.includes(p.id)}
                    onCheckedChange={() => togglePref(p.id)}
                  />
                  <label htmlFor={p.id} className="text-sm cursor-pointer">{p.label}</label>
                </div>
              ))}
            </div>

            <Button
              className="w-full gap-2"
              onClick={generate}
              disabled={!canGenerate || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate Portfolio Idea'}
            </Button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  className="glass rounded-xl p-12 flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-sm">Generating illustrative portfolio idea...</p>
                </motion.div>
              )}
              {!loading && result && <AILabResults key="results" result={result} />}
              {!loading && !result && (
                <motion.div
                  key="empty"
                  className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-1">Configure your inputs and generate</p>
                  <p className="text-xs text-muted-foreground/60">AI will create an illustrative portfolio suggestion</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}