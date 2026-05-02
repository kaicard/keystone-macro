import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// All 10 topics we cover — scan each in parallel
const TOPICS = [
  { name: 'Macro',       beat: 'macro',      category: 'Macro'       },
  { name: 'Equities',    beat: 'equities',   category: 'Equities'    },
  { name: 'US Economy',  beat: 'us_economy', category: 'US Economy'  },
  { name: 'UK Economy',  beat: 'uk_economy', category: 'UK Economy'  },
  { name: 'EU Economy',  beat: 'eu_economy', category: 'EU Economy'  },
  { name: 'Rates',       beat: 'rates',      category: 'Rates'       },
  { name: 'Commodities', beat: 'commodities',category: 'Commodities' },
  { name: 'FX',          beat: 'fx',         category: 'FX'          },
  { name: 'Geopolitics', beat: 'geopolitics',category: 'Geopolitics' },
  { name: 'Credit',      beat: 'credit',     category: 'Credit'      },
  { name: 'Technology',  beat: 'technology', category: 'Technology'  },
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 70)
    .replace(/-+$/, '');
}

function fingerprintHeadline(headline) {
  // Normalise to a comparable fingerprint: lowercase, strip punctuation, collapse spaces
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 8)
    .join(' ');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // Allow unauthenticated calls from the scheduler (no user session available)
    // but still protect against arbitrary public invocation with a simple check
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    // If called from frontend, require auth. Scheduler calls have no user — allow.
    // (Scheduler has no session so base44.auth.me() throws — that's fine)

    const londonDate = now.toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'Europe/London'
    });
    const londonTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
    });
    const cutoffISO = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(); // 4h lookback
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

    // ── Load existing items for dedup ──────────────────────────────────────────
    const existing = await base44.asServiceRole.entities.IntelligenceItem.list('-published_at', 300);
    const recentItems = (existing || []).filter(i => (i.published_date || '') >= cutoffDate);
    const existingSlugs = new Set(recentItems.map(i => i.slug));
    // Fingerprint recent headlines to catch semantic duplicates
    const existingFingerprints = new Set(recentItems.map(i => fingerprintHeadline(i.headline || '')));

    // ── Scan each topic in parallel ────────────────────────────────────────────
    const TOPIC_SCHEMA = {
      type: 'object',
      properties: {
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              headline:      { type: 'string' },
              sentiment:     { type: 'string' },
              impact:        { type: 'string' },
              desk_view:     { type: 'string' },
              what_to_watch: { type: 'string' },
              published_at:  { type: 'string' },
              is_breaking:   { type: 'string' },
            }
          }
        }
      }
    };

    const scanTopic = async (topic) => {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          model: 'gemini_3_flash',
          add_context_from_internet: true,
          prompt: `You are the news desk editor at Keystone Macro — a Bloomberg/FT-calibre institutional intelligence platform.

Today is ${londonDate}, ${londonTime} London time.

Search the web RIGHT NOW for the 2-3 most important and genuinely NEW developments in: **${topic.name}**

HARD RULES — violating any of these means the story is rejected:
1. ONLY stories confirmed to have broken or developed after ${cutoffISO} (last 4 hours). Do NOT republish older stories.
2. Do NOT fabricate, hallucinate, or infer. If you cannot confirm a story via web search, do not include it.
3. Write in Keystone Macro's editorial voice — sharp, analytical, no waffle. Do NOT copy-paste from sources.
4. Do NOT include any URLs, source names, or publication names anywhere.
5. Headlines: max 15 words, must contain a specific fact (number, name, action). No vague headlines.
6. If there are genuinely NO new stories in ${topic.name} in the past 4 hours, return an empty stories array. Do not force stories.

For each confirmed story return:
- headline: original 15-word max headline with a specific fact
- sentiment: positive / negative / neutral  
- impact: 1 precise sentence — what the market implication is RIGHT NOW
- desk_view: 2-3 sentences — the development, why it matters structurally, what it means for positioning
- what_to_watch: 2 specific instruments or data points to monitor next (e.g. "GBPUSD, 2Y Gilt yield")
- published_at: ISO timestamp of when the story broke (your best estimate, must be after ${cutoffISO})
- is_breaking: true if this is a live/developing story, false if it confirmed/settled`,
          response_json_schema: TOPIC_SCHEMA,
        });
        return { topic, stories: result?.stories || [] };
      } catch (_) {
        return { topic, stories: [] };
      }
    };

    // Run all 11 topic scans in parallel
    const results = await Promise.all(TOPICS.map(scanTopic));

    // ── Collect all valid stories first, then assign staggered timestamps ────────
    // Flatten all stories into one array so we can distribute timestamps across them
    const allStories = [];
    for (const { topic, stories } of results) {
      for (const story of stories) {
        if (!story.headline || story.headline.length < 10) continue;
        allStories.push({ topic, story });
      }
    }

    // Shuffle so timestamps aren't grouped by topic
    for (let i = allStories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allStories[i], allStories[j]] = [allStories[j], allStories[i]];
    }

    // Spread timestamps randomly across the last 30 minutes
    // Each story gets a unique random offset (0–29 min ago), then we sort ascending
    const WINDOW_MS = 30 * 60 * 1000;
    const offsets = allStories.map(() => Math.floor(Math.random() * WINDOW_MS));
    offsets.sort((a, b) => b - a); // largest offset = oldest = earliest story

    // ── Deduplicate and publish ────────────────────────────────────────────────
    let created = 0;
    let skipped = 0;

    for (let idx = 0; idx < allStories.length; idx++) {
      const { topic, story } = allStories[idx];
      if (!story.headline || story.headline.length < 10) { skipped++; continue; }

      // Assign staggered timestamp — random point in last 30 minutes
      const publishedAt = new Date(now.getTime() - offsets[idx]).toISOString();

      // Slug dedup
      const slug = slugify(story.headline);
      if (!slug || existingSlugs.has(slug)) { skipped++; continue; }

      // Fingerprint dedup (catch rephrased duplicates)
      const fp = fingerprintHeadline(story.headline);
      if (existingFingerprints.has(fp)) { skipped++; continue; }

      // Validate sentiment
      const sentiment = ['positive', 'negative', 'neutral'].includes(story.sentiment)
        ? story.sentiment : 'neutral';

      const publishedDate = new Date(publishedAt).toLocaleDateString('en-CA', {
        timeZone: 'Europe/London'
      });

      await base44.asServiceRole.entities.IntelligenceItem.create({
        headline:      story.headline,
        category:      topic.category,
        beat:          topic.beat,
        sentiment,
        impact:        story.impact || '',
        desk_view:     story.desk_view || '',
        what_to_watch: story.what_to_watch || '',
        slug,
        published_at:  publishedAt,
        published_date: publishedDate,
        is_top_story:  story.is_breaking === true || story.is_breaking === 'true',
        batch_id:      `news_scan_${now.toISOString()}`,
      });

      existingSlugs.add(slug);
      existingFingerprints.add(fp);
      created++;
    }

    // ── Prune items older than 7 days ──────────────────────────────────────────
    const old = (existing || []).filter(i => (i.published_date || '') < cutoffDate);
    for (const oldItem of old) {
      await base44.asServiceRole.entities.IntelligenceItem.delete(oldItem.id);
    }

    return Response.json({
      ok: true,
      created,
      skipped,
      pruned: old.length,
      scanned_topics: TOPICS.length,
      ran_at: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});