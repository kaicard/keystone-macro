import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, TrendingDown, Minus, Zap,
  ChevronDown, ChevronUp, BarChart2, AlertTriangle,
  Activity, Filter, CheckCircle2, Loader2, RefreshCw
} from 'lucide-react';
import EnrichedAnalysis from '@/components/calendar/EnrichedAnalysis';

const CATEGORY_COLORS = {
  'Central Bank': 'text-amber-400 bg-amber-400/10',
  'Inflation':    'text-red-400 bg-red-400/10',
  'Labour':       'text-blue-400 bg-blue-400/10',
  'GDP':          'text-emerald-400 bg-emerald-400/10',
  'PMI':          'text-purple-400 bg-purple-400/10',
  'Consumer':     'text-cyan-400 bg-cyan-400/10',
  'Housing':      'text-orange-400 bg-orange-400/10',
  'Holiday':      'text-muted-foreground bg-muted/30',
  'Trade':        'text-teal-400 bg-teal-400/10',
  'Speeches':     'text-pink-400 bg-pink-400/10',
};

const CATEGORY_IMPLICATIONS = {
  'Central Bank': {
    instruments: ['Currency pairs (domestic)', 'Government bonds (2y, 10y)', 'Equity indices', 'Gold'],
    bullish: 'Hawkish surprise (rate hike or fewer cuts) → currency strengthens, yields rise, equities sell off.',
    bearish: 'Dovish surprise (cut or soft guidance) → currency weakens, yields fall, equities and gold rally.',
  },
  'Inflation': {
    instruments: ['Government bonds', 'Currency', 'Gold', 'Rate-sensitive equities (REITs, utilities)'],
    bullish: 'Hot print → central bank stays hawkish; yields and currency rise, bond prices and growth stocks fall.',
    bearish: 'Cool print → rate cut expectations firm; bonds rally, currency softens, gold benefits.',
  },
  'Labour': {
    instruments: ['Currency', 'Equities', 'Government bonds', 'Consumer discretionary stocks'],
    bullish: 'Strong jobs/low claims → growth optimism; currency and equities gain, bonds soften.',
    bearish: 'Weak jobs/high claims → growth fears; risk-off, bonds rally, currency weakens.',
  },
  'GDP': {
    instruments: ['Currency', 'Equity indices', 'Cyclical sectors (industrials, materials)', 'Government bonds'],
    bullish: 'Beat → growth confidence; currency and equities rally, bonds sell off.',
    bearish: 'Miss → recession fears; risk-off rotation into bonds and defensive equities.',
  },
  'PMI': {
    instruments: ['Currency', 'Equity indices', 'Commodity-linked currencies (AUD, CAD)', 'Industrial metals'],
    bullish: 'Above 50 beat → expansion signal; currency and risk assets gain.',
    bearish: 'Below 50 miss → contraction; risk-off, defensive assets outperform.',
  },
  'Consumer': {
    instruments: ['Currency', 'Consumer discretionary stocks', 'Retail sector ETFs', 'Equity indices'],
    bullish: 'Strong confidence/spending → domestic growth story; equities and currency firm.',
    bearish: 'Weak sentiment → spending pullback feared; defensives outperform, growth stocks fall.',
  },
  'Housing': {
    instruments: ['Homebuilder stocks', 'Mortgage REITs', 'Lumber futures', 'Rate-sensitive bonds'],
    bullish: 'Strong data → construction and materials rally.',
    bearish: 'Weak data → housing slowdown; homebuilder stocks and mortgage REITs sell off.',
  },
  'Trade': {
    instruments: ['Currency', 'Export-heavy equity sectors', 'Government bonds', 'Commodity currencies'],
    bullish: 'Surplus widens → currency strengthens.',
    bearish: 'Deficit widens → currency weakens, trade friction concerns.',
  },
  'Holiday': {
    instruments: ['All markets'],
    bullish: '',
    bearish: 'Liquidity is thin. Gaps on open are more likely. Reduce position sizing around the holiday.',
  },
  'Speeches': {
    instruments: ['Currency pairs (domestic)', 'Government bonds', 'Equity indices'],
    bullish: 'Hawkish tone → currency and yields rise.',
    bearish: 'Dovish tone → currency weakens, bonds rally.',
  },
};

