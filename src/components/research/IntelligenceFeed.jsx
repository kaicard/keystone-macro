import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BEATS = [
  { key: 'all',         label: 'All' },
  { key: 'macro',       label: 'Macro' },
  { key: 'equities',    label: 'Equities' },
  { key: 'us_economy',  label: 'US Economy' },
  { key: 'uk_economy',  label: 'UK Economy' },
  { key: 'eu_economy',  label: 'EU Economy' },
  { key: 'rates',       label: 'Rates' },
  { key: 'commodities', label: 'Commodities' },
  { key: 'fx',          label: 'FX' },
  { key: 'geopolitics', label: 'Geopolitics' },
  { key: 'credit',      label: 'Credit' },
  { key: 'tech',        label: 'Technology' },
];

const CATEGORY_STYLES = {
  Macro:        'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Equities:     'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Rates:        'bg-blue-400/10 text-blue-400 border-blue-400/20',
  Commodities:  'bg-orange-400/10 text-orange-400 border-orange-400/20',
  Geopolitics:  'bg-red-400/10 text-red-400 border-red-400/20',
  FX:           'bg-purple-400/10 text-purple-400 border-purple-400/20',
  Credit:       'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  Technology:   'bg-violet-400/10 text-violet-400 border-violet-400/20',
  'US Economy': 'bg-sky-400/10 text-sky-400 border-sky-400/20',
  'UK Economy': 'bg-rose-400/10 text-rose-400 border-rose-400/20',
  'EU Economy': 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
};

const SENTIMENT_DOT = {
  positive: 'bg-emerald-400',
  negative: 'bg-red-400',
  neutral:  'bg-amber-400/60',
};

const MAX_ITEMS = 60;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — long enough to be fast, short enough to stay fresh

function getLocalTzLabel() {
  try {
    const parts = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || 'Local';
  } catch { return 'Local'; }
}

function utcTimeToLocal(utcTimeStr) {
  if (!utcTimeStr) return null;
  try {
    const today = new Date().toISOString().split('T')[0];
    const dt = new Date(`${today}T${utcTimeStr}:00Z`);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return utcTimeStr; }
}

function generateSlug(headline) {
  return headline?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80).trim() || '';
}

function getCacheKey() {
  const d = new Date();
  // Key changes every 2 hours — keeps feed fresh without regenerating constantly
  const slot = Math.floor(d.getUTCHours() / 2);
  return `intelligenceFeed_${d.toISOString().split('T')[0]}_s${slot}`;
}

function mergeItems(existing, incoming) {
  const existingSlugs = new Set(existing.map(i => i.slug));
  const newOnly = incoming.filter(i => !existingSlugs.has(i.slug));
  const merged = [...newOnly, ...existing].slice(0, MAX_ITEMS);
  return merged.sort((a, b) =>
    (b.published_time_utc || b.published_time || '').localeCompare(
     (a.published_time_utc || a.published_time || '')
    )
  );
}

async function loadFromCache() {
  try {
    const key = getCacheKey();
    const results = await base44.entities.MarketCache.filter({ key });
    if (results?.length) {
      const record = results[0];
      const age = Date.now() - new Date(record.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return { data: JSON.parse(record.payload), recordId: record.id, fresh: true };
      }
      return { data: JSON.parse(record.payload), recordId: record.id, fresh: false };
    }
  } catch (_) {}
  return { data: null, recordId: null, fresh: false };
}

async function saveToCache(items, recordId) {
  const key = getCacheKey();
  const payload = JSON.stringify(items);
  const fetched_at = new Date().toISOString();
  try {
    if (recordId) {
      await base44.entities.MarketCache.update(recordId, { payload, fetched_at, key });
    } else {
      await base44.entities.MarketCache.create({ key, payload, fetched_at });
    }
  } catch (_) {}
}

