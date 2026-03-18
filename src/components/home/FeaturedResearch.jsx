import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const sampleResearch = [
  {
    id: 1,
    category: 'Macro',
    title: 'The Rate Regime Shift: Navigating Higher-for-Longer',
    summary: 'Central banks signal a prolonged period of elevated rates. We examine the implications for multi-asset allocation and duration positioning.',
    date: '2026-03-15',
    readTime: 8,
  },
  {
    id: 2,
    category: 'Multi-Asset',
    title: 'Strategic vs Tactical: When to Deviate from SAA',
    summary: 'A framework for determining when tactical tilts are warranted, including regime signals and risk budget considerations.',
    date: '2026-03-12',
    readTime: 12,
  },
  {
    id: 3,
    category: 'Equities',
    title: 'Concentration Risk in US Equities: A Portfolio Perspective',
    summary: 'The S&P 500 top-10 weight exceeds 35%. We assess diversification options and hedging strategies for equity-heavy portfolios.',
    date: '2026-03-10',
    readTime: 10,
  },
  {
    id: 4,
    category: 'Wealth Strategy',
    title: 'Tax-Efficient Accumulation: ISA, Pension, and Beyond',
    summary: 'An educational overview of UK tax wrappers and their role in long-term wealth building for mid-career professionals.',
    date: '2026-03-08',
    readTime: 7,
  },
];

const categoryColors = {
  'Macro': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  'Multi-Asset': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Equities': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Wealth Strategy': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'Fixed Income': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

export default function FeaturedResearch() {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

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
          {sampleResearch.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to="/Research" className="block group">
                <div className="glass rounded-xl p-6 h-full hover:border-primary/30 transition-all duration-300 hover:glow-primary">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className={categoryColors[note.category] || 'bg-muted text-muted-foreground'}>
                      <Tag className="w-3 h-3 mr-1" />
                      {note.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {note.readTime} min read
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {note.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {note.summary}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}