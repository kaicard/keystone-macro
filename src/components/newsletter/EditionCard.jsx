import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

function parseMarketItems(summary) {
  if (!summary) return [];
  return summary.split(' · ').map(item => {
    const colonIdx = item.indexOf(':');
    if (colonIdx === -1) return null;
    const label = item.slice(0, colonIdx).trim();
    const rest = item.slice(colonIdx + 1).trim();
    const pctMatch = rest.match(/([-+][0-9.,]+%)/);
    const pctChange = pctMatch ? pctMatch[1] : null;
    const parenIdx = rest.indexOf('(');
    const value = parenIdx !== -1 ? rest.slice(0, parenIdx).trim() : rest.trim();
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

function MarketStat({ item }) {
  const isPos = item.isPos;
  const isNeg = item.isNeg;
  const changeColor = isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-muted-foreground/40';
  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : null;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/35 truncate leading-none">
        {item.label}
      </span>
      <span className="text-[11px] font-semibold text-foreground/80 tabular-nums leading-tight">
        {item.value}
      </span>
      {item.change && (
        <div className={`flex items-center gap-0.5 text-[9px] font-bold ${changeColor}`}>
          {Icon && <Icon className="w-2 h-2 shrink-0" />}
          {item.change}
        </div>
      )}
    </div>
  );
}

export default function EditionCard({ edition, index }) {
  const isMorning = edition.edition_type === 'morning';
  const marketItems = parseMarketItems(edition.market_summary).slice(0, 5);
  const tags = [...new Set((edition.tags || []).slice(0, 3).map(t => t.replace(/_/g, ' ').trim()))];

  const formattedDate = edition.publish_date
    ? new Date(edition.publish_date + 'T12:00:00Z').toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

  const accentColor = isMorning ? 'text-amber-400' : 'text-sky-400';
  const accentBg = isMorning ? 'bg-amber-400/[0.08]' : 'bg-sky-400/[0.08]';
  const accentBorder = isMorning ? 'border-amber-400/15' : 'border-sky-400/15';
  const accentLine = isMorning
    ? 'bg-gradient-to-r from-amber-400/60 via-amber-400/20 to-transparent'
    : 'bg-gradient-to-r from-sky-400/60 via-sky-400/20 to-transparent';

  return (
    <Link to={`/Newsletter/${edition.slug}`} className="group block h-full">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
        className="relative h-full flex flex-col overflow-hidden rounded-2xl border border-border/25 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border/50 hover:bg-card/70 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-px"
      >
        {/* Top accent line */}
        <div className={`h-[1.5px] w-full shrink-0 ${accentLine}`} />

        <div className="flex flex-col flex-1 p-5">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${accentBg} ${accentBorder}`}>
              {isMorning
                ? <Sun className={`w-3 h-3 ${accentColor}`} />
                : <Moon className={`w-3 h-3 ${accentColor}`} />}
              <span className={`text-[10px] font-bold tracking-wide ${accentColor}`}>
                {isMorning ? 'Morning Brief' : 'Evening Wrap'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/40 font-medium">{formattedDate}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors duration-200" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold leading-snug text-foreground/90 group-hover:text-primary transition-colors duration-200 mb-auto line-clamp-2">
            {edition.title}
          </h3>

          {/* Footer: market strip or tags */}
          {marketItems.length > 0 ? (
            <div className="mt-4 pt-3.5 border-t border-border/15">
              <div className="grid grid-cols-5 gap-2">
                {marketItems.map((item, i) => (
                  <MarketStat key={i} item={item} />
                ))}
              </div>
            </div>
          ) : tags.length > 0 ? (
            <div className="mt-4 pt-3.5 border-t border-border/15 flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="text-[9px] px-2 py-0.5 rounded-full border border-border/20 text-muted-foreground/35 font-semibold uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-4 pt-3.5 border-t border-border/15 h-8" />
          )}
        </div>
      </motion.article>
    </Link>
  );
}