// ─── SINGLE API CALL — generates headlines + full analysis together ───────────
async function generateFullFeed() {
  const now = new Date();
  const utcHour = String(now.getUTCHours()).padStart(2, '0');
  const utcMin  = String(now.getUTCMinutes()).padStart(2, '0');
  const currentUtcTime = `${utcHour}:${utcMin}`;
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const prompt = `You are a senior macro research analyst at Keystone Macro, a professional Bloomberg-quality intelligence platform.
Today is ${dateStr}. Current UTC time is ${currentUtcTime}.

Generate exactly 20 complete intelligence items covering global macro, markets, and geopolitics.
Write like a Goldman Sachs or JPMorgan trading desk briefing — sharp, specific, data-driven, institutional quality.

For EACH item provide ALL fields in one go:

headline: Sharp and specific — always include levels, percentages, or names.
  Example: "US 10-year yields breach 4.65% as Fed minutes signal rates on hold through Q3"
  Example: "Brent crude rallies to $89.40 as OPEC+ confirms supply cut extension into H2"

category: One of: Macro, Equities, Rates, Commodities, FX, Geopolitics, Credit, Technology, US Economy, UK Economy, EU Economy

sentiment: positive, negative, or neutral

published_time_utc: HH:MM in UTC. MUST be strictly before ${currentUtcTime}. Spread from 06:00 to ${currentUtcTime}.

beat: One of: macro, equities, us_economy, uk_economy, eu_economy, rates, commodities, fx, geopolitics, credit, tech

impact: 2-3 sentences. What happened, specific market moves with levels, what it signals for the next session.
  Example: "Headline CPI came in at 3.2% YoY, above the 2.9% consensus, the first upside surprise in four months. USD/JPY spiked 0.8% to 151.40; 2-year Treasury yields rose 11bp to 4.92%. The print materially reduces the probability of a June Fed cut, now priced at just 28%."

desk_view: 4-5 sentences of deep analytical context.
  Cover: structural background, why this development matters beyond the headline number, cross-asset positioning implications, what the next 48 hours look like, key risk or catalyst to monitor.

what_to_watch: Exactly 4-5 instruments with specific reason each.
  Format: "US 2-year Treasury (rate expectations repricing); EUR/USD (dollar strength testing 1.0820 support); Gold (inflation hedge demand); SPX (tech multiple compression on higher rates); TLT (duration risk)"

Cover: US, EU, UK, EM, Asia, commodities, FX, geopolitics. No two items on the same topic.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              headline:           { type: 'string' },
              category:           { type: 'string' },
              sentiment:          { type: 'string' },
              published_time_utc: { type: 'string' },
              beat:               { type: 'string' },
              impact:             { type: 'string' },
              desk_view:          { type: 'string' },
              what_to_watch:      { type: 'string' },
            }
          }
        }
      }
    }
  });

  return (result?.items || [])
    .filter(item => (item.published_time_utc || '00:00') <= currentUtcTime)
    .map(item => ({
      ...item,
      published_time:       item.published_time_utc,
      published_time_local: utcTimeToLocal(item.published_time_utc),
      slug:                 generateSlug(item.headline),
      generated_at:         new Date().toISOString(),
      enriched:             true, // Everything is fully enriched in one call
    }))
    .sort((a, b) =>
      (b.published_time_utc || '').localeCompare(a.published_time_utc || '')
    );
}

// ─── ITEM COMPONENT ───────────────────────────────────────────────────────────

function IntelligenceItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const navigate   = useNavigate();
  const catStyle   = CATEGORY_STYLES[item.category] || 'bg-muted/60 text-muted-foreground border-border/40';
  const sentDot    = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;
  const tzLabel    = getLocalTzLabel();
  const displayTime = item.published_time_local || item.published_time;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
      className="border-b border-border/20 last:border-0"
    >
      <button
        className="w-full text-left px-5 py-4 hover:bg-muted/10 transition-colors group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${sentDot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 border shrink-0 ${catStyle}`}>
                {item.category}
              </Badge>
              {displayTime && (
                <span className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {displayTime}
                  <span className="text-muted-foreground/30 text-[10px] ml-0.5">{tzLabel}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
              {item.headline}
            </p>
            {item.impact && !expanded && (
              <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{item.impact}</p>
            )}
          </div>
          <span className="text-muted-foreground/30 shrink-0 mt-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pl-10 mr-4 space-y-3">
              {/* Impact */}
              {item.impact && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide mb-1.5">
                    Impact
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.impact}</p>
                </div>
              )}

              {/* Desk View */}
              {item.desk_view && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1.5">
                    Desk View
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{item.desk_view}</p>
                </div>
              )}

              {/* Instruments */}
              {item.what_to_watch && (
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5">
                    Instruments to Watch
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.what_to_watch.split(';').map((w, i) => w.trim() && (
                      <span
                        key={i}
                        className="text-xs bg-accent/10 text-accent/90 border border-accent/20 px-2 py-0.5 rounded-full"
                      >
                        {w.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground/30 italic">
                  Keystone Macro Intelligence
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/Research/Intelligence/${item.slug}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors"
                >
                  Full analysis <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function IntelligenceFeed() {
  const [allItems, setAllItems]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newCount, setNewCount]     = useState(0);
  const [activeBeat, setActiveBeat] = useState('all');
  const [showAll, setShowAll]       = useState(false);
  const cacheIdRef  = useRef(null);
  const hasFetched  = useRef(false);
  const INITIAL_VISIBLE = 10;

  const loadFeed = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // Always check cache first
      const { data: cached, recordId, fresh } = await loadFromCache();
      cacheIdRef.current = recordId;

      if (cached?.length && !forceRefresh && fresh) {
        // Cache is fresh — show immediately, no API call
        const sorted = [...cached].sort((a, b) =>
          (b.published_time_utc || b.published_time || '').localeCompare(
           (a.published_time_utc || a.published_time || '')
          )
        );
        setAllItems(sorted);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      // Cache stale or force refresh — generate fresh feed
      // Show stale cache immediately while generating
      if (cached?.length) {
        const sorted = [...cached].sort((a, b) =>
          (b.published_time_utc || b.published_time || '').localeCompare(
           (a.published_time_utc || a.published_time || '')
          )
        );
        setAllItems(sorted);
        setLoading(false); // Remove spinner — show stale data while refreshing
      }

      // Generate new feed in background
      const newItems = await generateFullFeed();
      const currentItems = cached?.length ? cached : [];
      const merged = mergeItems(currentItems, newItems);

      const existingSlugs = new Set(currentItems.map(i => i.slug));
      const brandNew = newItems.filter(i => !existingSlugs.has(i.slug));
      if (brandNew.length > 0) {
        setNewCount(brandNew.length);
        setTimeout(() => setNewCount(0), 5000);
      }

      setAllItems(merged);
      setLastUpdated(new Date());
      setLoading(false);

      // Save to cache
      saveToCache(merged, cacheIdRef.current).then(result => {
        if (result) cacheIdRef.current = result;
      });

    } catch (err) {
      console.error('Intelligence feed error:', err?.message || err);
      setError(err?.message || 'Failed to load feed');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadFeed();
    }
    // Refresh every 2 hours — matches cache slot
    const interval = setInterval(() => loadFeed(true), 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const filtered = activeBeat === 'all'
    ? allItems
    : allItems.filter(item => item.beat === activeBeat);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const tzLabel = getLocalTzLabel();

  return (
    <div className="glass rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Research Intelligence</span>
          {newCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
              +{newCount} new
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {tzLabel}
            </span>
          )}
          {loading && allItems.length > 0 && (
            <span className="text-xs text-primary/50 flex items-center gap-1 hidden sm:flex">
              <RefreshCw className="w-3 h-3 animate-spin" /> Refreshing...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {allItems.length > 0 && (
            <span className="text-xs text-muted-foreground/40 hidden sm:inline">
              {allItems.length} items
            </span>
          )}
          <button
            onClick={() => { setShowAll(false); loadFeed(true); }}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading && allItems.length === 0 ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Beat tabs */}
      <div className="flex overflow-x-auto gap-1 p-3 border-b border-border/30 scrollbar-hide">
        {BEATS.map(beat => (
          <button
            key={beat.key}
            onClick={() => { setActiveBeat(beat.key); setShowAll(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeBeat === beat.key
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {beat.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div>
        {error && allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-destructive">Failed to load feed</p>
            <p className="text-xs text-muted-foreground/60">{error}</p>
            <button onClick={() => loadFeed(true)} className="text-xs text-primary hover:underline mt-1">
              Try again
            </button>
          </div>
        ) : loading && allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Generating intelligence feed...</p>
            <p className="text-xs text-muted-foreground/40">One moment — compiling global macro developments</p>
          </div>
        ) : (
          <AnimatePresence mode="sync">
            <motion.div
              key={activeBeat}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {visible.map((item, i) => (
                <IntelligenceItem key={`${item.slug}-${i}`} item={item} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Show more */}
      {filtered.length > INITIAL_VISIBLE && (
        <div className="border-t border-border/30 px-6 py-3">
          <button
            onClick={() => setShowAll(s => !s)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? 'Show less' : `Show ${filtered.length - INITIAL_VISIBLE} more items`}
          </button>
        </div>
      )}
    </div>
  );
}