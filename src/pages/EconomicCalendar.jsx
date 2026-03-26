import React, { useState, useMemo } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown, ChevronUp, AlertCircle, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Country flags
const FLAGS = {
  US: '🇺🇸', UK: '🇬🇧', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳',
  CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭', DE: '🇩🇪', FR: '🇫🇷',
};

const EVENTS = [
  { id: 1,  date: '2026-03-26', time: '07:00', country: 'UK', event: 'UK CPI (YoY)',                        importance: 'high',   previous: '3.0%',   forecast: '2.9%',   actual: '2.8%',  category: 'Inflation',    description: 'Consumer price inflation year-on-year. Core services CPI watched closely by BOE for rate path.' },
  { id: 2,  date: '2026-03-26', time: '09:00', country: 'EU', event: 'ECB President Lagarde Speech',        importance: 'high',   previous: '—',      forecast: '—',      actual: null,    category: 'Central Bank', description: 'Any forward guidance on rate cuts or QT tapering will move EUR and European yields.' },
  { id: 3,  date: '2026-03-26', time: '13:30', country: 'US', event: 'Core PCE Price Index (MoM)',          importance: 'high',   previous: '0.3%',   forecast: '0.3%',   actual: null,    category: 'Inflation',    description: 'The Fed\'s preferred inflation measure. A beat above 0.3% would push rate cut expectations further out.' },
  { id: 4,  date: '2026-03-26', time: '13:30', country: 'US', event: 'Initial Jobless Claims',              importance: 'medium', previous: '223K',   forecast: '218K',   actual: null,    category: 'Labour',       description: 'Weekly leading indicator of labour market health. A significant miss would signal deterioration.' },
  { id: 5,  date: '2026-03-26', time: '15:00', country: 'US', event: 'Pending Home Sales (MoM)',            importance: 'medium', previous: '-4.6%',  forecast: '1.0%',   actual: null,    category: 'Housing',      description: 'Forward-looking housing indicator. Rate-sensitive; watch for any bounce following recent declines.' },
  { id: 6,  date: '2026-03-26', time: '18:00', country: 'US', event: 'Fed Chair Powell Speech',             importance: 'high',   previous: '—',      forecast: '—',      actual: null,    category: 'Central Bank', description: 'Market will parse every word for clues on the June cut probability and inflation tolerance.' },
  { id: 7,  date: '2026-03-27', time: '07:00', country: 'DE', event: 'Germany GDP (QoQ)',                   importance: 'high',   previous: '-0.2%',  forecast: '0.1%',   actual: null,    category: 'GDP',          description: 'Germany\'s economy has been the weak link in the Eurozone. Contraction could weigh on ECB cut timing.' },
  { id: 8,  date: '2026-03-27', time: '13:30', country: 'US', event: 'US GDP (QoQ)',                        importance: 'high',   previous: '3.1%',   forecast: '2.8%',   actual: null,    category: 'GDP',          description: 'Final Q4 read. Slowdown expected but not alarming. Watch personal consumption component.' },
  { id: 9,  date: '2026-03-27', time: '13:30', country: 'US', event: 'Personal Consumption Expenditure',   importance: 'medium', previous: '0.7%',   forecast: '0.4%',   actual: null,    category: 'Consumer',     description: 'Measures household spending — key component of GDP and a health check on consumer confidence.' },
  { id: 10, date: '2026-03-27', time: '15:00', country: 'US', event: 'University of Michigan Sentiment',   importance: 'medium', previous: '64.7',   forecast: '63.0',   actual: null,    category: 'Consumer',     description: 'Consumer confidence survey. Expectations component is closely watched as a leading indicator.' },
  { id: 11, date: '2026-03-28', time: 'All Day', country: 'US', event: 'Good Friday — US Markets Closed', importance: 'high',   previous: '—',      forecast: '—',      actual: null,    category: 'Holiday',      description: 'US equity and bond markets are closed. Reduced liquidity; avoid large position changes around this date.' },
  { id: 12, date: '2026-03-31', time: '09:00', country: 'EU', event: 'Eurozone CPI Flash Estimate (YoY)', importance: 'high',   previous: '2.3%',   forecast: '2.2%',   actual: null,    category: 'Inflation',    description: 'First estimate of Eurozone inflation. Key input for ECB rate cut decision at the April meeting.' },
  { id: 13, date: '2026-04-01', time: '07:00', country: 'UK', event: 'UK Manufacturing PMI Final',         importance: 'medium', previous: '46.9',   forecast: '47.2',   actual: null,    category: 'PMI',          description: 'Factory activity below 50 signals contraction. UK manufacturing has been persistently weak.' },
  { id: 14, date: '2026-04-01', time: '13:30', country: 'US', event: 'Non-Farm Payrolls (NFP)',            importance: 'high',   previous: '275K',   forecast: '200K',   actual: null,    category: 'Labour',       description: 'The single most market-moving monthly data release. Headline + revisions + AHE all matter.' },
  { id: 15, date: '2026-04-01', time: '13:30', country: 'US', event: 'Unemployment Rate',                  importance: 'high',   previous: '4.1%',   forecast: '4.1%',   actual: null,    category: 'Labour',       description: 'Any move above 4.2% would sharply increase probability of Fed cuts. Sahm Rule indicator to watch.' },
  { id: 16, date: '2026-04-01', time: '13:30', country: 'US', event: 'Average Hourly Earnings (MoM)',      importance: 'high',   previous: '0.3%',   forecast: '0.3%',   actual: null,    category: 'Labour',       description: 'Wage growth is central to services inflation. A beat here complicates the Fed\'s disinflation narrative.' },
  { id: 17, date: '2026-04-02', time: '07:00', country: 'UK', event: 'UK Services PMI Final',              importance: 'medium', previous: '51.1',   forecast: '51.0',   actual: null,    category: 'PMI',          description: 'Services sector remains the primary growth engine for UK. Above 50 is expansion territory.' },
  { id: 18, date: '2026-04-03', time: '13:30', country: 'CA', event: 'Canada Unemployment Rate',           importance: 'medium', previous: '6.6%',   forecast: '6.6%',   actual: null,    category: 'Labour',       description: 'Canadian labour market has softened. BOC cuts ahead of the Fed; domestic data supports easing.' },
  { id: 19, date: '2026-04-07', time: '00:30', country: 'AU', event: 'RBA Interest Rate Decision',         importance: 'high',   previous: '4.35%',  forecast: '4.10%',  actual: null,    category: 'Central Bank', description: 'RBA expected to cut 25bps. Watch for guidance on pace of future cuts and AUD reaction.' },
  { id: 20, date: '2026-04-09', time: '12:00', country: 'UK', event: 'BOE Interest Rate Decision',         importance: 'high',   previous: '5.00%',  forecast: '4.75%',  actual: null,    category: 'Central Bank', description: 'BOE decision with MPR. 25bp cut widely priced. Key signal: guidance on the pace of the easing cycle.' },
  { id: 21, date: '2026-04-09', time: '12:30', country: 'UK', event: 'BOE Press Conference — Gov Bailey',  importance: 'high',   previous: '—',      forecast: '—',      actual: null,    category: 'Central Bank', description: 'Forward guidance from Governor Bailey on terminal rate and future meeting-by-meeting approach.' },
  { id: 22, date: '2026-04-10', time: '13:30', country: 'US', event: 'US CPI (YoY)',                       importance: 'high',   previous: '3.2%',   forecast: '3.1%',   actual: null,    category: 'Inflation',    description: 'Headline inflation print. Core CPI excluding food/energy is the more actionable figure for markets.' },
  { id: 23, date: '2026-04-10', time: '13:30', country: 'US', event: 'US Core CPI (YoY)',                  importance: 'high',   previous: '3.8%',   forecast: '3.7%',   actual: null,    category: 'Inflation',    description: 'The stickiest component of US inflation. A downside surprise here could bring June cut back into play.' },
  { id: 24, date: '2026-04-14', time: '13:30', country: 'US', event: 'US Retail Sales (MoM)',              importance: 'high',   previous: '0.6%',   forecast: '0.4%',   actual: null,    category: 'Consumer',     description: 'Measures consumer spending. Core (ex-autos) is the cleaner read. Important for GDP tracking.' },
  { id: 25, date: '2026-04-17', time: '12:15', country: 'EU', event: 'ECB Interest Rate Decision',         importance: 'high',   previous: '4.00%',  forecast: '3.75%',  actual: null,    category: 'Central Bank', description: '25bp cut expected. Attention will be on the pace of future cuts and updated staff projections.' },
  { id: 26, date: '2026-04-17', time: '12:45', country: 'EU', event: 'ECB Monetary Policy Press Conference', importance: 'high', previous: '—',      forecast: '—',      actual: null,    category: 'Central Bank', description: 'Lagarde\'s press conference will set EUR direction. Watch for signals on June and the pace to neutral.' },
  { id: 27, date: '2026-04-23', time: '08:30', country: 'UK', event: 'UK PMI Composite Flash',             importance: 'medium', previous: '50.5',   forecast: '50.2',   actual: null,    category: 'PMI',          description: 'First estimate of UK economic activity. Below 50 would raise BOE dovish expectations further.' },
  { id: 28, date: '2026-04-25', time: '13:30', country: 'US', event: 'US GDP Q1 Advance Estimate (QoQ)',   importance: 'high',   previous: '3.1%',   forecast: '2.5%',   actual: null,    category: 'GDP',          description: 'First look at Q1 GDP growth. Significant deceleration expected; extent of slowdown matters for Fed path.' },
  { id: 29, date: '2026-04-29', time: '18:00', country: 'US', event: 'FOMC Interest Rate Decision',        importance: 'high',   previous: '5.50%',  forecast: '5.25%',  actual: null,    category: 'Central Bank', description: 'No cut expected at this meeting. Attention entirely on the statement language and dot plot revision.' },
  { id: 30, date: '2026-04-30', time: '18:30', country: 'US', event: 'FOMC Press Conference — Fed Chair Powell', importance: 'high', previous: '—',   forecast: '—',      actual: null,    category: 'Central Bank', description: 'Powell\'s Q&A will drive the USD and rates reaction. Any pivot language would be highly market-moving.' },
];

