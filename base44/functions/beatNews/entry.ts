import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BEAT_PROMPTS = {
  markets:      'Global financial markets: equity indices, ETFs, volatility, cross-asset moves, fund flows, options activity.',
  us_economy:   'United States economy: Fed policy, US CPI, NFP, GDP, retail sales, consumer confidence, fiscal policy, tariffs, White House economic decisions.',
  uk_economy:   'United Kingdom economy: Bank of England, UK CPI, UK GDP, UK labour market, housing market, gilts, budget and fiscal policy, Sterling.',
  eu_economy:   'Eurozone and European economy: ECB decisions, Eurozone CPI, Germany GDP, French politics, EU fiscal rules, Euro currency.',
  commodities:  'Commodities markets: oil (WTI, Brent), natural gas, gold, silver, copper, agricultural commodities, OPEC, supply disruptions.',
  tech:         'Technology sector: AI developments, semiconductor industry, big tech earnings, regulation, M&A, venture capital, product launches.',
  geopolitics:  'Geopolitics and global macro: US-China tensions, Middle East, Ukraine-Russia, NATO, trade wars, sanctions, elections.',
  rates_credit: 'Fixed income, interest rates and credit markets: government bonds, corporate credit spreads, high yield, IG debt, central bank bond buying.',
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const beat = body?.beat;

    if (!beat || !BEAT_PROMPTS[beat]) {
      return Response.json({ error: 'Invalid beat' }, { status: 400 });
    }

    const cacheKey = `beatNews_${beat}`;

    // Check cache
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: cacheKey });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return Response.json({ articles: JSON.parse(entry.payload), fetched_at: entry.fetched_at, from_cache: true });
      }
    }

    // Fetch fresh
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a financial news editor. Search the internet RIGHT NOW for the 8 most important and recent news stories in this beat: ${BEAT_PROMPTS[beat]}

Return ONLY a JSON array of exactly 8 articles. Each article must have:
- headline: punchy, specific news headline (not generic)
- source: publication name (FT, Bloomberg, Reuters, WSJ, Guardian, BBC, etc.)
- summary: 2-3 sentence summary covering what happened, why it matters, and the market/economic implication
- sentiment: "positive", "negative", or "neutral" (from an investor's perspective)
- published_time: approximate time this was published today in HH:MM format (24h London time) — estimate from article context
- url_hint: the most likely URL domain where this story would appear (e.g. "ft.com", "bloomberg.com")

Focus on stories from the last 24 hours. Be specific — include actual figures, names, and percentages where available. Do not make up stories; only include stories that are actually happening.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                source: { type: 'string' },
                summary: { type: 'string' },
                sentiment: { type: 'string' },
                published_time: { type: 'string' },
                url_hint: { type: 'string' },
              }
            }
          }
        }
      }
    });

    const articles = result?.articles || [];
    const now = new Date().toISOString();

    // Update cache
    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, {
        payload: JSON.stringify(articles),
        fetched_at: now,
      });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({
        key: cacheKey,
        payload: JSON.stringify(articles),
        fetched_at: now,
      });
    }

    return Response.json({ articles, fetched_at: now, from_cache: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});