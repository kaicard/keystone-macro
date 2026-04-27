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
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

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
      const fresh = age < CACHE_TTL_MS;
      return { data: JSON.parse(record.payload), recordId: record.id, fresh };
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

// ─── STEP 1: Generate 20 headlines only (fits in 1000 tokens easily) ──────────
async function generateHeadlines() {
  const now = new Date();
  const utcHour = String(now.getUTCHours()).padStart(2, '0');
  const utcMin  = String(now.getUTCMinutes()).padStart(2, '0');
  const currentUtcTime = `${utcHour}:${utcMin}`;
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior macro analyst at Keystone Macro. Today is ${dateStr}, UTC time ${currentUtcTime}.

Generate exactly 20 sharp, specific market intelligence headlines. Each headline must include a specific level, percentage, or name. Cover US, EU, UK, EM, Asia, commodities, FX, geopolitics — no two items on the same topic.

For each item:
- headline: specific with data points (e.g. "Brent crude rallies to $89 as OPEC+ confirms cut extension")
- category: Macro / Equities / Rates / Commodities / FX / Geopolitics / Credit / Technology / US Economy / UK Economy / EU Economy
- sentiment: positive / negative / neutral
- published_time_utc: HH:MM, strictly before ${currentUtcTime}, spread from 06:00
- beat: macro / equities / us_economy / uk_economy / eu_economy / rates / commodities / fx / geopolitics / credit / tech`,
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
      enriched:             false,
    }))
    .sort((a, b) =>
      (b.published_time_utc || '').localeCompare(a.published_time_utc || '')
    );
}

// ─── STEP 2: Enrich in batches of 5 — each call fits in 1000 tokens ──────────
async function enrichBatch(items) {
  const headlineList = items
    .map((item, i) => `${i + 1}. [${item.category}] ${item.headline}`)
    .join('\n');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior macro analyst at Keystone Macro. Enrich these ${items.length} intelligence headlines with analysis.

${headlineList}

For each item (numbered 1-${items.length}) provide:
- impact: 2 sentences. What happened, specific market moves, what it signals.
- desk_view: 3 sentences. Structural context, cross-asset implications, what to watch next 48 hours.
- what_to_watch: 3-4 instruments with reason. Format: "INSTRUMENT (reason); INSTRUMENT (reason)"`,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              impact:        { type: 'string' },
              desk_view:     { type: 'string' },
              what_to_watch: { type: 'string' },
            }
          }
        }
      }
    }
  });

  const enriched = result?.items || [];
  return items.map((item, i) => ({
    ...item,
    ...(enriched[i] || {}),
    enriched: true,
  }));
}

