import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radio, ChevronDown, ChevronUp, ArrowRight, Clock, Star, Zap } from 'lucide-react';
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
  negative:  'bg-red-400',
  neutral:   'bg-amber-400/60',
};

function getDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatTime(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  } catch { return null; }
}

// ─── Single Intelligence Item ─────────────────────────────────────────────────
function IntelligenceItem({ item, index, showDate = false }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const catStyle = CATEGORY_STYLES[item.category] || 'bg-muted/60 text-muted-foreground border-border/40';
  const sentDot  = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;
  const time     = formatTime(item.published_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.25) }}
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
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400/80 bg-amber-400/8 px-1.5 py-0.5 rounded border border-amber-400/15">
                  <Star className="w-2.5 h-2.5" /> Top Story
                </span>
              )}
              {time && (
                <span className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />{time}
                </span>
              )}
              {showDate && item.published_date && (
                <span className="text-[10px] text-muted-foreground/35">{getDateLabel(item.published_date)}</span>
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

// ─── Day Group ─────────────────────────────────────────────────────────────────
function DayGroup({ dateStr, items, beatFilter, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const filtered = beatFilter === 'all' ? items : items.filter(i => i.beat === beatFilter);
  if (filtered.length === 0) return null;
  const label = getDateLabel(dateStr);

  return (
    <div className="border-b border-border/20 last:border-0">
      <button
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/50 font-medium">{filtered.length}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/30 transition-transform ${open ? 'rotate-180' : ''}`} />
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
            {filtered.map((item, i) => (
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
  const [activeBeat, setActiveBeat] = useState('all');

  // Fetch from persistent entity — fast load, pre-populated server-side
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['intelligence-feed'],
    queryFn: () => base44.entities.IntelligenceItem.list('-published_at', 200),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Group by date
  const byDate = allItems.reduce((acc, item) => {
    const d = item.published_date || item.published_at?.split('T')[0] || 'unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const todayStr = new Date().toISOString().split('T')[0];
  const todayItems = byDate[todayStr] || [];
  const topStories = todayItems.filter(i => i.is_top_story);
  const filteredTopStories = activeBeat === 'all' ? topStories : topStories.filter(i => i.beat === activeBeat);

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
          {allItems.length > 0 && (
            <span className="text-xs text-muted-foreground/40 hidden sm:inline">{allItems.length} items</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/30 hidden sm:inline">Refreshed every 30 min</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Beat filter tabs */}
      <div className="flex overflow-x-auto gap-1 p-3 border-b border-border/30">
        {BEATS.map(beat => (
          <button
            key={beat.key}
            onClick={() => setActiveBeat(beat.key)}
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading intelligence feed...</p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/50">
          <Zap className="w-5 h-5" />
          <p className="text-sm">No items yet — feed refreshes every 30 minutes</p>
        </div>
      ) : (
        <>
          {/* Top Stories */}
          {filteredTopStories.length > 0 && (
            <div className="border-b border-border/30">
              <div className="px-5 py-3 flex items-center gap-2 bg-amber-400/3">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">Top Stories</span>
              </div>
              {filteredTopStories.map((item, i) => (
                <IntelligenceItem key={item.id} item={item} index={i} />
              ))}
            </div>
          )}

          {/* Grouped by date */}
          {sortedDates.map((dateStr, di) => (
            <DayGroup
              key={dateStr}
              dateStr={dateStr}
              items={byDate[dateStr]}
              beatFilter={activeBeat}
              defaultOpen={di === 0}
            />
          ))}
        </>
      )}
    </div>
  );
}