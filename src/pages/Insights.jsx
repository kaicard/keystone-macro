import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, BarChart3, Lock } from 'lucide-react';
import PageBackground from '@/components/layout/PageBackground';
import SubscriberGrowthChart from '@/components/insights/SubscriberGrowthChart';
import TierBreakdown from '@/components/insights/TierBreakdown';
import ContentOutputChart from '@/components/insights/ContentOutputChart';
import CategoryBreakdown from '@/components/insights/CategoryBreakdown';

const ADMIN_EMAILS = ['kaicard05@gmail.com', 'hello@keystonemacro.com'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatWeekStart(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export default function Insights() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch { setUser(null); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, []);

  const { data: freeSubs = [] } = useQuery({ queryKey: ['insights-free'], queryFn: () => base44.entities.NewsletterSubscriber.list('-created_date', 200) });
  const { data: premiumSubs = [] } = useQuery({ queryKey: ['insights-prem'], queryFn: () => base44.entities.NewsletterSubscription.list('-created_date', 200) });
  const { data: editions = [] } = useQuery({ queryKey: ['insights-editions'], queryFn: () => base44.entities.NewsletterEdition.list('-publish_date', 200) });
  const { data: notes = [] } = useQuery({ queryKey: ['insights-notes'], queryFn: () => base44.entities.ResearchNote.list('-publish_date', 200) });

  const threeMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  }, []);

  const weeklyData = useMemo(() => {
    const weeks = [];
    const start = getWeekKey(threeMonthsAgo);
    for (let i = 0; i < 14; i++) {
      const w = new Date(start);
      w.setDate(w.getDate() + i * 7);
      weeks.push({ date: w, week: formatWeekStart(w), newSignups: 0, newFree: 0, newPremium: 0, cumulativeTotal: 0, cumulativePremium: 0 });
    }

    const activeFree = freeSubs.filter(s => s.status === 'active');
    const activePrem = premiumSubs.filter(s => s.status === 'active');

    weeks.forEach((wk, idx) => {
      const nextWeek = idx < weeks.length - 1 ? weeks[idx + 1].date : new Date();
      wk.newFree = activeFree.filter(s => {
        const c = new Date(s.created_date);
        return c >= wk.date && c < nextWeek;
      }).length;
      wk.newPremium = activePrem.filter(s => {
        const c = new Date(s.created_date);
        return c >= wk.date && c < nextWeek;
      }).length;
      wk.newSignups = wk.newFree + wk.newPremium;
    });

    let cumTotal = activeFree.length + activePrem.length - weeks.reduce((s, w) => s + w.newFree + w.newPremium, 0);
    let cumPrem = activePrem.length - weeks.reduce((s, w) => s + w.newPremium, 0);
    weeks.forEach(wk => {
      cumTotal += wk.newFree + wk.newPremium;
      cumPrem += wk.newPremium;
      wk.cumulativeTotal = Math.max(cumTotal, 0);
      wk.cumulativePremium = Math.max(cumPrem, 0);
    });

    return weeks;
  }, [freeSubs, premiumSubs, threeMonthsAgo]);

  const tierStats = useMemo(() => {
    const free = freeSubs.filter(s => s.status === 'active').length;
    const premium = premiumSubs.filter(s => s.status === 'active').length;
    return { free, premium, total: free + premium };
  }, [freeSubs, premiumSubs]);

  const monthlyContent = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ date: d, month: `${MONTH_NAMES[d.getMonth()]}`, editions: 0, notes: 0 });
    }

    editions.filter(e => e.status === 'published' && e.publish_date).forEach(e => {
      const d = new Date(e.publish_date);
      const m = months.find(mo => mo.date.getFullYear() === d.getFullYear() && mo.date.getMonth() === d.getMonth());
      if (m) m.editions++;
    });

    notes.filter(n => n.status === 'published' && n.publish_date).forEach(n => {
      const d = new Date(n.publish_date);
      const m = months.find(mo => mo.date.getFullYear() === d.getFullYear() && mo.date.getMonth() === d.getMonth());
      if (m) m.notes++;
    });

    return months;
  }, [editions, notes]);

  const categoryStats = useMemo(() => {
    const map = {};
    notes.filter(n => n.status === 'published' && n.publish_date && new Date(n.publish_date) >= threeMonthsAgo).forEach(n => {
      map[n.category] = (map[n.category] || 0) + 1;
    });
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  }, [notes, threeMonthsAgo]);

  if (loading) {
    return (
      <div className="pt-24 lg:pt-28 pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/Home" replace />;
  }

  const recentEditions = editions.filter(e => e.status === 'published').slice(0, 5);

  return (
    <div className="pt-24 lg:pt-28 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Insights</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Platform Analytics</h1>
          <p className="text-muted-foreground">Subscriber trends and content output over the last 3 months.</p>
        </motion.div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Subscribers', value: tierStats.total, sub: `${tierStats.premium} premium` },
            { label: 'Premium Conversion', value: tierStats.total > 0 ? `${Math.round((tierStats.premium / tierStats.total) * 100)}%` : '0%', sub: 'free → paid' },
            { label: 'Editions Published', value: monthlyContent.reduce((s, m) => s + m.editions, 0), sub: 'last 4 months' },
            { label: 'Research Notes', value: monthlyContent.reduce((s, m) => s + m.notes, 0), sub: 'last 4 months' },
          ].map((stat, i) => (
            <motion.div key={stat.label} className="glass rounded-xl p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2">
            <SubscriberGrowthChart weeklyData={weeklyData} />
          </div>
          <TierBreakdown free={tierStats.free} premium={tierStats.premium} total={tierStats.total} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2">
            <ContentOutputChart monthlyContent={monthlyContent} />
          </div>
          <CategoryBreakdown categories={categoryStats} />
        </div>

        {/* Recent editions + engagement note */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Recent Newsletter Editions</h3>
          {recentEditions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No published editions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentEditions.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.edition_type} · {e.publish_date}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {(e.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
            <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Note: Open and click engagement data (email opens, link clicks, page views) is available in the Base44 Analytics dashboard — Dashboard → Analytics → Traffic Overview. This view shows subscriber growth and content production trends from your stored data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}