import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Calendar, Clock, TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import PageBackground from '@/components/layout/PageBackground';

// ─── Market Snapshot Card ─────────────────────────────────────────────────────

function MarketSnapshotBar({ summary }) {
  if (!summary) return null;
  const items = summary.split(' · ').filter(Boolean);
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {items.map((item, i) => {
        const [label, rest] = item.split(':').map(s => s?.trim());
        if (!rest) return null;
        const changeMatch = rest.match(/\(([+-][^)]+)\)/);
        const change = changeMatch?.[1] || '';
        const value = rest.replace(/\s*\([^)]*\)/, '').trim();
        const isPos = change.startsWith('+');
        const isNeg = change.startsWith('-');
        return (
          <div key={i} className="glass rounded-xl p-4 border border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5">{label}</p>
            <p className="text-base font-bold font-mono tabular-nums">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold font-mono ${
                isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-muted-foreground'
              }`}>
                {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {change}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Block (parsed from markdown) ────────────────────────────────────

function SectionBlock({ section, index }) {
  const lines = section.split('\n').filter(Boolean);
  const headlineMatch = lines[0]?.match(/^#+\s+(.+?):\s*(.+)$/);
  const label = headlineMatch?.[1] || '';
  const headline = headlineMatch?.[2] || lines[0]?.replace(/^#+\s+/, '') || '';
  const bodyLines = lines.slice(1).join('\n');
  const calloutMatch = bodyLines.match(/^>\s+(.+)/m);
  const callout = calloutMatch?.[1] || '';
  const body = bodyLines.replace(/^>\s+.+/m, '').trim();

  const LABEL_COLORS = {
    Equities: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/8',
    'Fixed Income': 'text-blue-400 border-blue-400/30 bg-blue-400/8',
    FX: 'text-purple-400 border-purple-400/30 bg-purple-400/8',
    Commodities: 'text-orange-400 border-orange-400/30 bg-orange-400/8',
    'Macro Data': 'text-amber-400 border-amber-400/30 bg-amber-400/8',
    Geopolitics: 'text-red-400 border-red-400/30 bg-red-400/8',
    'Central Banks': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/8',
    Credit: 'text-teal-400 border-teal-400/30 bg-teal-400/8',
  };
  const labelStyle = LABEL_COLORS[label] || 'text-primary border-primary/30 bg-primary/8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="mb-10"
    >
      {label && (
        <span className={`inline-block text-[10px] font-bold uppercase tracking-[2px] px-2.5 py-1 rounded border mb-3 ${labelStyle}`}>
          {label}
        </span>
      )}
      {headline && (
        <h2 className="font-display text-xl sm:text-2xl font-semibold leading-snug mb-4 text-foreground">{headline}</h2>
      )}
      {body && (
        <div className="text-muted-foreground leading-[1.9] text-[15px] mb-4 whitespace-pre-line">{body}</div>
      )}
      {callout && (
        <div className="border-l-2 border-primary/50 pl-5 py-2 bg-primary/5 rounded-r-xl">
          <p className="text-sm text-muted-foreground italic leading-relaxed">{callout}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-7 h-7 text-muted-foreground/40" />
          </div>
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

  // Parse sections from markdown body (split on ---)
  const rawSections = edition.body ? edition.body.split(/\n---\n/).filter(s => s.trim()) : [];

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Back */}
          <Link to="/Newsletter" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Newsletter Archive
          </Link>

          {/* Masthead */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                isMorning
                  ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
                  : 'bg-blue-400/10 border-blue-400/20 text-blue-400'
              }`}>
                {isMorning ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {isMorning ? 'Morning Brief' : 'Evening Wrap'}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{edition.publish_date}</span>
                {edition.published_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(edition.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              {edition.title}
            </h1>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mb-8" />
          </div>

          {/* Market Snapshot Grid */}
          <MarketSnapshotBar summary={edition.market_summary} />

          {/* Tags */}
          {edition.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {edition.tags.map(t => (
                <span key={t} className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-muted/50 text-muted-foreground/60 border border-border/30">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          {edition.body ? (
            <div>
              {rawSections.length > 1 ? (
                rawSections.map((section, i) => (
                  <SectionBlock key={i} section={section} index={i} />
                ))
              ) : (
                <div className="glass rounded-2xl p-8 sm:p-10">
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none
                    [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-5 [&_h2]:mt-10 [&_h2]:text-foreground
                    [&_h2:first-child]:mt-0
                    [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-primary
                    [&_p]:text-muted-foreground [&_p]:leading-[1.9] [&_p]:mb-5 [&_p]:text-[15px]
                    [&_strong]:text-foreground [&_strong]:font-semibold
                    [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                    [&_blockquote_p]:mb-0
                    [&_ul]:space-y-2 [&_ul]:my-5
                    [&_li]:text-muted-foreground [&_li]:text-[15px]
                    [&_hr]:my-8 [&_hr]:opacity-20
                  ">
                    {edition.body}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <p>This edition's full content is available to subscribers.</p>
              <Button asChild className="mt-4 gap-2">
                <Link to="/Newsletter">Subscribe — £9.99/month <ArrowLeft className="w-4 h-4 rotate-180" /></Link>
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/30 text-center space-y-2">
            <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">The Keystone Macro Brief</p>
            <p className="text-xs text-muted-foreground/30">For informational purposes only · Not financial advice</p>
            <Link to="/Newsletter" className="inline-flex items-center gap-2 text-xs text-primary/60 hover:text-primary transition-colors mt-2">
              <ArrowLeft className="w-3 h-3" /> Back to Archive
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}