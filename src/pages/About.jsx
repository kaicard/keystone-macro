import React, { useRef } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Linkedin, Shield, TrendingUp, Eye, Users, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const principles = [
  { icon: Shield, title: 'Process Over Noise', description: 'Systematic thinking and disciplined frameworks cut through market noise. Rigour and repeatability outperform reactive decision-making.' },
  { icon: Eye, title: 'Risk Before Return', description: 'Understanding tail risks, drawdown dynamics, and correlation regimes is the foundation of any serious portfolio construction process.' },
  { icon: TrendingUp, title: 'Macro Drives Everything', description: 'Regime identification shapes asset allocation across every cycle. Central bank policy, fiscal impulse, and growth inflections set the context.' },
  { icon: Users, title: 'Suitability First', description: 'The right portfolio is defined by the investor\'s objectives, constraints, and behavioural profile, not by the market environment alone.' },
  { icon: BookOpen, title: 'First-Principles Thinking', description: 'Challenging consensus views and building investment theses from the ground up produces differentiated, high-conviction research.' },
  { icon: Target, title: 'Clarity of Thought', description: 'Institutional-quality ideas demand precise communication. If a framework cannot be explained clearly, it is not yet fully understood.' },
];

const timeline = [
  { year: '2021', title: 'Active Market Participation', description: 'Began systematic trading across equities, FX, and commodities, building early risk frameworks through hands-on exposure to live market conditions.' },
  { year: '2023', title: 'Proprietary Trading', description: 'Managed funded capital across indices and commodities, generating consistent monthly returns through macro-driven trade ideas.' },
  { year: '2024', title: 'University of Surrey', description: 'Began BSc Economics. Deepened work in strategic and tactical asset allocation, factor analysis, and client-suitability frameworks.' },
  { year: '2025', title: 'Spring Programmes', description: 'Completed competitive spring insight programmes spanning finance, trading, and research.' },
  { year: '2026', title: 'Precious Metals & Keystone Macro', description: 'Summer internship within the physical bullion and precious-metals settlement ecosystem. Launched Keystone Macro the same year.' },
];

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className="pt-24 lg:pt-28 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6">
            About Keystone Macro
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Independent macro and multi-asset research, built by Kai Card — Economics student at the University of Surrey.
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          className="rounded-xl border border-border/55 bg-card/50 p-6 sm:p-8 mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-6">The Platform</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Keystone Macro is Kai Card’s independent macro and multi-asset research platform, developed alongside Economics studies at the University of Surrey and hands-on market work.
            </p>
            <p>
              Experience spans proprietary trading across indices and commodities, competitive spring insight programmes in finance and trading, and a summer internship within the physical bullion and precious-metals settlement ecosystem. The platform uses AI to assist analysis; new intelligence carries direct attribution, and automated long-form drafts are reviewed before publication.
            </p>
            <p>
              The investment philosophy is rooted in macro-first thinking: identifying regimes, understanding central bank dynamics, and constructing portfolios genuinely calibrated to client objectives, constraints, and behavioural realities — not just market conditions.
            </p>
          </div>
        </motion.div>

        {/* Principles */}
        <div ref={ref} className="mb-12 sm:mb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-8 text-center">Core Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                className="rounded-xl border border-border/55 bg-card/45 p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-12 sm:mb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-8 text-center">Experience</h2>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" aria-hidden="true" />
            <div className="space-y-5">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.year}
                  className="relative flex items-start gap-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0 rounded-xl border border-border/55 bg-card/45 p-5">
                    <span className="text-primary font-semibold text-sm">{t.year}</span>
                    <h3 className="font-semibold mt-1 mb-2">{t.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Early careers */}
        <motion.section
          id="early-careers"
          className="mb-12 sm:mb-16 rounded-xl border border-border/55 bg-card/45 p-6 sm:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Opportunities</p>
              <h2 className="font-display text-2xl font-semibold mb-3">Early Careers &amp; Contributors</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Keystone Macro welcomes enquiries from students and early-career professionals interested in markets, research, and portfolio strategy. Whether you have a question, are seeking short-term experience, or would like to contribute to a research or data project, you’re encouraged to get in touch.
              </p>
            </div>
            <Link to="/Contact?type=early-careers" className="shrink-0">
              <Button variant="outline" className="gap-2">
                Register your interest <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-2xl font-semibold mb-4">Contact</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Open to conversations on macro markets, portfolio strategy, asset allocation, and professional opportunities in investment management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/Contact">
              <Button className="gap-2">
                Contact <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="https://www.linkedin.com/company/keystone-macro/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}