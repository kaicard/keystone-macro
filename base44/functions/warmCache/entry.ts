import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Scheduled function that pre-warms all market caches so users get instant loads
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Warm caches sequentially in small batches to avoid rate limits
    const BEATS = ['markets', 'global_equities', 'us_economy', 'uk_economy', 'eu_economy', 'commodities', 'tech', 'geopolitics', 'rates_credit'];

    const [quotesRes, contextRes, newsRes] = await Promise.all([
      base44.asServiceRole.functions.invoke('liveQuotes', {}),
      base44.asServiceRole.functions.invoke('liveMarketContext', {}),
      base44.asServiceRole.functions.invoke('liveNews', {}),
    ]);

    // Warm beats one at a time to stay within rate limits
    const beatResults = [];
    for (const beat of BEATS) {
      const res = await base44.asServiceRole.functions.invoke('beatNews', { beat });
      beatResults.push(res);
      await new Promise(r => setTimeout(r, 1500));
    }

    return Response.json({
      ok: true,
      quotes: quotesRes?.ok,
      context: contextRes?.ok,
      news: newsRes?.ok,
      beats_warmed: beatResults.length,
      ts: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});