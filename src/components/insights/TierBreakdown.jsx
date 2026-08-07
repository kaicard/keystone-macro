import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Gem, User } from 'lucide-react';

export default function TierBreakdown({ free, premium, total }) {
  const conversionRate = total > 0 ? Math.round((premium / total) * 100) : 0;
  const data = [
    { name: 'Premium', value: premium, color: 'hsl(var(--primary))' },
    { name: 'Free', value: free, color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-4">Tier Split</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={32} outerRadius={52} paddingAngle={3}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <Gem className="w-4 h-4 text-primary" />
            <div>
              <p className="text-lg font-semibold leading-none">{premium}</p>
              <p className="text-xs text-muted-foreground">Premium · {conversionRate}% conversion</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold leading-none">{free}</p>
              <p className="text-xs text-muted-foreground">Free tier</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-2xl font-display font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">Total active</p>
          </div>
        </div>
      </div>
    </div>
  );
}