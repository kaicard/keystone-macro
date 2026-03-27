import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'liveNews';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const HEADLINE_SCHEMA = {
  type: "object",
  properties: {
    headlines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headline: { type: "string" },
          source: { type: "string" },
          category: { type: "string" },
          sentiment: { type: "string" },
          impact: { type: "string" },
          desk_view: { type: "string" },
          what_to_watch: { type: "string" },
          published_time: { type: "string" },
          url_hint: { type: "string" }
        }
      }
    }
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check cache first
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (age < CACHE_TTL_MS && entry.payload) {
        const headlines = JSON.parse(entry.payload);
        return Response.json({ ok: true, headlines, cached: true, fetched_at: entry.fetched_at });
      }
    }

    // Cache miss or stale — fetch fresh
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `You are a macro market intelligence editor. Search the web for the 8 most important real macro, geopolitical, and financial market news stories from today (${today}).

Pull REAL headlines from verified sources: Bloomberg, Reuters, Financial Times, Wall Street Journal, CNBC, BBC News, or similar. Only include stories published today or within the last 24 hours.

For each story provide these fields:
- headline: the actual headline or close paraphrase (max 15 words)
- source: publication name (e.g. "Reuters", "Bloomberg", "FT")
- category: one of: Macro, Equities, Rates, Commodities, Geopolitics, FX, Credit
- sentiment: one of: positive, negative, neutral
- impact: 1-sentence market impact summary
- desk_view: 2-3 sentence analysis of what happened, why it matters, and market implications
- what_to_watch: the key follow-on variable or event to monitor
- published_time: time published today in HH:MM format (24h London time)
- url_hint: domain where this story appears (e.g. "bloomberg.com", "ft.com")

Cover a range of: central bank policy, geopolitical developments, major equity movers, commodity moves, FX, and global macro data. Only use real verified events.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: HEADLINE_SCHEMA,
    });

    const headlines = res?.headlines || [];
    const fetched_at = new Date().toISOString();

    // Save to cache
    const payload = JSON.stringify(headlines);
    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, headlines, cached: false, fetched_at });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, headlines: [] }, { status: 200 });
  }
});