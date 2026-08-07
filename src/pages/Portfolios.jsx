import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, TrendingUp, Target, Umbrella, GraduationCap, BarChart3, Globe, Leaf, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PortfolioBuilder from '@/components/portfolios/PortfolioBuilder';
import PortfolioCard from '@/components/portfolios/PortfolioCard';
import ScenarioSimulator from '@/components/portfolios/ScenarioSimulator';
import WealthCasesTab from '@/components/portfolios/WealthCasesTab';
import PortfolioLab from '@/components/portfolios/PortfolioLab';

const modelPortfolios = [
  {
    name: 'Balanced Growth', icon: TrendingUp, risk: 'Moderate', iconColor: 'text-emerald-400',
    objective: 'Long-term capital growth with moderate volatility, suitable for investors with a medium risk appetite and multi-year horizon.',
    suitable_investor: 'Mid-career professional, comfortable with market fluctuations, building long-term wealth.',
    time_horizon: '7–10 years',
    volatility_estimate: '10–13% annualised',
    max_drawdown_estimate: '-25% to -30%',
    allocation: [
      { asset_class: 'Global Equities', weight: 55, rationale: 'Core growth engine across developed and emerging markets' },
      { asset_class: 'Fixed Income', weight: 25, rationale: 'Income and ballast during equity drawdowns' },
      { asset_class: 'Alternatives', weight: 10, rationale: 'Diversification and uncorrelated returns' },
      { asset_class: 'Gold', weight: 5, rationale: 'Inflation hedge and tail risk protection' },
      { asset_class: 'Cash', weight: 5, rationale: 'Liquidity and rebalancing dry powder' },
    ],
    commentary: 'Current positioning reflects a mild pro-risk tilt given improving macro data, while maintaining meaningful fixed income duration exposure given yield levels.',
  },
  {
    name: 'Conservative Income', icon: Shield, risk: 'Conservative', iconColor: 'text-blue-400',
    objective: 'Capital preservation with steady income generation. Suitable for risk-averse investors or those approaching decumulation.',
    suitable_investor: 'Near-retiree or income-focused investor with low tolerance for drawdowns.',
    time_horizon: '3–5 years',
    volatility_estimate: '5–7% annualised',
    max_drawdown_estimate: '-10% to -15%',
    allocation: [
      { asset_class: 'Fixed Income', weight: 50, rationale: 'Core income and stability' },
      { asset_class: 'Global Equities', weight: 25, rationale: 'Modest growth and dividend income' },
      { asset_class: 'Cash & Short Duration', weight: 15, rationale: 'Liquidity and capital preservation' },
      { asset_class: 'Gold', weight: 10, rationale: 'Safe haven and purchasing power protection' },
    ],
    commentary: 'Elevated yields present an attractive entry for fixed income. Portfolio benefits from higher-for-longer rate environment through carry.',
  },
  {
    name: 'Global Equity', icon: Target, risk: 'Growth', iconColor: 'text-purple-400',
    objective: 'Maximum long-term growth through diversified global equity exposure with small satellite positions.',
    suitable_investor: 'Young investor with high risk tolerance and very long time horizon.',
    time_horizon: '10+ years',
    volatility_estimate: '14–18% annualised',
    max_drawdown_estimate: '-35% to -45%',
    allocation: [
      { asset_class: 'US Equities', weight: 40, rationale: 'Core exposure to world\'s deepest equity market' },
      { asset_class: 'International DM', weight: 25, rationale: 'Developed market diversification' },
      { asset_class: 'Emerging Markets', weight: 15, rationale: 'Higher growth potential' },
      { asset_class: 'Bonds', weight: 10, rationale: 'Minimal ballast and rebalancing asset' },
      { asset_class: 'Alternatives', weight: 10, rationale: 'Private markets, infrastructure' },
    ],
    commentary: 'Tilted toward quality growth with selective EM exposure. Maintaining slight overweight to US given tech-led earnings momentum.',
  },
  {
    name: 'Inflation Defence', icon: Umbrella, risk: 'Moderate', iconColor: 'text-amber-400',
    objective: 'Protect purchasing power across inflation regimes while maintaining reasonable growth potential.',
    suitable_investor: 'Investor concerned about persistent inflation eroding real returns.',
    time_horizon: '5–7 years',
    volatility_estimate: '9–12% annualised',
    max_drawdown_estimate: '-20% to -25%',
    allocation: [
      { asset_class: 'Global Equities', weight: 35, rationale: 'Real asset exposure and pricing power companies' },
      { asset_class: 'Inflation-Linked Bonds', weight: 20, rationale: 'Direct inflation protection' },
      { asset_class: 'Commodities', weight: 15, rationale: 'Natural inflation hedge' },
      { asset_class: 'Gold', weight: 15, rationale: 'Store of value and monetary debasement hedge' },
      { asset_class: 'Real Estate', weight: 10, rationale: 'Real asset with rental income' },
      { asset_class: 'Cash', weight: 5, rationale: 'Short-term liquidity' },
    ],
    commentary: 'Portfolio designed to outperform traditional 60/40 in inflationary regimes. Current tilt reflects sticky services inflation and commodity supply constraints.',
  },
  {
    name: 'Student / Beginner', icon: GraduationCap, risk: 'Moderate', iconColor: 'text-cyan-400',
    objective: 'Simple, low-cost portfolio for someone beginning their investment journey. Focus on broad diversification.',
    suitable_investor: 'New investor, student, or first-time saver with small capital and long time horizon.',
    time_horizon: '10+ years',
    volatility_estimate: '10–14% annualised',
    max_drawdown_estimate: '-25% to -35%',
    allocation: [
      { asset_class: 'Global Equity Index', weight: 70, rationale: 'Broad, low-cost global exposure' },
      { asset_class: 'Bond Index', weight: 20, rationale: 'Diversification and lower volatility' },
      { asset_class: 'Cash', weight: 10, rationale: 'Emergency buffer and rebalancing' },
    ],
    commentary: 'Simplicity is key for new investors. This portfolio uses just 2-3 low-cost index funds. Time in the market matters more than timing the market.',
  },
  {
    name: 'Aggressive Growth', icon: BarChart3, risk: 'Aggressive', iconColor: 'text-red-400',
    objective: 'High-conviction growth portfolio for investors seeking maximum long-term capital appreciation and willing to accept significant volatility.',
    suitable_investor: 'High-risk-tolerance investor with a long horizon, comfortable with drawdowns exceeding 40%.',
    time_horizon: '10–15 years',
    volatility_estimate: '18–22% annualised',
    max_drawdown_estimate: '-40% to -55%',
    allocation: [
      { asset_class: 'US Growth Equities', weight: 35, rationale: 'High-beta exposure to tech and innovation' },
      { asset_class: 'International Equities', weight: 20, rationale: 'Global diversification in growth markets' },
      { asset_class: 'Emerging Markets', weight: 20, rationale: 'Structural growth and demographic tailwinds' },
      { asset_class: 'Small & Mid Cap', weight: 15, rationale: 'Higher return potential with increased risk' },
      { asset_class: 'Alternatives', weight: 10, rationale: 'Venture, private equity, and crypto exposure' },
    ],
    commentary: 'Fully invested with no meaningful defensive allocation. Drawdowns are expected and tolerated. Focus is on compounding over a decade-plus horizon.',
  },
  {
    name: 'Global Macro', icon: Globe, risk: 'Moderate', iconColor: 'text-sky-400',
    objective: 'Dynamic, multi-asset portfolio that actively shifts allocations based on macroeconomic regime changes across geographies.',
    suitable_investor: 'Sophisticated investor seeking tactical flexibility and macro-driven returns uncorrelated to passive indices.',
    time_horizon: '5–10 years',
    volatility_estimate: '10–14% annualised',
    max_drawdown_estimate: '-22% to -30%',
    allocation: [
      { asset_class: 'Global Equities', weight: 30, rationale: 'Core equity exposure, regime-adjusted' },
      { asset_class: 'Government Bonds', weight: 20, rationale: 'Duration as regime hedge' },
      { asset_class: 'Commodities', weight: 15, rationale: 'Inflation and geopolitical risk premium' },
      { asset_class: 'FX & Currency', weight: 10, rationale: 'Active currency positioning as macro signal' },
      { asset_class: 'Gold', weight: 15, rationale: 'Monetary hedge and safe haven' },
      { asset_class: 'Cash', weight: 10, rationale: 'Dry powder for tactical deployment' },
    ],
    commentary: 'Current positioning: overweight commodities and gold given USD debasement risk, underweight duration pending central bank clarity.',
  },
  {
    name: 'ESG & Sustainable', icon: Leaf, risk: 'Growth', iconColor: 'text-green-400',
    objective: 'Growth-oriented portfolio integrating environmental, social, and governance criteria without sacrificing long-term returns.',
    suitable_investor: 'Values-aligned investor seeking competitive returns with a positive real-world impact framework.',
    time_horizon: '7–10 years',
    volatility_estimate: '12–15% annualised',
    max_drawdown_estimate: '-28% to -35%',
    allocation: [
      { asset_class: 'ESG Global Equities', weight: 50, rationale: 'Broad ESG-screened equity exposure' },
      { asset_class: 'Green Bonds', weight: 20, rationale: 'Climate-linked fixed income' },
      { asset_class: 'Clean Energy', weight: 15, rationale: 'Thematic exposure to energy transition' },
      { asset_class: 'Social Infrastructure', weight: 10, rationale: 'Impact-driven real assets' },
      { asset_class: 'Cash', weight: 5, rationale: 'Liquidity reserve' },
    ],
    commentary: 'Clean energy transition and ESG regulation tailwinds remain structural. Green bond issuance at record levels provides attractive fixed income alternatives.',
  },
  {
    name: 'UK Wealth', icon: Building2, risk: 'Moderate', iconColor: 'text-rose-400',
    objective: 'Sterling-denominated portfolio tailored for UK-based investors, incorporating ISA-friendly assets, domestic bias and GBP hedging considerations.',
    suitable_investor: 'UK resident investor optimising for GBP returns, tax efficiency, and home-country familiarity.',
    time_horizon: '5–10 years',
    volatility_estimate: '9–12% annualised',
    max_drawdown_estimate: '-20% to -28%',
    allocation: [
      { asset_class: 'UK Equities (FTSE)', weight: 25, rationale: 'Home bias, dividend yield, and currency alignment' },
      { asset_class: 'Global Equities (GBP-hedged)', weight: 30, rationale: 'International growth with FX risk removed' },
      { asset_class: 'UK Gilts', weight: 15, rationale: 'Sterling fixed income and duration' },
      { asset_class: 'Corporate Bonds', weight: 15, rationale: 'Yield enhancement over gilts' },
      { asset_class: 'Property / REITs', weight: 10, rationale: 'UK real estate exposure and income' },
      { asset_class: 'Cash (GBP)', weight: 5, rationale: 'ISA cash sleeve and liquidity' },
    ],
    commentary: 'FTSE 100 remains attractively valued on a global basis. Gilt yields provide genuine income for the first time in a decade. GBP hedging reduces unintended FX drift.',
  },
];

