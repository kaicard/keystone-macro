import React from 'react';
import { motion } from 'framer-motion';

function getSectorColor(changePct) {
  const val = parseFloat(changePct);
  if (isNaN(val)) return 'bg-muted/30 text-muted-foreground';
  if (val >= 2) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (val >= 0.5) return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
  if (val > 0) return 'bg-emerald-400/5 text-emerald-500 border-emerald-500/10';
  if (val === 0) return 'bg-muted/20 text-muted-foreground border-border/20';
  if (val > -0.5) return 'bg-red-400/5 text-red-500 border-red-500/10';
  if (val > -2) return 'bg-red-400/10 text-red-400 border-red-400/20';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
}

const SECTOR_ABBR = {
  'Technology': 'Tech',
  'Financials': 'Fins',
  'Healthcare': 'HC',
  'Energy': 'Energy',
  'Consumer Discretionary': 'Cons D',
  'Consumer Staples': 'Cons S',
  'Industrials': 'Indus',
  'Materials': 'Matls',
  'Utilities': 'Utils',
  'Real Estate': 'RE',
  'Communication Services': 'Comms',
};

export default function SectorHeatmap({ sectors, loading }) {
  if (loading || !sectors?.length) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
        {[...Array(11)].map((_, i) => (
          <div key={i} className="glass rounded-lg p-3 animate-pulse h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2">
      {sectors.map((s, i) => {
        const color = getSectorColor(s.change_pct);
        return (
          <motion.div
            key={s.name}
            className={`rounded-lg p-3 border text-center ${color}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <p className="text-xs font-semibold leading-tight mb-1">{SECTOR_ABBR[s.name] || s.name}</p>
            <p className="text-sm font-bold">{s.change_pct}</p>
          </motion.div>
        );
      })}
    </div>
  );
}