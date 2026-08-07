import React from 'react';
import { Tag } from 'lucide-react';

export default function CategoryBreakdown({ categories }) {
  const maxCount = Math.max(...categories.map(c => c.count), 1);
  const sorted = [...categories].sort((a, b) => b.count - a.count);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Research by Category</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No published notes in this period.</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map(cat => (
            <div key={cat.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{cat.category}</span>
                <span className="text-muted-foreground tabular-nums">{cat.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                  style={{ width: `${(cat.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}