import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, GraduationCap, Briefcase, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cases = [
  {
    icon: GraduationCap,
    title: 'Young Professional',
    subtitle: 'Building wealth from £25k',
    description: 'Graduate starting a long-term investment journey with a focus on equity accumulation and tax-efficient wrappers.',
    risk: 'Medium-High',
    horizon: '20+ years',
  },
  {
    icon: Briefcase,
    title: 'Mid-Career Executive',
    subtitle: '£250k investable assets',
    description: 'Established professional seeking diversified growth with some income, balancing career earnings with portfolio returns.',
    risk: 'Medium',
    horizon: '10–15 years',
  },
  {
    icon: Building2,
    title: 'Entrepreneur Post-Exit',
    subtitle: 'Capital preservation & growth',
    description: 'Business owner after liquidity event requiring structured allocation, downside protection, and inflation hedging.',
    risk: 'Low-Medium',
    horizon: '7–10 years',
  },
  {
    icon: Clock,
    title: 'Near-Retirement',
    subtitle: 'Income & preservation focus',
    description: 'Pre-retiree transitioning from accumulation to decumulation, prioritising capital preservation and reliable income.',
    risk: 'Low',
    horizon: '3–5 years',
  },
];

export default function WealthCasesPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Wealth Case Studies</h2>
            <p className="text-muted-foreground">Illustrative client scenarios and suitability-driven allocation.</p>
          </div>
          <Link to="/WealthCases">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
              All Cases <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to="/WealthCases" className="block group">
                <div className="glass rounded-xl p-6 h-full hover:border-primary/20 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{c.title}</h3>
                  <p className="text-xs text-primary/80 mb-3">{c.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                    <span>Risk: {c.risk}</span>
                    <span>Horizon: {c.horizon}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 mt-6 text-center">
          Hypothetical scenarios for educational purposes. Not personal advice.
        </p>
      </div>
    </section>
  );
}