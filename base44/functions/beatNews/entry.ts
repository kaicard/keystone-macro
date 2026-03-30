import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BEAT_PROMPTS = {
  markets:         'Global financial markets: equity indices, ETFs, volatility, cross-asset moves, fund flows, options activity.',
  global_equities: 'Global equity markets: stock market moves across US, Europe, Asia, and emerging markets. Individual stock news, earnings, analyst upgrades/downgrades, sector rotation, IPOs, M&A, share buybacks, and equity fund flows across major regions.',
  us_economy:   'United States economy: Fed policy, US CPI, NFP, GDP, retail sales, consumer confidence, fiscal policy, tariffs, White House economic decisions.',
  uk_economy:   'United Kingdom economy: Bank of England, UK CPI, UK GDP, UK labour market, housing market, gilts, budget and fiscal policy, Sterling.',
  eu_economy:   'Eurozone and European economy: ECB decisions, Eurozone CPI, Germany GDP, French politics, EU fiscal rules, Euro currency.',
  commodities:  'Commodities markets: oil (WTI, Brent), natural gas, gold, silver, copper, agricultural commodities, OPEC, supply disruptions.',
  tech:         'Technology sector: AI developments, semiconductor industry, big tech earnings, regulation, M&A, venture capital, product launches.',
  geopolitics:  'Geopolitics and global macro: US-China tensions, Middle East, Ukraine-Russia, NATO, trade wars, sanctions, elections.',
  rates_credit: 'Fixed income, interest rates and credit markets: government bonds, corporate credit spreads, high yield, IG debt, central bank bond buying.',
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
    const fetchNow = new Date();
    const londonDate = fetchNow.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
    const londonTime = fetchNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const cutoff = new Date(fetchNow - 24*60*60*1000).toISOString();

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a financial news editor. Current date/time: ${londonDate}, ${londonTime} London time.

Search the internet RIGHT NOW for the 8 most important recent news stories in this beat: ${BEAT_PROMPTS[beat]}

STRICT RULES:
- Only include articles you can confirm exist in your search results — do NOT fabricate or hallucinate stories
- Only include stories published after ${cutoff}
- published_time must be the ACTUAL timestamp from the article, in HH:MM London time — write "—" if you cannot determine it
- url must be the EXACT URL from your search results — write "" if you cannot confirm the real URL
- Be specific — include actual figures, names, and percentages from the real articles

Each article must have:
- headline: the actual headline verbatim or close paraphrase (not generic)
- source: publication name (FT, Bloomberg, Reuters, WSJ, Guardian, BBC, CNBC, AP, etc.)
- summary: 2-3 sentence summary covering what happened, why it matters, and the market/economic implication
- sentiment: "positive", "negative", or "neutral" (from an investor's perspective)
- published_time: ACTUAL publication time from article metadata in HH:MM London time; "—" if unknown
- url: exact direct URL from your search results
- url_hint: the domain (e.g. "ft.com", "bloomberg.com")`,
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
                url: { type: 'string' },
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