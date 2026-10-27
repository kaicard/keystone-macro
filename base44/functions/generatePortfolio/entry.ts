import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { HOUSE_STYLE } from '../../shared/writingStyle.ts';
import { getCaller, signInRequired, limitRequests } from '../../shared/requestSecurity.ts';

// The prompt and output schema live here: the client only sends the user's
// selections, validated against these fixed option sets.
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CHF: 'Fr', SGD: 'S$',
};
const RISK_OPTIONS = ['Conservative', 'Moderate', 'Growth', 'Aggressive'];
const HORIZON_OPTIONS = ['Short (1-3 years)', 'Medium (3-7 years)', 'Long (7+ years)'];
const OBJECTIVE_OPTIONS = ['Growth', 'Income', 'Preservation', 'Inflation Protection', 'Diversification'];
const REGIME_OPTIONS = [
  'Risk-on', 'Risk-off', 'Recession fear', 'Disinflation', 'Inflation shock',
  'Central bank easing', 'Higher-for-longer rates', 'AI / tech boom', 'Energy shock',
];
const PREFERENCE_LABELS: Record<string, string> = {
  no_crypto: 'Avoid crypto',
  low_vol: 'Lower volatility',
  global: 'Global diversification',
  uk_tilt: 'UK tilt',
  us_tilt: 'US tilt',
  income: 'Income preference',
  gold: 'Gold hedge',
  esg: 'ESG tilt',
};

const PORTFOLIO_SCHEMA = {
  type: 'object',
  properties: {
    portfolio_name: { type: 'string' },
    saa: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          asset_class: { type: 'string' },
          weight: { type: 'number' },
          rationale: { type: 'string' },
          illustrative_instruments: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, reason: { type: 'string' } },
            },
          },
        },
      },
    },
    taa_tilts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { asset_class: { type: 'string' }, tilt: { type: 'string' }, reason: { type: 'string' } },
      },
    },
    overall_rationale: { type: 'string' },
    performance_context: { type: 'string' },
    scenario_sensitivity: {
      type: 'array',
      items: {
        type: 'object',
        properties: { scenario: { type: 'string' }, effect: { type: 'string' }, impact: { type: 'string' } },
      },
    },
    risk_considerations: { type: 'string' },
    strengths: { type: 'string' },
    weaknesses: { type: 'string' },
    if_conditions_change: { type: 'string' },
  },
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getCaller(base44);
    if (!user) return signInRequired();
    const body = await req.json().catch(() => ({}));

    const currency = typeof body?.currency === 'string' && CURRENCY_SYMBOLS[body.currency] ? body.currency : null;
    const risk = RISK_OPTIONS.includes(body?.risk) ? body.risk : null;
    const horizon = HORIZON_OPTIONS.includes(body?.horizon) ? body.horizon : null;
    const objective = OBJECTIVE_OPTIONS.includes(body?.objective) ? body.objective : null;
    const regime = REGIME_OPTIONS.includes(body?.regime) ? body.regime : null;
    const capitalNum = Number(String(body?.capital ?? '').replace(/[^0-9.]/g, ''));

    if (!currency || !risk || !horizon || !objective || !regime || !Number.isFinite(capitalNum) || capitalNum <= 0) {
      return Response.json({ error: 'Invalid portfolio parameters' }, { status: 400 });
    }

    const preferences = Array.isArray(body?.preferences) ? body.preferences : [];
    const prefLabels = preferences.map((id: string) => PREFERENCE_LABELS[id]).filter(Boolean);

    const symbol = CURRENCY_SYMBOLS[currency];
    const capitalFormatted = `${symbol}${capitalNum.toLocaleString('en-GB')}`;

    const prompt = `You are an institutional portfolio construction expert. Generate a detailed educational portfolio for:

Capital to Invest: ${capitalFormatted} ${currency}
Risk Tolerance: ${risk}
Time Horizon: ${horizon}
Objective: ${objective}
Market Regime: ${regime}
Preferences: ${prefLabels.join(', ') || 'None specified'}

CRITICAL CAPITAL CONSTRAINTS - You MUST apply these rules based on the capital amount (${capitalFormatted}):
- Under ${symbol}10,000: Focus on liquid ETFs and index funds only. No direct property, private equity, hedge funds, or alternatives. Keep it simple with 3-4 asset classes max.
- ${symbol}10,000-${symbol}50,000: ETFs, index funds, and liquid securities. Minimal alternatives. No direct real estate or private assets.
- ${symbol}50,000-${symbol}250,000: Can include diversified equities, bonds, some liquid alternatives (REITs, commodity ETFs). No direct property or private equity.
- ${symbol}250,000-${symbol}1,000,000: Can include a broader alternatives sleeve. Possibly some direct property exposure. Modest illiquid allocation.
- Above ${symbol}1,000,000: Full institutional toolkit available - private equity, hedge funds, direct real estate, infrastructure, private credit.

All instrument examples must be appropriate for this capital level. Express all monetary examples in ${currency} (${symbol}). All weights must sum to exactly 100%.

For the Strategic Asset Allocation (SAA), each asset class must include:
- asset_class name
- weight (percentage, all weights must sum to 100)
- rationale (clear explanation of why this weight)
- illustrative_instruments: array of 3-4 example instruments/ETFs/securities with name and reason
  Examples: { name: "NVIDIA", reason: "AI compute leadership, strong earnings growth" }
  Examples: { name: "iShares US Treasury ETF", reason: "Duration management, safe haven allocation" }
  Examples: { name: "Gold ETF (GLD)", reason: "Inflation hedge, portfolio diversifier" }

Also provide:
- Tactical tilts (TAA) with tilt direction and reason
- Overall portfolio rationale
- Performance context (how this type of portfolio has historically behaved)
- Scenario sensitivity: array of 3 scenarios [inflation rises / rates fall / growth slows] with scenario name, effect, and impact (positive/negative/neutral)
- Risk considerations
- Strengths and weaknesses in current regime
- If conditions change narrative

This is for EDUCATIONAL purposes. Frame all instruments as illustrative examples only.

${HOUSE_STYLE}`;

    const limited = await limitRequests(base44, user, 'portfolio', { minute: 3, day: 30 });
    if (limited) return limited;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: PORTFOLIO_SCHEMA,
    });

    return Response.json(result || {});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}