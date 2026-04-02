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

async function invokeLLMWithRetry(base44, prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: HEADLINE_SCHEMA,
      });
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      // Short backoff before retry
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

async function refreshInBackground(base44, existingId) {
  const now = new Date();
  const today = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' });
  const currentTimeUTC = now.toISOString();
  const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  const prompt = `You are the editor of Keystone Macro, an independent macro intelligence platform. The current date and time is ${today}, ${londonTime} London time (${currentTimeUTC} UTC).

Search the web RIGHT NOW for the 8 most important macro, geopolitical, and financial market developments published TODAY (${today}).

Your job is to rewrite each story in Keystone Macro's own editorial voice — clear, direct, and analytical. Do NOT reproduce verbatim headlines from any publication. Write original headlines and analysis that Keystone Macro owns editorially, inspired by the facts in the news but written fresh. This is critical.

STRICT RULES:
- Only include stories confirmed to exist in your search results — do NOT fabricate or hallucinate
- Only include stories from the last 24 hours (after ${new Date(now - 24*60*60*1000).toISOString()})
- Write ALL fields in Keystone Macro's voice — do not copy-paste from source material
- Do NOT include any URLs, links, or source domains
- For published_time: use the approximate time of the development in HH:MM London time — write "—" if unknown
- Source field: write the general type, e.g. "Central Banks", "Labour Data", "Geopolitics", "Corporate" — NOT publication names

For each story provide:
- headline: original Keystone Macro headline (max 15 words) — must be written fresh, not copied from any publication
- source: topic area (e.g. "Central Banks", "Geopolitics", "Labour Data", "Commodities", "Corporate")
- category: one of: Macro, Equities, Rates, Commodities, Geopolitics, FX, Credit
- sentiment: one of: positive, negative, neutral
- impact: 1-sentence market impact written in Keystone Macro's analytical voice
- desk_view: 2-3 sentences of original analysis — what happened, why it matters, what it means for markets
- what_to_watch: the key follow-on variable or event to monitor
- published_time: approximate time of the development in HH:MM London time, or "—"

Cover a range of: central bank policy, geopolitical developments, major equity movers, commodity moves, FX, and global macro data.

IMPORTANT: Return the stories ordered by published_time, newest first.`;

  const res = await invokeLLMWithRetry(base44, prompt);

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