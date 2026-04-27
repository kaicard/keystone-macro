import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import PageBackground from '@/components/layout/PageBackground';

export default function ResearchArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['research-notes'],
    queryFn: () => base44.entities.ResearchNote.list('-publish_date', 200),
  });

  const note = notes.find(n => {
    const noteSlug = n.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return noteSlug === slug || n.id === slug;
  });

  if (isLoading) {
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Article not found.</p>
          <Button variant="ghost" onClick={() => navigate('/Research')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/Research')} className="gap-2 mb-6 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Button>

          {note.hero_image_url && (
            <img src={note.hero_image_url} alt={note.title} className="w-full h-64 object-cover rounded-2xl mb-8" />
          )}

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge variant="outline" className="text-xs">{note.category}</Badge>
            {note.tags?.map(t => <Badge key={t} variant="outline" className="text-xs text-muted-foreground">{t}</Badge>)}
            {note.is_premium && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Premium</Badge>}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2 leading-tight">{note.title}</h1>
          {note.subtitle && <p className="text-lg text-muted-foreground mb-6">{note.subtitle}</p>}

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8 border-b border-border/40 pb-6">
            {note.publish_date && (
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
            {note.read_time_minutes && (
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{note.read_time_minutes} min read</span>
            )}
          </div>

          {note.executive_summary && (
            <div className="glass rounded-xl p-5 mb-8 border-l-2 border-primary/40">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Executive Summary</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.executive_summary}</p>
            </div>
          )}

          {note.body && (
            <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed mb-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-7">
              <ReactMarkdown>{note.body}</ReactMarkdown>
            </div>
          )}

          {note.takeaway && (
            <div className="glass rounded-xl p-5 mb-6 border border-primary/20 bg-primary/5">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Key Takeaway</p>
              <p className="text-sm text-foreground leading-relaxed">{note.takeaway}</p>
            </div>
          )}

          {note.key_risks && (
            <div className="glass rounded-xl p-5 mb-6">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Key Risks</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.key_risks}</p>
            </div>
          )}

          {note.what_would_change_mind && (
            <div className="glass rounded-xl p-5 mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">What Would Change My Mind</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{note.what_would_change_mind}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground/30 text-center mt-12">
            For informational and educational purposes only. Not financial advice.
          </p>
        </motion.div>
      </div>
    </div>
  );
}