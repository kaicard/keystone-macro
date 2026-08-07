import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileText, Mail } from 'lucide-react';

export default function ContentOutputChart({ monthlyContent }) {
  const totalEditions = monthlyContent.reduce((s, m) => s + m.editions, 0);
  const totalNotes = monthlyContent.reduce((s, m) => s + m.notes, 0);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Content Output</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-primary"><Mail className="w-3 h-3" /> {totalEditions} editions</span>
          <span className="flex items-center gap-1 text-accent"><FileText className="w-3 h-3" /> {totalNotes} notes</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthlyContent} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
          <Bar dataKey="editions" name="Newsletter Editions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="notes" name="Research Notes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}