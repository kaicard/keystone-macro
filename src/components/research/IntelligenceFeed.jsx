import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, ChevronDown, ChevronUp, ArrowRight, Clock, Star, Zap, Calendar, Bell, RefreshCw } from 'lucide-react';
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

const DATE_FILTERS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'This Week' },
  { key: 'all',       label: 'All' },
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

function londonDateStr(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return londonDateStr(monday);
}

function getDateLabel(dateStr) {
  const today = londonDateStr();
  const yesterday = londonDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatTime(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  } catch { return null; }
}

function generateSlug(headline) {
  return (headline || '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80).trim();
}

// ─── Generate fresh intelligence items and save to DB ─────────────────────────
async function generateAndSaveItems() {
  const now = new Date();
  const utcHour = String(now.getUTCHours()).padStart(2, '0');
  const utcMin  = String(now.getUTCMinutes()).padStart(2, '0');
  const currentUtcTime = `${utcHour}:${utcMin}`;
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const batchId = `batch_${now.toISOString()}`;
  const todayStr = londonDateStr();

  // Step 1: Generate headlines
  const headlineResult = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior macro research analyst at Keystone Macro. Today is ${dateStr}, UTC time ${currentUtcTime}.

Generate exactly 20 distinct, specific market intelligence headlines. Each must cover a completely DIFFERENT topic. Write like a Bloomberg or FT breaking news desk — sharp, specific, data-driven with real levels and percentages.

Rules:
- Every headline must include specific data: a level, %, basis points, or name
- No two headlines on the same topic or asset class
- Cover: US macro, UK macro, EU macro, Asia, EM, commodities, FX, rates, geopolitics, credit, tech
- published_time_utc must be strictly before ${currentUtcTime}, spread from 06:00
- Mark 2-3 as is_top_story: true (the biggest market-moving stories)

For each item:
- headline: specific with data (e.g. "Brent crude surges 3.2% to $91.40 as OPEC+ reaffirms output cuts")
- category: Macro / Equities / Rates / Commodities / FX / Geopolitics / Credit / Technology / US Economy / UK Economy / EU Economy
- sentiment: positive / negative / neutral
- published_time_utc: HH:MM strictly before ${currentUtcTime}
- beat: macro / equities / us_economy / uk_economy / eu_economy / rates / commodities / fx / geopolitics / credit / tech
- is_top_story: true or false`,
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
              is_top_story:       { type: 'boolean' },
            }
          }
        }
      }
    }
  });

  const headlines = (headlineResult?.items || [])
    .filter(item => (item.published_time_utc || '00:00') <= currentUtcTime)
    .slice(0, 20);

  if (!headlines.length) return [];

  // Step 2: Enrich in batches of 5
  const BATCH = 5;
  const enriched = [];

  for (let i = 0; i < headlines.length; i += BATCH) {
    const batch = headlines.slice(i, i + BATCH);
    const list = batch.map((item, j) => `${j + 1}. [${item.category}] ${item.headline}`).join('\n');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior macro analyst at Keystone Macro. Enrich these ${batch.length} headlines with concise analysis.

${list}

For each (numbered 1-${batch.length}):
- impact: 2 sentences. What happened, specific market moves with levels, what it signals.
- desk_view: 3 sentences. Structural context, cross-asset implications, what to watch next 48h.
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

      const enrichedBatch = result?.items || [];
      batch.forEach((item, j) => {
        enriched.push({ ...item, ...(enrichedBatch[j] || {}) });
      });
    } catch (_) {
      batch.forEach(item => enriched.push(item));
    }
  }

  // Step 3: Save to database
  const records = enriched.map(item => ({
    headline:      item.headline,
    category:      item.category,
    beat:          item.beat,
    sentiment:     item.sentiment,
    impact:        item.impact || '',
    desk_view:     item.desk_view || '',
    what_to_watch: item.what_to_watch || '',
    slug:          generateSlug(item.headline) + '-' + todayStr,
    published_at:  (() => {
      const [h, m] = (item.published_time_utc || '09:00').split(':');
      const d = new Date();
      d.setUTCHours(parseInt(h), parseInt(m), 0, 0);
      return d.toISOString();
    })(),
    published_date: todayStr,
    is_top_story:   item.is_top_story || false,
    batch_id:       batchId,
  }));

  await base44.entities.IntelligenceItem.create(records);
  return records;
}

// ─── Single Intelligence Item ─────────────────────────────────────────────────
function IntelligenceItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const navigate  = useNavigate();
  const catStyle  = CATEGORY_STYLES[item.category] || 'bg-muted/60 text-muted-foreground border-border/40';
  const sentDot   = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;
  const time      = formatTime(item.published_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.2) }}
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
              {item.is_top_story && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400/80 px-1.5 py-0.5 rounded border border-amber-400/20 bg-amber-400/8">
                  <Star className="w-2.5 h-2.5" /> Top Story
                </span>
              )}
              {time && (
                <span className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />{time}
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
              {item.headline}
            </p>
            {item.impact && !expanded && (
              <p className="text-xs text-muted-foreground/55 mt-1 line-clamp-1">{item.impact}</p>
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

// ─── Day Group ────────────────────────────────────────────────────────────────
function DayGroup({ dateStr, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!items.length) return null;
  return (
    <div className="border-b border-border/20 last:border-0">
      <button
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{getDateLabel(dateStr)}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground/40 font-medium">{items.length}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/25 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {items.map((item, i) => (
              <IntelligenceItem key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function IntelligenceFeed() {
  const [activeBeat, setActiveBeat]           = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('today');
  const [allItems, setAllItems]               = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [isGenerating, setIsGenerating]       = useState(false);
  const [newCount, setNewCount]               = useState(0);
  const knownIds = useRef(new Set());

  const loadItems = useCallback(async () =