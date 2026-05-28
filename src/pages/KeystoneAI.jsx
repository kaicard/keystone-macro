import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Send, RotateCcw, FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import PageBackground from '@/components/layout/PageBackground';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AILabResults from '@/components/ailab/AILabResults';

// Custom Keystone AI logo — architectural keystone / K mark
function KeystoneIcon({ className = "w-6 h-6" }) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`kg-${id}`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Outer hexagon — rotated square for a premium gem / keystone silhouette */}
      <path
        d="M16 3 L28.5 9.5 L28.5 22.5 L16 29 L3.5 22.5 L3.5 9.5 Z"
        stroke={`url(#kg-${id})`}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Inner accent hex — slightly rotated for depth */}
      <path
        d="M16 8 L23.5 12 L23.5 20 L16 24 L8.5 20 L8.5 12 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        strokeOpacity="0.35"
        fill="currentColor"
        fillOpacity="0.10"
      />

      {/* Vertical spine — the K/keystone stem */}
      <line x1="16" y1="9.5" x2="16" y2="22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />

      {/* Upper arm of the K */}
      <path d="M16 15 L21.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />

      {/* Lower arm of the K */}
      <path d="M16 15 L21.5 22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />

      {/* Centre node — polished focal point */}
      <circle cx="16" cy="15" r="2" fill="currentColor" fillOpacity="0.9" />
      <circle cx="16" cy="15" r="3.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
    </svg>
  );
}

// ─── Analyst Chat ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior macro research analyst at Keystone Macro, a premier institutional research platform. You have deep expertise across:

- Global macroeconomics (Fed, ECB, BOJ, BOE policy; inflation dynamics; growth cycles)
- Fixed income (yield curves, duration, credit spreads, sovereign debt)
- Equities (sector rotation, factor investing, earnings cycles, valuation)
- Commodities (oil, gold, metals, agricultural; supply/demand dynamics)
- FX (DXY, G10, EM; carry trade; capital flows)
- Geopolitics (sanctions, trade policy, war risk, political cycles)
- M&A and corporate strategy
- Portfolio construction and asset allocation

Your tone is precise, direct, and institutional — like a Goldman Sachs or BlackRock research note. You give concrete views, not hedged non-answers. You reference specific data, levels, and catalysts. You always consider cross-asset implications. You are rigorous, analytical, and confident in your views while acknowledging key risks.

When asked about markets or macro, always provide:
1. Your base case view with supporting data
2. Key risks to that view
3. How you'd position (instruments to watch or trade)
4. What would change your mind

Keep responses concise but substantive. Use markdown headers and bullet points for clarity.`;

const STARTERS = [
  "What's your view on Fed policy and duration risk in 2025?",
  "How should I position for persistent dollar strength?",
  "Walk me through the European fiscal pivot and implications for EUR assets.",
  "What does China's recovery mean for commodity markets?",
  "Is gold's rally sustainable or a positioning trade?",
  "What are the biggest macro risks investors are underpricing right now?",
  "How do you think about EM currency stress in this environment?",
  "Break down the oil supply/demand picture and geopolitical risk premium.",
];

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-xl font-display font-semibold mt-6 mb-3 pb-2 border-b border-border/50 text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold mt-5 mb-2.5 text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-2 text-primary">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-7 text-foreground/90 mb-4 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 space-y-1.5 pl-1 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-foreground/90 leading-6">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 pl-4 border-l-2 border-primary/40 text-muted-foreground italic text-sm">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) => inline
    ? <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-primary">{children}</code>
    : <pre className="my-4 p-4 rounded-xl bg-muted/60 overflow-x-auto text-xs font-mono leading-relaxed">{children}</pre>,
  hr: () => <hr className="my-5 border-border/40" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/30">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-muted/20 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2.5 text-sm text-foreground/85">{children}</td>,
};

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-1">
          <KeystoneIcon className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={`rounded-2xl ${
        isUser
          ? 'max-w-[75%] px-5 py-3.5 bg-primary text-primary-foreground rounded-tr-sm'
          : 'w-full max-w-[92%] px-6 py-5 glass rounded-tl-sm text-foreground'
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-1 text-xs font-bold text-muted-foreground">
          You
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <KeystoneIcon className="w-4 h-4 text-primary" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );
}

function AnalystChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const prevMsgCount = useRef(0);
  useEffect(() => {
    // Only scroll when a new message is added (not on initial render)
    if (messages.length > prevMsgCount.current || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCount.current = messages.length;
  }, [messages, loading]);

  const buildHistory = (msgs) => msgs.map(m => `${m.role === 'user' ? 'USER' : 'ANALYST'}: ${m.content}`).join('\n\n');

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    const history = buildHistory(messages);

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `${SYSTEM_PROMPT}\n\nToday is ${today}.\n\n${history ? `CONVERSATION HISTORY:\n${history}\n\n` : ''}USER: ${userMsg}\n\nRespond as the Keystone Macro senior analyst. Be direct, data-driven, and institutional.`;
    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gemini_3_flash', add_context_from_internet: true });
    const reply = typeof response === 'string' ? response : response?.response || response?.text || JSON.stringify(response);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const reset = () => { setMessages([]); setInput(''); };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 220px)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Institutional-grade macro analysis on demand.</p>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> New Chat
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <KeystoneIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">Ask the Desk</h2>
            <p className="text-muted-foreground mb-6 max-w-md text-sm">Ask about markets, policy, positioning, or portfolio construction.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
              {STARTERS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="glass rounded-xl px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all duration-200">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pb-4 pr-1" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="pt-4 pb-2">
          <div className="glass rounded-2xl p-3 flex gap-3 items-end">
            <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask about macro, markets, positioning, or portfolio construction…"
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm min-h-[44px] max-h-36" rows={1} />
            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="icon" className="rounded-xl h-9 w-9 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/40 text-center mt-2">For informational purposes only · Not financial advice</p>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Lab ────────────────────────────────────────────────────────────

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

function PortfolioLab() {
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
      response_json_schema: {
        type: "object",
        properties: {
          portfolio_name: { type: "string" },
          saa: { type: "array", items: { type: "object", properties: { asset_class: { type: "string" }, weight: { type: "number" }, rationale: { type: "string" }, illustrative_instruments: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" } } } } } } },
          taa_tilts: { type: "array", items: { type: "object", properties: { asset_class: { type: "string" }, tilt: { type: "string" }, reason: { type: "string" } } } },
          overall_rationale: { type: "string" },
          performance_context: { type: "string" },
          scenario_sensitivity: { type: "array", items: { type: "object", properties: { scenario: { type: "string" }, effect: { type: "string" }, impact: { type: "string" } } } },
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'chat', label: 'Analyst Chat', icon: KeystoneIcon },
  { id: 'lab', label: 'Portfolio Lab', icon: FlaskConical },
];

export default function KeystoneAI() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="pt-20 lg:pt-24 pb-10 min-h-screen relative">
      <PageBackground />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <KeystoneIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Keystone AI</h1>
              <p className="text-xs text-muted-foreground">Macro Intelligence · Portfolio Construction</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 glass rounded-xl w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'chat' ? <AnalystChat /> : <PortfolioLab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}