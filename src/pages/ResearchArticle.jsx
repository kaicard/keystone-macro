import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, Tag, AlertTriangle, Lightbulb, Eye, Share2, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { sampleNotes } from '@/lib/researchNotes';

const categoryColors = {
  'Macro': 'bg-chart-1/10 text-chart-1',
  'Multi-Asset': 'bg-chart-2/10 text-chart-2',
  'Equities': 'bg-chart-3/10 text-chart-3',
  'Wealth Strategy': 'bg-chart-4/10 text-chart-4',
  'Fixed Income': 'bg-chart-5/10 text-chart-5',
  'Commodities': 'bg-amber-400/10 text-amber-400',
  'Behavioural Finance': 'bg-purple-400/10 text-purple-400',
  'Risk Management': 'bg-red-400/10 text-red-400',
  'Trade Reviews': 'bg-cyan-400/10 text-cyan-400',
};

function generateSlug(title) {
  return title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || '';
}

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

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link to="/Research" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Research
          </Link>
        </motion.div>

        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className={`text-xs ${categoryColors[note.category] || ''}`}>{note.category}</Badge>
            {note.is_featured && <Badge className="bg-primary/10 text-primary border-0 text-xs">Featured</Badge>}
            {note.is_premium && <Badge className="bg-amber-400/10 text-amber-400 border-0 text-xs">Premium</Badge>}
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{note.read_time_minutes} min read</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight mb-3">{note.title}</h1>
          {note.subtitle && <p className="text-muted-foreground text-lg leading-relaxed">{note.subtitle}</p>}

          {note.tags?.length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground/50" />
              {note.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-5">
            <Button variant="outline" size="sm" className="gap-2 glass border-border/30 text-xs" onClick={handleShare}>
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Link copied' : 'Share'}
            </Button>
          </div>
        </motion.div>

        <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {note.executive_summary && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Executive Summary</p>
              <p className="text-sm leading-relaxed text-foreground/90">{note.executive_summary}</p>
            </div>
          )}

          <div className="border-t border-border/30" />

          {note.body && (
            <div className="prose prose-sm prose-invert max-w-none
              [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground
              [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-foreground
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-4
              [&_ul]:space-y-2 [&_ul]:my-4 [&_ul]:ml-4
              [&_ol]:space-y-2 [&_ol]:my-4 [&_ol]:ml-4
              [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:my-6 [&_blockquote]:text-muted-foreground/80 [&_blockquote]:italic">
              <ReactMarkdown>{note.body}</ReactMarkdown>
            </div>
          )}

          {note.key_risks && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">Key Risks</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.key_risks}</p>
            </div>
          )}

          {note.takeaway && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Key Takeaway</h3>
              </div>
              <p className="text-sm leading-relaxed font-medium">{note.takeaway}</p>
            </div>
          )}

          {note.what_would_change_mind && (
            <div className="rounded-xl border border-border/30 bg-muted/10 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold">What Would Change My Mind</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.what_would_change_mind}</p>
            </div>
          )}

          <div className="border-t border-border/30 pt-6">
            <p className="text-xs text-muted-foreground/40 leading-relaxed">
              This research note is published by Keystone Macro for educational and informational purposes only.
              Nothing contained herein constitutes financial advice or investment advice.
              Always seek independent financial advice before making investment decisions.
            </p>
          </div>
        </motion.div>

        {related.length > 0 && (
          <motion.div className="mt-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display text-xl font-semibold mb-6">Related Research</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/Research/${r.slug || generateSlug(r.title)}`} className="glass rounded-xl p-5 hover:border-primary/20 transition-all group">
                  <Badge variant="outline" className={`text-xs mb-3 ${categoryColors[r.category] || ''}`}>{r.category}</Badge>
                  <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors mb-2">{r.title}</p>
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(r.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}