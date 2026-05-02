import React, { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, Tag, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sampleNotes } from '@/lib/researchNotes';

const categoryColors = {
  'Macro': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  'Multi-Asset': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Equities': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Wealth Strategy': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'Fixed Income': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  'Commodities': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'Behavioural Finance': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'Risk Management': 'bg-red-400/10 text-red-400 border-red-400/20',
  'Trade Reviews': 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
};

function NoteCard({ note, delay, inView, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div
        className="glass rounded-xl p-6 h-full hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Badge variant="outline" className={categoryColors[note.category] || 'bg-muted text-muted-foreground'}>
            <Tag className="w-3 h-3 mr-1" />
            {note.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {note.read_time_minutes} min read
          </span>
          {isNew(note.publish_date) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">
              <TrendingUp className="w-2.5 h-2.5" /> New
            </span>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors leading-snug">
          {note.title}
        </h3>
        {note.subtitle && (
          <p className="text-xs text-muted-foreground/70 mb-2 italic">{note.subtitle}</p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {note.executive_summary}
        </p>
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
    </motion.div>
  );
}

function isNew(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (now - d) / (1000 * 60 * 60 * 24) <= 3;
}

function generateSlug(title) {
  return title
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || '';
}

export default function FeaturedResearch() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const navigate = useNavigate();

  const { data: dbNotes } = useQuery({
    queryKey: ['research-notes'],
    queryFn: () => base44.entities.ResearchNote.list('-created_date', 50),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const [showOlder, setShowOlder] = useState(false);

  // Merge DB notes with sample notes — DB notes take precedence (dedup by title)
  const allNotes = useMemo(() => {
    const dbTitles = new Set(dbNotes.map(n => n.title?.toLowerCase().trim()));
    const filteredSamples = sampleNotes.filter(n => !dbTitles.has(n.title?.toLowerCase().trim()));
    return [...dbNotes, ...filteredSamples];
  }, [dbNotes]);

  const sorted = [...allNotes]
    .filter(n => !n.status || n.status === 'published' || n.publish_date)
    .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

  // Split into current/prev week vs older
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfPrevWeek = new Date(startOfThisWeek);
  startOfPrevWeek.setDate(startOfThisWeek.getDate() - 7);

  const recentNotes = sorted.filter(n => new Date(n.publish_date) >= startOfPrevWeek);
  const olderNotes = sorted.filter(n => new Date(n.publish_date) < startOfPrevWeek);

  // Fallback: if recentNotes empty, just show top 4 from all
  const displayRecent = recentNotes.length > 0 ? recentNotes : sorted.slice(0, 4);
  const displayOlder = recentNotes.length > 0 ? olderNotes : [];

  return (
    <section ref={ref} className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Latest Research</h2>
            <p className="text-muted-foreground">Market commentary, investment theses, and portfolio insights.</p>
          </div>
          <Link to="/Research">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayRecent.map((note, i) => (
            <NoteCard key={note.id} note={note} delay={i * 0.1} inView={inView} onClick={() => navigate(`/Research/${note.slug || generateSlug(note.title)}`)} />
          ))}
        </div>

        {/* Older notes */}
        {displayOlder.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowOlder(o => !o)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              {showOlder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showOlder ? 'Hide older notes' : `Show ${displayOlder.length} older note${displayOlder.length !== 1 ? 's' : ''}`}
            </button>
            <AnimatePresence>
              {showOlder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {displayOlder.map((note, i) => (
                      <NoteCard key={note.id} note={note} delay={i * 0.05} inView={true} onClick={() => navigate(`/Research/${note.slug || generateSlug(note.title)}`)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}