import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, Target, Layers, BarChart2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TradeChart from './TradeChart';

const ASSET_COLORS = {
  'Equities':     { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/25', dot: 'bg-purple-400' },
  'Fixed Income': { text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/25',   dot: 'bg-blue-400'   },
  'FX':           { text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/25',   dot: 'bg-cyan-400'   },
  'Commodities':  { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/25',  dot: 'bg-amber-400'  },
  'Rates':        { text: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/25',    dot: 'bg-sky-400'    },
  'Credit':       { text: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/25',dot: 'bg-emerald-400'},
  'Multi-Asset':  { text: 'text-rose-400',   bg: 'bg-rose-400/10',   border: 'border-rose-400/25',   dot: 'bg-rose-400'   },
};

const STATUS_CONFIG = {
  active:     { label: 'ACTIVE',     color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  monitoring: { label: 'MONITORING', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  closed:     { label: 'CLOSED',     color: 'text-muted-foreground bg-muted/30 border-border/30' },
  historical: { label: 'HISTORICAL', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
};

const SEED_IDEAS = [
  {
    id: 's1',
    title: 'Long Gold — Fiscal Dominance & De-Dollarisation Supercycle',
    asset_class: 'Commodities',
    direction: 'long',
    entry_level: '$2,650/oz',
    exit_level: '$3,400/oz',
    stop_level: '$2,480/oz',
    catalyst: 'Central bank reserve diversification; US debt/GDP at 125%; negative real rates structurally anchored by fiscal constraints.',
    methodology: 'Macro / Cross-Asset',
    thesis: `## Macro Framework\n\nGold's structural bull case rests on the thesis that fiscal dominance — where debt obligations constrain monetary policy — creates a ceiling on real rates that central banks cannot pierce without triggering sovereign debt crises.\n\n### De-Dollarisation: Structural, Not Cyclical\n\nEmerging market central banks (China PBoC, India RBI, Turkey TCMB, Poland, Hungary) have collectively purchased gold at 1,000+ tonnes per year since 2022 — the highest sustained pace since the Bretton Woods era. The freezing of $300bn+ of Russian sovereign reserves in 2022 was a watershed moment: it demonstrated that USD-denominated reserves carry geopolitical confiscation risk. This has prompted a fundamental reassessment of the reserve composition across the Global South. This demand is structural, inelastic to price, and not rate-sensitive.\n\n### Fiscal Dominance = Real Rate Ceiling\n\nUS federal interest payments now exceed $1 trillion annually — roughly 4% of GDP. At this debt level, every 100bps rise in 10-year yields adds ~$330bn in annual interest cost. The fiscal math makes sustained positive real rates politically untenable. The Fed's ability to fight inflation through rate hikes is increasingly constrained, creating a structural floor for gold: it wins in the inflationary scenario (real rates stay negative) and in the recessionary scenario (risk-off, safe haven demand).\n\n### Technical Context\n\nGold broke decisively above the $2,100 structural resistance zone — a level that capped rallies in 2020 and 2022. The EMA9 crossed above EMA21 on monthly timeframes, confirming trend continuation. Fibonacci extension targets from the 2018-2020 base leg project to $3,100-$3,400. Bollinger Band expansion on the weekly chart signals a continuation breakout rather than overextension.\n\n### Support / Resistance\n\n- **Key support**: $2,480 (50% Fibonacci retracement, 200-day EMA)\n- **Resistance cleared**: $2,650 (former ATH, now support)\n- **Target zone**: $3,100-$3,400 (Fibonacci extension 161.8%)\n\n## Key Risks\n\n- Sharp USD rally in a disorderly risk-off event (flight to USD cash, not gold)\n- Surprise disinflation allowing the Fed to cut rates rapidly — reducing gold's relative appeal vs. short duration\n- China economic slowdown reducing EM central bank reserve accumulation capacity`,
    outcome: 'Gold reached $3,167/oz by Q1 2025. Trade hit primary Fibonacci extension target. Partial profit taken at $3,000.',
    pnl_estimate: '+26.7% unlevered (to $3,167)',
    date: '2024-11-01',
    tags: ['Gold', 'XAU/USD', 'Real Rates', 'De-Dollarisation', 'Central Banks', 'Macro'],
    status: 'historical',
    rr_ratio: '4.4:1',
  },
  {
    id: 's2',
    title: 'Short EUR/USD — Transatlantic Policy Divergence & Deindustrialisation',
    asset_class: 'FX',
    direction: 'short',
    entry_level: '1.0920',
    exit_level: '1.0200',
    stop_level: '1.1100',
    catalyst: 'Fed-ECB rate differential at 200bps+; German manufacturing PMI sub-45; energy cost structural disadvantage.',
    methodology: 'Macro / Technical',
    thesis: `## Framework: Divergence Trade\n\nThe EUR/USD short is a classic divergence trade — exploiting a widening economic and policy gap between two currency blocs. The thesis rests on three pillars: policy divergence, structural economic weakness, and technical confirmation.\n\n### Policy Divergence: 200bps+ Carry Incentive\n\nUS 2-year yields exceeded German 2-year Bund yields by over 200bps throughout 2024. At this differential, uncovered interest parity creates persistent carry advantage for short EUR/long USD positioning. Institutional flows — particularly from European pension funds hedging USD-denominated assets — amplified the directional move.\n\n### Eurozone Structural Impairment\n\nGermany's export model — built on cheap Russian energy and Chinese end-demand — has been structurally impaired. The energy price shock post-2022 permanently raised industrial input costs by 30-40% vs pre-war levels. German manufacturing PMI remained below 45 for 18 consecutive months — recessionary territory. Chemical, automotive, and steel sectors are undergoing structural contraction or relocation. This is not a cyclical dip; it is a permanent loss of competitive advantage.\n\n### Technical Structure\n\nEUR/USD repeatedly failed at 1.09-1.10 — the confluence of the 200-day EMA and the 61.8% Fibonacci retracement of the 2021-2022 decline. Each rally into this zone was sold. The lower-high formation on the weekly chart confirmed a distribution pattern. Key support breaks at 1.0700 and 1.0500 provided shorting opportunities with defined risk.\n\n### Carry Economics\n\nShort EUR/long USD earned ~200bps of carry per year, making this a positive-carry macro trade — you were paid to wait for the directional move.\n\n## Key Risks\n\n- Eurozone fiscal surprise (German debt brake reform, NGEU expansion) improving growth prospects\n- USD-negative shock (soft US labour data, aggressive Fed pivot)\n- ECB holding rates higher than expected, narrowing the differential\n- China stimulus lifting European export demand`,
    outcome: 'EUR/USD reached 1.0448 by Q4 2024. Trade hit 65% of target before German fiscal pivot narrative partially reversed the move.',
    pnl_estimate: '+4.4% FX return unlevered (to 1.0448)',
    date: '2024-07-10',
    tags: ['EUR/USD', 'FX', 'ECB', 'Fed', 'Germany', 'Divergence', 'Carry'],
    status: 'historical',
    rr_ratio: '4.0:1',
  },
  {
    id: 's3',
    title: 'Long US 10Y Duration — Yield Cycle Peak & Asymmetric Convexity',
    asset_class: 'Fixed Income',
    direction: 'long',
    entry_level: 'TLT @ $87 (10Y yield 5.02%)',
    exit_level: 'TLT @ $105 (10Y yield 3.75%)',
    stop_level: 'TLT @ $82 (10Y yield 5.50%)',
    catalyst: 'Peak Fed funds rate at 5.25-5.50%; deteriorating leading indicators; 45%+ recession probability.',
    methodology: 'Macro / Fundamental / Historical Analogue',
    thesis: `## The Peak Cycle Duration Trade\n\nAt 5.00%+ yields in October 2023, long duration represented one of the most asymmetric risk/reward opportunities in fixed income since 2007. The trade combined positive carry, historical analogue support, and recession optionality.\n\n### Historical Analogue: Every Prior Cycle Peak\n\nAt every prior Federal Reserve rate cycle peak — 1989, 1995, 2000, 2006, 2019 — 10-year Treasuries rallied significantly in the subsequent 12 months. The average capital gain was 12-18% on a price basis (TLT equivalent). The 2023 setup was particularly compelling because 5%+ yields had not been seen since 2007, providing a multi-decade valuation reference point.\n\n### Positive Carry + Recession Convexity\n\nAt 5.00%, 10-year Treasuries offered ~400bps of positive carry over money market rates in a recessionary scenario where the Fed cuts aggressively. Convexity — the acceleration of price gains as yields fall — made this position particularly attractive at high yield levels. A move from 5% to 4% produces ~9% price gain; from 5% to 3.5% produces ~17% price gain.\n\n### Leading Indicators Were Flashing Recession\n\nThe Conference Board LEI declined for 14 consecutive months by October 2023. ISM Manufacturing New Orders sub-45 for 11 months. Jobless claims trending up from the 200k floor. The yield curve (2s10s) had been deeply inverted for 18 months — a historically reliable recession predictor with a 12-18 month lag.\n\n### Fiscal Supply Risk (The Counter)\n\nThe primary risk was fiscal: with a $2+ trillion deficit, the Treasury was issuing bonds at an unprecedented pace. If foreign demand weakened (Japan YCC adjustment), term premium could rise, capping the rally. This materialised partially in 2025 as deficit concerns returned.\n\n## Key Risks\n\n- Stagflationary scenario: inflation re-accelerates, Fed raises further (stop: 5.50% yield)\n- Fiscal dominance: bond vigilantes force term premium higher despite economic weakness\n- Strong labour market preventing recessionary conditions`,
    outcome: '10Y yield fell from 5.00% to 3.78% by December 2023. TLT rallied from $87 to $102. Primary target nearly achieved within 2 months.',
    pnl_estimate: '+17.2% (TLT price return, 2 months)',
    date: '2023-10-26',
    tags: ['TLT', '10Y UST', 'Duration', 'Fed', 'Recession', 'Fixed Income', 'Convexity'],
    status: 'historical',
    rr_ratio: '3.7:1',
  },
  {
    id: 's4',
    title: 'Long NVDA — AI Capex Supercycle & Compute Monopoly',
    asset_class: 'Equities',
    direction: 'long',
    entry_level: '$480',
    exit_level: '$875',
    stop_level: '$390',
    catalyst: 'Hyperscaler AI capex commitment $200bn+; H100/H200 GPU supply scarcity; CUDA ecosystem moat.',
    methodology: 'Thematic / Fundamental / Scarcity',
    thesis: `## The AI Compute Monopoly\n\nNVIDIA represents the closest thing to a modern monopoly in critical infrastructure. The thesis is not simply "AI will be big" — it is that NVIDIA has captured a bottleneck position in the AI value chain that is structurally protected by software ecosystem lock-in.\n\n### The CUDA Moat: 3,000 Libraries, 4 Million Developers\n\nNVIDIA's real competitive advantage is not hardware — it is CUDA, the proprietary software platform that has been optimised for 15+ years. Over 3,000 software libraries, 600+ AI/ML models, and 4 million developers have been trained on CUDA. Switching costs are enormous: retraining an ML engineering organisation on AMD ROCm or Intel oneAPI is a 2-3 year undertaking. This software moat makes NVDA's position durable even as hardware competition intensifies.\n\n### Demand: $500bn in Committed AI Infrastructure Capex\n\nMicrosoft ($80bn), Google ($75bn), Amazon ($90bn), and Meta ($65bn) collectively guided for unprecedented AI infrastructure spending in FY2025. Every dollar of hyperscaler AI capex is disproportionately captured by NVIDIA — at 80%+ GPU market share for training workloads. At $30,000-$40,000 per H100 GPU, with clusters of 10,000-100,000 GPUs, the economics of demand are extraordinary.\n\n### Margin Structure: 75%+ Gross Margins\n\nNVIDIA's data centre gross margins at 75%+ reflect its pricing power in a supply-constrained environment. This is software-like margin on what is nominally a hardware business — the premium reflects the CUDA lock-in and scarcity of H100s.\n\n### Valuation: 25x Forward at Entry = Reasonable for 100%+ Growth\n\nAt $480 entry, NVDA traded at approximately 25x forward consensus earnings — a discount to its historical premium relative to growth rate. For a business growing data centre revenue at 100%+ YoY with expanding margins and a defensible moat, this was not an expensive entry.\n\n## Key Risks\n\n- Hyperscaler capex retrenchment if AI ROI disappoints enterprise customers\n- Custom silicon (TPU, Trainium, MAIA) eating share faster than expected\n- China export restriction widening, removing a $10bn+ annual revenue market\n- Competition: AMD MI300X gaining traction for inference workloads`,
    outcome: 'NVDA reached $974 (pre-split equivalent) by June 2024, exceeding the $875 target. Trade returned 82% from entry.',
    pnl_estimate: '+82.3% from entry to target ($875)',
    date: '2023-11-15',
    tags: ['NVDA', 'NVIDIA', 'AI', 'Semiconductors', 'Capex', 'CUDA', 'Equities'],
    status: 'historical',
    rr_ratio: '4.4:1',
  },
  {
    id: 's5',
    title: 'Long Brent Crude — OPEC+ Supply Discipline & Geopolitical Risk Premium',
    asset_class: 'Commodities',
    direction: 'long',
    entry_level: '$77/bbl',
    exit_level: '$96/bbl',
    stop_level: '$70/bbl',
    catalyst: 'Saudi voluntary 1mb/d cut extended; Israel-Iran escalation risk; China demand recovery tracking above IEA.',
    methodology: 'Macro / Geopolitical / Supply-Demand',
    thesis: `## Supply-Demand Thesis with Geopolitical Optionality\n\nThe Brent long thesis combined fundamental supply/demand imbalance with optionality on geopolitical risk premium — a structure that provided multiple paths to profit.\n\n### OPEC+ Supply Architecture: 2.2mb/d Removed\n\nSaudi Arabia extended its unilateral voluntary cut of 1mb/d through Q1 2024, complemented by Russian cuts of 500kb/d. Total OPEC+ voluntary cuts exceeded 2.2mb/d — the deepest restriction since COVID. Saudi's fiscal breakeven at $80-90/bbl provided strong incentive to defend prices. The kingdom demonstrated willingness to forgo market share to maintain price — a more disciplined stance than 2016.\n\n### Geopolitical Risk Premium: Iran as Tail Risk\n\nThe October 7th Hamas attack and subsequent Israeli response elevated Middle East escalation risk dramatically. The key scenario was Iranian involvement triggering Strait of Hormuz disruption — the passage through which 21mb/d (~20% of global supply) transits. Markets were pricing near-zero probability of Hormuz disruption. Buying crude at $77 gave optionality on this tail risk effectively for free.\n\n### Demand Underappreciated by Consensus\n\nIEA demand forecasts consistently underestimated China's post-reopening oil appetite. Chinese refinery throughput hit record highs through H1 2023. India's demand growth tracking 500kb/d above prior year. Aviation fuel demand recovering faster than forecast on international travel recovery.\n\n### US SPR Depletion Creates Structural Buyer\n\nThe SPR drawdown to 40-year lows (under 350mb) obligated the US to refill — adding structural incremental demand to physical markets.\n\n## Key Risks\n\n- Global recession causing material demand destruction (primary risk)\n- OPEC+ discipline breakdown: members cheating quotas\n- Iran deal restoring 1-2mb/d Iranian barrels to market\n- US shale production surprise (Permian breakeven sub-$55/bbl)`,
    outcome: 'Brent hit $93.7/bbl in October 2023 after Middle East escalation. Trade achieved 85% of $96 target.',
    pnl_estimate: '+21.7% unlevered (to $93.7)',
    date: '2023-08-20',
    tags: ['Brent', 'WTI', 'Oil', 'OPEC', 'Geopolitics', 'Iran', 'Commodities'],
    status: 'historical',
    rr_ratio: '2.7:1',
  },
  {
    id: 's6',
    title: 'Short GBP/JPY — BOJ YCC Unwind & Sterling Stagflation Risk',
    asset_class: 'FX',
    direction: 'short',
    entry_level: '192.50',
    exit_level: '179.00',
    stop_level: '196.50',
    catalyst: 'BOJ yield curve control abandonment; UK real wage compression; carry unwind velocity.',
    methodology: 'Macro / Central Bank Policy / Carry Unwind',
    thesis: `## The Carry Unwind Thesis\n\nGBP/JPY represented an extreme carry trade — long a stagflating currency (GBP) funded by the world's most aggressively easy central bank (BOJ). The thesis was that YCC unwind would simultaneously strengthen JPY and that UK stagflation would weaken sterling — a double-directional move.\n\n### BOJ Yield Curve Control: The End Game\n\nThe BOJ had been defending the 10-year JGB yield at 0.5% (later 1.0%) through unlimited bond buying — an unsustainable intervention against global rate normalisation. Japan's core CPI at 3.1% — the highest in 40 years — was building pressure for policy normalisation. Every meeting carried the risk of a YCC adjustment announcement, which had historically produced violent JPY appreciation (3-5% moves in hours).\n\nThe structural bear case: YCC abandonment would force a global carry unwind as JPY-funded trades across all markets are liquidated. This is a non-linear event — JPY longs would be buying into a vacuum.\n\n### Sterling: Stagflation Without the Currency Benefit\n\nUK CPI was the last G7 inflation to break below 10% (achieved December 2023 at 3.9%). Real wages had been negative for 24 months. Mortgage refinancing shock — 1.5 million fixed-rate mortgages repricing at 5%+ vs 1-2% prior — was creating a rolling consumer credit squeeze. Housing market correction of 8-12% was underway.\n\nThe BOE was caught between inflation (requiring more hikes) and growth collapse (requiring cuts) — the stagflation trap.\n\n## Key Risks\n\n- BOJ delays YCC normalisation, extending the carry trade\n- UK economy surprises to the upside on service sector resilience\n- Risk-on environment maintaining demand for carry pairs\n- EUR/GBP moves against the GBP weakness thesis`,
    outcome: 'GBP/JPY fell from 193 to 180 following BOJ YCC adjustments in July and October 2023. Primary target achieved.',
    pnl_estimate: '+7.0% FX unlevered (to 179.00)',
    date: '2023-06-15',
    tags: ['GBP/JPY', 'BOJ', 'YCC', 'Sterling', 'Carry', 'FX', 'Japan'],
    status: 'historical',
    rr_ratio: '3.4:1',
  },
];

// Risk/Reward visual bar
function RRBar({ ratio }) {
  const val = parseFloat(ratio);
  if (isNaN(val)) return null;
  const pct = Math.min((val / 6) * 100, 100);
  const color = val >= 4 ? '#34d399' : val >= 2.5 ? '#f59e0b' : '#f87171';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground/60 w-16 shrink-0">R/R Ratio</span>
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold font-mono" style={{ color }}>{ratio}</span>
    </div>
  );
}

// Levels panel
function LevelBadge({ label, value, color }) {
  return (
    <div className={`flex-1 min-w-0 rounded-lg border p-2.5 ${color}`}>
      <p className="text-[9px] uppercase tracking-widest font-bold opacity-60 mb-1">{label}</p>
      <p className="text-xs font-bold font-mono truncate">{value || '—'}</p>
    </div>
  );
}

function TradeCard({ idea, index }) {
  const [expanded, setExpanded] = useState(false);
  const asset = ASSET_COLORS[idea.asset_class] || { text: 'text-muted-foreground', bg: 'bg-muted/40', border: 'border-border/30', dot: 'bg-muted-foreground' };
  const statusCfg = STATUS_CONFIG[idea.status] || STATUS_CONFIG.historical;
  const isLong = idea.direction === 'long';
  const dirColor = isLong ? 'text-emerald-400' : 'text-red-400';
  const dirBg = isLong ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-red-400/10 border-red-400/20';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden border border-border/30 hover:border-border/50 transition-all bg-card/40 backdrop-blur-sm"
    >
      {/* Accent top bar */}
      <div className={`h-0.5 w-full ${asset.dot}`} style={{ opacity: 0.6 }} />

      <button className="w-full text-left px-5 pt-4 pb-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-4">
          {/* Left: direction icon */}
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${dirBg}`}>
            {isLong
              ? <TrendingUp className={`w-5 h-5 ${dirColor}`} />
              : <TrendingDown className={`w-5 h-5 ${dirColor}`} />}
          </div>

          {/* Middle: content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${asset.bg} ${asset.text} ${asset.border}`}>
                {idea.asset_class}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${dirBg} ${dirColor}`}>
                {idea.direction.toUpperCase()}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              {idea.methodology && (
                <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">{idea.methodology}</span>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug mb-1.5">{idea.title}</h3>
            <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">{idea.catalyst}</p>
          </div>

          {/* Right: P&L + expand */}
          <div className="shrink-0 flex flex-col items-end gap-2 ml-2">
            {idea.pnl_estimate && (
              <span className={`text-sm font-bold font-mono ${idea.pnl_estimate.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {idea.pnl_estimate.split(' ')[0]}
              </span>
            )}
            {idea.date && <span className="text-[10px] text-muted-foreground/40 font-mono">{idea.date}</span>}
            {expanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
          </div>
        </div>

        {/* Levels row (always visible) */}
        <div className="flex gap-2 mt-3">
          <LevelBadge label="Entry"  value={idea.entry_level} color="bg-muted/20 border-border/20 text-foreground" />
          <LevelBadge label="Target" value={idea.exit_level}  color="bg-amber-400/5 border-amber-400/15 text-amber-300" />
          <LevelBadge label="Stop"   value={idea.stop_level}  color="bg-red-400/5 border-red-400/15 text-red-400" />
        </div>

        {/* R/R bar */}
        {idea.rr_ratio && <div className="mt-2.5"><RRBar ratio={idea.rr_ratio} /></div>}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/20 px-5 pb-6 pt-5 space-y-6">

              {/* Technical Chart */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Technical Analysis — Illustrative</span>
                </div>
                <div className="bg-muted/10 rounded-xl p-3 border border-border/20">
                  <TradeChart
                    direction={idea.direction}
                    entryLevel={idea.entry_level}
                    exitLevel={idea.exit_level}
                    stopLevel={idea.stop_level}
                  />
                </div>
                <div className="flex flex-wrap gap-3 mt-2 px-1">
                  {[
                    { color: '#f59e0b', label: 'Fibonacci 61.8%' },
                    { color: '#a78bfa', label: '50.0%' },
                    { color: '#38bdf8', label: '38.2%' },
                    { color: '#4ade80', label: '23.6%' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-1">
                      <span className="w-2.5 h-px inline-block" style={{ backgroundColor: f.color, borderTop: `1px dashed ${f.color}`, display: 'inline-block' }} />
                      <span className="text-[9px] text-muted-foreground/50">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Thesis */}
              {idea.thesis && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Full Thesis</span>
                  </div>
                  <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed
                    [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-4 [&_h2]:mb-2
                    [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-primary/80 [&_h3]:mt-3 [&_h3]:mb-1
                    [&_p]:text-muted-foreground [&_p]:my-1.5 [&_p]:leading-relaxed
                    [&_ul]:my-1.5 [&_li]:my-0.5 [&_li]:text-muted-foreground
                    [&_strong]:text-foreground">
                    <ReactMarkdown>{idea.thesis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Outcome */}
              {idea.outcome && (
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold">Outcome</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{idea.outcome}</p>
                  {idea.pnl_estimate && (
                    <p className={`text-base font-bold font-mono ${idea.pnl_estimate.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {idea.pnl_estimate}
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              {idea.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {idea.tags.map(t => (
                    <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground/60 border border-border/20">
                      {t}
                    </span>
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

// Filter options
const FILTERS = ['All', 'Equities', 'Fixed Income', 'FX', 'Commodities', 'Rates', 'Credit'];

export default function TradeIdeas() {
  const [filter, setFilter] = useState('All');

  const { data: dbIdeas = [], isLoading } = useQuery({
    queryKey: ['trade-ideas'],
    queryFn: () => base44.entities.TradeIdea.list('-date', 50),
  });

  const rawIdeas = dbIdeas.length > 0 ? dbIdeas : SEED_IDEAS;
  const ideas = filter === 'All' ? rawIdeas : rawIdeas.filter(i => i.asset_class === filter);

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex gap-3 items-start bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-amber-400">Educational & historical analysis only.</span>{' '}
          These are illustrative historical trade studies for analytical learning. Charts are synthetic and for educational reference only. This is NOT financial advice, NOT a signal service, and NOT actionable. Past performance of illustrative examples does not indicate future results. Consult qualified advisors before making any investment decisions.
        </p>
      </div>

      {/* Header + filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-semibold text-base">Historical Trade Library</h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">{ideas.length} idea{ideas.length !== 1 ? 's' : ''} · Institutional-grade analysis</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/20 text-muted-foreground border-border/20 hover:border-border/40 hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="rounded-xl h-48 bg-muted/20 animate-pulse border border-border/20" />)}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/50 text-sm">No ideas in this category yet.</div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea, i) => <TradeCard key={idea.id || i} idea={idea} index={i} />)}
        </div>
      )}
    </div>
  );
}