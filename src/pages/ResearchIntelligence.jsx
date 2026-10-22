import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import IntelligenceAnalysisBody from '@/components/research/IntelligenceAnalysisBody';
import AnalysisDisclaimer from '@/components/research/AnalysisDisclaimer';
import {
  ArrowLeft, Clock, CalendarDays, ExternalLink, CheckCircle2,
  AlertTriangle, Star, Radio, Activity, Eye,
} from 'lucide-react';
import { cleanMarketCopy } from '@/lib/cleanMarketCopy';

const CATEGORY_TONE = {
  Macro: 'text-amber-300 border-amber-400/25 bg-amber-400/[0.07]',
  Equities: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/[0.07]',
  Rates: 'text-blue-300 border-blue-400/25 bg-blue-400/[0.07]',
  Commodities: 'text-orange-300 border-orange-400/25 bg-orange-400/[0.07]',
  Geopolitics: 'text-red-300 border-red-400/25 bg-red-400/[0.07]',
  FX: 'text-purple-300 border-purple-400/25 bg-purple-400/[0.07]',
  Credit: 'text-cyan-300 border-cyan-400/25 bg-cyan-400/[0.07]',
  Technology: 'text-violet-300 border-violet-400/25 bg-violet-400/[0.07]',
  'US Economy': 'text-sky-300 border-sky-400/25 bg-sky-400/[0.07]',
  'UK Economy': 'text-rose-300 border-rose-400/25 bg-rose-400/[0.07]',
  'EU Economy': 'text-indigo-300 border-indigo-400/25 bg-indigo-400/[0.07]',
};

const SENTIMENT_TONE = {
  positive: { label: 'Constructive', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  negative: { label: 'Cautious', dot: 'bg-rose-400', text: 'text-rose-400' },
  neutral: { label: 'Neutral', dot: 'bg-amber-300/70', text: 'text-amber-300/80' },
};

function SidebarRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40">{label}</span>
      <span className="text-right text-xs text-foreground/70">{children}</span>
    </div>
  );
}

