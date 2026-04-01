import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function formatTime(isoTime, userTimezone) {
  const date = new Date(isoTime);
  return date.toLocaleString('en-GB', {
    timeZone: userTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function EconomicSummaryCards({ events, userTimezone }) {
  const now = new Date();

  const highImpactToday = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.releaseTime);
      return (
        eventDate.toDateString() === now.toDateString() &&
        e.impact === 'High'
      );
    }).slice(0, 3);
  }, [events, now]);

  const nextEvent = useMemo(() => {
    return events.find(e => new Date(e.releaseTime) > now);
  }, [events, now]);

  const recentReleases = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.releaseTime);
      return eventDate <= now && eventDate > new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }).slice(0, 3);
  }, [events, now]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* High Impact Today */}
      <motion.div
        className="glass rounded-xl p-6 border border-red-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="font-semibold text-sm">High Impact Today</h3>
        </div>
        {highImpactToday.length > 0 ? (
          <div className="space-y-3">
            {highImpactToday.map(e => (
              <div key={e.id} className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">{e.event}</p>
                  <p className="text-xs text-muted-foreground">{e.country}</p>
                </div>
                <p className="text-xs font-mono text-primary whitespace-nowrap">{formatTime(e.releaseTime, userTimezone)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No high-impact events today</p>
        )}
      </motion.div>

      {/* Next Event */}
      <motion.div
        className="glass rounded-xl p-6 border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Upcoming</h3>
        </div>
        {nextEvent ? (
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">{nextEvent.event}</p>
              <p className="text-xs text-muted-foreground mb-2">{nextEvent.country}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary font-mono font-semibold">{formatTime(nextEvent.releaseTime, userTimezone)}</span>
                <Badge variant="outline" className="text-xs bg-primary/5">
                  {nextEvent.impact === 'High' ? '🔴' : nextEvent.impact === 'Medium' ? '🟡' : '⚪'} {nextEvent.impact}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No upcoming events</p>
        )}
      </motion.div>

      {/* Recent Releases */}
      <motion.div
        className="glass rounded-xl p-6 border border-emerald-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-sm">Recently Released</h3>
        </div>
        {recentReleases.length > 0 ? (
          <div className="space-y-3">
            {recentReleases.map(e => {
              const beats = e.actual && parseFloat(e.actual) > parseFloat(e.forecast);
              return (
                <div key={e.id} className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{e.event}</p>
                    <p className="text-xs text-muted-foreground">{e.country}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${beats ? 'text-emerald-500' : 'text-red-500'}`}>
                      {e.actual ? `${e.actual}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">vs {e.forecast}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No recent releases</p>
        )}
      </motion.div>
    </div>
  );
}