// Confirmed seed data for previous tab — always accurate
const SEED_PREVIOUS = [
  { id: 's1',  date: '2026-03-19', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision',    importance: 'high', previous: '3.75–4.00%', forecast: '3.50–3.75%', actual: '3.50–3.75%', category: 'Central Bank', outcome: 'Fed cut 25bp to 3.50–3.75% as expected. Dot plot showed one more cut in 2026. GDP forecasts trimmed; PCE inflation upgraded. Powell flagged tariff and geopolitical uncertainty. Equities dipped; 10-year yields rose 4bp.' },
  { id: 's2',  date: '2026-03-20', utcTime: '12:00', country: 'UK', event: 'BOE Interest Rate Decision',     importance: 'high', previous: '4.00%',       forecast: '3.75%',       actual: '3.75%',       category: 'Central Bank', outcome: 'BOE cut 25bp to 3.75% as expected, 7-2 vote. MPC cited energy price spike as upside inflation risk. GBP fell 0.3%; gilts rallied.' },
  { id: 's3',  date: '2026-04-01', utcTime: '14:00', country: 'US', event: 'ISM Manufacturing PMI',          importance: 'high', previous: '50.3',        forecast: '49.5',        actual: '49.0',        category: 'PMI',          outcome: 'ISM Manufacturing fell to 49.0, below the 49.5 consensus. Prices paid surged to 69.4 on tariff pass-through. New orders fell sharply. USD weakened; equities sold off.' },
  { id: 's4',  date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Nonfarm Payrolls',               importance: 'high', previous: '151K',        forecast: '138K',        actual: '177K',        category: 'Labour',       outcome: 'NFP beat at 177K versus 138K forecast. Unemployment held at 4.2%. Resilient but softening labour market.' },
  { id: 's5',  date: '2026-04-09', utcTime: '11:00', country: 'UK', event: 'BOE Interest Rate Decision',     importance: 'high', previous: '3.75%',       forecast: '3.50%',       actual: '3.50%',       category: 'Central Bank', outcome: 'BOE cut 25bp to 3.50% as expected, 7-2 vote. Bailey flagged tariff uncertainty as a growth headwind. GBP fell 0.4%; gilts rallied.' },
  { id: 's6',  date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US CPI (YoY)',                   importance: 'high', previous: '3.0%',        forecast: '2.6%',        actual: '2.4%',        category: 'Inflation',    outcome: 'US CPI surprised to the downside at 2.4%. Core CPI fell to 2.8%. USD weakened sharply; 10-year yields dropped 12bp.' },
  { id: 's7',  date: '2026-04-17', utcTime: '12:15', country: 'EU', event: 'ECB Interest Rate Decision',     importance: 'high', previous: '2.65%',       forecast: '2.40%',       actual: '2.40%',       category: 'Central Bank', outcome: 'ECB cut 25bp to 2.40% as expected. Lagarde flagged tariff risks as a downside growth concern. EUR/USD fell 0.2%.' },
  { id: 's8',  date: '2026-04-29', utcTime: '12:30', country: 'US', event: 'GDP Advance Q1 (QoQ Ann.)',      importance: 'high', previous: '2.4%',        forecast: '0.4%',        actual: '-0.3%',       category: 'GDP',          outcome: 'US GDP contracted 0.3% annualised in Q1. Tariff-related import surge distorted the trade component. Recession fears spiked; USD fell sharply.' },
  { id: 's9',  date: '2026-04-29', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision',    importance: 'high', previous: '3.50–3.75%',  forecast: '3.50–3.75%',  actual: '3.50–3.75%',  category: 'Central Bank', outcome: 'Fed held at 3.50–3.75% as expected. Powell flagged two-sided risks from tariff inflation and growth slowdown.' },
  { id: 's10', date: '2026-04-30', utcTime: '11:00', country: 'UK', event: 'BOE Interest Rate Decision',     importance: 'high', previous: '3.75%',       forecast: '3.75%',       actual: '3.75%',       category: 'Central Bank', outcome: 'BOE held at 3.75% with an 8-1 vote. MPC cited tariff uncertainty as a near-term inflation risk, pausing the cutting cycle. GBP firmed 0.3%.' },
  { id: 's11', date: '2026-04-30', utcTime: '12:15', country: 'EU', event: 'ECB Interest Rate Decision',     importance: 'high', previous: '2.40%',       forecast: '2.15%',       actual: '2.15%',       category: 'Central Bank', outcome: 'ECB cut 25bp to 2.15% as expected. Lagarde described tariffs as a significant headwind. EUR/USD fell 0.25% on the dovish press conference.' },
];

async function fetchCalendarWeek() {
  const res = await base44.functions.invoke('calendarToday', { source: 'forex-factory', range: 'week' });
  const events = res?.data?.events;
  if (!Array.isArray(events)) throw new Error('No events returned');
  return events.filter(e => e.importance === 'high' || e.importance === 'medium');
}

function toLocalTime(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return utcTime || '—';
  try {
    return new Date(`${dateStr}T${utcTime}:00Z`)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return utcTime; }
}

function localTzLabel() {
  try {
    return Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value || 'Local';
  } catch { return 'Local'; }
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();
}

function getWeekEnd(today) {
  const d = new Date(today + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().split('T')[0];
}

function isReleased(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return true;
  if (dateStr < getTodayStr()) return true;
  return Date.now() >= new Date(`${dateStr}T${utcTime}:00Z`).getTime();
}

function ActualBadge({ actual, forecast, dateStr, utcTime }) {
  if (!actual || !isReleased(dateStr, utcTime)) {
    return <span className="text-muted-foreground/30 text-xs font-mono tabular-nums">—</span>;
  }
  const a = parseFloat(actual), f = parseFloat(forecast);
  const beat    = !isNaN(a) && !isNaN(f) && a > f;
  const miss    = !isNaN(a) && !isNaN(f) && a < f;
  const special = actual === '✓' || isNaN(a);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded ${
      special ? 'bg-muted/50 text-foreground/80' :
      beat    ? 'bg-emerald-400/15 text-emerald-400' :
      miss    ? 'bg-red-400/15 text-red-400' :
                'bg-muted/50 text-foreground/80'
    }`}>
      {!special && (beat ? <TrendingUp className="w-3 h-3" /> : miss ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />)}
      {actual}
    </span>
  );
}

function ExpandedPanel({ event, enrichment, enriching }) {
  const impl      = CATEGORY_IMPLICATIONS[event.category] || null;
  const released  = isReleased(event.date, event.utcTime);
  const localTime = toLocalTime(event.date, event.utcTime);
  const tz        = localTzLabel();

  const preview = event.outcome || (
    `${event.event} is scheduled at ${localTime} ${tz}.` +
    (event.forecast && event.forecast !== '—' ? ` Market consensus: ${event.forecast}. Prior reading: ${event.previous}.` : '') +
    (event.category === 'Central Bank' ? ' Any guidance on the policy path will be the primary market driver.' :
     event.category === 'Speeches' ? ' Watch for any shift in tone on the inflation or growth outlook.' :
     ' Any surprise versus consensus will drive the initial market reaction.')
  );

  return (
    <div className="border-t border-border/10 bg-muted/5 px-4 py-4 space-y-4">
      <div className="flex gap-2.5">
        <Activity className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">
            {released && event.actual ? 'Analysis' : 'Preview'}
          </p>
          {enrichment || enriching ? (
            <EnrichedAnalysis enrichment={enrichment} enriching={enriching} />
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">{preview}</p>
          )}
        </div>
      </div>
      {impl && (
        <>
          <div className="flex gap-2.5">
            <BarChart2 className="w-3.5 h-3.5 text-accent/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5">Instruments to Watch</p>
              <div className="flex flex-wrap gap-1.5">
                {impl.instruments.map(inst => (
                  <span key={inst} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent/90 border border-accent/20 font-medium">
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {(impl.bullish || impl.bearish) && (
            <div className="flex gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
              <div className="space-y-1.5 w-full">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Market Implications</p>
                {impl.bullish && (
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wide w-7 leading-5">Beat</span>
                    <p className="text-xs text-muted-foreground/80 leading-5">{impl.bullish}</p>
                  </div>
                )}
                {impl.bearish && (
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-red-400 shrink-0 uppercase tracking-wide w-7 leading-5">
                      {event.category === 'Holiday' ? 'Note' : 'Miss'}
                    </span>
                    <p className="text-xs text-muted-foreground/80 leading-5">{impl.bearish}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventRow({ event, today, enrichments, enriching }) {
  const [open, setOpen] = useState(false);
  const isToday  = event.date === today;
  const isHigh   = event.importance === 'high';
  const catStyle = CATEGORY_COLORS[event.category] || 'text-muted-foreground bg-muted/30';
  const eventKey   = `${event.date}|${event.event.toLowerCase()}`;
  const enrichment = enrichments?.[eventKey];

  return (
    <div className={`border-b border-border/20 last:border-0 ${isToday && isHigh ? 'bg-primary/[0.02]' : ''}`}>
      <button className="w-full text-left hover:bg-muted/10 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="grid items-center px-4 py-3" style={{ gridTemplateColumns: '72px 40px 14px 1fr 72px 72px 88px 24px' }}>
          <span className={`text-xs font-mono font-semibold tabular-nums ${isToday ? 'text-primary' : 'text-muted-foreground/70'}`}>
            {toLocalTime(event.date, event.utcTime)}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wide">{event.country}</span>
          <span className={`w-2 h-2 rounded-full inline-block ${isHigh ? 'bg-amber-400' : event.importance === 'medium' ? 'bg-blue-400/70' : 'bg-border'}`} />
          <div className="flex items-center gap-2 min-w-0 pr-3">
            <span className={`text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>{event.event}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 hidden sm:inline ${catStyle}`}>{event.category}</span>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">PREV</p>
            <p className="text-xs font-mono text-muted-foreground/70 tabular-nums">{(!event.previous || event.previous === '0' || event.previous === '—') ? '—' : event.previous}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">FCST</p>
            <p className="text-xs font-mono text-muted-foreground/70 tabular-nums">{(!event.forecast || event.forecast === '0' || event.forecast === '—') ? '—' : event.forecast}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">ACTUAL</p>
            <ActualBadge actual={event.actual} forecast={event.forecast} dateStr={event.date} utcTime={event.utcTime} />
          </div>
          <span className="text-muted-foreground/30 flex justify-end">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <ExpandedPanel event={event} enrichment={enrichment} enriching={enriching} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DateGroup({ dateStr, events, today, enrichments, enriching }) {
  const isToday   = dateStr === today;
  const highCount = events.filter(e => e.importance === 'high').length;
  const tz        = localTzLabel();
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2 px-1">
        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
        <span className={`text-[11px] font-bold tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
          {isToday ? 'TODAY · ' : ''}{formatDate(dateStr)}
        </span>
        {highCount > 0 && (
          <span className="text-[10px] text-amber-400/70 px-1.5 py-0.5 rounded bg-amber-400/8 border border-amber-400/15 ml-auto">
            {highCount} high impact
          </span>
        )}
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid items-center px-4 py-2 border-b border-border/20 bg-muted/5" style={{ gridTemplateColumns: '72px 40px 14px 1fr 72px 72px 88px 24px' }}>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">TIME ({tz})</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">CTRY</span>
          <span />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">EVENT</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold text-right hidden md:block">PREVIOUS</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold text-right hidden md:block">FORECAST</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold text-right">ACTUAL</span>
          <span />
        </div>
        {events.map(e => <EventRow key={e.id} event={e} today={today} enrichments={enrichments} enriching={enriching} />)}
      </div>
    </div>
  );
}

export default function EconomicCalendar() {
  const [tab, setTab]             = useState('today');
  const [impactFilter, setImpact] = useState('all');
  const [today, setToday]         = useState(getTodayStr);
  const [ffEvents, setFfEvents]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [liveStatus, setLiveStatus] = useState('idle');
  const [enrichments, setEnrichments] = useState({});
  const [enriching, setEnriching]     = useState(false);
  const enrichedKeys  = useRef(new Set());
  const hadActualKeys = useRef(new Set());

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
    const t = setTimeout(() => setToday(getTodayStr()), midnight - now);
    return () => clearTimeout(t);
  }, [today]);

  const loadFF = useCallback(async () => {
    setLoading(true);
    setLiveStatus('loading');
    try {
      const events = await fetchCalendarWeek();
      setFfEvents(events);
      setLiveStatus('live');
    } catch (err) {
      console.error('Calendar fetch failed:', err);
      setLiveStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFF();
    const interval = setInterval(loadFF, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFF]);

  // Enrich high/medium events with LLM analysis (beat/miss verdicts, speech summaries)
  useEffect(() => {
    const enrichable = ffEvents.filter(e => e.importance === 'high' || e.importance === 'medium');
    if (enrichable.length === 0) return;

    const toEnrich = enrichable.filter(e => {
      const key = `${e.date}|${e.event.toLowerCase()}`;
      const hasActual = !!e.actual;
      if (!enrichedKeys.current.has(key)) return true;
      if (hasActual && !hadActualKeys.current.has(key)) return true;
      return false;
    });

    if (toEnrich.length === 0) return;

    toEnrich.forEach(e => {
      const key = `${e.date}|${e.event.toLowerCase()}`;
      enrichedKeys.current.add(key);
      if (e.actual) hadActualKeys.current.add(key);
    });

    setEnriching(true);
    base44.functions.invoke('enrichCalendarEvents', {
      events: toEnrich.map(e => ({
        key: `${e.date}|${e.event.toLowerCase()}`,
        event: e.event,
        country: e.country,
        date: e.date,
        utcTime: e.utcTime,
        category: e.category,
        previous: e.previous,
        forecast: e.forecast,
        actual: e.actual,
      }))
    }).then(res => {
      const data = res?.data?.analyses || {};
      setEnrichments(prev => ({ ...prev, ...data }));
    }).catch(() => {}).finally(() => setEnriching(false));
  }, [ffEvents]);

  const weekEnd = useMemo(() => getWeekEnd(today), [today]);

  const allEvents = useMemo(() => {
    const ffKeys = new Set(ffEvents.map(e => `${e.date}|${e.event.toLowerCase()}`));
    const seedPrev = SEED_PREVIOUS.filter(e => !ffKeys.has(`${e.date}|${e.event.toLowerCase()}`));
    return [...ffEvents, ...seedPrev];
  }, [ffEvents]);

  const filtered = useMemo(() => {
    let base = allEvents.filter(e => {
      if (tab === 'today')    return e.date === today;
      if (tab === 'week')     return e.date >= today && e.date <= weekEnd;
      if (tab === 'previous') return e.date < today;
      return true;
    });
    if (impactFilter === 'high') base = base.filter(e => e.importance === 'high');
    return base;
  }, [allEvents, tab, today, weekEnd, impactFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    Object.values(map).forEach(evs =>
      evs.sort((a, b) => {
        const ta = a.utcTime === 'All Day' ? '00:00' : (a.utcTime || '00:00');
        const tb = b.utcTime === 'All Day' ? '00:00' : (b.utcTime || '00:00');
        return ta.localeCompare(tb);
      })
    );
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return tab === 'previous' ? sorted.reverse() : sorted;
  }, [filtered, tab]);

  const todayEvents   = allEvents.filter(e => e.date === today);
  const todayHigh     = todayEvents.filter(e => e.importance === 'high').length;
  const todayReleased = todayEvents.filter(e => e.actual && isReleased(e.date, e.utcTime)).length;

  return (
    <div className="pt-24 lg:pt-28 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/15 bg-primary/[0.07] mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Macro Events</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground">Central bank decisions, macro releases, and market-moving data. Medium and high impact only.</p>
        </motion.div>

        {tab === 'today' && (
          <motion.div className="grid grid-cols-2 gap-3 mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
            <div className="rounded-xl border border-border/55 bg-card/50 px-4 py-3 flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">High Impact Today</p>
                <p className="text-lg font-semibold">{todayHigh}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/55 bg-card/50 px-4 py-3 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-lg font-semibold">{todayReleased} <span className="text-sm font-normal text-muted-foreground">/ {todayEvents.length}</span></p>
              </div>
            </div>

          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 rounded-xl border border-border/55 bg-card/40 p-2">
          <div className="flex gap-1 w-fit">
            {[{ key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'previous', label: 'Previous' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-foreground/[0.075] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={loadFF} disabled={loading} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted-foreground/50 ml-1 mr-0.5" />
              {[{ key: 'all', label: 'All' }, { key: 'high', label: 'High Only' }].map(f => (
                <button key={f.key} onClick={() => setImpact(f.key)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${impactFilter === f.key ? 'bg-foreground/[0.075] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {loading && ffEvents.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 opacity-40 animate-spin" />
              <p className="text-sm font-medium mb-1">Loading calendar...</p>
            </div>
          ) : grouped.length > 0 ? (
            grouped.map(([dateStr, evs]) => <DateGroup key={dateStr} dateStr={dateStr} events={evs} today={today} enrichments={enrichments} enriching={enriching} />)
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium mb-1">No events for this period</p>
              <p className="text-xs text-muted-foreground/50">
                {liveStatus === 'error'
                  ? 'Try refreshing or check a different date range.'
                  : tab === 'today'
                  ? 'No medium or high impact releases today. Check "This Week" for upcoming events.'
                  : 'Use Today, This Week, or Previous.'}
              </p>
            </div>
          )}
        </motion.div>


      </div>
    </div>
  );
}