export default function ResearchIntelligence() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingItem(true);
    setAnalysis(null);
    base44.entities.IntelligenceItem.filter({ slug })
      .then((items) => {
        if (!active) return;
        setItem((items || [])[0] || null);
        setLoadingItem(false);
      })
      .catch(() => {
        if (!active) return;
        setItem(null);
        setLoadingItem(false);
      });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    if (item.full_analysis) {
      setAnalysis(item.full_analysis);
      return;
    }
    let active = true;
    setLoadingAnalysis(true);
    base44.functions.invoke('getIntelligenceAnalysis', { slug })
      .then((response) => {
        if (!active) return;
        const data = response?.data;
        if (data?.ok && data.analysis) setAnalysis(data.analysis);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAnalysis(false);
      });
    return () => { active = false; };
  }, [item, slug]);

  if (loadingItem) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="mb-3 font-display text-3xl font-semibold">Intelligence item not found</h1>
          <Button asChild variant="outline">
            <Link to="/Research"><ArrowLeft className="mr-2 h-4 w-4" />Back to research</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tone = CATEGORY_TONE[item.category] || 'text-muted-foreground border-border/30 bg-muted/20';
  const sentiment = SENTIMENT_TONE[item.sentiment] || SENTIMENT_TONE.neutral;
  const publishedAt = item.source_published_at || item.published_at;
  const dateLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const timeLabel = publishedAt
    ? new Date(publishedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;
  const watchItems = (item.what_to_watch || '')
    .split(/[;\n]/)
    .map((value) => cleanMarketCopy(value))
    .filter(Boolean);
  const summary = cleanMarketCopy(analysis?.executive_summary || '');

  return (
    <div className="relative min-h-screen pb-24 pt-24 lg:pt-28">
      <PageBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link to="/Research" className="group mb-10 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Research intelligence
          </Link>
        </motion.div>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mb-6 overflow-hidden rounded-xl border border-border/55 bg-card/60"
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/40 to-transparent" />
          <div className="relative p-7 sm:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Radio className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Research Intelligence</span>
              <span className="text-border/50">·</span>
              <Badge variant="outline" className={`border text-xs ${tone}`}>{item.category}</Badge>
              {item.is_top_story && (
                <Badge className="border-0 bg-amber-400/10 text-xs text-amber-400">
                  <Star className="mr-1 h-3 w-3" /> Priority
                </Badge>
              )}
            </div>

            <h1 className="mb-5 font-display text-3xl font-semibold leading-[1.15] text-foreground sm:text-[2.5rem]">
              {cleanMarketCopy(item.headline)}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/60">
              {dateLabel && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />{dateLabel}
                </span>
              )}
              {timeLabel && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />{timeLabel}
                </span>
              )}
              {item.verification_status === 'verified' && (
                <span className="flex items-center gap-1.5 text-emerald-400/85">
                  <CheckCircle2 className="h-3.5 w-3.5" />Verified source
                </span>
              )}
            </div>
          </div>
        </motion.header>

        {/* ── EXECUTIVE SUMMARY ────────────────────────────────────────── */}
        {summary && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="relative mb-6 overflow-hidden rounded-xl border border-primary/15 bg-primary/5 backdrop-blur-sm"
          >
            <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
            <div className="p-7 sm:p-8">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Executive summary</span>
              </div>
              <p className="text-base font-medium leading-[1.85] text-foreground/85 sm:text-[17px]">{summary}</p>
            </div>
          </motion.section>
        )}

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border/30 bg-card/30 p-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.04]"
          >
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/45">Primary reference</p>
              <p className="truncate text-sm font-medium text-foreground/80">{item.source_name || 'Open source'}</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
          </a>
        )}

        {!item.source_url && (
          <div className="mb-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.045] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-muted-foreground">
              This legacy item predates source-link requirements. Treat it as unverified commentary.
            </p>
          </div>
        )}

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-8">
          <div>
            {loadingAnalysis ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                    <p className="text-sm text-muted-foreground">Preparing full analysis. This takes around 20 seconds the first time.</p>
                  </div>
                </div>
                {[0, 1, 2].map((index) => (
                  <div key={index} className="animate-pulse rounded-xl border border-border/25 bg-card/30 p-6 sm:p-8">
                    <div className="mb-5 h-2.5 w-32 rounded bg-muted/30" />
                    <div className="space-y-3">
                      <div className="h-2.5 w-full rounded bg-muted/20" />
                      <div className="h-2.5 w-11/12 rounded bg-muted/20" />
                      <div className="h-2.5 w-9/12 rounded bg-muted/20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <IntelligenceAnalysisBody analysis={analysis} item={item} />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm">
              <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
              <div className="p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/45">At a glance</p>
                <div className="divide-y divide-border/15">
                  <SidebarRow label="Coverage">{item.category}</SidebarRow>
                  <SidebarRow label="Tone">
                    <span className={`inline-flex items-center gap-1.5 ${sentiment.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sentiment.dot}`} />
                      {sentiment.label}
                    </span>
                  </SidebarRow>
                  {item.published_date && <SidebarRow label="Published">{item.published_date}</SidebarRow>}
                  {item.source_name && <SidebarRow label="Source">{item.source_name}</SidebarRow>}
                  <SidebarRow label="Status">
                    {item.verification_status === 'verified' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400/85">
                        <CheckCircle2 className="h-3 w-3" />Verified
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">Unverified</span>
                    )}
                  </SidebarRow>
                </div>
              </div>
            </div>

            {watchItems.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm">
                <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-primary/70" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/45">Instruments</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {watchItems.map((value) => (
                      <span key={value} className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[11px] text-primary/80">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <AnalysisDisclaimer />

        <div className="mt-8 border-t border-border/20 pt-6">
          <Link to="/Research" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Research
          </Link>
        </div>
      </div>
    </div>
  );
}