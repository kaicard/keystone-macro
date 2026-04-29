import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Sun, Moon, Calendar, TrendingUp, TrendingDown, Minus,
  BarChart2, Globe, Zap, Shield, Star, DollarSign, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageBackground from '@/components/layout/PageBackground';

// ─── Label prettifier — strips underscores, title-cases ──────────────────────
function prettyLabel(raw) {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ─── Pick an icon for each section label ─────────────────────────────────────
function sectionIcon(label) {
  const l = label.toLowerCase();
  if (l.includes('equit')) return TrendingUp;
  if (l.includes('fixed') || l.includes('bond') || l.includes('rate') || l.includes('income')) return BarChart2;
  if (l.includes('fx') || l.includes('currency') || l.includes('em')) return DollarSign;
  if (l.includes('commodity') || l.includes('commodit') || l.includes('oil') || l.includes('gold')) return Zap;
  if (l.includes('macro') || l.includes('gdp') || l.includes('data')) return Activity;
  if (l.includes('geo') || l.includes('politic')) return Globe;
  if (l.includes('credit') || l.includes('spread')) return BarChart2;
  if (l.includes('m&a') || l.includes('corporate')) return Star;
  return Shield;
}

// ─── Parse body into sections (split by --- or by ## headings) ───────────────
function parseSections(body) {
  if (!body) return [];

  // Split on --- dividers
  const blocks = body.split(/\n---\n/).map(b => b.trim()).filter(Boolean);

  return blocks.map(block => {
    // Extract ## heading
    const headingMatch = block.match(/^##\s+(.+)/m);
    if (!headingMatch) {
      return { label: '', headline: '', body: block };
    }

    const rawHeading = headingMatch[1].trim();
    const bodyWithoutHeading = block.replace(/^##\s+.+/m, '').trim();

    // Check if heading is "label: Headline text" format
    const colonIdx = rawHeading.indexOf(':');
    if (colonIdx !== -1) {
      const rawLabel = rawHeading.slice(0, colonIdx).trim();
      const headline = rawHeading.slice(colonIdx + 1).trim();
      return {
        label: prettyLabel(rawLabel),
        headline,
        body: bodyWithoutHeading,
      };
    }

    // No colon — entire heading is the headline
    return {
      label: '',
      headline: rawHeading,
      body: bodyWithoutHeading,
    };
  });
}

// ─── Parse market summary ─────────────────────────────────────────────────────
function parseMarketItems(summary) {
  if (!summary) return [];
  return summary.split(' · ').map(item => {
    const colonIdx = item.indexOf(':');
    if (colonIdx === -1) return null;
    const label = item.slice(0, colonIdx).trim();
    const rest = item.slice(colonIdx + 1).trim();
    const match = rest.match(/^([^\(]+)\s*(\([^)]+\))?$/);
    const value = match ? match[1].trim() : rest;
    const change = match && match[2] ? match[2].replace(/[()]/g, '').trim() : null;
    const isPos = change && change.startsWith('+');
    const isNeg = change && change.startsWith('-');
    return { label, value, change, isPos, isNeg };
  }).filter(Boolean);
}

// ─── Market snapshot card ─────────────────────────────────────────────────────
function MarketCard({ item }) {
  const Icon = item.isPos ? TrendingUp : item.isNeg ? TrendingDown : Minus;
  const color = item.isPos ? 'text-emerald-400' : item.isNeg ? 'text-red-400' : 'text-muted-foreground';
  const bg = item.isPos ? 'bg-emerald-500/5' : item.isNeg ? 'bg-red-500/5' : 'bg-muted/20';
  const border = item.isPos ? 'border-emerald-500/15' : item.isNeg ? 'border-red-500/15' : 'border-border/20';

  return (
    <div className={`rounded-xl p-4 border ${bg} ${border} flex flex-col gap-2`}>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">{item.label}</span>
      <span className="text-base font-bold text-foreground tabular-nums leading-none">{item.value}</span>
      {item.change && (
        <div className={`flex items-center gap-1 text-[11px] font-semibold ${color}`}>
          <Icon className="w-2.5 h-2.5" />
          {item.change}
        </div>
      )}
    </div>
  );
}

// ─── Inline markdown renderer (for section body, no h2) ──────────────────────
const bodyComponents = {
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-primary mt-5 mb-2 uppercase tracking-wide">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-[1.85] text-foreground/75 mb-4 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground/90">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 space-y-1.5 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[15px] text-foreground/75 leading-7">
      <span className="mt-2.5 w-1 h-1 rounded-full bg-primary/40 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <div className="my-5 relative">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-primary/70 via-primary/40 to-transparent" />
      <div className="pl-5 text-sm text-muted-foreground italic leading-relaxed">{children}</div>
    </div>
  ),
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-border/25">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/30">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/15">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-muted/10 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2.5 text-sm text-foreground/75">{children}</td>,
  code: ({ inline, children }) => inline
    ? <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-primary">{children}</code>
    : <pre className="my-4 p-4 rounded-xl bg-muted/40 overflow-x-auto text-xs font-mono leading-relaxed border border-border/20">{children}</pre>,
  hr: () => null, // we handle dividers ourselves
};

// ─── Single section card ──────────────────────────────────────────────────────
const SECTION_COLORS = [
  'from-amber-500/10 to-transparent border-amber-500/10',
  'from-blue-500/10 to-transparent border-blue-500/10',
  'from-violet-500/10 to-transparent border-violet-500/10',
  'from-emerald-500/10 to-transparent border-emerald-500/10',
  'from-rose-500/10 to-transparent border-rose-500/10',
  'from-cyan-500/10 to-transparent border-cyan-500/10',
];

const SECTION_ICON_COLORS = [
  'text-amber-400 bg-amber-400/10',
  'text-blue-400 bg-blue-400/10',
  'text-violet-400 bg-violet-400/10',
  'text-emerald-400 bg-emerald-400/10',
  'text-rose-400 bg-rose-400/10',
  'text-cyan-400 bg-cyan-400/10',
];

function SectionCard({ section, index }) {
  const Icon = sectionIcon(section.label || section.headline);
  const colorClass = SECTION_COLORS[index % SECTION_COLORS.length];
  const iconColorClass = SECTION_ICON_COLORS[index % SECTION_ICON_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.4 }}
      className={`relative rounded-2xl border bg-gradient-to-br ${colorClass} bg-card/40 backdrop-blur-sm overflow-hidden`}
    >
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />

      <div className="p-7 sm:p-8">
        {/* Label + icon row */}
        {section.label && (
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              {section.label}
            </span>
          </div>
        )}

        {/* Headline */}
        {section.headline && (
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground leading-snug mb-5">
            {section.headline}
          </h2>
        )}

        {/* Body */}
        {section.body && (
          <ReactMarkdown components={bodyComponents} remarkPlugins={[remarkGfm]}>
            {section.body}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewsletterEdition() {
  const { slug } = useParams();

  const { data: editions = [], isLoading } = useQuery({
    queryKey: ['edition', slug],
    queryFn: () => base44.entities.NewsletterEdition.filter({ slug, status: 'published' }),
  });

  const edition = editions[0];

  if (isLoading) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center relative">
        <PageBackground />
        <div className="max-w-lg mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-3xl font-semibold mb-3">Edition Not Found</h1>
          <p className="text-muted-foreground mb-6">This edition isn't available or hasn't been published yet.</p>
          <Button asChild variant="outline">
            <Link to="/Newsletter" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Newsletter</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isMorning = edition.edition_type === 'morning';
  const marketItems = parseMarketItems(edition.market_summary);
  const sections = parseSections(edition.body);
  const formattedDate = edition.publish_date
    ? new Date(edition.publish_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : edition.publish_date;

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back nav */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link to="/Newsletter" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-10 group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Newsletter Archive
            </Link>
          </motion.div>

          {/* ── HERO HEADER ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/70 backdrop-blur-xl mb-6"
          >
            <div className={`h-1 w-full ${isMorning ? 'bg-gradient-to-r from-amber-400 via-primary to-transparent' : 'bg-gradient-to-r from-blue-500 via-accent to-transparent'}`} />
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.06] blur-3xl pointer-events-none ${isMorning ? 'bg-amber-400' : 'bg-blue-400'}`} />

            <div className="p-8 sm:p-10 relative">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMorning ? 'bg-amber-400/15' : 'bg-blue-400/15'}`}>
                  {isMorning ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isMorning ? 'text-amber-400' : 'text-blue-400'}`}>
                  {isMorning ? 'Morning Brief' : 'Evening Wrap'}
                </span>
                <span className="text-border/50">·</span>
                <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{formattedDate}
                </span>
              </div>

              <h1 className="font-inter text-3xl sm:text-4xl font-semibold leading-tight text-foreground mb-6">
                {edition.title}
              </h1>

              {/* Clean tags */}
              {edition.tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {edition.tags.map(t => (
                    <span key={t} className="text-[9px] px-2.5 py-1 rounded-full border border-border/25 text-muted-foreground/50 font-bold uppercase tracking-widest">
                      {prettyLabel(t)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── MARKET SNAPSHOT ───────────────────────────────────────────── */}
          {marketItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mb-6"
            >
              <div className="rounded-2xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-3.5 border-b border-border/20 flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Market Snapshot</p>
                  <p className="text-[9px] text-muted-foreground/30">At time of publication</p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {marketItems.map((item, i) => (
                      <MarketCard key={i} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SECTIONS ──────────────────────────────────────────────────── */}
          {sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section, i) => (
                <SectionCard key={i} section={section} index={i} />
              ))}
            </div>
          ) : edition.body ? (
            // Fallback: render as plain markdown if parsing yields nothing
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-border/30 bg-card/60 backdrop-blur-xl p-8 sm:p-12"
            >
              <ReactMarkdown components={bodyComponents} remarkPlugins={[remarkGfm]}>
                {edition.body}
              </ReactMarkdown>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <p>This edition's full content is available to subscribers.</p>
              <Button asChild className="mt-4">
                <Link to="/Newsletter">Subscribe — £9.99/month</Link>
              </Button>
            </div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 pt-8 border-t border-border/20 flex items-center justify-between flex-wrap gap-4"
          >
            <Link to="/Newsletter" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Archive
            </Link>
            <p className="text-[10px] text-muted-foreground/25">Keystone Macro · For informational purposes only · Not financial advice</p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}