import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, Briefcase, Building2, Clock, Crown, Heart, TrendingUp, Globe, Shield, Landmark, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs pointer-events-none">
      <p className="font-semibold text-foreground mb-0.5">{payload[0].name}</p>
      <p className="font-bold text-sm" style={{ color: payload[0].payload.fill }}>{payload[0].value}%</p>
    </div>
  );
};

const COLORS = ['hsl(38, 80%, 55%)', 'hsl(210, 60%, 50%)', 'hsl(160, 50%, 45%)', 'hsl(280, 50%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(45, 70%, 50%)', 'hsl(200, 50%, 50%)'];

const RISK_COLORS = {
  'Low': 'bg-blue-400/10 text-blue-400',
  'Low-Medium': 'bg-cyan-400/10 text-cyan-400',
  'Medium': 'bg-amber-400/10 text-amber-400',
  'Medium-High': 'bg-orange-400/10 text-orange-400',
  'High': 'bg-red-400/10 text-red-400',
};

const cases = [
  {
    icon: GraduationCap,
    iconColor: 'text-cyan-400',
    title: 'Young Professional',
    subtitle: '£25,000 — Long-term accumulation',
    tag: 'Growth',
    client_snapshot: '28-year-old professional, two years into a financial services career. Consistent income with strong growth trajectory. No dependants. High financial literacy and comfort with market volatility.',
    objectives: 'Maximise long-term capital growth over a 20+ year horizon. Exploit tax-efficient wrappers (ISA, SIPP). Build a diversified global equity portfolio with compounding at its core.',
    constraints: 'Limited current capital. No tolerance for illiquid assets. Must maintain 3-month emergency cash buffer outside the portfolio.',
    risk_tolerance: 'Medium-High',
    time_horizon: '20+ years',
    investable_amount: '£25,000',
    liquidity_needs: 'Low — no material capital requirements for 5+ years',
    proposed_saa: [
      { asset_class: 'Global Equities', weight: 75 },
      { asset_class: 'Emerging Markets', weight: 10 },
      { asset_class: 'Fixed Income', weight: 5 },
      { asset_class: 'Gold', weight: 5 },
      { asset_class: 'Cash', weight: 5 },
    ],
    taa_adjustments: 'Slight overweight to technology and AI-adjacent sectors given current cycle positioning. Underweight fixed income relative to SAA — duration unattractive at current yields.',
    rationale: 'With a multi-decade horizon and no near-term liquidity requirements, a heavily equity-tilted allocation is rational. Global diversification across developed and emerging markets provides exposure to multiple growth engines. A small gold position acts as a tail-risk hedge without meaningfully diluting returns.',
    key_risks: 'High equity concentration introduces significant short-term drawdown risk. First major bear market will test conviction. Technology sector concentration in global indices adds factor risk.',
    rebalancing_considerations: 'Annual rebalancing to target weights. Deploy monthly contributions systematically to benefit from pound-cost averaging. Consider semi-annual tactical review relative to macro regime.',
    behavioural_considerations: 'Behavioural risk is the primary constraint. Must establish clear drawdown tolerance framework before deployment. Maintain a written investment policy statement to prevent reactive decision-making during volatile periods.',
    regime_changes: 'A global recession would cause meaningful short-term losses, but persistent contributions during drawdowns historically improve long-run outcomes. Higher inflation would support a modest increase in real assets and inflation-linked bonds.',
  },
  {
    icon: Briefcase,
    iconColor: 'text-emerald-400',
    title: 'Mid-Career Executive',
    subtitle: '£250,000 — Balanced growth',
    tag: 'Balanced',
    client_snapshot: '42-year-old senior executive. £250k investable across ISA and general investment accounts. Married, two school-age children. Mortgage with 12 years remaining. Seeking sustainable long-term growth with risk awareness.',
    objectives: 'Grow wealth over a 12-15 year horizon while managing downside risk. Fund children\'s university costs in 8-10 years. Build a financial foundation ahead of target retirement at 58.',
    constraints: 'Education funding creates a medium-term liquidity event. Moderate tolerance for drawdowns, but key psychological threshold at -20% on total portfolio.',
    risk_tolerance: 'Medium',
    time_horizon: '12–15 years',
    investable_amount: '£250,000',
    liquidity_needs: 'Moderate — potential education-related withdrawal of £40-60k within 10 years',
    proposed_saa: [
      { asset_class: 'Global Equities', weight: 55 },
      { asset_class: 'Fixed Income', weight: 25 },
      { asset_class: 'Alternatives', weight: 10 },
      { asset_class: 'Gold', weight: 5 },
      { asset_class: 'Cash', weight: 5 },
    ],
    taa_adjustments: 'Mild overweight to shorter-duration bonds to reduce rate sensitivity. Favour value and dividend-growth equity strategies over pure momentum in current regime.',
    rationale: 'Classic 60/40 variant adapted for UK investor with dual objectives. Equity allocation drives long-run growth; fixed income provides portfolio ballast and liquidity. Alternatives provide genuine diversification beyond traditional asset class correlations.',
    key_risks: 'Education funding creates a sequencing constraint — equity drawdown near the withdrawal date could force crystallising losses. Inflation eroding purchasing power of bond allocation over a decade.',
    rebalancing_considerations: 'Semi-annual rebalancing. Ring-fence education funding in lower-volatility vehicles (short-duration bonds, money market) 3 years before required drawdown.',
    behavioural_considerations: 'Avoid home bias tendency. Resist urge to over-allocate to familiar UK equities. Maintain discipline on rebalancing — selling equities during rallies to maintain bond allocation is psychologically difficult but important.',
    regime_changes: 'Rising rates would provide a bond reinvestment tailwind but near-term mark-to-market losses. Recession would warrant increasing fixed income and reducing alternatives. Disinflation regime is broadly supportive of current positioning.',
  },
  {
    icon: Building2,
    iconColor: 'text-amber-400',
    title: 'Entrepreneur Post-Exit',
    subtitle: '£2,000,000 — Capital preservation with growth',
    tag: 'Conservative Growth',
    client_snapshot: '50-year-old founder who completed a partial business sale. First significant liquid wealth event. No other material income source. Spouse working, combined household income £120k. High financial literacy but limited investment management experience.',
    objectives: 'Preserve real capital value over the medium term. Establish a sustainable, growing income stream within 5 years. Maintain significant flexibility for potential future business opportunities.',
    constraints: 'Strong emotional attachment to capital — maximum tolerated drawdown approximately 15% on total portfolio. No illiquid investments for 3 years. Concentrated tax position from exit proceeds.',
    risk_tolerance: 'Low-Medium',
    time_horizon: '7–10 years',
    investable_amount: '£2,000,000',
    liquidity_needs: 'High near-term, transitioning to sustainable income drawdown',
    proposed_saa: [
      { asset_class: 'Fixed Income', weight: 35 },
      { asset_class: 'Global Equities', weight: 30 },
      { asset_class: 'Alternatives', weight: 15 },
      { asset_class: 'Gold', weight: 10 },
      { asset_class: 'Cash & Money Market', weight: 10 },
    ],
    taa_adjustments: 'Overweight short-duration bonds and money market instruments while rates remain elevated. Modest underweight equities until macro regime clarity improves.',
    rationale: 'Capital preservation is the primary objective given the concentration of wealth and emotional significance. Fixed income and cash provide stability and income. Equity exposure is global and diversified to avoid concentration in familiar sectors. Meaningful gold position provides both inflation protection and genuine diversification during risk-off episodes.',
    key_risks: 'Inflation could erode purchasing power if the portfolio remains too conservative for too long. Emotional risk of over-reacting to short-term volatility, particularly given the concentration of wealth in a single liquidity event.',
    rebalancing_considerations: 'Gradual deployment over 12 months rather than lump-sum to manage emotional and market timing risk. Quarterly strategic review. Income-generating assets prioritised as income stream is established.',
    behavioural_considerations: 'Anchoring bias risk — tendency to compare current portfolio value to business exit proceeds. Establish clear nominal capital floor and communicate to client. Gradual deployment recommended to avoid regret risk from market timing.',
    regime_changes: 'Higher inflation warrants increasing real assets and inflation-linked bonds. A global recession would pressure equity allocation but strengthen fixed income. Review income generation strategy if rates fall materially.',
  },
  {
    icon: Clock,
    iconColor: 'text-blue-400',
    title: 'Pre-Retirement Planning',
    subtitle: '£500,000 — Transition to drawdown',
    tag: 'Income Focus',
    client_snapshot: '62-year-old professional planning retirement within 2-3 years. £500k across pension and ISA. Partner has a defined benefit pension providing £18k annually. Owns primary residence outright. Excellent health, targeting a 30-year retirement.',
    objectives: 'Manage sequence-of-returns risk during the transition to drawdown. Generate approximately £30k annually from portfolio. Preserve real capital value over a 30-year drawdown horizon.',
    constraints: 'Cannot absorb a large drawdown in the 2-3 years before retirement — sequence risk is the primary risk management challenge. Fixed income needs translate to meaningful portfolio allocation.',
    risk_tolerance: 'Low',
    time_horizon: '3 years to retirement, then 25+ years in drawdown',
    investable_amount: '£500,000',
    liquidity_needs: 'High — regular income drawdown of approximately £30k/year',
    proposed_saa: [
      { asset_class: 'Fixed Income', weight: 45 },
      { asset_class: 'Global Equities', weight: 25 },
      { asset_class: 'Cash & Money Market', weight: 15 },
      { asset_class: 'Gold', weight: 10 },
      { asset_class: 'Alternatives', weight: 5 },
    ],
    taa_adjustments: 'Maintain a 2-year cash buffer to fund drawdown without forced equity selling. Ladder bond maturities to match expected drawdown schedule.',
    rationale: 'Pre-retirement sequencing risk demands a defensive posture in the near term. A cash-and-bonds-heavy allocation protects against a market drawdown immediately before retirement — the worst possible time. Long-term equity allocation maintains real growth potential across what could be a 30-year drawdown period.',
    key_risks: 'Longevity risk — a 30-year drawdown period at 6% withdrawal rate risks portfolio depletion if returns disappoint. Inflation eroding real purchasing power of the income stream over decades.',
    rebalancing_considerations: 'Maintain rolling 2-year cash buffer. Annual drawdown review against portfolio value. Gradually increase equity allocation in later retirement years as longevity risk becomes more acute than sequence risk.',
    behavioural_considerations: 'Loss aversion is heightened near retirement. Investors at this stage are acutely aware of portfolio values. Clear communication of the income sustainability model is critical. Avoid reactive de-risking during normal market corrections.',
    regime_changes: 'Rate cuts would reduce money market and short bond yields, requiring a partial shift toward longer duration or dividend equities for income. Inflation shock would support the gold allocation and inflation-linked bond consideration.',
  },
  {
    icon: Crown,
    iconColor: 'text-purple-400',
    title: 'High Net Worth Family Office',
    subtitle: '£5,000,000+ — Multi-generational wealth',
    tag: 'Multi-Generational',
    client_snapshot: 'Multi-generational family wealth held across a family investment company structure. Patriarch and matriarch in late 60s, with two adult children and grandchildren. Primary goal is preserving and growing real family wealth across generations while funding current lifestyle.',
    objectives: 'Preserve and compound real wealth over a 30+ year multigenerational horizon. Fund lifestyle at approximately £150k annually. Begin estate planning and intergenerational transfer strategy.',
    constraints: 'Complex tax structure across family investment company, personal ISAs, and SIPPs. Significant inherited exposure to UK commercial property. Two adult children with different risk appetites involved in governance.',
    risk_tolerance: 'Medium',
    time_horizon: '30+ years (multi-generational)',
    investable_amount: '£5,000,000+',
    liquidity_needs: 'Moderate — annual income drawdown of ~£150k; remainder long-term',
    proposed_saa: [
      { asset_class: 'Global Equities', weight: 45 },
      { asset_class: 'Private Assets / Alternatives', weight: 20 },
      { asset_class: 'Fixed Income', weight: 15 },
      { asset_class: 'Real Assets / Property', weight: 10 },
      { asset_class: 'Gold', weight: 5 },
      { asset_class: 'Cash', weight: 5 },
    ],
    taa_adjustments: 'Reduce commercial property concentration through gradual disposal and redeploy into global equity and private assets. Maintain global equity diversification with deliberate underweight to UK equities relative to global benchmark.',
    rationale: 'Multi-generational mandate justifies a higher allocation to private assets and alternatives — the illiquidity premium is accessible at this scale. Global equity provides the compounding engine. Fixed income and gold provide ballast and serve as a rebalancing source during equity drawdowns. Real asset exposure maintained via liquid alternatives rather than continued concentration in direct property.',
    key_risks: 'Governance risk — differing risk appetites within family. Concentration in UK commercial property a near-term risk. Estate planning complexity could create liquidity mismatches at intergenerational transfer events.',
    rebalancing_considerations: 'Annual Investment Policy Statement review with family governance board. Staged disposal of direct property over 3-5 years. Maintain separate income and growth sleeves with distinct objectives and benchmarks.',
    behavioural_considerations: 'Family governance structure critical. Investment committee with external independent adviser recommended. Clear written policy for decision-making during market stress. Avoid return-chasing driven by generational differences in risk perception.',
    regime_changes: 'Inflationary environment strengthens real assets and commodities case. Higher rates reduce direct property valuations but improve fixed income entry points. A prolonged risk-off period would draw on fixed income and gold as rebalancing source into equities.',
  },
  {
    icon: Heart,
    iconColor: 'text-rose-400',
    title: 'Widow / Beneficiary',
    subtitle: '£400,000 — Financial independence',
    tag: 'Preservation',
    client_snapshot: '58-year-old recently widowed professional. Received £400k from life insurance and estate inheritance. Part-time employment income of approximately £25k annually. Two adult children, no ongoing financial dependants. Low prior investment experience.',
    objectives: 'Achieve financial independence and supplement part-time income. Avoid depletion of inherited wealth. Maintain meaningful access to capital for planned home improvements and potential lifestyle changes.',
    constraints: 'No prior investment experience — education and confidence are as important as returns. Significant emotional attachment to inherited capital. Strong preference for simplicity and transparency.',
    risk_tolerance: 'Low-Medium',
    time_horizon: '15–20 years',
    investable_amount: '£400,000',
    liquidity_needs: 'Moderate — potential home renovation spend of ~£30-50k within 2 years',
    proposed_saa: [
      { asset_class: 'Fixed Income', weight: 35 },
      { asset_class: 'Global Equities', weight: 30 },
      { asset_class: 'Cash & Money Market', weight: 20 },
      { asset_class: 'Gold', weight: 10 },
      { asset_class: 'Alternatives', weight: 5 },
    ],
    taa_adjustments: 'Maintain elevated cash position for near-term renovation costs. Gradual equity deployment over 12-18 months. Keep portfolio construction simple — avoid complex instruments that erode confidence.',
    rationale: 'Simplicity and emotional resilience are paramount given low prior investment experience and emotional context. A conservative-to-balanced allocation is appropriate. High cash allocation ensures near-term capital availability without forced selling. Gradual equity deployment over time manages both market timing and emotional risk.',
    key_risks: 'Over-conservatism could fail to generate real returns over a 20-year horizon. Emotional decision-making following adverse market events. Potential for capital erosion through excessive fee drag if advice structures are inappropriate.',
    rebalancing_considerations: 'Annual review aligned to overall financial plan. Clear, written framework for portfolio changes prevents reactive decisions. Maintain consistent communication and progress reporting.',
    behavioural_considerations: 'Building investment confidence is central to success. Regular, plain-language reporting on portfolio progress. Establish clear long-run objectives to anchor decisions during market volatility. Consider starting with a simpler, 2-3 fund portfolio and adding complexity over time.',
    regime_changes: 'Persistent high inflation would erode purchasing power significantly over a 20-year horizon — should trigger an allocation review toward real assets. A severe equity drawdown in the first 2-3 years would be psychologically damaging given the low prior experience.',
  },
  {
    icon: Globe,
    iconColor: 'text-teal-400',
    title: 'Internationally Mobile Professional',
    subtitle: '£180,000 — Multi-currency complexity',
    tag: 'Growth',
    client_snapshot: '35-year-old professional working in London on a UK visa. Salary in GBP, family based in Australia, potential to relocate within 5 years. Holds both UK ISA and international brokerage account. Currency exposure is a genuine complication.',
    objectives: 'Build global wealth without creating excessive currency risk relative to eventual home country. Maintain flexibility for international relocation. Optimise tax across UK and Australian obligations.',
    constraints: 'Potential relocation within 5 years creates a shorter effective time horizon for UK-wrapper assets. Currency mismatch between GBP income and AUD long-term liabilities. Limited UK pension contribution history.',
    risk_tolerance: 'Medium-High',
    time_horizon: '5 years (UK), 20+ years (global)',
    investable_amount: '£180,000',
    liquidity_needs: 'Moderate — potential relocation costs and AUD conversion',
    proposed_saa: [
      { asset_class: 'Global Equities (USD-denominated)', weight: 50 },
      { asset_class: 'Fixed Income (short duration)', weight: 20 },
      { asset_class: 'AUD-denominated Assets', weight: 15 },
      { asset_class: 'Gold (USD)', weight: 10 },
      { asset_class: 'Cash (multi-currency)', weight: 5 },
    ],
    taa_adjustments: 'Maintain global equity bias via USD-denominated ETFs to reduce GBP/AUD bilateral currency mismatch. Avoid excessive UK equity home bias given relocation optionality.',
    rationale: 'Currency complexity demands a deliberate approach. Denominating equity allocation in USD provides a natural hedge against both GBP and AUD long-term moves. Global equity exposure captures growth without excessive single-country concentration. Short-duration fixed income preserves capital in the near term and maintains flexibility for relocation costs.',
    key_risks: 'GBP appreciation vs AUD would reduce the sterling value of Australian-denominated assets. Relocation-triggered tax events may create unexpected liquidity needs. Complexity of managing cross-border tax obligations.',
    rebalancing_considerations: 'Maintain a currency review as part of annual rebalancing. Monitor GBP/AUD rate for opportunistic AUD conversion. Ring-fence ISA allowances before potential loss of residency.',
    behavioural_considerations: 'Simplify where possible to maintain oversight across borders. Avoid over-engineering the currency hedge — perfect is the enemy of good. Establish a clear relocation trigger that prompts a full portfolio review.',
    regime_changes: 'USD strength would benefit USD-denominated equity holdings in GBP terms. An Australian rate differential shift could influence the relative attractiveness of AUD-denominated assets.',
  },
  {
    icon: Landmark,
    iconColor: 'text-indigo-400',
    title: 'Defined Benefit Pension Recipient',
    subtitle: '£350,000 additional wealth — Low income need',
    tag: 'Preservation',
    client_snapshot: '60-year-old retiring public sector professional. Receives a defined benefit pension of £32k per year from day one of retirement. Holds £350k in personal savings and an inherited portfolio. The DB pension fully funds lifestyle requirements — the investment portfolio is entirely discretionary.',
    objectives: 'Grow discretionary wealth without taking unnecessary risk. DB pension provides full income security — no income requirement from portfolio. Focus on real capital preservation and estate planning.',
    constraints: 'No income need reduces risk requirement significantly. Should not over-risk simply because time horizon permits it. Estate planning increasingly relevant.',
    risk_tolerance: 'Medium',
    time_horizon: '20+ years (estate planning horizon)',
    investable_amount: '£350,000',
    liquidity_needs: 'Low — no income requirement; occasional large purchases only',
    proposed_saa: [
      { asset_class: 'Global Equities', weight: 55 },
      { asset_class: 'Fixed Income', weight: 20 },
      { asset_class: 'Alternatives', weight: 10 },
      { asset_class: 'Gold', weight: 10 },
      { asset_class: 'Cash', weight: 5 },
    ],
    taa_adjustments: 'With income fully secured via DB pension, tolerate higher equity weighting than age alone would suggest. Focus on quality growth equities with long-run compounding characteristics.',
    rationale: 'The DB pension is the portfolio\'s most important asset — it provides a bond-like income floor that fundamentally changes the risk calculus. The investment portfolio can therefore be more growth-oriented than the investor\'s age would suggest. The focus shifts from income generation to real capital preservation and potential estate value.',
    key_risks: 'Longevity risk is low given DB pension security. Primary risk is inflation eroding the real value of the DB pension and portfolio over 25+ years. Estate planning complexity as portfolio grows.',
    rebalancing_considerations: 'Annual review. Consider SIPP drawdown strategy for tax-efficient estate planning. Review inheritance tax exposure and potential gifting strategy.',
    behavioural_considerations: 'Risk of over-conservatism — investors with secure income often default to very defensive positioning that fails to preserve real wealth. Important to frame the DB pension as the core defensive asset and calibrate portfolio risk accordingly.',
    regime_changes: 'Higher inflation is the key risk — would require increasing real asset and commodity exposure. Equity market drawdown is tolerable given no income requirement and long time horizon.',
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

            {/* Header */}
            <div className="glass rounded-xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <selected.icon className={`w-6 h-6 ${selected.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="font-display text-3xl font-semibold">{selected.title}</h1>
                    <Badge variant="outline" className={RISK_COLORS[selected.risk_tolerance]}>{selected.tag}</Badge>
                  </div>
                  <p className="text-primary text-sm">{selected.subtitle}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{selected.client_snapshot}</p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Risk Profile', value: selected.risk_tolerance },
                { label: 'Time Horizon', value: selected.time_horizon },
                { label: 'Capital', value: selected.investable_amount },
                { label: 'Liquidity', value: selected.liquidity_needs?.split('—')[0].trim() },
              ].map(m => (
                <div key={m.label} className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="text-sm font-semibold">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Objectives & Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">Objectives</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.objectives}</p>
              </div>
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">Constraints</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.constraints}</p>
              </div>
            </div>

            {/* SAA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass rounded-xl p-6">
                <h3 className="font-semibold mb-5">Strategic Asset Allocation</h3>
                <div className="space-y-3">
                  {selected.proposed_saa.map((a, i) => (
                    <div key={a.asset_class} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-sm flex-1">{a.asset_class}</span>
                      <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i] }}
                          initial={{ width: 0 }} animate={{ width: `${a.weight}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{a.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Analysis sections */}
            {/* Portfolio Construction Rationale */}
            <div className="glass rounded-xl p-6 border border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <h3 className="font-semibold">Portfolio Construction Rationale</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">Why This Allocation</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.rationale}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Trade-offs & What Was Avoided</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.taa_adjustments}</p>
                </div>
              </div>
            </div>

            {[
              { title: 'Key Risks', content: selected.key_risks },
              { title: 'Rebalancing Framework', content: selected.rebalancing_considerations },
              { title: 'Behavioural Considerations', content: selected.behavioural_considerations },
              { title: 'Regime Change Sensitivity', content: selected.regime_changes },
            ].map(s => s.content && (
              <div key={s.title} className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            ))}

          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Portfolio Case Studies</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Institutional-grade portfolio construction across a range of client mandates, objectives, and constraints. Each case reflects real-world suitability analysis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              className="glass rounded-xl p-6 cursor-pointer hover:border-primary/20 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onClick={() => setSelected(c)}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
                    <Badge variant="outline" className={`text-xs ${RISK_COLORS[c.risk_tolerance]}`}>{c.risk_tolerance}</Badge>
                  </div>
                  <p className="text-xs text-primary/70 mb-2">{c.subtitle}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{c.client_snapshot}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/60">
                    <span>{c.time_horizon}</span>
                    <span>·</span>
                    <span>{c.investable_amount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}