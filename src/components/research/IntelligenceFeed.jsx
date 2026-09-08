import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Radio,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  Star,
  Zap,
  CalendarDays,
  Bell,
  ExternalLink,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { cleanMarketCopy, truncateWords } from '@/lib/cleanMarketCopy';

const BEATS = [
  { key: 'all', label: 'All coverage' },
  { key: 'macro', label: 'Macro' },
  { key: 'equities', label: 'Equities' },
  { key: 'us_economy', label: 'US Economy' },
  { key: 'uk_economy', label: 'UK Economy' },
  { key: 'eu_economy', label: 'EU Economy' },
  { key: 'rates', label: 'Rates' },
  { key: 'commodities', label: 'Commodities' },
  { key: 'fx', label: 'FX' },
  { key: 'geopolitics', label: 'Geopolitics' },
  { key: 'credit', label: 'Credit' },
  { key: 'technology', label: 'Technology' },
];

const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'All' },
];

const CATEGORY_STYLES = {
  Macro: 'text-amber-300 bg-amber-400/[0.08] border-amber-400/15',
  Equities: 'text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15',
  Rates: 'text-blue-300 bg-blue-400/[0.08] border-blue-400/15',
  Commodities: 'text-orange-300 bg-orange-400/[0.08] border-orange-400/15',
  Geopolitics: 'text-red-300 bg-red-400/[0.08] border-red-400/15',
  FX: 'text-purple-300 bg-purple-400/[0.08] border-purple-400/15',
  Credit: 'text-cyan-300 bg-cyan-400/[0.08] border-cyan-400/15',
  Technology: 'text-violet-300 bg-violet-400/[0.08] border-violet-400/15',
  'US Economy': 'text-sky-300 bg-sky-400/[0.08] border-sky-400/15',
  'UK Economy': 'text-rose-300 bg-rose-400/[0.08] border-rose-400/15',
  'EU Economy': 'text-indigo-300 bg-indigo-400/[0.08] border-indigo-400/15',
};

const SENTIMENT_DOT = {
  positive: 'bg-emerald-400',
  negative: 'bg-rose-400',
  neutral: 'bg-amber-300/70',
};

const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function localDateStr(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: userTZ });
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return localDateStr(monday);
}

function getDateLabel(dateStr) {
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: userTZ,
  });
}

function formatTime(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTZ,
    });
  } catch {
    return null;
  }
}

function isValidItem(item) {
  if (!item?.headline || item.headline === 'DELETED' || item.slug === 'DELETED') return false;
  if (/data not loaded/i.test(item.headline)) return false;
  if (/at 0\.?0?%?\s*[-.]?\s*/.test(item.headline) && item.headline.length < 40) return false;
  return true;
}

