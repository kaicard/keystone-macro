import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageBackground from '@/components/layout/PageBackground';

// ─── Parse market summary string into structured items ────────────────────────
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

function MarketCard({ item }) {
  const Icon = item.isPos ? TrendingUp : item.isNeg ? TrendingDown : Minus;
  const color = item.isPos ? 'text-emerald-400' : item.isNeg ? 'text-red-400' : 'text-muted-foreground';
  const bg = item.isPos ? 'bg-emerald-400/8' : item.isNeg ? 'bg-red-400/8' : 'bg-muted/30';
  const border = item.isPos ? 'border-emerald-400/15' : item.isNeg ? 'border-red-400/15' : 'border-border/20';

  return (
    <div className={`rounded-xl p-4 border ${bg} ${border} flex flex-col gap-2`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{item.label}</span>
      <span className="text-lg font-bold text-foreground tabular-nums leading-none">{item.value}</span>
      {item.change && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
          <Icon className="w-3 h-3" />
          {item.change}
        </div>
      )}
    </div>
  );
}

// ─── Section parser — splits markdown body into labelled sections ─────────────
function parseSections(body) {
  if (!body) return [];
  const blocks = body.split(/\n---\n/);
  return blocks.map(block => block.trim()).filter(Boolean);
}

const markdownComponents = {
  h2: ({ children }) => (
    <div className="mt-10 mb-4 first:mt-0">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-px flex-1 bg-border/30" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-foreground">{children}</h2>
    </div>
  ),
  h3: ({ children }) => <h3 className="text-base font-semibold text-primary mt-6 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-base leading-8 text-foreground/80 mb-5 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  ul: ({ children }) => <ul className="my-4 space-y-2 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 space-y-2 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-foreground/80 leading-7">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 relative pl-6 py-1">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary/60 to-primary/20" />
      <div className="text-muted-foreground italic leading-7 text-sm">{children}</div>
    </blockquote>
  ),
  hr: () => <div className="my-10 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border/30">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/20">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-muted/20 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{children}</th>,
  td: ({ children }) => <td className="px-5 py-3 text-sm text-foreground/80">{children}</td>,
  code: ({ inline, children }) => inline
    ? <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-primary">{children}</code>
    : <pre className="my-5 p-5 rounded-xl bg-muted/50 overflow-x-auto text-xs font-mono leading-relaxed border border-border/20">{children}</pre>,
};

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
  const formattedDate = edition.publish_date
    ? new Date(edition.publish_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : edition.publish_date;

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Back nav */}
            <Link to="/Newsletter" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-10 group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Newsletter Archive
            </Link>

            {/* ── HERO HEADER ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/70 backdrop-blur-xl mb-8">
              {/* Accent gradient top bar */}
              <div className={`h-1 w-full ${isMorning ? 'bg-gradient-to-r from-amber-400 via-primary to-amber-200' : 'bg-gradient-to-r from-blue-500 via-accent to-blue-300'}`} />

              {/* Subtle background glow */}
              <div className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.04] blur-3xl pointer-events-none ${isMorning ? 'bg-amber-400' : 'bg-blue-400'}`} />

              <div className="p-8 sm:p-12 relative">
                {/* Edition label + date */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMorning ? 'bg-amber-400/15' : 'bg-blue-400/15'}`}>
                    {isMorning
                      ? <Sun className="w-4.5 h-4.5 text-amber-400" />
                      : <Moon className="w-4.5 h-4.5 text-blue-400" />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isMorning ? 'text-amber-400' : 'text-blue-400'}`}>
                      {isMorning ? 'Morning Brief' : 'Evening Wrap'}
                    </span>
                    <span className="text-border/60">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{formattedDate}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-8 text-foreground">
                  {edition.title}
                </h1>

                {/* Tags */}
                {edition.tags?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {edition.tags.map(t => (
                      <span key={t} className="text-[10px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground/60 font-bold uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── MARKET SNAPSHOT ─────────────────────────────────────────── */}
            {marketItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/20 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Market Snapshot</p>
                    <p className="text-[10px] text-muted-foreground/40">At time of publication</p>
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

            {/* ── BODY CONTENT ────────────────────────────────────────────── */}
            {edition.body ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-border/30 bg-card/60 backdrop-blur-xl overflow-hidden"
              >
                <div className="p-8 sm:p-12 lg:p-14">
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                    {edition.body}
                  </ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="px-8 sm:px-12 lg:px-14 py-6 border-t border-border/20 bg-muted/20 flex items-center justify-between flex-wrap gap-4">
                  <Link to="/Newsletter" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Archive
                  </Link>
                  <p className="text-[10px] text-muted-foreground/30 text-right">Keystone Macro · For informational purposes only · Not financial advice</p>
                </div>
              </motion.div>
            ) : (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                <p>This edition's full content is available to subscribers.</p>
                <Button asChild className="mt-4 gap-2">
                  <Link to="/Newsletter">Subscribe — £9.99/month</Link>
                </Button>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}