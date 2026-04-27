import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Zap, Clock } from 'lucide-react';
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

function generateSlug(headline) {
  return headline?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80).trim() || '';
}

async function loadFromCache() {
  try {
    const results = await base44.entities.MarketCache.filter({ key: 'intelligenceFeed' });
    if (results?.length) {
      const record = results[0];
      const age = Date.now() - new Date(record.fetched_at).getTime();
      if (age < 30 * 60 * 1000) return { data: JSON.parse(record.payload), recordId: record.id };
      return { data: null, recordId: record.id };
    }
  } catch (_) {}
  return { data: null, recordId: null };
}

async function saveToCache(items, recordId) {
  const payload = JSON.stringify(items);
  const fetched_at = new Date().toISOString();
  try {
    if (recordId) {
      await base44.entities.MarketCache.update(recordId, { payload, fetched_at });
    } else {
      await base44.entities.MarketCache.create({ key: 'intelligenceFeed', payload, fetched_at });
    }
  } catch (_) {}
}

async function generateIntelligenceFeed() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const prompt = `You are a senior macro research analyst at Keystone Macro, a professional macro intelligence platform.
Today is ${dateStr}, current time ${timeStr} BST.

Generate 18 current, market-moving intelligence items covering major beats in global macro, markets, and geopolitics as of today.
These should read like a professional trading desk briefing — sharp, specific, analytical.

CRITICAL RULES:
- Write entirely in your own words. Do NOT reproduce any source text verbatim.
- Use real, plausible market context. Be specific with levels, percentages, and names.
- published_time must be a REAL time between 06:00 and ${timeStr} in HH:MM format — vary them realistically. No placeholders.
- desk_view must be 2-3 sentences of analytical depth — what it means for markets, what to watch, what it signals.
- what_to_watch must name specific instruments (e.g. "EUR/USD, Bund 10y, DAX").
- Categories: Macro, Equities, Rates, Commodities, FX, Geopolitics, Credit, Technology, US Economy, UK Economy, EU Economy.
- Sentiment: positive, negative, or neutral.

Return ONLY valid JSON, no markdown, no preamble:
{
  "items": [
    {
      "headline": "string",
      "category": "string",
      "sentiment": "positive|negative|neutral",
      "published_time": "HH:MM",
      "impact": "string — one-line market impact",
      "desk_view": "string — 2-3 sentence analytical view",
      "what_to_watch": "string — specific instruments",
      "beat": "macro|equities|us_economy|uk_economy|eu_economy|rates|commodities|fx|geopolitics|credit|tech"
    }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed.items.map(item => ({
    ...item,
    slug: generateSlug(item.headline),
    generated_at: new Date().toISOString()
  }));
}

function IntelligenceItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const catStyle = CATEGORY_STYLES[item.category] || 'bg-muted/60 text-muted-foreground border-border/40';
  const sentDot = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="border-b border-border/20 last:border-0"
    >
      <button className="w-full text-left px-5 py-4 hover:bg-muted/10 transition-colors group" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3">
          <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${sentDot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 border shrink-0 ${catStyle}`}>{item.category}</Badge>
              {item.published_time && (
                <span className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />{item.published_time}
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">{item.headline}</p>
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
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1.5">Desk View</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{item.desk_view}</p>
              </div>
              {item.what_to_watch && (
                <div className="flex gap-2 items-start">
                  <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide shrink-0 pt-0.5">Watch</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.what_to_watch}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
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

export default function IntelligenceFeed() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeBeat, setActiveBeat] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const cacheIdRef = useRef(null);
  const hasFetched = useRef(false);
  const INITIAL_VISIBLE = 8;

  const loadFeed = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (!forceRefresh) {
        const { data: cached, recordId } = await loadFromCache();
        if (cached?.length) {
          cacheIdRef.current = recordId;
          setAllItems(cached);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
        cacheIdRef.current = recordId;
      }
      const items = await generateIntelligenceFeed();
      setAllItems(items);
      setLastUpdated(new Date());
      await saveToCache(items, cacheIdRef.current);
    } catch (err) {
      console.error('Intelligence feed error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadFeed();
    }
    const interval = setInterval(() => loadFeed(true), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const filtered = activeBeat === 'all' ? allItems : allItems.filter(item => item.beat === activeBeat);
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Research Intelligence</span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowAll(false); loadFeed(true); }}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex overflow-x-auto gap-1 p-3 border-b border-border/30 scrollbar-hide">
        {BEATS.map(beat => (
          <button
            key={beat.key}
            onClick={() => { setActiveBeat(beat.key); setShowAll(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeBeat === beat.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {beat.label}
          </button>
        ))}
      </div>

      <div>
        {loading && allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="relative">
              <Zap className="w-6 h-6 text-primary/40" />
              <RefreshCw className="w-4 h-4 text-primary animate-spin absolute -bottom-1 -right-1" />
            </div>
            <p className="text-sm text-muted-foreground">Generating intelligence feed...</p>
            <p className="text-xs text-muted-foreground/40">Scanning global macro developments</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeBeat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {visible.map((item, i) => <IntelligenceItem key={`${item.slug}-${i}`} item={item} index={i} />)}
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