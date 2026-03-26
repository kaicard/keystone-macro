import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Eye, AlertTriangle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Detailed theme data
const THEME_DETAILS = {
  'Higher-for-Longer Rates': {
    summary: 'Major central banks — particularly the Fed and BOE — have signalled that restrictive monetary policy will remain in place for longer than markets initially priced. This regime shift has profound implications for asset allocation, particularly duration exposure and equity valuation multiples.',
    our_take: "The 'higher-for-longer' narrative has repeatedly caught markets off-guard. With inflation proving stickier than models predicted, we think investors should underweight duration relative to benchmarks and favour short-dated credit over long gilts. Equity multiples — particularly in rate-sensitive sectors — face structural headwinds. Real assets and floating-rate instruments warrant a larger SAA role.",
    implications: [
      'Duration risk in long-end government bonds elevated — favour 1-3Y vs 10Y+',
      'Equity P/E compression risk, particularly in growth/tech at elevated valuations',
      'Financials and banks may benefit from steeper net interest margins',
      'Mortgage-sensitive housing sectors remain under structural pressure',
      'Corporate refinancing risk escalating for leveraged issuers',
    ],
    headlines: [
      'Fed holds rates, signals only one cut in 2026 as PCE remains above target',
      'BOE Governor Bailey: "Premature to declare victory on inflation"',
      'US 10Y Treasury yield re-tests 4.5% as jobs data beats expectations',
      'ECB dovish pivot expected — Lagarde hints at June cut',
    ],
    what_to_watch: [
      'Core PCE / CPI monthly readings — any surprise higher delays cuts',
      'Fed FOMC dot plot revisions in March and June meetings',
      'Credit spreads — early warning system for a policy mistake',
      'Long-end gilt and treasury auction demand',
    ],
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  'AI Equity Leadership': {
    summary: 'The AI investment cycle is driving unprecedented capital expenditure from hyperscalers, reshaping semiconductor demand, cloud infrastructure spend, and software valuations. A narrow cohort of AI-beneficiary equities is driving outsized index-level returns, raising concentration risk questions for portfolio managers.',
    our_take: "AI capex is real, not hype — Microsoft, Google, Amazon and Meta have collectively guided over $300bn in infrastructure spend. The debate is not whether AI creates value, but whether current equity valuations already price perfection. Nvidia's dominance is structural but the multiple leaves no margin for error. We prefer a barbell: core AI infrastructure positions with hedges on overstretched software multiples.",
    implications: [
      'Semiconductor sector remains the purest AI capex beneficiary (NVDA, AMD, ASML)',
      'S&P 500 top-10 concentration at multi-decade highs — index risk is AI risk',
      'Power infrastructure and data centre REITs offer less-crowded AI exposure',
      'Traditional IT services and legacy software face margin pressure from AI disruption',
      'Regulatory risk rising — EU AI Act and US antitrust posture in focus',
    ],
    headlines: [
      'Nvidia Q4 revenue up 122% YoY, data centre segment hits new record',
      'Microsoft AI Copilot adoption accelerates, Azure growth re-rates higher',
      'Meta commits to $65bn AI capex in 2026 alone',
      'EU AI Act enforcement begins — broad compliance requirements for frontier models',
    ],
    what_to_watch: [
      'Hyperscaler earnings — any capex guidance revision moves the sector',
      'Nvidia supply chain — HBM memory tight, TSMC capacity allocation',
      'Consumer AI monetisation — when does usage translate to revenue?',
      'Regulatory developments in the US and EU',
    ],
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  'Oil Supply Risk': {
    summary: 'OPEC+ supply discipline, Middle East tensions, and Russian export uncertainty are creating a persistent supply risk premium in crude oil. Meanwhile, demand signals from China and the US remain mixed, creating a volatile two-sided market.',
    our_take: "Brent crude's risk premium is structural, not temporary. Iran sanctions enforcement, continued OPEC+ cohesion, and underinvestment in upstream capex since 2020 point to a supply-constrained medium-term outlook. We think energy equities remain attractive on a free cash flow basis, and oil as a portfolio hedge against geopolitical tail risks warrants consideration in a multi-asset context.",
    implications: [
      'Energy sector equities screen well on FCF yield relative to market',
      'Inflationary second-round effects if Brent sustains above $90/bbl',
      'Airlines, logistics, and consumer discretionary face margin headwinds',
      'GCC sovereign wealth fund inflows support EM fixed income and global equities',
      'Renewables transition thesis accelerates if energy costs remain structurally elevated',
    ],
    headlines: [
      'OPEC+ maintains production cuts through Q2, Saudi Aramco signals discipline',
      'Red Sea disruptions adding $2-3/bbl freight premium to Brent',
      'US Strategic Petroleum Reserve near historic lows — limited buffer capacity',
      'IEA warns of tight supply in H2 2026 amid demand recovery in Asia',
    ],
    what_to_watch: [
      'OPEC+ June ministerial meeting — any supply reversal would be price negative',
      'Iran nuclear deal developments and US sanctions enforcement',
      'China crude import data — bellwether for demand recovery pace',
      'US shale rig count and production trajectory',
    ],
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  'EM Divergence': {
    summary: 'Emerging markets are not monolithic. Commodity exporters (Brazil, Saudi Arabia, South Africa) are benefiting from elevated hard commodity prices and improving terms of trade, while commodity importers (Turkey, India, Indonesia) face persistent external account pressures and currency vulnerability.',
    our_take: "EM divergence is our highest-conviction macro theme for 2026. We favour a selective long EM approach — overweighting Brazil, GCC, and select Southeast Asian markets with strong commodity exposure or domestic demand tailwinds. We are cautious on EM FX broadly and particularly on countries with large current account deficits and USD-denominated debt refinancing requirements.",
    implications: [
      'EM commodity exporters: Brazil, Chile, Saudi Arabia — structural outperformance potential',
      'EM FX vulnerable in a higher-for-longer USD environment',
      'EM local currency bonds offer attractive real yields but carry FX risk',
      'China recovery pace is the single most important driver of broad EM sentiment',
      'India standalone story — domestic consumption and manufacturing re-shoring beneficiary',
    ],
    headlines: [
      'Brazil real outperforms EM peers as Petrobras dividend yields attract inflows',
      'Turkish lira under pressure after central bank signals policy pivot',
      'China Q1 GDP beats expectations but property sector remains a drag',
      'India manufacturing PMI at 5-year high as supply chain diversification accelerates',
    ],
    what_to_watch: [
      'DXY strength — stronger dollar tightens EM financial conditions',
      'China property sector stabilisation — systemic risk vs managed slowdown',
      'EM current account balances as commodity prices fluctuate',
      'Fed rate path — delayed cuts keep pressure on EM capital flows',
    ],
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  'UK Fiscal Reset': {
    summary: "The UK's autumn fiscal statement triggered a significant repricing of UK gilts, with the government's borrowing requirements surprising markets to the upside. The resulting gilt selloff and sterling weakness reflect a fragile equilibrium between growth ambitions and fiscal credibility.",
    our_take: "UK gilts are in a difficult place. Supply is increasing at the same time the BOE is unwinding its QE portfolio. The risk premium on 30Y gilts has meaningfully widened. We would underweight long-end gilts and instead favour short-dated instruments or index-linked gilts as an inflation hedge. UK equities (FTSE 100) remain attractively valued internationally but domestically-exposed mid-caps face the full brunt of fiscal drag.",
    implications: [
      'Long-end gilt supply significantly above expectations — demand-side risk',
      'Sterling under pressure — current account deficit and fiscal risk premium',
      'UK housebuilders and retailers sensitive to fiscal tightening impact on consumers',
      'FTSE 100 defensively positioned — international revenues provide currency hedge',
      'BOE independence risk if fiscal slippage continues — rating agency watch',
    ],
    headlines: [
      'UK 30Y gilt yield rises above 5.4% as gilt auction sees weak demand',
      'OBR revises growth forecasts lower, borrowing higher for FY2026/27',
      'BOE maintains QT programme despite gilt market volatility',
      'Sterling drops below 1.25 vs USD as fiscal concerns resurface',
    ],
    what_to_watch: [
      'Monthly DMO gilt issuance calendar and auction bid-to-cover ratios',
      'UK inflation trajectory — sticky services CPI complicates BOE path',
      'OBR fiscal sustainability assessments',
      'Sterling vs USD and EUR — measure of market confidence in UK fiscal stance',
    ],
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  'Real Estate Distress': {
    summary: 'Commercial real estate faces a perfect storm: higher-for-longer rates have raised capitalisation rates, repricing asset values downward; refinancing conditions are punitive; and structural demand shifts in office and retail remain unresolved. Residential real estate in rate-sensitive markets is under similar pressure.',
    our_take: "CRE distress is a slow-moving crisis with a long tail. European and US office vacancy rates are at historic highs, and the debt refinancing wall of 2025-2027 will force crystallisation of losses across the sector. We are significantly underweight CRE broadly, with selective interest in logistics REITs and residential in supply-constrained geographies (London prime, select US sunbelt markets). Private credit exposure to CRE is the risk vector most likely to surprise investors.",
    implications: [
      'Office sector facing structural vacancy — remote work is permanent, not cyclical',
      'CRE debt refinancing at materially higher rates will crystallise losses for lenders',
      'Regional US banks have disproportionate CRE loan exposure — systemic risk vector',
      'UK house price affordability stretched — first-time buyer demand suppressed',
      'Logistics and industrial REITs remain fundamentally supported by e-commerce',
    ],
    headlines: [
      'US office vacancy rate hits 20% — highest since 1980s S&L crisis',
      'Blackstone BREIT redemption requests fall as sentiment stabilises',
      'UK house prices decline for third consecutive month as rates bite',
      'Deutsche Bank increases CRE loan loss provisions by €1.2bn',
    ],
    what_to_watch: [
      'Regional US bank CRE loan-to-value stress tests',
      'CMBS delinquency rates — leading indicator of crystallised losses',
      'UK and US house price indices for magnitude of correction',
      'Logistics/industrial REIT occupancy rates — the bright spot in an otherwise weak sector',
    ],
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
};

export default function ThemeModal({ theme, onClose }) {
  const details = THEME_DETAILS[theme?.title];
  if (!theme || !details) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl glass-strong rounded-2xl overflow-hidden my-8"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className={`p-6 border-b border-border/40 ${details.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${details.bg} border ${details.border} flex items-center justify-center`}>
                  <theme.icon className={`w-5 h-5 ${details.color}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${details.color} mb-0.5`}>Macro Theme</p>
                  <h2 className="font-display text-2xl font-semibold">{theme.title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/20 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Summary */}
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">{details.summary}</p>
            </div>

            {/* Our Take */}
            <div className={`rounded-xl p-5 border ${details.border} ${details.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className={`w-4 h-4 ${details.color}`} />
                <h3 className={`text-sm font-semibold ${details.color}`}>Our Take</h3>
              </div>
              <p className="text-sm leading-relaxed">{details.our_take}</p>
            </div>

            {/* Market Implications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold">Key Market Implications</h3>
              </div>
              <div className="space-y-2">
                {details.implications.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/20">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${details.color.replace('text-', 'bg-')}`} />
                    <p className="text-sm text-muted-foreground leading-relaxed">{imp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Headlines */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Related Headlines</h3>
              </div>
              <div className="space-y-2">
                {details.headlines.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-border/20 hover:border-border/40 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                    <p className="text-sm text-foreground/80">{h}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Watch */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`w-4 h-4 ${details.color}`} />
                <h3 className="text-sm font-semibold">What to Watch</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {details.what_to_watch.map((w, i) => (
                  <div key={i} className={`px-3 py-2.5 rounded-lg border ${details.border} bg-muted/10`}>
                    <p className="text-xs text-muted-foreground leading-relaxed">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs text-muted-foreground/50 italic">Analysis and views are for educational purposes only.</p>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/20"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}