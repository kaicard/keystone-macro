import React, { useState, useMemo } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const COUNTRY_LABELS = {
  US: 'US', UK: 'UK', EU: 'EU', JP: 'JP', CN: 'CN',
  CA: 'CA', AU: 'AU', CH: 'CH', DE: 'DE', FR: 'FR',
};

const CATEGORY_COLORS = {
  'Central Bank': 'text-amber-400',
  'Inflation':    'text-red-400',
  'Labour':       'text-blue-400',
  'GDP':          'text-emerald-400',
  'PMI':          'text-purple-400',
  'Consumer':     'text-cyan-400',
  'Housing':      'text-orange-400',
  'Holiday':      'text-muted-foreground',
};

const EVENTS = [
  // March 26 — Yesterday (all released)
  { id: 1,  date: '2026-03-26', time: '07:00', country: 'UK', event: 'UK CPI (YoY)',                   importance: 'high',   previous: '3.0%',  forecast: '2.9%',  actual: '2.8%',  category: 'Inflation',
    outcome: 'Inflation fell to 2.8%, below both consensus and prior, its lowest since mid-2021. Services CPI softened to 4.7%. This materially increased market pricing for a BOE rate cut in May, with GBP/USD dipping ~30 pips on release.' },
  { id: 2,  date: '2026-03-26', time: '09:00', country: 'EU', event: 'ECB President Lagarde Speech',   importance: 'high',   previous: '—',     forecast: '—',     actual: '✓',     category: 'Central Bank',
    outcome: 'Lagarde reiterated data-dependency and flagged that tariff uncertainty warranted caution on the rate path. She declined to commit to a June cut explicitly, though markets continue to price ~70% probability. EUR/USD edged lower.' },
  { id: 3,  date: '2026-03-26', time: '12:30', country: 'US', event: 'Initial Jobless Claims',         importance: 'medium', previous: '223K',  forecast: '225K',  actual: '224K',  category: 'Labour',
    outcome: 'Claims printed in-line at 224K, offering little directional signal. Continuing claims ticked up slightly to 1.87M but remain consistent with a stable, if softening, labour market.' },
  { id: 4,  date: '2026-03-26', time: '12:30', country: 'US', event: 'Durable Goods Orders (MoM)',     importance: 'high',   previous: '3.2%',  forecast: '-1.0%', actual: '0.9%',  category: 'Consumer',
    outcome: 'Durable goods surprised strongly to the upside at +0.9% vs -1.0% forecast, driven by transport equipment. Core capital goods orders (ex-aircraft, non-defense) rose 0.7%, a positive signal for business investment.' },

  // March 27 — Today
  { id: 5,  date: '2026-03-27', time: '07:00', country: 'DE', event: 'Germany Ifo Business Climate',   importance: 'high',   previous: '85.2',  forecast: '85.8',  actual: '86.7',  category: 'PMI',
    outcome: 'Ifo beat strongly at 86.7, the highest reading since June 2024. Both current conditions and expectations improved. This may reflect fiscal optimism following the German infrastructure package announcement. EUR briefly spiked on the release.' },
  { id: 6,  date: '2026-03-27', time: '07:00', country: 'UK', event: 'UK Retail Sales (MoM)',          importance: 'high',   previous: '-0.6%', forecast: '0.4%',  actual: '1.0%',  category: 'Consumer',
    outcome: 'UK Retail Sales surprised significantly to the upside at +1.0% MoM (consensus +0.4%). Food and clothing drove the gain. This, combined with Wednesday\'s soft CPI, gives the BOE a mixed picture — strong demand but easing price pressures.' },
  { id: 7,  date: '2026-03-27', time: '12:30', country: 'US', event: 'US GDP Q4 Final (QoQ Ann.)',     importance: 'high',   previous: '2.3%',  forecast: '2.3%',  actual: '2.4%',  category: 'GDP',
    outcome: 'GDP was revised marginally higher to 2.4% annualised in the final Q4 print. Consumer spending was revised up to 4.2%. The resilience of US growth in Q4 contrasts with softening Q1 2026 data, creating some uncertainty for the Fed\'s path.' },
  { id: 8,  date: '2026-03-27', time: '12:30', country: 'US', event: 'Core PCE Price Index (QoQ)',     importance: 'high',   previous: '2.5%',  forecast: '2.5%',  actual: '2.6%',  category: 'Inflation',
    outcome: 'Core PCE for Q4 was revised slightly higher to 2.6%, a modest hawkish surprise. This reinforces the Fed\'s patience on rate cuts — pricing for a June reduction held largely stable post-release.' },
  { id: 9,  date: '2026-03-27', time: '15:00', country: 'US', event: 'University of Michigan Sentiment (Final)', importance: 'medium', previous: '57.9', forecast: '57.9', actual: null, category: 'Consumer',
    outcome: null },

  // March 28 — Good Friday
  { id: 10, date: '2026-03-28', time: 'All Day', country: 'US', event: 'Good Friday — US & UK Markets Closed', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Holiday',
    outcome: null },
  { id: 11, date: '2026-03-28', time: '12:30', country: 'US', event: 'Core PCE Price Index (MoM) — Feb', importance: 'high', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Inflation',
    outcome: 'Note: Released Good Friday. Markets closed; reaction will be Monday. Consensus is 0.3% MoM with the YoY rate holding at 2.8%.' },

  // March 31
  { id: 12, date: '2026-03-31', time: '09:00', country: 'EU', event: 'Eurozone CPI Flash (YoY)',        importance: 'high',   previous: '2.3%',  forecast: '2.2%',  actual: null,    category: 'Inflation',
    outcome: null },
  { id: 13, date: '2026-03-31', time: '09:00', country: 'EU', event: 'Eurozone Core CPI Flash (YoY)',   importance: 'high',   previous: '2.6%',  forecast: '2.5%',  actual: null,    category: 'Inflation',
    outcome: null },

  // April 1
  { id: 14, date: '2026-04-01', time: '09:00', country: 'UK', event: 'UK Manufacturing PMI Final',      importance: 'medium', previous: '46.9',  forecast: '47.2',  actual: null,    category: 'PMI',
    outcome: null },
  { id: 15, date: '2026-04-01', time: '14:00', country: 'US', event: 'ISM Manufacturing PMI',           importance: 'high',   previous: '50.3',  forecast: '49.8',  actual: null,    category: 'PMI',
    outcome: null },

  // April 2
  { id: 16, date: '2026-04-02', time: '09:00', country: 'EU', event: 'Eurozone Services PMI Final',     importance: 'medium', previous: '50.6',  forecast: '50.6',  actual: null,    category: 'PMI',
    outcome: null },
  { id: 17, date: '2026-04-02', time: '14:00', country: 'US', event: 'ISM Services PMI',               importance: 'high',   previous: '53.5',  forecast: '53.0',  actual: null,    category: 'PMI',
    outcome: null },
  { id: 18, date: '2026-04-02', time: '14:00', country: 'US', event: 'JOLTS Job Openings',              importance: 'medium', previous: '7.74M', forecast: '7.60M', actual: null,    category: 'Labour',
    outcome: null },

  // April 3
  { id: 19, date: '2026-04-03', time: '12:30', country: 'US', event: 'Non-Farm Payrolls (NFP)',         importance: 'high',   previous: '151K',  forecast: '140K',  actual: null,    category: 'Labour',
    outcome: null },
  { id: 20, date: '2026-04-03', time: '12:30', country: 'US', event: 'Unemployment Rate',              importance: 'high',   previous: '4.1%',  forecast: '4.1%',  actual: null,    category: 'Labour',
    outcome: null },
  { id: 21, date: '2026-04-03', time: '12:30', country: 'US', event: 'Average Hourly Earnings (MoM)', importance: 'medium', previous: '0.3%',  forecast: '0.3%',  actual: null,    category: 'Labour',
    outcome: null },
  { id: 22, date: '2026-04-03', time: '12:30', country: 'CA', event: 'Canada Employment Change',       importance: 'medium', previous: '1.1K',  forecast: '10.0K', actual: null,    category: 'Labour',
    outcome: null },

  // April 7
  { id: 23, date: '2026-04-07', time: '04:30', country: 'AU', event: 'RBA Interest Rate Decision',     importance: 'high',   previous: '4.10%', forecast: '4.10%', actual: null,    category: 'Central Bank',
    outcome: null },

  // April 9
  { id: 24, date: '2026-04-09', time: '12:00', country: 'UK', event: 'BOE Interest Rate Decision',     importance: 'high',   previous: '4.50%', forecast: '4.25%', actual: null,    category: 'Central Bank',
    outcome: null },
  { id: 25, date: '2026-04-09', time: '12:30', country: 'UK', event: 'BOE MPC Minutes & Press Conference', importance: 'high', previous: '—',    forecast: '—',     actual: null,    category: 'Central Bank',
    outcome: null },

  // April 10
  { id: 26, date: '2026-04-10', time: '12:30', country: 'US', event: 'US CPI (YoY)',                   importance: 'high',   previous: '2.8%',  forecast: '2.6%',  actual: null,    category: 'Inflation',
    outcome: null },
  { id: 27, date: '2026-04-10', time: '12:30', country: 'US', event: 'US Core CPI (YoY)',              importance: 'high',   previous: '3.1%',  forecast: '3.0%',  actual: null,    category: 'Inflation',
    outcome: null },

  // April 14
  { id: 28, date: '2026-04-14', time: '12:30', country: 'US', event: 'US Retail Sales (MoM)',          importance: 'high',   previous: '-0.9%', forecast: '0.6%',  actual: null,    category: 'Consumer',
    outcome: null },

  // April 16
  { id: 29, date: '2026-04-16', time: '12:30', country: 'US', event: 'US Housing Starts',              importance: 'medium', previous: '1.37M', forecast: '1.39M', actual: null,    category: 'Housing',
    outcome: null },

  // April 17
  { id: 30, date: '2026-04-17', time: '12:15', country: 'EU', event: 'ECB Interest Rate Decision',     importance: 'high',   previous: '2.65%', forecast: '2.40%', actual: null,    category: 'Central Bank',
    outcome: null },
  { id: 31, date: '2026-04-17', time: '12:45', country: 'EU', event: 'ECB Press Conference',           importance: 'high',   previous: '—',     forecast: '—',     actual: null,    category: 'Central Bank',
    outcome: null },

  // April 23
  { id: 32, date: '2026-04-23', time: '08:30', country: 'UK', event: 'UK PMI Composite Flash',         importance: 'medium', previous: '50.5',  forecast: '50.3',  actual: null,    category: 'PMI',
    outcome: null },
  { id: 33, date: '2026-04-23', time: '09:00', country: 'EU', event: 'Eurozone PMI Composite Flash',   importance: 'high',   previous: '50.2',  forecast: '50.5',  actual: null,    category: 'PMI',
    outcome: null },
  { id: 34, date: '2026-04-23', time: '13:45', country: 'US', event: 'S&P Global US PMI Composite Flash', importance: 'medium', previous: '53.5', forecast: '52.8', actual: null,   category: 'PMI',
    outcome: null },

  // April 25
  { id: 35, date: '2026-04-25', time: '12:30', country: 'US', event: 'US GDP Q1 Advance (QoQ Ann.)',   importance: 'high',   previous: '2.4%',  forecast: '1.5%',  actual: null,    category: 'GDP',
    outcome: null },
  { id: 36, date: '2026-04-25', time: '12:30', country: 'US', event: 'Core PCE Price Index (MoM) — Mar', importance: 'high', previous: '0.4%',  forecast: '0.3%',  actual: null,    category: 'Inflation',
    outcome: null },

  // April 29
  { id: 37, date: '2026-04-29', time: '18:00', country: 'US', event: 'FOMC Interest Rate Decision',    importance: 'high',   previous: '4.25–4.50%', forecast: '4.25–4.50%', actual: null, category: 'Central Bank',
    outcome: null },
  { id: 38, date: '2026-04-30', time: '18:30', country: 'US', event: 'FOMC Press Conference',          importance: 'high',   previous: '—',     forecast: '—',     actual: null,    category: 'Central Bank',
    outcome: null },
];

