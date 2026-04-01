import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'liveNews';
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes — stale-while-revalidate handles freshness
const STALE_THRESHOLD_MS = 25 * 60 * 1000; // start background refresh after 25 min

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
          url: { type: "string" },
          url_hint: { type: "string" }
        }
      }
    }
  }
};

async function refreshInBackground(base44, existingId) {
  const now = new Date();
  const today = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
  const currentTimeUTC = now.toISOString();
  const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  const prompt = `You are a macro market intelligence editor. The current date and time is ${today}, ${londonTime} London time (${currentTimeUTC} UTC).

Search the web RIGHT NOW for the 8 most important real macro, geopolitical, and financial market news stories published TODAY (${today}).

STRICT RULES:
- Only include articles confirmed to exist in your search results — do NOT fabricate or hallucinate stories
- Only include stories published in the last 24 hours (after ${new Date(now - 24*60*60*1000).toISOString()})
- For published_time: use the ACTUAL publication timestamp from the article metadata — if unknown, write "—"
- For url: use the EXACT URL from your search results — if you cannot confirm the real URL, omit the field or write ""
- Sources must be one of: Bloomberg, Reuters, FT, WSJ, CNBC, BBC News, Guardian, Sky News, or AP

For each story provide:
- headline: the actual headline verbatim or close paraphrase (max 15 words)
- source: publication name (e.g. "Reuters", "Bloomberg", "FT")
- category: one of: Macro, Equities, Rates, Commodities, Geopolitics, FX, Credit
- sentiment: one of: positive, negative, neutral
- impact: 1-sentence market impact summary
- desk_view: 2-3 sentence analysis of what happened, why it matters, and market implications
- what_to_watch: the key follow-on variable or event to monitor
- published_time: ACTUAL article publication time in HH:MM London time — derived from the article timestamp in your search results; write "—" if unknown
- url: the exact direct URL to the article from your search results
- url_hint: domain (e.g. "bloomberg.com", "ft.com")

Cover a range of: central bank policy, geopolitical developments, major equity movers, commodity moves, FX, and global macro data.

IMPORTANT: Return the stories ordered by published_time, newest first (most recently published story at index 0).`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: HEADLINE_SCHEMA,
  });

  const headlines = res?.headlines || [];
  if (!headlines.length) return;

  const payload = JSON.stringify(headlines);
  const fetched_at = new Date().toISOString();
  if (existingId) {
    await base44.asServiceRole.entities.MarketCache.update(existingId, { payload, fetched_at });
  } else {
    await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check cache first
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (entry.payload) {
        const headlines = JSON.parse(entry.payload);
        // Return stale data immediately — refresh in background if past threshold
        if (age >= STALE_THRESHOLD_MS && age < CACHE_TTL_MS) {
          // Background refresh (don't await)
          refreshInBackground(base44, entry.id).catch(() => {});
        }
        if (age < CACHE_TTL_MS) {
          return Response.json({ ok: true, headlines, cached: true, fetched_at: entry.fetched_at });
        }
      }
    }

    // Cache miss or fully expired — fetch fresh (blocking)
    await refreshInBackground(base44, cached?.[0]?.id || null);
    const fresh = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    const freshEntry = fresh?.[0];
    const headlines = freshEntry?.payload ? JSON.parse(freshEntry.payload) : [];
    return Response.json({ ok: true, headlines, cached: false, fetched_at: freshEntry?.fetched_at || new Date().toISOString() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, headlines: [] }, { status: 200 });
  }
});