import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Clock, Tag, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sampleNotes } from '@/lib/researchNotes';
import ResearchNoteModal from '@/components/research/ResearchNoteModal';

// Show the 4 most recent notes (sorted by publish_date descending)
const latestNotes = [...sampleNotes]
  .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date))
  .slice(0, 4);

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

function isNew(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (now - d) / (1000 * 60 * 60 * 24) <= 3;
}

export default function FeaturedResearch() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedNote, setSelectedNote] = useState(null);

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
          {latestNotes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className="glass rounded-xl p-6 h-full hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 cursor-pointer group"
                onClick={() => setSelectedNote(note)}
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
          ))}
        </div>
      </div>

      {selectedNote && (
        <ResearchNoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </section>
  );
}