const CATEGORY_COLORS = {
  'Central Bank': 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  'Inflation':    'bg-red-400/15 text-red-400 border-red-400/20',
  'Labour':       'bg-blue-400/15 text-blue-400 border-blue-400/20',
  'GDP':          'bg-emerald-400/15 text-emerald-400 border-emerald-400/20',
  'PMI':          'bg-purple-400/15 text-purple-400 border-purple-400/20',
  'Consumer':     'bg-cyan-400/15 text-cyan-400 border-cyan-400/20',
  'Housing':      'bg-orange-400/15 text-orange-400 border-orange-400/20',
  'Holiday':      'bg-muted/40 text-muted-foreground border-border/30',
};

const TODAY = new Date('2026-03-26');
const todayStr = '2026-03-26';

function getWeekRange() {
  const start = new Date(TODAY);
  const end = new Date(TODAY);
  end.setDate(end.getDate() + 6);
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}
function getMonthRange() {
  return { start: '2026-03-26', end: '2026-04-30' };
}
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ActualBadge({ actual, forecast }) {
  if (!actual) return <span className="text-muted-foreground/30 text-xs font-mono">—</span>;
  const aNum = parseFloat(actual);
  const fNum = parseFloat(forecast);
  const beat = !isNaN(aNum) && !isNaN(fNum) && aNum > fNum;
  const miss = !isNaN(aNum) && !isNaN(fNum) && aNum < fNum;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
      beat ? 'bg-emerald-400/15 text-emerald-400' :
      miss ? 'bg-red-400/15 text-red-400' :
      'bg-muted/40 text-foreground'
    }`}>
      {beat ? <TrendingUp className="w-3 h-3" /> : miss ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {actual}
    </span>
  );
}

function EventCard({ event }) {
  const [open, setOpen] = useState(false);
  const isToday = event.date === todayStr;
  const isHigh = event.importance === 'high';

  return (
    <motion.div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isHigh
          ? 'border-border/40 bg-card/60 hover:border-primary/25'
          : 'border-border/25 bg-card/30 hover:border-border/50'
      } ${isToday ? 'ring-1 ring-primary/20' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        className="w-full text-left p-4 sm:p-5"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-4">
          {/* Time + Flag column */}
          <div className="shrink-0 w-16 sm:w-20 flex flex-col items-start gap-1">
            <span className={`text-xs font-mono font-semibold ${isToday ? 'text-primary' : 'text-foreground/60'}`}>
              {event.time}
            </span>
            <span className="text-lg leading-none">{FLAGS[event.country] || '🌐'}</span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-semibold leading-snug ${isToday ? 'text-foreground' : 'text-foreground/85'}`}>
                  {event.event}
                </span>
                {isHigh && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Zap className="w-2.5 h-2.5" /> HIGH
                  </span>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                <ActualBadge actual={event.actual} forecast={event.forecast} />
                {open
                  ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" />
                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[event.category] || ''}`}>
                {event.category}
              </Badge>
              <span className="text-xs text-muted-foreground">{event.country}</span>
              {event.previous !== '—' && (
                <span className="text-xs text-muted-foreground/70">
                  Prev: <span className="font-mono text-foreground/60">{event.previous}</span>
                </span>
              )}
              {event.forecast !== '—' && (
                <span className="text-xs text-muted-foreground/70">
                  Fcst: <span className="font-mono text-foreground/60">{event.forecast}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {open && event.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-0 ml-20 border-t border-border/20">
              <p className="text-xs text-muted-foreground leading-relaxed pt-3">{event.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DateSection({ dateStr, events }) {
  const isToday = dateStr === todayStr;
  const highCount = events.filter(e => e.importance === 'high').length;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-px flex-1 ${isToday ? 'bg-primary/30' : 'bg-border/40'}`} />
        <div className="flex items-center gap-2 shrink-0">
          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          <span className={`text-xs font-semibold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
            {isToday ? 'Today — ' : ''}{formatDate(dateStr)}
          </span>
          {highCount > 0 && (
            <span className="text-[10px] font-medium text-amber-400/70 bg-amber-400/8 px-1.5 py-0.5 rounded-full border border-amber-400/15">
              {highCount} high impact
            </span>
          )}
        </div>
        <div className={`h-px flex-1 ${isToday ? 'bg-primary/30' : 'bg-border/40'}`} />
      </div>
      <div className="space-y-2">
        {events.map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </div>
  );
}

export default function EconomicCalendar() {
  const [tab, setTab] = useState('today');

  const filtered = useMemo(() => {
    const { start: wStart, end: wEnd } = getWeekRange();
    const { start: mStart, end: mEnd } = getMonthRange();
    return EVENTS.filter(e => {
      if (tab === 'today') return e.date === todayStr;
      if (tab === 'week')  return e.date >= wStart && e.date <= wEnd;
      if (tab === 'month') return e.date >= mStart && e.date <= mEnd;
      return true;
    });
  }, [tab]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const keyToday = EVENTS.filter(e => e.date === todayStr && e.importance === 'high');

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">High-Impact Events Only</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground text-lg">
            Central bank decisions, macro releases, and market-moving events.
          </p>
        </motion.div>

        {/* Key Events Today */}
        {keyToday.length > 0 && tab === 'today' && (
          <motion.div
            className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">On Watch Today</span>
              <span className="text-xs text-muted-foreground ml-auto">{keyToday.length} high-impact events</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keyToday.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background/40 border border-border/20">
                  <span className="text-base">{FLAGS[e.country]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{e.event}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{e.time} · {e.category}</p>
                  </div>
                  {e.actual
                    ? <ActualBadge actual={e.actual} forecast={e.forecast} />
                    : <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">Pending</span>
                  }
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 glass rounded-xl w-fit">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week',  label: 'This Week' },
            { key: 'month', label: 'This Month' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-muted-foreground/60 mb-6 flex-wrap">
          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> High Impact</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-emerald-400" /> Beat</span>
          <span className="flex items-center gap-1.5"><TrendingDown className="w-3 h-3 text-red-400" /> Miss</span>
          <span className="ml-auto italic text-muted-foreground/40">Click any event to expand</span>
        </div>

        {/* Events */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {grouped.map(([dateStr, events]) => (
            <DateSection key={dateStr} dateStr={dateStr} events={events} />
          ))}
          {grouped.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No events for this period</p>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}