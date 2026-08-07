import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

export default function SubscriberGrowthChart({ weeklyData }) {
  const latest = weeklyData[weeklyData.length - 1] || {};
  const first = weeklyData[0] || {};
  const totalGrowth = (latest.cumulativeTotal || 0) - (first.cumulativeTotal || 0);
  const peakWeek = weeklyData.reduce((max, w) => (w.newSignups > max.newSignups ? w : max), weeklyData[0] || {});

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Subscriber Growth</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">+{totalGrowth} in 3mo</span>
          {peakWeek.newSignups > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" /> Peak: {peakWeek.week}
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="cumulativeTotal" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#totalGrad)" />
          <Area type="monotone" dataKey="cumulativePremium" name="Premium" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#premGrad)" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Total subscribers</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Premium</span>
      </div>
    </div>
  );
}