const TODAY = '2026-03-27';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getWeekEnd() {
  const d = new Date(TODAY + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function ActualBadge({ actual, forecast }) {
  if (!actual) return <span className="text-muted-foreground/30 text-xs font-mono tabular-nums">—</span>;
  const aNum = parseFloat(actual);
  const fNum = parseFloat(forecast);
  const beat = !isNaN(aNum) && !isNaN(fNum) && aNum > fNum;
  const miss = !isNaN(aNum) && !isNaN(fNum) && aNum < fNum;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded ${
      beat ? 'bg-emerald-400/15 text-emerald-400' :
      miss ? 'bg-red-400/15 text-red-400' :
      'bg-muted/50 text-foreground/80'
    }`}>
      {beat ? <TrendingUp className="w-3 h-3" /> : miss ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {actual}
    </span>
  );
}

function EventRow({ event }) {
  const [open, setOpen] = useState(false);
  const isToday = event.date === TODAY;
  const isHigh = event.importance === 'high';
  const catColor = CATEGORY_COLORS[event.category] || 'text-muted-foreground';
  const hasPending = event.forecast !== '—' && !event.actual;

  return (
    <div className={`border-b border-border/20 last:border-0 ${isToday && isHigh ? 'bg-primary/3' : ''}`}>
      <button
        className="w-full text-left px-5 py-3.5 hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          {/* Time */}
          <span className={`text-xs font-mono w-14 shrink-0 ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground/60'}`}>
            {event.time}
          </span>

          {/* Country */}
          <span className="text-[10px] font-bold text-muted-foreground/60 w-6 shrink-0 tracking-wide">{COUNTRY_LABELS[event.country] || event.country}</span>

          {/* Impact dot */}
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isHigh ? 'bg-amber-400' : event.importance === 'medium' ? 'bg-blue-400/70' : 'bg-border'
          }`} />

          {/* Event name */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>
              {event.event}
            </span>
            <span className={`text-xs shrink-0 hidden sm:inline ${catColor}`}>{event.category}</span>
          </div>

          {/* Data columns */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="hidden md:flex flex-col items-end w-16">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Prev</span>
              <span className="text-xs font-mono text-muted-foreground/70 tabular-nums">{event.previous}</span>
            </div>
            <div className="hidden md:flex flex-col items-end w-16">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Fcst</span>
              <span className={`text-xs font-mono tabular-nums ${hasPending ? 'text-primary/70' : 'text-muted-foreground/70'}`}>
                {event.forecast}
              </span>
            </div>
            <div className="flex flex-col items-end w-20">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Actual</span>
              <ActualBadge actual={event.actual} forecast={event.forecast} />
            </div>
            <span className="text-muted-foreground/30 w-4">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pl-[4.5rem] border-t border-border/15">
              <p className="text-xs text-muted-foreground leading-relaxed pt-3">
                {event.outcome || `${event.event} is scheduled at ${event.time}. ${event.forecast !== '—' ? `Market consensus is ${event.forecast} versus the prior reading of ${event.previous}.` : 'No specific consensus forecast.'} ${event.category === 'Central Bank' ? 'Any forward guidance on rates or policy will be the primary market driver.' : ''}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DateGroup({ dateStr, events }) {
  const isToday = dateStr === TODAY;
  const highCount = events.filter(e => e.importance === 'high').length;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2 px-1">
        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
        <span className={`text-xs font-semibold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
          {isToday ? 'Today · ' : ''}{formatDate(dateStr)}
        </span>
        {highCount > 0 && (
          <span className="text-[10px] text-amber-400/70 px-1.5 py-0.5 rounded bg-amber-400/8 border border-amber-400/15 ml-auto">
            {highCount} high impact
          </span>
        )}
      </div>
      <div className="glass rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-2 border-b border-border/30 bg-muted/5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-14">Time</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-6 shrink-0">Ctry</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-3 shrink-0" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 flex-1">Event</span>
          <div className="flex items-center gap-5 shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-16 text-right hidden md:block">Previous</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-16 text-right hidden md:block">Forecast</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-20 text-right">Actual</span>
            <span className="w-4" />
          </div>
        </div>
        {events.map(e => <EventRow key={e.id} event={e} />)}
      </div>
    </div>
  );
}

export default function EconomicCalendar() {
  const [tab, setTab] = useState('today');

  const filtered = useMemo(() => {
    const weekEnd = getWeekEnd();
    return EVENTS.filter(e => {
      if (tab === 'today') return e.date === TODAY;
      if (tab === 'week')  return e.date >= TODAY && e.date <= weekEnd;
      if (tab === 'month') return e.date >= TODAY && e.date <= '2026-04-30';
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

  const todayHighCount = EVENTS.filter(e => e.date === TODAY && e.importance === 'high').length;
  const todayReleasedCount = EVENTS.filter(e => e.date === TODAY && e.actual).length;

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Macro Events</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground">
            Central bank decisions, macro releases, and market-moving data.
          </p>
        </motion.div>

        {/* Stats strip */}
        {tab === 'today' && (
          <motion.div
            className="flex gap-4 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">High Impact Today</p>
                <p className="text-lg font-semibold">{todayHighCount}</p>
              </div>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-lg font-semibold">{todayReleasedCount} <span className="text-sm font-normal text-muted-foreground">/ {EVENTS.filter(e => e.date === TODAY).length}</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 glass rounded-xl w-fit">
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

        {/* Events */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {grouped.map(([dateStr, events]) => (
            <DateGroup key={dateStr} dateStr={dateStr} events={events} />
          ))}
          {grouped.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No events for this period</p>
            </div>
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground/30 text-center mt-8">
          Click any row to see the outcome summary. Times shown in local release timezone.
        </p>
      </div>
    </div>
  );
}