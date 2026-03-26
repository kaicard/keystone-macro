import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Country flags as emoji
const FLAGS = {
  US: '🇺🇸', UK: '🇬🇧', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳',
  CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭', DE: '🇩🇪', FR: '🇫🇷',
};

// High-impact economic calendar — curated institutional events
const EVENTS = [
  // TODAY (2026-03-26)
  { id: 1, date: '2026-03-26', time: '07:00', country: 'UK', event: 'UK CPI (YoY)', importance: 'high', previous: '3.0%', forecast: '2.9%', actual: '2.8%', category: 'Inflation' },
  { id: 2, date: '2026-03-26', time: '09:00', country: 'EU', event: 'ECB President Lagarde Speech', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank' },
  { id: 3, date: '2026-03-26', time: '13:30', country: 'US', event: 'Core PCE Price Index (MoM)', importance: 'high', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Inflation' },
  { id: 4, date: '2026-03-26', time: '13:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '223K', forecast: '218K', actual: null, category: 'Labour' },
  { id: 5, date: '2026-03-26', time: '15:00', country: 'US', event: 'Pending Home Sales (MoM)', importance: 'medium', previous: '-4.6%', forecast: '1.0%', actual: null, category: 'Housing' },
  { id: 6, date: '2026-03-26', time: '18:00', country: 'US', event: 'Fed Chair Powell Speech', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank' },

  // THIS WEEK (2026-03-27)
  { id: 7, date: '2026-03-27', time: '07:00', country: 'DE', event: 'Germany GDP (QoQ)', importance: 'high', previous: '-0.2%', forecast: '0.1%', actual: null, category: 'GDP' },
  { id: 8, date: '2026-03-27', time: '13:30', country: 'US', event: 'US GDP (QoQ)', importance: 'high', previous: '3.1%', forecast: '2.8%', actual: null, category: 'GDP' },
  { id: 9, date: '2026-03-27', time: '13:30', country: 'US', event: 'Personal Consumption Expenditure', importance: 'medium', previous: '0.7%', forecast: '0.4%', actual: null, category: 'Consumer' },
  { id: 10, date: '2026-03-27', time: '15:00', country: 'US', event: 'University of Michigan Sentiment', importance: 'medium', previous: '64.7', forecast: '63.0', actual: null, category: 'Consumer' },

  // NEXT WEEK
  { id: 11, date: '2026-03-28', time: 'All Day', country: 'US', event: 'Good Friday — US Markets Closed', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Holiday' },
  { id: 12, date: '2026-03-31', time: '09:00', country: 'EU', event: 'Eurozone CPI Flash Estimate (YoY)', importance: 'high', previous: '2.3%', forecast: '2.2%', actual: null, category: 'Inflation' },
  { id: 13, date: '2026-04-01', time: '07:00', country: 'UK', event: 'UK Manufacturing PMI Final', importance: 'medium', previous: '46.9', forecast: '47.2', actual: null, category: 'PMI' },
  { id: 14, date: '2026-04-01', time: '13:30', country: 'US', event: 'Non-Farm Payrolls (NFP)', importance: 'high', previous: '275K', forecast: '200K', actual: null, category: 'Labour' },
  { id: 15, date: '2026-04-01', time: '13:30', country: 'US', event: 'Unemployment Rate', importance: 'high', previous: '4.1%', forecast: '4.1%', actual: null, category: 'Labour' },
  { id: 16, date: '2026-04-01', time: '13:30', country: 'US', event: 'Average Hourly Earnings (MoM)', importance: 'high', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Labour' },
  { id: 17, date: '2026-04-02', time: '07:00', country: 'UK', event: 'UK Services PMI Final', importance: 'medium', previous: '51.1', forecast: '51.0', actual: null, category: 'PMI' },
  { id: 18, date: '2026-04-03', time: '13:30', country: 'CA', event: 'Canada Unemployment Rate', importance: 'medium', previous: '6.6%', forecast: '6.6%', actual: null, category: 'Labour' },

  // FURTHER IN MONTH
  { id: 19, date: '2026-04-07', time: '00:30', country: 'AU', event: 'RBA Interest Rate Decision', importance: 'high', previous: '4.35%', forecast: '4.10%', actual: null, category: 'Central Bank' },
  { id: 20, date: '2026-04-09', time: '12:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '5.00%', forecast: '4.75%', actual: null, category: 'Central Bank' },
  { id: 21, date: '2026-04-09', time: '12:30', country: 'UK', event: 'BOE Press Conference — Gov Bailey', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank' },
  { id: 22, date: '2026-04-10', time: '13:30', country: 'US', event: 'US CPI (YoY)', importance: 'high', previous: '3.2%', forecast: '3.1%', actual: null, category: 'Inflation' },
  { id: 23, date: '2026-04-10', time: '13:30', country: 'US', event: 'US Core CPI (YoY)', importance: 'high', previous: '3.8%', forecast: '3.7%', actual: null, category: 'Inflation' },
  { id: 24, date: '2026-04-14', time: '13:30', country: 'US', event: 'US Retail Sales (MoM)', importance: 'high', previous: '0.6%', forecast: '0.4%', actual: null, category: 'Consumer' },
  { id: 25, date: '2026-04-17', time: '12:15', country: 'EU', event: 'ECB Interest Rate Decision', importance: 'high', previous: '4.00%', forecast: '3.75%', actual: null, category: 'Central Bank' },
  { id: 26, date: '2026-04-17', time: '12:45', country: 'EU', event: 'ECB Monetary Policy Press Conference', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank' },
  { id: 27, date: '2026-04-23', time: '08:30', country: 'UK', event: 'UK PMI Composite Flash', importance: 'medium', previous: '50.5', forecast: '50.2', actual: null, category: 'PMI' },
  { id: 28, date: '2026-04-25', time: '13:30', country: 'US', event: 'US GDP Q1 Advance Estimate (QoQ)', importance: 'high', previous: '3.1%', forecast: '2.5%', actual: null, category: 'GDP' },
  { id: 29, date: '2026-04-29', time: '18:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '5.50%', forecast: '5.25%', actual: null, category: 'Central Bank' },
  { id: 30, date: '2026-04-30', time: '18:30', country: 'US', event: 'FOMC Press Conference — Fed Chair Powell', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank' },
];

const CATEGORY_COLORS = {
  'Central Bank': 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  'Inflation': 'bg-red-400/15 text-red-400 border-red-400/20',
  'Labour': 'bg-blue-400/15 text-blue-400 border-blue-400/20',
  'GDP': 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20',
  'PMI': 'bg-purple-400/15 text-purple-400 border-purple-400/20',
  'Consumer': 'bg-cyan-400/15 text-cyan-400 border-cyan-400/20',
  'Housing': 'bg-orange-400/15 text-orange-400 border-orange-400/20',
  'Holiday': 'bg-muted/40 text-muted-foreground border-border/30',
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

function formatEventDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ActualBadge({ actual, forecast }) {
  if (!actual) return <span className="text-muted-foreground/40 text-xs">—</span>;
  const isBeaten = forecast && parseFloat(actual) > parseFloat(forecast);
  const isMissed = forecast && parseFloat(actual) < parseFloat(forecast);
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
      isBeaten ? 'bg-emerald-400/15 text-emerald-400' :
      isMissed ? 'bg-red-400/15 text-red-400' :
      'text-foreground'
    }`}>{actual}</span>
  );
}

function EventRow({ event }) {
  const [open, setOpen] = useState(false);
  const isToday = event.date === todayStr;
  const isPast = event.actual != null;

  return (
    <>
      <tr
        className={`border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer ${
          isToday && event.importance === 'high' ? 'bg-primary/3' : ''
        }`}
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3 text-xs text-muted-foreground font-mono w-20 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-foreground/70">{event.time}</span>
            {isToday && <span className="text-primary text-[10px] font-semibold uppercase tracking-wide">Today</span>}
          </div>
        </td>
        <td className="px-4 py-3 w-12 text-center">
          <span className="text-xl">{FLAGS[event.country] || '🌐'}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>
              {event.event}
            </span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[event.category] || ''}`}>
              {event.category}
            </Badge>
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          {event.importance === 'high' ? (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-amber-400 font-semibold ml-1">HIGH</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-muted-foreground/40 text-muted-foreground/40" />
              <Star className="w-3 h-3 fill-muted-foreground/40 text-muted-foreground/40" />
              <Star className="w-3 h-3 text-muted-foreground/20" />
              <span className="text-xs text-muted-foreground ml-1">MED</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground text-right hidden sm:table-cell">{event.previous}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground text-right hidden sm:table-cell">{event.forecast}</td>
        <td className="px-4 py-3 text-right w-20">
          <ActualBadge actual={event.actual} forecast={event.forecast} />
        </td>
        <td className="px-4 py-3 text-muted-foreground/40 w-8">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border/20 bg-muted/5">
          <td colSpan={8} className="px-6 py-3">
            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <div><span className="font-semibold text-foreground">Country:</span> {event.country} {FLAGS[event.country]}</div>
              <div className="sm:hidden"><span className="font-semibold text-foreground">Previous:</span> {event.previous}</div>
              <div className="sm:hidden"><span className="font-semibold text-foreground">Forecast:</span> {event.forecast}</div>
              <div><span className="font-semibold text-foreground">Category:</span> {event.category}</div>
              <div><span className="font-semibold text-foreground">Impact:</span> <span className={event.importance === 'high' ? 'text-amber-400' : ''}>{event.importance === 'high' ? 'High — markets typically move on this release' : 'Medium — directional signal'}</span></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DateGroup({ dateStr, events }) {
  const isToday = dateStr === todayStr;
  return (
    <tbody>
      <tr className="bg-muted/20">
        <td colSpan={8} className="px-4 py-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {isToday ? '📅 Today — ' : ''}{formatEventDate(dateStr)}
            </span>
            {isToday && <span className="text-[10px] text-primary/60">({events.length} events)</span>}
          </div>
        </td>
      </tr>
      {events.map(e => <EventRow key={e.id} event={e} />)}
    </tbody>
  );
}

export default function EconomicCalendar() {
  const [tab, setTab] = useState('today');

  const filtered = useMemo(() => {
    const { start: wStart, end: wEnd } = getWeekRange();
    const { start: mStart, end: mEnd } = getMonthRange();
    return EVENTS.filter(e => {
      if (tab === 'today') return e.date === todayStr;
      if (tab === 'week') return e.date >= wStart && e.date <= wEnd;
      if (tab === 'month') return e.date >= mStart && e.date <= mEnd;
      return true;
    });
  }, [tab]);

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Key events today (high impact, today)
  const keyToday = EVENTS.filter(e => e.date === todayStr && e.importance === 'high');

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">High-Impact Events Only</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground text-lg">
            Central bank decisions, macro releases, and market-moving events.
          </p>
        </motion.div>

        {/* Key Events Today Banner */}
        {keyToday.length > 0 && (
          <motion.div
            className="mb-6 glass rounded-xl p-4 border-l-2 border-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Key Events Today</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keyToday.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <span>{FLAGS[e.country]}</span>
                  <span className="text-xs font-mono text-muted-foreground">{e.time}</span>
                  <span className="text-xs font-medium">{e.event}</span>
                  {e.actual && <span className="text-xs text-emerald-400 font-bold ml-1">✓ {e.actual}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 p-1 glass rounded-xl w-fit">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
            High Impact
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <Star className="w-3 h-3 fill-muted-foreground/40 text-muted-foreground/40" />
              <Star className="w-3 h-3 fill-muted-foreground/40 text-muted-foreground/40" />
            </div>
            Medium Impact
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400/20 inline-block" /> Beat
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-400/20 inline-block" /> Miss
          </div>
          <span className="ml-auto italic">All times in local (London)</span>
        </div>

        {/* Calendar Table */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time</div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">Ctry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Impact</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Prev</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Fcst</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual</th>
                  <th className="w-8" />
                </tr>
              </thead>
              {grouped.map(([dateStr, events]) => (
                <DateGroup key={dateStr} dateStr={dateStr} events={events} />
              ))}
              {grouped.length === 0 && (
                <tbody>
                  <tr><td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">No events for this period</td></tr>
                </tbody>
              )}
            </table>
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground/30 mt-6 text-center">
          Curated high-impact events only. Times in London (BST/GMT). Not financial advice.
        </p>
      </div>
    </div>
  );
}