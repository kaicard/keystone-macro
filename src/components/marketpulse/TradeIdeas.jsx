import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ASSET_COLORS = {
  'Equities': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Fixed Income': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'FX': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Commodities': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'Rates': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  'Credit': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Crypto': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Multi-Asset': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const STATUS_COLORS = {
  active: 'text-emerald-400 bg-emerald-400/10',
  closed: 'text-muted-foreground bg-muted/40',
  monitoring: 'text-amber-400 bg-amber-400/10',
  historical: 'text-blue-400 bg-blue-400/10',
};

// Fallback seed data
const SEED_IDEAS = [
  {
    id: 's1', title: 'Long Gold — Dollar Debasement & Multipolar Reserve Shift', asset_class: 'Commodities',
    direction: 'long', entry_level: '$2,050/oz', exit_level: '$2,500/oz', stop_level: '$1,950/oz',
    catalyst: 'Accelerating central bank reserve diversification away from USD; fiscal dominance concerns.',
    methodology: 'Macro / Quantitative',
    thesis: `## Thesis\n\nGold's secular bull case rests on three structural pillars that have strengthened materially since 2022.\n\n### 1. Central Bank Reserve Diversification\n\nEmerging market central banks — led by China, India, Russia, and Turkey — have purchased gold at record pace since Western sanctions froze Russian FX reserves. The implicit threat to USD-denominated reserves has prompted a fundamental reassessment of reserve composition across the Global South. This demand is **structural, not cyclical**, and is not rate-sensitive in the traditional sense.\n\n### 2. Fiscal Dominance & Real Rate Ceiling\n\nThe US debt trajectory makes sustained high real rates politically untenable over a multi-year horizon. As debt service costs approach 4% of GDP, the pressure on the Federal Reserve to cap yields — whether explicitly or through QE — creates a meaningful risk of negative real rates returning. Gold thrives in negative real rate environments.\n\n### 3. Geopolitical Risk Premium\n\nThe Iran conflict, Russia-Ukraine, and Taiwan risk have driven persistent geopolitical risk premium into safe haven assets. Gold's role as a politically neutral reserve asset is increasingly valued.\n\n## Position\n\n- **Entry**: $2,050/oz on pullbacks\n- **Target**: $2,500/oz (18-month horizon)\n- **Stop**: $1,950/oz (closes below 200-day MA with decisive break)\n\n## Key Risks\n\n- A sharp USD rally driven by risk-off dollar demand could temporarily suppress gold\n- A rapid Fed rate cut cycle that does NOT coincide with fiscal concerns could reduce real-rate appeal\n- Improvement in geopolitical situation reducing safe-haven premium`,
    outcome: 'Gold reached $2,431 within 12 months of entry. Trade achieved approximately 85% of target before partial consolidation.', pnl_estimate: '+18.6% from entry to target',
    date: '2024-01-15', tags: ['Gold', 'USD', 'Macro', 'Real Rates', 'Geopolitics'], status: 'historical',
  },
  {
    id: 's2', title: 'Short EUR/USD — ECB Divergence & Energy Shock Aftermath', asset_class: 'FX',
    direction: 'short', entry_level: '1.0850', exit_level: '1.0200', stop_level: '1.1050',
    catalyst: 'Fed-ECB policy divergence; eurozone industrial weakness; energy import drag.',
    methodology: 'Macro / Technical',
    thesis: `## Thesis\n\nThe EUR/USD short was predicated on a widening policy divergence between the Federal Reserve and the European Central Bank, compounded by structural eurozone economic weakness.\n\n### Policy Divergence\n\nThe Fed's "higher for longer" stance through 2024 created meaningful yield differential in favour of USD. US 2-year yields exceeded German 2-year equivalents by over 200bps, providing strong carry incentive to hold dollars over euros.\n\n### Eurozone Industrial Recession\n\nGermany's manufacturing sector entered a prolonged recession — the PMI remained below 45 for much of the period. The energy cost shock post-Ukraine war permanently impaired German industrial competitiveness, with energy-intensive industries either contracting or relocating.\n\n### Technical Picture\n\nEUR/USD failed repeatedly at the 1.09-1.10 resistance zone (200-day MA area), forming a classic lower-high pattern. The 1.0700 level was identified as key support — a break would open space toward 1.02.\n\n## Position\n\n- **Entry**: 1.0850 (limit sell on rebound)\n- **Target**: 1.0200 (parity re-test zone)\n- **Stop**: 1.1050 (above key resistance)\n\n## Key Risks\n\n- ECB holds rates higher than expected, narrowing differential\n- Eurozone surprise recovery from fiscal stimulus (materialised as German fiscal pivot risk)\n- USD-negative surprise (poor NFP, dovish Fed pivot)`,
    outcome: 'EUR/USD reached 1.0448 within 8 months. Trade hit partial target before German fiscal pivot narrative reversed the move.', pnl_estimate: '+3.7% FX return (unlevered)',
    date: '2024-02-20', tags: ['EUR/USD', 'FX', 'ECB', 'Fed', 'Divergence'], status: 'historical',
  },
  {
    id: 's3', title: 'Long US Duration — Peak Fed / Recession Hedge', asset_class: 'Fixed Income',
    direction: 'long', entry_level: '10Y UST at 5.00% yield', exit_level: '10Y at 3.75% yield', stop_level: '10Y UST at 5.40% yield',
    catalyst: 'Peak Fed funds rate; deteriorating labour market; recession probability rising above 40%.',
    methodology: 'Macro / Fundamental',
    thesis: `## Thesis\n\nWith the Fed funds rate at 5.25-5.50% and 10-year Treasury yields at 5.00% — the highest since 2007 — the risk/reward for long duration became compelling from both a tactical and structural perspective.\n\n### Peak Policy Rate\n\nThe Fed's own dot plot showed the median member expecting cuts in 2024. With inflation trending toward target at 3.2% and core services inflation decelerating, the probability of further hikes was low. The asymmetry favoured long duration.\n\n### Historical Context\n\nAt every prior peak in the Fed funds rate cycle (1989, 1995, 2000, 2006, 2019), 10-year Treasuries rallied significantly in the subsequent 12 months. The average return from peak yield to trough was 15-20% on a price basis.\n\n### Labour Market Leading Indicators\n\nJuly jobless claims were rising. ISM manufacturing new orders were below 45. The Conference Board Leading Economic Index was down 14 consecutive months. Recession probability models placed the probability at 45-65%.\n\n### Carry and Convexity\n\nAt 5.00%, 10-year Treasuries offered 400bps of carry over cash in a recession, making this an asymmetric trade — positive carry while waiting for the rally, significant convexity gain if rates fell sharply.\n\n## Position\n\n- **Entry**: 10Y at 5.00% (TLT at ~$88)\n- **Target**: 10Y at 3.75% (TLT ~$105)\n- **Stop**: 10Y at 5.40% (TLT ~$83)\n\n## Key Risks\n\n- Stagflationary scenario: inflation re-accelerates, forcing Fed to hike further\n- Fiscal supply overwhelms demand (realised partially in 2025 as deficit concern returned)\n- Strong labour market prevents recessionary conditions`,
    outcome: '10Y Treasury rallied from 5.00% to 3.78% by December 2023. TLT moved from $88 to $102. Trade achieved primary target.', pnl_estimate: '+15.9% (TLT price return)',
    date: '2023-10-25', tags: ['Treasuries', 'Duration', 'Fed', 'Recession', 'Fixed Income'], status: 'historical',
  },
  {
    id: 's4', title: 'Long NVDA — AI Capex Supercycle & Data Centre Buildout', asset_class: 'Equities',
    direction: 'long', entry_level: '$450', exit_level: '$800', stop_level: '$370',
    catalyst: 'AI infrastructure spending by hyperscalers (Microsoft, Google, Amazon, Meta); GPU compute monopoly.',
    methodology: 'Thematic / Fundamental',
    thesis: `## Thesis\n\nNVIDIA's position in the AI compute stack is the closest thing to a monopoly in modern technology markets. The company controls approximately 80% of the GPU market for AI training and inference workloads, with its CUDA software ecosystem creating a near-insurmountable moat.\n\n### Hyperscaler Capex Commitment\n\nMicrosoft, Google, Meta, and Amazon collectively guided for over $200bn in AI infrastructure capex in 2024, representing an acceleration of 40-60% year-over-year. NVIDIA is the primary beneficiary of every dollar spent on AI training infrastructure.\n\n### Earnings Trajectory\n\nNVIDIA's Data Centre revenue grew from $4bn to $18bn per quarter in just three quarters — the fastest revenue ramp of any large-cap company in history. Gross margins expanded to 75%+ as ASPs for H100 GPUs remained elevated against constrained supply.\n\n### Competitive Moat\n\nAMD's MI300X and Intel's Gaudi chips are credible alternatives for inference but lag for training workloads. CUDA's 3,000+ libraries and 4M+ developers represent switching costs that take years to overcome. NVIDIA's NVLink interconnect technology also differentiates performance at scale.\n\n### Valuation Context\n\nAt a $450 entry, NVIDIA traded at ~25x forward earnings — reasonable for a company growing revenue at 100%+ year-over-year with expanding margins and a multi-year capex supercycle ahead.\n\n## Key Risks\n\n- Hyperscaler capex cut if AI ROI disappoints\n- Geopolitical risk: China chip export restrictions limiting TAM\n- AMD or custom silicon eating market share faster than expected\n- Valuation compression in a rising rate environment`,
    outcome: 'NVDA reached $974 (split-adjusted equivalent) by June 2024. Primary target of $800 exceeded by Q2 2024.', pnl_estimate: '+77.8% from entry to $800 target',
    date: '2023-09-01', tags: ['NVDA', 'AI', 'Semiconductors', 'Equities', 'Mega-cap'], status: 'historical',
  },
  {
    id: 's5', title: 'Long Brent Crude — OPEC+ Discipline & Iran War Risk Premium', asset_class: 'Commodities',
    direction: 'long', entry_level: '$78/bbl', exit_level: '$95/bbl', stop_level: '$72/bbl',
    catalyst: 'OPEC+ production cuts extended; Iran-Israel escalation risk; US SPR depletion.',
    methodology: 'Macro / Geopolitical',
    thesis: `## Thesis\n\nBrent crude's risk/reward at $78/bbl was compelling given the conjunction of supply discipline from OPEC+, rising geopolitical risk premium from Middle East escalation, and a demand trajectory that was underappreciated by consensus.\n\n### OPEC+ Supply Discipline\n\nSaudi Arabia extended voluntary cuts of 1mb/d through Q1 2024, and Russia aligned cuts of 500kb/d through the same period. Total OPEC+ voluntary cuts exceeded 2.2mb/d, the deepest supply restriction since 2020. Saudi Arabia's fiscal breakeven around $80-85/bbl provided strong incentive to defend prices.\n\n### Geopolitical Risk Premium\n\nThe October 2023 Hamas attack and subsequent Israel-Gaza conflict raised tail risk of a broader regional escalation involving Iran. Any closure of the Strait of Hormuz (through which ~20% of global oil supply transits) would cause an immediate supply shock. Markets were pricing minimal probability of this scenario.\n\n### US Strategic Petroleum Reserve\n\nThe SPR had been drawn down to 40-year lows (under 350mb) following 2022 releases. Refill demand would add incremental buying pressure to physical markets.\n\n### Demand Underappreciated\n\nChina's post-reopening oil demand recovery was tracking above IEA forecasts, with refinery throughput at record levels. India's demand growth of 500kb/d year-over-year was also underappreciated.\n\n## Position\n\n- **Entry**: $78/bbl on pullback\n- **Target**: $95/bbl (12-month)\n- **Stop**: $72/bbl (break of key support / demand destruction signal)\n\n## Key Risks\n\n- Global recession causing demand destruction\n- OPEC+ discipline breaks down (members cheat on quotas)\n- Iran deal restoring Iranian barrels to market\n- US shale production surprise to the upside`,
    outcome: 'Brent reached $91.8/bbl in October 2023 following escalation of Middle East conflict. Trade achieved 75% of target before demand concerns capped the move.', pnl_estimate: '+17.7% from entry to $91.8',
    date: '2023-08-15', tags: ['Brent', 'Oil', 'OPEC', 'Geopolitics', 'Commodities'], status: 'historical',
  },
];

function TradeCard({ idea }) {
  const [expanded, setExpanded] = useState(false);
  const assetStyle = ASSET_COLORS[idea.asset_class] || 'text-muted-foreground bg-muted/40';
  const isLong = idea.direction === 'long';

  return (
    <motion.div
      layout
      className="glass rounded-xl overflow-hidden border border-border/30 hover:border-primary/15 transition-colors"
    >
      <button className="w-full text-left p-5" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${assetStyle}`}>{idea.asset_class}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isLong ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
              }`}>
                {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {idea.direction.toUpperCase()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLORS[idea.status] || 'text-muted-foreground bg-muted/40'}`}>
                {idea.status}
              </span>
              {idea.date && <span className="text-xs text-muted-foreground/60 font-mono">{idea.date}</span>}
            </div>
            <h3 className="font-semibold text-sm leading-snug mb-2">{idea.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{idea.catalyst}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            {idea.pnl_estimate && (
              <span className={`text-xs font-bold font-mono ${idea.pnl_estimate.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {idea.pnl_estimate}
              </span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Levels grid */}
        {(idea.entry_level || idea.exit_level || idea.stop_level) && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Entry', value: idea.entry_level, color: 'text-foreground' },
              { label: 'Target', value: idea.exit_level, color: 'text-emerald-400' },
              { label: 'Stop', value: idea.stop_level, color: 'text-red-400' },
            ].map(l => l.value && (
              <div key={l.label} className="bg-muted/30 rounded-lg px-3 py-2">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-0.5">{l.label}</p>
                <p className={`text-xs font-bold font-mono ${l.color}`}>{l.value}</p>
              </div>
            ))}
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/20 px-5 pb-5 pt-4 space-y-4">
              {idea.methodology && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">Methodology</p>
                  <p className="text-xs text-muted-foreground">{idea.methodology}</p>
                </div>
              )}
              {idea.thesis && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">Full Thesis</p>
                  <ReactMarkdown className="prose prose-xs dark:prose-invert max-w-none text-xs [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-muted-foreground [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5">
                    {idea.thesis}
                  </ReactMarkdown>
                </div>
              )}
              {idea.outcome && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1.5">Outcome</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{idea.outcome}</p>
                  {idea.pnl_estimate && (
                    <p className={`text-sm font-bold mt-2 font-mono ${idea.pnl_estimate.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {idea.pnl_estimate}
                    </p>
                  )}
                </div>
              )}
              {idea.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {idea.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TradeIdeas() {
  const { data: dbIdeas = [], isLoading } = useQuery({
    queryKey: ['trade-ideas'],
    queryFn: () => base44.entities.TradeIdea.list('-date', 50),
  });

  const ideas = dbIdeas.length > 0 ? dbIdeas : SEED_IDEAS;

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="flex gap-3 items-start bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-amber-400">Historical hypothetical analysis only.</span> These are illustrative examples of trades that may have occurred historically based on publicly available information. This is not financial advice, not a signal service, and cannot be replicated. For educational and analytical purposes only.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {ideas.length} Historical Trade Ideas
        </h3>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea, i) => (
            <motion.div key={idea.id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <TradeCard idea={idea} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}