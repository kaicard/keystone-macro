import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

const IMPACT_COLORS = {
  High: 'bg-red-500/10 text-red-600 border-red-200',
  Medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
  Low: 'bg-slate-500/10 text-slate-600 border-slate-200',
};

const IMPACT_PRIORITY = { High: 0, Medium: 1, Low: 2 };

function formatTime(isoTime, userTimezone) {
  const date = new Date(isoTime);
  return date.toLocaleString('en-GB', {
    timeZone: userTimezone,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getImpactEmoji(impact) {
  const emojis = { High: '🔴', Medium: '🟡', Low: '⚪' };
  return emojis[impact] || '⚪';
}

export default function EconomicCalendarTable({ events, userTimezone, filter = 'all' }) {
  const filtered = useMemo(() => {
    const now = new Date();
    let filtered = events;

    if (filter === 'today') {
      filtered = events.filter(e => {
        const eventDate = new Date(e.releaseTime);
        return eventDate.toDateString() === now.toDateString();
      });
    } else if (filter === 'week') {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      filtered = events.filter(e => {
        const eventDate = new Date(e.releaseTime);
        return eventDate >= now && eventDate <= weekEnd;
      });
    } else if (filter === 'month') {
      const monthEnd = new Date(now);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      filtered = events.filter(e => {
        const eventDate = new Date(e.releaseTime);
        return eventDate >= now && eventDate <= monthEnd;
      });
    }

    return filtered.sort((a, b) => IMPACT_PRIORITY[a.impact] - IMPACT_PRIORITY[b.impact]);
  }, [events, filter]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30">
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time (UTC)</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Impact</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Previous</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Forecast</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actual</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(event => {
            const eventTime = new Date(event.releaseTime);
            const now = new Date();
            const isUpcoming = eventTime > now;
            const dataBeats = event.actual && parseFloat(event.actual) > parseFloat(event.forecast);

            return (
              <tr key={event.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 text-xs font-medium">{formatTime(event.releaseTime, userTimezone)}</td>
                <td className="py-3 px-4 font-semibold">{event.country}</td>
                <td className="py-3 px-4">{event.event}</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-lg">{getImpactEmoji(event.impact)}</span>
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">{event.previous}%</td>
                <td className="py-3 px-4 text-right text-foreground font-medium">{event.forecast}%</td>
                <td className={`py-3 px-4 text-right font-semibold ${event.actual ? (dataBeats ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                  {event.actual ? (
                    <span className="flex items-center justify-end gap-1">
                      {event.actual}% {dataBeats ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={isUpcoming ? 'outline' : 'secondary'} className={IMPACT_COLORS[event.impact]}>
                    {isUpcoming ? 'Upcoming' : 'Released'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No events in this period</div>
      )}
    </div>
  );
}