const riskColors = {
  Conservative: 'bg-blue-400/10 text-blue-400',
  Moderate: 'bg-amber-400/10 text-amber-400',
  Growth: 'bg-purple-400/10 text-purple-400',
  Aggressive: 'bg-red-400/10 text-red-400',
};

export default function Portfolios() {
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Portfolios</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Illustrative model portfolios, an interactive builder, and scenario analysis. For educational purposes only.
          </p>
        </motion.div>

        <Tabs defaultValue="models" className="space-y-8">
          <TabsList className="glass border-border/30 flex-wrap h-auto gap-1">
            <TabsTrigger value="models">Model Portfolios</TabsTrigger>
            <TabsTrigger value="builder">Portfolio Builder</TabsTrigger>
            <TabsTrigger value="simulator">Scenario Simulator</TabsTrigger>
            <TabsTrigger value="lab">Portfolio Lab</TabsTrigger>
            <TabsTrigger value="wealth">Wealth Cases</TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            {selectedPortfolio ? (
              <PortfolioCard
                portfolio={selectedPortfolio}
                riskColors={riskColors}
                onBack={() => setSelectedPortfolio(null)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modelPortfolios.map((p, i) => (
                  <motion.div
                    key={p.name}
                    className="glass rounded-xl p-6 cursor-pointer hover:border-primary/20 transition-all duration-300 group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    onClick={() => setSelectedPortfolio(p)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <p.icon className={`w-5 h-5 ${p.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                    <Badge className={`${riskColors[p.risk]} border-0 text-xs mb-3`}>{p.risk}</Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.objective}</p>
                    <div className="space-y-1.5">
                      {p.allocation.slice(0, 3).map(a => (
                        <div key={a.asset_class} className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${a.weight}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-20 truncate">{a.asset_class}</span>
                          <span className="text-xs font-medium w-8 text-right">{a.weight}%</span>
                        </div>
                      ))}
                      {p.allocation.length > 3 && (
                        <p className="text-xs text-muted-foreground/60">+{p.allocation.length - 3} more assets</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground/50 mt-8 text-center">
              Illustrative portfolio ideas only. Not financial advice or recommendations.
            </p>
          </TabsContent>

          <TabsContent value="builder">
            <PortfolioBuilder />
          </TabsContent>

          <TabsContent value="simulator">
            <ScenarioSimulator />
          </TabsContent>

          <TabsContent value="lab">
            <PortfolioLab />
          </TabsContent>

          <TabsContent value="wealth">
            <WealthCasesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}