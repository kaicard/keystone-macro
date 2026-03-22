import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Linkedin, Shield, TrendingUp, Eye, Users, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const principles = [
  { icon: Shield, title: 'Process Over Noise', description: 'Systematic thinking and disciplined frameworks matter more than headlines and hot takes.' },
  { icon: Eye, title: 'Risk Before Return', description: 'Understanding what can go wrong is the foundation of understanding what can go right.' },
  { icon: TrendingUp, title: 'Macro Matters', description: 'Top-down context shapes every asset class. Regimes, cycles, and policy drive markets.' },
  { icon: Users, title: 'Client Suitability', description: 'The right portfolio depends on the person, not just the market. Objectives and constraints come first.' },
  { icon: BookOpen, title: 'Continuous Learning', description: 'Markets evolve constantly. Staying curious, humble, and adaptive is non-negotiable.' },
  { icon: Target, title: 'Clarity of Thought', description: 'Complex ideas communicated simply. If you can\'t explain it clearly, you don\'t understand it well enough.' },
];

const timeline = [
  { year: '2021', title: 'Entered the Markets', description: 'Began systematic trading across equities, FX, and commodities. Developed initial risk frameworks and market instincts.' },
  { year: '2023', title: 'Deep Macro Research', description: 'Focused on macro analysis, regime identification, and multi-asset allocation strategies.' },
  { year: '2024', title: 'Portfolio Construction Focus', description: 'Shifted toward institutional-style portfolio construction, SAA/TAA frameworks, and client suitability.' },
  { year: '2025', title: 'Wealth Management Study', description: 'Expanded into wealth management concepts, client case studies, and educational content creation.' },
  { year: '2026', title: 'Macro Memoir', description: 'Launched this platform to share research, portfolio ideas, and educational wealth strategy content.' },
];

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6">
            About Macro Memoir
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            A platform built from genuine passion for markets, portfolio construction, and the intersection of 
            investment thinking and wealth management.
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          className="glass rounded-2xl p-8 sm:p-12 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Why I Built This</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Macro Memoir started as a way to document a journey in markets — from early trading 
              experiences to developing a deeper understanding of macro regimes, asset allocation, and 
              portfolio construction.
            </p>
            <p>
              Over time, it evolved into something more: a platform to share research, illustrate portfolio 
              thinking, and explore wealth management concepts in a way that combines rigour with accessibility.
            </p>
            <p>
              My interest lies at the intersection of macro analysis, multi-asset investing, risk management, 
              and client suitability. I believe the best investment thinking combines top-down awareness with 
              bottom-up discipline, and always starts with understanding the person behind the portfolio.
            </p>
            <p>
              This platform serves as both a learning tool and a demonstration of how I think about markets, 
              allocate risk, and approach the challenge of building portfolios that are genuinely suitable for 
              different objectives and constraints.
            </p>
          </div>
        </motion.div>

        {/* Principles */}
        <div ref={ref} className="mb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-8 text-center">Core Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                className="glass rounded-xl p-6"
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
        <div className="mb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-8 text-center">Journey</h2>
          <div className="relative">
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border" />
            {timeline.map((t, i) => (
              <motion.div
                key={t.year}
                className={`relative flex items-start gap-6 mb-8 ${
                  i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className={`flex-1 ${i % 2 === 0 ? 'sm:text-right' : 'sm:text-left'} hidden sm:block`}>
                  {i % 2 === 0 ? (
                    <div className="glass rounded-xl p-5">
                      <span className="text-primary font-semibold text-sm">{t.year}</span>
                      <h3 className="font-semibold mt-1 mb-2">{t.title}</h3>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                  ) : <div />}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className={`flex-1 ${i % 2 !== 0 ? 'sm:text-left' : ''}`}>
                  {i % 2 !== 0 ? (
                    <div className="glass rounded-xl p-5">
                      <span className="text-primary font-semibold text-sm">{t.year}</span>
                      <h3 className="font-semibold mt-1 mb-2">{t.title}</h3>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-5 sm:hidden">
                      <span className="text-primary font-semibold text-sm">{t.year}</span>
                      <h3 className="font-semibold mt-1 mb-2">{t.title}</h3>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-2xl font-semibold mb-4">Let's Connect</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Interested in discussing markets, portfolio strategy, or potential opportunities? I'd love to hear from you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/Contact">
              <Button className="gap-2 rounded-full">
                Get In Touch <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 rounded-full glass">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}