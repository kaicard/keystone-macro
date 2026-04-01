import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageBackground from '@/components/layout/PageBackground';
import EconomicCalendarTable from '@/components/economic/EconomicCalendarTable';
import EconomicSummaryCards from '@/components/economic/EconomicSummaryCards';

export default function EconomicCalendar() {
  const [filter, setFilter] = useState('all');
  const [userTimezone, setUserTimezone] = useState('Europe/London');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60);

  // Get user timezone from browser
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz);
    } catch {
      setUserTimezone('Europe/London');
    }
  }, []);

  // Fetch events with 5-minute cache
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['economic-events'],
    queryFn: async () => {
      const response = await base44.functions.invoke('economicEvents', {});
      setLastUpdated(new Date());
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 60 seconds
  });

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const events = data?.events || [];

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-2">Economic Calendar</h1>
              <p className="text-muted-foreground text-lg">Major macro events • Accurate release times • Live updates</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {lastUpdated && (
                <div className="text-xs text-muted-foreground/60">
                  <p>Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Next: {autoRefreshCountdown}s</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {!isLoading && events.length > 0 && (
          <EconomicSummaryCards events={events} userTimezone={userTimezone} />
        )}

        {/* Tabs & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass border-border/30 mb-6">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading calendar...</span>
                </div>
              </div>
            ) : (
              <EconomicCalendarTable events={events} userTimezone={userTimezone} filter={filter} />
            )}
          </Tabs>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          className="text-xs text-muted-foreground/50 text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Times shown in your timezone ({userTimezone}) • Data updated every 60 seconds • High-impact events sorted first
        </motion.p>
      </div>
    </div>
  );
}