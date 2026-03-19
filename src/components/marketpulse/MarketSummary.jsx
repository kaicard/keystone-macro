import React from 'react';
import { FileText } from 'lucide-react';

export default function MarketSummary({ summary, loading }) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Today's Market Summary</h3>
        <span className="ml-auto text-xs text-muted-foreground">AI-generated</span>
      </div>
      {loading && !summary ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted/30 rounded w-full" />
          <div className="h-4 bg-muted/30 rounded w-5/6" />
          <div className="h-4 bg-muted/30 rounded w-4/6" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{summary || 'Loading market summary...'}</p>
      )}
    </div>
  );
}