import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroBackground from './HeroBackground';

export default function HeroSection() {
  return (
    <section className="editorial-hero relative flex min-h-[600px] items-center overflow-hidden border-b border-border pb-16 pt-32 sm:pb-20 sm:pt-40">
      <HeroBackground />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background pointer-events-none" />
      
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-left sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="editorial-hero-kicker mb-7 inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
              Keystone Macro · Independent Market Intelligence
            </span>
          </div>
        </motion.div>

        <motion.h1
          className="mb-6 max-w-4xl font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] sm:text-5xl lg:text-[56px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Macro Research.{' '}
          <span className="text-gradient">Portfolio Intelligence.</span>
          {' '}Live Market Insight.
        </motion.h1>

        <motion.p
          className="mb-9 max-w-2xl text-base font-normal leading-7 text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Clear macro research, live cross-asset context, and practical portfolio intelligence for a more informed view of markets.
        </motion.p>

        <motion.div
          className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/Research">
            <Button size="lg" className="group relative gap-2 overflow-hidden border-brand bg-brand px-6 text-brand-foreground hover:border-brand hover:bg-brand/90 hover:text-brand-foreground">

              <BookOpen className="w-4 h-4" />
              View Research
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/MarketPulse">
            <Button size="lg" variant="outline" className="gap-2 px-6">Markets</Button>
          </Link>
          <Link to="/Newsletter">
            <Button size="lg" variant="ghost" className="gap-2 text-primary hover:text-primary">
              <Sparkles className="w-4 h-4" /> Newsletter
            </Button>
          </Link>
        </motion.div>


      </div>



      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}