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

    // Handle nested parens: "7,212.44 (-76.49 (-1.07%))" → value=7,212.44, change=-1.07%
    // Extract the innermost percentage change first
    const pctMatch = rest.match(/([-+][0-9.,]+%)/);
    const pctChange = pctMatch ? pctMatch[1] : null;

    // Value is everything before the first '('
    const parenIdx = rest.indexOf('(');
    const value = parenIdx !== -1 ? rest.slice(0, parenIdx).trim() : rest.trim();

    // Prefer the pct change; fall back to the simple single-parens format
    let change = pctChange;
    if (!change) {
      const simpleMatch = rest.match(/^[^\(]+\(([^)]+)\)$/);
      change = simpleMatch ? simpleMatch[1].trim() : null;
    }

    const isPos = change ? change.startsWith('+') : false;
    const isNeg = change ? change.startsWith('-') : false;
    return { label, value, change, isPos, isNeg };
  }).filter(Boolean);
}

function MarketPill({ item }) {
  const Icon = item.isPos ? TrendingUp : item.isNeg ? TrendingDown : Minus;
  const color = item.isPos
    ? 'text-emerald-400'
    : item.isNeg
    ? 'text-red-400'
    : 'text-muted-foreground/50';

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 truncate">{item.label}</span>
      <span className="text-xs font-semibold text-foreground tabular-nums">{item.value}</span>
      {item.change && (
        <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${color}`}>
          <Icon className="w-2 h-2 shrink-0" />
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
    ? new Date(edition.publish_date + 'T12:00:00Z').toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      })
    : '';

  // Show only unique, short tags (max 4)
  const tags = [...new Set((edition.tags || []).slice(0, 4).map(t => t.replace(/_/g, ' ').trim()))];

  return (
    <Link to={`/Newsletter/${edition.slug}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-400 group-hover:-translate-y-0.5"
      >
        {/* Top accent */}
        <div className={`h-px w-full ${isMorning
          ? 'bg-gradient-to-r from-amber-400/70 via-primary/30 to-transparent'
          : 'bg-gradient-to-r from-blue-400/70 via-accent/30 to-transparent'}`}
        />

        <div className="p-5 sm:p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isMorning ? 'bg-amber-400/10' : 'bg-blue-400/10'}`}>
                {isMorning
                  ? <Sun className="w-3 h-3 text-amber-400" />
                  : <Moon className="w-3 h-3 text-blue-400" />}
              </div>
              <span className={`text-[11px] font-bold tracking-wide shrink-0 ${isMorning ? 'text-amber-400' : 'text-blue-400'}`}>
                {isMorning ? 'Morning Brief' : 'Evening Wrap'}
              </span>
              <span className="text-border/60 shrink-0">·</span>
              <span className="text-[11px] text-muted-foreground/50 truncate">{formattedDate}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-primary shrink-0 mt-0.5 transition-colors duration-200" />
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-200 mb-4">
            {edition.title}
          </h3>

          {/* Bottom row: market snapshot + tags */}
          <div className="flex items-end justify-between gap-4">
            {/* Market snapshot — compact inline strip */}
            {marketItems.length > 0 && (
              <div className="grid grid-cols-5 gap-3 flex-1 pt-3 border-t border-border/15">
                {marketItems.map((item, i) => (
                  <MarketPill key={i} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Tags — only if no market snapshot */}
          {marketItems.length === 0 && tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-border/15">
              {tags.map(tag => (
                <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full border border-border/25 text-muted-foreground/40 font-bold uppercase tracking-widest">
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