function MetaLabel({ children, className = '' }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-semibold tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function IntelligenceItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const catStyle = CATEGORY_STYLES[item.category] || 'text-muted-foreground bg-muted/20 border-border/30';
  const sentDot = SENTIMENT_DOT[item.sentiment] || SENTIMENT_DOT.neutral;
  const time = formatTime(item.published_at);
  const headline = cleanMarketCopy(item.headline);
  const impact = cleanMarketCopy(item.impact);
  const deskView = cleanMarketCopy(item.desk_view);
  const watchItems = cleanMarketCopy(item.what_to_watch)
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);

  return (
    <motion.article
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, delay: Math.min(index * 0.018, 0.12) }}
      className={`relative border-b border-border/20 last:border-0 ${item.is_top_story ? 'before:absolute before:inset-y-4 before:left-0 before:w-px before:bg-amber-300/70' : ''}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="group w-full px-5 py-5 text-left transition-colors hover:bg-white/[0.018] sm:px-6"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3.5">
          <span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${sentDot}`} />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <MetaLabel className={catStyle}>{item.category || 'Market'}</MetaLabel>
              {item.is_top_story && (
                <MetaLabel className="border-amber-300/20 bg-amber-300/5 text-amber-300">
                  <Star className="mr-1 h-3 w-3" /> Priority
                </MetaLabel>
              )}
              {time && (
                <span className="inline-flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground/45">
                  <Clock className="h-3 w-3" /> {time}
                </span>
              )}
            </div>
            <h3 className="max-w-5xl text-[15px] font-semibold leading-6 text-foreground/90 transition-colors group-hover:text-foreground sm:text-base">
              {headline}
            </h3>
            {!expanded && impact && (
              <p className="mt-1.5 max-w-5xl text-sm leading-6 text-muted-foreground/60 line-clamp-1">
                {truncateWords(impact, 28)}
              </p>
            )}
          </div>
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground/35 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 px-10 pb-6 sm:px-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
              <div className="space-y-5">
                {impact && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/45">Market impact</p>
                    <p className="max-w-4xl text-sm leading-6 text-muted-foreground/80">{impact}</p>
                  </div>
                )}
                {deskView && (
                  <div className="border-l border-primary/35 pl-4">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">Keystone view</p>
                    <p className="max-w-4xl text-sm leading-6 text-foreground/85">{deskView}</p>
                  </div>
                )}
              </div>

              <aside className="space-y-5 border-t border-border/20 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                {watchItems.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/45">Instruments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {watchItems.map((value) => (
                        <span key={value} className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[11px] text-primary/80">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/45">Provenance</p>
                  <div className="flex flex-col gap-2">
                    {item.source_url ? (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.source_name || 'Primary source'}</span>
                      </a>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/35">Legacy item · source unavailable</p>
                    )}
                    {item.verification_status === 'verified' && (
                      <span className="inline-flex w-fit items-center gap-1 text-[10px] text-emerald-400/80">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {item.slug && (
                  <button
                    type="button"
                    onClick={() => navigate(`/Research/Intelligence/${item.slug}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
                  >
                    Full analysis <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function DayGroup({ dateStr, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!items.length) return null;

  return (
    <section className="border-b border-border/20 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between bg-white/[0.012] px-5 py-3 text-left transition-colors hover:bg-white/[0.025] sm:px-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55">{getDateLabel(dateStr)}</span>
          <span className="text-[10px] tabular-nums text-muted-foreground/30">{items.length}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {items.map((item, index) => (
              <IntelligenceItem key={item.id} item={item} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function IntelligenceFeed() {
  const [activeBeat, setActiveBeat] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('today');
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const knownIds = useRef(new Set());

  const loadItems = useCallback(async () => {
    try {
      const items = await base44.entities.IntelligenceItem.list('-published_at', 300);
      return (items || []).filter(isValidItem);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    loadItems().then((items) => {
      setAllItems(items);
      knownIds.current = new Set(items.map((item) => item.id));
      setIsLoading(false);
    });
  }, [loadItems]);

  useEffect(() => {
    const unsubscribe = base44.entities.IntelligenceItem.subscribe((event) => {
      if (event.type === 'create' && !knownIds.current.has(event.id) && isValidItem(event.data)) {
        knownIds.current.add(event.id);
        setAllItems((previous) => [event.data, ...previous]);
        setNewCount((count) => count + 1);
      } else if (event.type === 'update') {
        setAllItems((previous) => previous.map((item) => item.id === event.id ? event.data : item).filter(isValidItem));
      } else if (event.type === 'delete') {
        setAllItems((previous) => previous.filter((item) => item.id !== event.id));
      }
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    const today = localDateStr();
    const yesterday = localDateStr(new Date(Date.now() - 86400000));
    const weekStart = getWeekStart();

    return allItems.filter((item) => {
      const date = item.published_date || item.published_at?.split('T')[0] || '';
      if (activeDateFilter === 'today' && date !== today) return false;
      if (activeDateFilter === 'yesterday' && date !== yesterday) return false;
      if (activeDateFilter === 'week' && (date < weekStart || date > today)) return false;
      if (activeBeat !== 'all' && item.beat !== activeBeat) return false;
      return true;
    });
  }, [allItems, activeDateFilter, activeBeat]);

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => setVisibleCount(PAGE_SIZE), [activeDateFilter, activeBeat]);

  const visibleItems = filtered.slice(0, visibleCount);
  const byDate = useMemo(() => {
    const groups = {};
    visibleItems.forEach((item) => {
      const date = item.published_date || item.published_at?.split('T')[0] || 'unknown';
      groups[date] = groups[date] || [];
      groups[date].push(item);
    });
    Object.values(groups).forEach((group) => group.sort((a, b) => (b.published_at || '').localeCompare(a.published_at || '')));
    return groups;
  }, [visibleItems]);

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/35 bg-card/45 shadow-[0_24px_80px_-52px_rgba(0,0,0,0.85)] backdrop-blur-xl">
      <header className="flex flex-col gap-5 border-b border-border/25 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07]">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-foreground/95">Research Intelligence</h2>
                {!isLoading && <span className="text-[11px] tabular-nums text-muted-foreground/40">{filtered.length}</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground/45">Curated macro and cross-asset developments</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/80">Live</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-xl border border-border/30 bg-background/30 p-1">
            <CalendarDays className="mx-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/35" />
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveDateFilter(filter.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${activeDateFilter === filter.key ? 'bg-foreground/[0.09] text-foreground shadow-sm' : 'text-muted-foreground/55 hover:text-foreground'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="relative flex h-10 min-w-[180px] items-center rounded-xl border border-border/30 bg-background/30 pl-9 pr-3">
            <SlidersHorizontal className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/40" />
            <select
              value={activeBeat}
              onChange={(event) => setActiveBeat(event.target.value)}
              className="h-full w-full appearance-none bg-transparent pr-5 text-xs font-medium text-foreground/75 outline-none"
              aria-label="Research category"
            >
              {BEATS.map((beat) => <option key={beat.key} value={beat.key}>{beat.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-muted-foreground/35" />
          </label>

          <div className="hidden items-center gap-2 pl-1 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/80">Live</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {newCount > 0 && (
          <motion.button
            type="button"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onClick={() => setNewCount(0)}
            className="flex w-full items-center justify-center gap-2 border-b border-emerald-400/15 bg-emerald-400/[0.06] py-2.5 text-xs font-medium text-emerald-300"
          >
            <Bell className="h-3.5 w-3.5" /> {newCount} new {newCount === 1 ? 'item' : 'items'}
          </motion.button>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-xs text-muted-foreground/45">Loading intelligence</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <Zap className="h-5 w-5 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60">No research for this selection</p>
          <p className="text-xs text-muted-foreground/35">Try another period or coverage area.</p>
        </div>
      ) : (
        <>
          {sortedDates.map((dateStr, index) => (
            <DayGroup key={dateStr} dateStr={dateStr} items={byDate[dateStr]} defaultOpen={index === 0} />
          ))}

          {(hasMore || visibleCount > PAGE_SIZE) && (
            <footer className="flex items-center justify-center gap-2 border-t border-border/20 px-5 py-4">
              {visibleCount > PAGE_SIZE && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(PAGE_SIZE)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground/55 transition-colors hover:bg-muted/20 hover:text-foreground"
                >
                  <ChevronUp className="h-3.5 w-3.5" /> Show less
                </button>
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-white/[0.02] px-4 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-primary/20 hover:text-primary"
                >
                  Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </footer>
          )}
        </>
      )}
    </div>
  );
}