import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Calendar, Tag, AlertTriangle, Lightbulb,
  Eye, Share2, CheckCheck, BookOpen, TrendingUp, Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sampleNotes } from '@/lib/researchNotes';

const CATEGORY_CONFIG = {
  'Macro':               { color: 'bg-amber-400/10 text-amber-400 border-amber-400/20',  accent: 'from-amber-500/8',  bar: 'from-amber-400 via-primary to-transparent' },
  'Multi-Asset':         { color: 'bg-blue-400/10 text-blue-400 border-blue-400/20',     accent: 'from-blue-500/8',   bar: 'from-blue-400 via-accent to-transparent' },
  'Equities':            { color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', accent: 'from-emerald-500/8', bar: 'from-emerald-400 via-primary to-transparent' },
  'Fixed Income':        { color: 'bg-sky-400/10 text-sky-400 border-sky-400/20',        accent: 'from-sky-500/8',    bar: 'from-sky-400 via-accent to-transparent' },
  'Commodities':         { color: 'bg-orange-400/10 text-orange-400 border-orange-400/20', accent: 'from-orange-500/8', bar: 'from-orange-400 via-primary to-transparent' },
  'Wealth Strategy':     { color: 'bg-purple-400/10 text-purple-400 border-purple-400/20', accent: 'from-purple-500/8', bar: 'from-purple-400 via-accent to-transparent' },
  'Behavioural Finance': { color: 'bg-violet-400/10 text-violet-400 border-violet-400/20', accent: 'from-violet-500/8', bar: 'from-violet-400 via-primary to-transparent' },
  'Risk Management':     { color: 'bg-red-400/10 text-red-400 border-red-400/20',        accent: 'from-red-500/8',    bar: 'from-red-400 via-destructive to-transparent' },
  'Trade Reviews':       { color: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',     accent: 'from-cyan-500/8',   bar: 'from-cyan-400 via-accent to-transparent' },
};

function generateSlug(title) {
  return title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || '';
}

const bodyComponents = {
  h2: ({ children }) => (
    <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mt-10 mb-4 leading-snug">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-primary mt-7 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-[1.9] text-foreground/75 mb-5 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground/90">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  ul: ({ children }) => <ul className="my-4 space-y-2 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 space-y-2 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[15px] text-foreground/75 leading-7">
      <span className="mt-2.5 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <div className="my-6 relative">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-primary/70 via-primary/40 to-transparent" />
      <div className="pl-5 text-sm text-muted-foreground italic leading-relaxed">{children}</div>
    </div>
  ),
  hr: () => <div className="my-8 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />,
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
};

export default function ResearchArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: dbNotes = [] } = useQuery({
    queryKey: ['research-notes'],
    queryFn: () => base44.entities.ResearchNote.list('-publish_date', 100),
    staleTime: 5 * 60 * 1000,
  });

  const allNotes = dbNotes.length > 0 ? dbNotes : sampleNotes;
  const note = allNotes.find(n => (n.slug && n.slug === slug) || generateSlug(n.title) === slug);
  const related = allNotes.filter(n => n !== note && n.category === note?.category).slice(0, 3);

  useEffect(() => {
    if (dbNotes.length > 0 && !note) navigate('/Research', { replace: true });
  }, [dbNotes, note, navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!note) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading article...</p>
      </div>
    </div>
  );

  const cfg = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG['Macro'];
  const formattedDate = note.publish_date
    ? new Date(note.publish_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link to="/Research" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-10 group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Research
            </Link>
          </motion.div>

          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/70 backdrop-blur-xl mb-6"
          >
            <div className={`h-1 w-full bg-gradient-to-r ${cfg.bar}`} />
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.06] blur-3xl pointer-events-none bg-gradient-to-br ${cfg.accent} to-transparent`} />

            <div className="p-8 sm:p-10 relative">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Research Note</span>
                <span className="text-border/50">·</span>
                <Badge variant="outline" className={`text-xs border ${cfg.color}`}>{note.category}</Badge>
                {note.is_featured && <Badge className="bg-primary/10 text-primary border-0 text-xs">Featured</Badge>}
                {note.is_premium && <Badge className="bg-amber-400/10 text-amber-400 border-0 text-xs">Premium</Badge>}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-foreground mb-4">
                {note.title}
              </h1>
              {note.subtitle && (
                <p className="text-base text-muted-foreground leading-relaxed mb-6">{note.subtitle}</p>
              )}

              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground/60">
                {formattedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />{formattedDate}
                  </span>
                )}
                {note.read_time_minutes && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />{note.read_time_minutes} min read
                  </span>
                )}
              </div>

              {note.tags?.length > 0 && (
                <div className="flex items-center gap-2 mt-5 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground/30" />
                  {note.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full border border-border/25 text-muted-foreground/50 font-bold uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Button variant="outline" size="sm" className="gap-2 glass border-border/30 text-xs" onClick={handleShare}>
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? 'Link copied' : 'Share'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ── BODY ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="space-y-4"
          >
            {/* Executive Summary */}
            {note.executive_summary && (
              <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/5 backdrop-blur-sm">
                <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
                <div className="p-7 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Executive Summary</span>
                  </div>
                  <p className="text-[15px] leading-[1.9] text-foreground/85 font-medium">{note.executive_summary}</p>
                </div>
              </div>
            )}

            {/* Main Body */}
            {note.body && (
              <div className="relative overflow-hidden rounded-2xl border border-border/25 bg-card/40 backdrop-blur-sm">
                <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
                <div className="p-7 sm:p-8">
                  <ReactMarkdown components={bodyComponents} remarkPlugins={[remarkGfm]}>
                    {note.body}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Key Risks */}
            {note.key_risks && (
              <div className="relative overflow-hidden rounded-2xl border border-red-400/20 bg-red-400/5 backdrop-blur-sm">
                <div className="h-px w-full bg-gradient-to-r from-red-400/40 via-red-400/10 to-transparent" />
                <div className="p-7 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-400/10">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/80">Key Risks</span>
                  </div>
                  <p className="text-[15px] leading-[1.9] text-foreground/75">{note.key_risks}</p>
                </div>
              </div>
            )}

            {/* Takeaway */}
            {note.takeaway && (
              <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-400/5 backdrop-blur-sm">
                <div className="h-px w-full bg-gradient-to-r from-amber-400/40 via-amber-400/10 to-transparent" />
                <div className="p-7 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-400/10">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Key Takeaway</span>
                  </div>
                  <p className="text-[15px] leading-[1.9] text-foreground/85 font-medium">{note.takeaway}</p>
                </div>
              </div>
            )}

            {/* What Would Change My Mind */}
            {note.what_would_change_mind && (
              <div className="relative overflow-hidden rounded-2xl border border-border/25 bg-card/30 backdrop-blur-sm">
                <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
                <div className="p-7 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent/10">
                      <Eye className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">What Would Change My Mind</span>
                  </div>
                  <p className="text-[15px] leading-[1.9] text-foreground/75">{note.what_would_change_mind}</p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-6 border-t border-border/20 flex items-center justify-between flex-wrap gap-4">
              <Link to="/Research" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Research
              </Link>
              <p className="text-[10px] text-muted-foreground/25">Keystone Macro · For informational purposes only · Not financial advice</p>
            </div>
          </motion.div>

          {/* ── RELATED ──────────────────────────────────────────────────── */}
          {related.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <h2 className="font-display text-xl font-semibold mb-5">Related Research</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map(r => {
                  const rcfg = CATEGORY_CONFIG[r.category] || CATEGORY_CONFIG['Macro'];
                  return (
                    <Link
                      key={r.id}
                      to={`/Research/${r.slug || generateSlug(r.title)}`}
                      className="group relative overflow-hidden rounded-2xl border border-border/25 bg-card/40 backdrop-blur-sm hover:border-primary/20 transition-all p-5"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${rcfg.bar} opacity-60`} />
                      <Badge variant="outline" className={`text-xs mb-3 border ${rcfg.color}`}>{r.category}</Badge>
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors mb-2">{r.title}</p>
                      <p className="text-xs text-muted-foreground/50">
                        {new Date(r.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}