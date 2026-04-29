import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function parseMarketItems(summary) {
  if (!summary) return [];
  return summary.split(' · ').map(item => {
    const colonIdx = item.indexOf(':');
    if (colonIdx === -1) return null;
    const label = item.slice(0, colonIdx).trim();
    const rest = item.slice(colonIdx + 1).trim();
    // try to extract value and change e.g. "4,512.3 (+1.2%)"
    const match = rest.match(/^([^\(]+)\s*(\([^)]+\))?$/);
    const value = match ? match[1].trim() : rest;
    const change = match && match[2] ? match[2].replace(/[()]/g, '').trim() : null;
    const isPos = change && change.startsWith('+');
    const isNeg = change && change.startsWith('-');
    return { label, value, change, isPos, isNeg };
  }).filter(Boolean);
}

function MarketPill({ item }) {
  const Icon = item.isPos ? TrendingUp : item.isNeg ? TrendingDown : Minus;
  const color = item.isPos
    ? 'text-emerald-400 bg-emerald-400/10'
    : item.isNeg
    ? 'text-red-400 bg-red-400/10'
    : 'text-muted-foreground bg-muted/50';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">{item.label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
      {item.change && (
        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 w-fit ${color}`}>
          <Icon className="w-2.5 h-2.5" />
          {item.change}
        </div>
      )}
    </div>
  );
}

export default function EditionCard({ edition, index }) {
  const isMorning = edition.edition_type === 'morning';
  const marketItems = parseMarketItems(edition.market_summary).slice(0, 5);

  const formattedDate = edition.publish_date
    ? new Date(edition.publish_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : edition.publish_date;

  return (
    <Link to={`/Newsletter/${edition.slug}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/25 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group-hover:-translate-y-0.5"
      >
        {/* Top accent line */}
        <div className={`h-px w-full ${isMorning ? 'bg-gradient-to-r from-amber-400/60 via-primary/40 to-transparent' : 'bg-gradient-to-r from-blue-400/60 via-accent/40 to-transparent'}`} />

        <div className="p-7 sm:p-8">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isMorning ? 'bg-amber-400/10' : 'bg-blue-400/10'}`}>
                {isMorning
                  ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                  : <Moon className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <span className={`text-xs font-semibold tracking-wide ${isMorning ? 'text-amber-400' : 'text-blue-400'}`}>
                {isMorning ? 'Morning Brief' : 'Evening Wrap'}
              </span>
              <span className="text-border/80">·</span>
              <span className="text-xs text-muted-foreground/60">{formattedDate}</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
          </div>

          {/* Title */}
          <h3 className="font-display text-xl sm:text-2xl font-semibold leading-snug mb-6 group-hover:text-primary transition-colors duration-300 text-foreground">
            {edition.title}
          </h3>

          {/* Market snapshot grid */}
          {marketItems.length > 0 && (
            <div className="pt-5 border-t border-border/20">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4">Market Snapshot</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-3">
                {marketItems.map((item, i) => (
                  <MarketPill key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {edition.tags?.length > 0 && (
            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {edition.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground/60 font-medium uppercase tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}