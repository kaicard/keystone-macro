import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Clock,
  Mic, Loader2, CheckCircle2
} from 'lucide-react';

const VERDICT_CONFIG = {
  beat:        { label: 'Beat Forecast',   icon: TrendingUp,   className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  miss:        { label: 'Missed Forecast', icon: TrendingDown, className: 'bg-red-400/15 text-red-400 border-red-400/20' },
  in_line:     { label: 'In Line',          icon: Minus,         className: 'bg-muted/30 text-foreground/60 border-border/30' },
  pending:     { label: 'Awaiting Release', icon: Clock,        className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  delivered:   { label: 'Speech Delivered', icon: CheckCircle2, className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  scheduled:   { label: 'Speech Scheduled', icon: Clock,       className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  in_progress: { label: 'Live Now',         icon: Mic,          className: 'bg-amber-400/15 text-amber-400 border-amber-400/20 animate-pulse' },
};

export default function EnrichedAnalysis({ enrichment, enriching }) {
  if (enriching && !enrichment) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50 py-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Generating analysis...
      </div>
    );
  }

  if (!enrichment) return null;

  const cfg = VERDICT_CONFIG[enrichment.verdict] || VERDICT_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.className}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>

      {enrichment.analysis && (
        <p className="text-xs text-foreground/75 leading-[1.8]">{enrichment.analysis}</p>
      )}

      {enrichment.key_points?.length > 0 && (
        <ul className="space-y-2 pt-0.5">
          {enrichment.key_points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground/80 leading-[1.7]">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}