import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, ChevronDown, ChevronUp, ArrowRight, Clock, Star, Zap, Calendar, Bell } from 'lucide-react';
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
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short',
  });
}

function formatTime(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
    });
  } catch { return null; }
}

function isValidItem(item) {
  if (!item) return false;
  if (!item.headline) return false;
  if (item.headline === 'DELETED') return false;
  if (item.slug === 'DELETED') return false;
  if (item.headline.includes('Data Not Loaded')) return false;
  if (item.headline.includes('data not loaded')) return false;
  if (/at 0\.?0?%?\s*[-.]?\s*/.test(item.headline) && item.headline.length < 40) return false;
  return true;
}

function IntelligenceItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const catStyle = CATEGORY_STYLES[item.category] || 'bg-muted/60 text-muted-foreground border-border/40';
  const sentDot  = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;
  const time     = formatTime(item.published_at);

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
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {getDateLabel(dateStr)}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground/40 font-medium">
            {items.length}
          </span>
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

export default function IntelligenceFeed() {
  const [activeBeat, setActiveBeat]             = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('today');
  const [allItems, setAllItems]                 = useState([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [newCount, setNewCount]                 = useState(0);
  const knownIds = useRef(new Set());

  const loadItems = useCallback(async () => {
    try {
      const items = await base44.entities.IntelligenceItem.list('-published_at', 300);
      return (items || []).filter(isValidItem);
    } catch { return []; }
  }, []);

  useEffect(() => {
    loadItems().then(items => {
      setAllItems(items);
      knownIds.current = new Set(items.map(i => i.id));
      setIsLoading(false);
    });
  }, [loadItems]);

  useEffect(() => {
    const unsub = base44.entities.IntelligenceItem.subscribe((event) => {
      if (event.type === 'create' && !knownIds.current.has(event.id)) {
        if (isValidItem(event.data)) {
          knownIds.current.add(event.id);
          setAllItems(prev => [event.data, ...prev]);
          setNewCount(n => n + 1);
        }
      } else if (event.type === 'update') {
        setAllItems(prev =>
          prev.map(i => i.id === event.id ? event.data : i).filter(isValidItem)
        );
      } else if (event.type === 'delete') {
        setAllItems(prev => prev.filter(i => i.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const today     = londonDateStr();
    const yesterday = londonDateStr(new Date(Date.now() - 86400000));
    const weekStart = getWeekStart();
    return allItems.filter(item => {
      const d = item.published_date || item.published_at?.split('T')[0] || '';
      if (activeDateFilter === 'today'     && d !== today)                  return false;
      if (activeDateFilter === 'yesterday' && d !== yesterday)              return false;
      if (activeDateFilter === 'week'      && (d < weekStart || d > today)) return false;
      if (activeBeat !== 'all' && item.beat !== activeBeat)                 return false;
      return true;
    });
  }, [allItems, activeDateFilter, activeBeat]);

  const byDate = useMemo(() => {
    const groups = {};
    filtered.forEach(item => {
      const d = item.published_date || item.published_at?.split('T')[0] || 'unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    Object.values(groups).forEach(g =>
      g.sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))
    );
    return groups;
  }, [filtered]);

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const todayStr = londonDateStr();
  const topStories = useMemo(() =>
    allItems.filter(i =>
      i.is_top_story &&
      i.published_date === todayStr &&
      (activeBeat === 'all' || i.beat === activeBeat)
    ).sort((a, b) => (b.published_at || '').localeCompare(a.published_at || '')),
    [allItems, activeBeat, todayStr]
  );

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Research Intelligence</span>
          {filtered.length > 0 && (
            <span className="text-xs text-muted-foreground/40 hidden sm:inline">{filtered.length} items</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest hidden sm:inline">Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      <AnimatePresence>
        {newCount > 0 && (
          <motion.button
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNewCount(0)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-400/10 border-b border-emerald-400/20 hover:bg-emerald-400/15 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              {newCount} new {newCount === 1 ? 'item' : 'items'} — click to dismiss
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border/20">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground/30 mr-1 shrink-0" />
        {DATE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveDateFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeDateFilter === f.key
                ? 'bg-foreground/10 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex overflow-x-auto gap-1 p-3 border-b border-border/20 scrollbar-hide">
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
      ) : (
        <>
          {(activeDateFilter === 'today' || activeDateFilter === 'all') && topStories.length > 0 && (
            <div className="border-b border-border/25">
              <div className="px-5 py-2.5 flex items-center gap-2 bg-amber-400/4 border-b border-amber-400/10">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">Top Stories</span>
              </div>
              {topStories.map((item, i) => (
                <IntelligenceItem key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/40">
              <Zap className="w-5 h-5" />
              <p className="text-sm">No items for this period</p>
              <p className="text-xs">Items appear as economic data releases throughout the day</p>
            </div>
          ) : (
            sortedDates.map((dateStr, di) => (
              <DayGroup key={dateStr} dateStr={dateStr} items={byDate[dateStr]} defaultOpen={di === 0} />
            ))
          )}
        </>
      )}
    </div>
  );
}