// ─── ITEM COMPONENT ───────────────────────────────────────────────────────────
function IntelligenceItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const navigate    = useNavigate();
  const catStyle    = CATEGORY_STYLES[item.category] || 'bg-muted/60 text-muted-foreground border-border/40';
  const sentDot     = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;
  const tzLabel     = getLocalTzLabel();
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
              {item.enriched ? (
                <>
                  {item.impact && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide mb-1.5">Impact</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.impact}</p>
                    </div>
                  )}
                  {item.desk_view && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1.5">Desk View</p>
                      <p className="text-sm text-foreground/90 leading-relaxed">{item.desk_view}</p>
                    </div>
                  )}
                  {item.what_to_watch && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5">Instruments to Watch</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.what_to_watch.split(';').map((w, i) => w.trim() && (
                          <span key={i} className="text-xs bg-accent/10 text-accent/90 border border-accent/20 px-2 py-0.5 rounded-full">
                            {w.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <RefreshCw className="w-3.5 h-3.5 text-primary/40 animate-spin" />
                  <p className="text-xs text-muted-foreground/50">Loading analysis...</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground/30 italic">Keystone Macro Intelligence</span>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/Research/Intelligence/${item.slug}`); }}
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
  const [allItems, setAllItems]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [enriching, setEnriching]     = useState(false);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newCount, setNewCount]       = useState(0);
  const [activeBeat, setActiveBeat]   = useState('all');
  const [showAll, setShowAll]         = useState(false);
  const cacheIdRef = useRef(null);
  const hasFetched = useRef(false);
  const INITIAL_VISIBLE = 10;
  const BATCH_SIZE = 5; // 5 items per enrichment call — fits in 1000 tokens

  const enrichInBackground = useCallback(async (headlines, currentItems) => {
    setEnriching(true);
    let working = [...currentItems];

    for (let i = 0; i < headlines.length; i += BATCH_SIZE) {
      const batch = headlines.slice(i, i + BATCH_SIZE);
      try {
        const enrichedBatch = await enrichBatch(batch);
        // Replace unenriched versions with enriched ones
        enrichedBatch.forEach(enrichedItem => {
          const idx = working.findIndex(w => w.slug === enrichedItem.slug);
          if (idx !== -1) working[idx] = enrichedItem;
          else working.unshift(enrichedItem);
        });
        const merged = mergeItems(
          working.filter(w => !enrichedBatch.find(e => e.slug === w.slug)),
          enrichedBatch
        );
        working = merged;
        setAllItems([...working]);
        saveToCache(working, cacheIdRef.current);
      } catch (_) {
        // Batch failed — mark as enriched with empty fields so spinner stops
        batch.forEach(item => {
          const idx = working.findIndex(w => w.slug === item.slug);
          if (idx !== -1) working[idx] = { ...working[idx], enriched: true };
        });
        setAllItems([...working]);
      }
    }
    setEnriching(false);
  }, []);

  const loadFeed = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data: cached, recordId, fresh } = await loadFromCache();
      cacheIdRef.current = recordId;

      // Fresh cache — show instantly, no API call
      if (cached?.length && !forceRefresh && fresh) {
        const sorted = [...cached].sort((a, b) =>
          (b.published_time_utc || b.published_time || '').localeCompare(
           (a.published_time_utc || a.published_time || '')
          )
        );
        setAllItems(sorted);
        setLastUpdated(new Date());
        setLoading(false);
        // Enrich any unenriched items that loaded from cache
        const unenriched = sorted.filter(i => !i.enriched);
        if (unenriched.length > 0) enrichInBackground(unenriched, sorted);
        return;
      }

      // Show stale cache immediately while we refresh in background
      if (cached?.length && !forceRefresh) {
        const sorted = [...cached].sort((a, b) =>
          (b.published_time_utc || b.published_time || '').localeCompare(
           (a.published_time_utc || a.published_time || '')
          )
        );
        setAllItems(sorted);
        setLoading(false);
      }

      // Generate fresh headlines
      const newHeadlines = await generateHeadlines();
      const currentItems = cached?.length ? cached : [];
      const merged = mergeItems(currentItems, newHeadlines);

      const existingSlugs = new Set(currentItems.map(i => i.slug));
      const brandNew = newHeadlines.filter(i => !existingSlugs.has(i.slug));
      if (brandNew.length > 0) {
        setNewCount(brandNew.length);
        setTimeout(() => setNewCount(0), 5000);
      }

      setAllItems(merged);
      setLastUpdated(new Date());
      setLoading(false);

      // Save headlines to cache immediately
      const { recordId: newRecordId } = await loadFromCache();
      cacheIdRef.current = newRecordId || recordId;
      await saveToCache(merged, cacheIdRef.current);

      // Enrich new items in background — batches of 5
      if (brandNew.length > 0) {
        enrichInBackground(brandNew, merged);
      }

    } catch (err) {
      console.error('Intelligence feed error:', err?.message || err);
      setError(err?.message || 'Failed to load feed');
      setLoading(false);
    }
  }, [enrichInBackground]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadFeed();
    }
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
          {enriching && (
            <span className="text-xs text-primary/50 flex items-center gap-1 hidden sm:flex">
              <RefreshCw className="w-3 h-3 animate-spin" /> Enriching...
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

      <div>
        {error && allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-destructive">Failed to load feed</p>
            <p className="text-xs text-muted-foreground/60">{error}</p>
            <button onClick={() => loadFeed(true)} className="text-xs text-primary hover:underline mt-1">Try again</button>
          </div>
        ) : loading && allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Generating intelligence feed...</p>
            <p className="text-xs text-muted-foreground/40">Compiling global macro developments</p>
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