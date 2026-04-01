import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroBackground from './HeroBackground';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroBackground />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Macro Research · Portfolio Intelligence · Live Market Data
            </span>
          </div>
        </motion.div>

        <motion.h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Macro Research.{' '}
          <span className="text-gradient">Portfolio Intelligence.</span>
          {' '}Real-Time Market Insight.
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          A platform for macro analysis, asset allocation, and modern wealth strategy.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/Research">
            <Button size="lg" className="group px-6 gap-2 rounded-full relative overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <BookOpen className="w-4 h-4" />
              View Research
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/Portfolios">
            <Button size="lg" variant="outline" className="px-6 gap-2 rounded-full glass">
              View Model Portfolios
            </Button>
          </Link>
          <Link to="/AIPortfolioLab">
            <Button size="lg" variant="ghost" className="gap-2 rounded-full text-primary hover:text-primary">
              <Sparkles className="w-4 h-4" />
              AI Portfolio Lab
            </Button>
          </Link>
        </motion.div>

        <motion.p
          className="text-xs text-muted-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Educational. Not financial advice.
        </motion.p>
      </div>

      {/* Scroll indicator */}
       <motion.div
         className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer"
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8, delay: 1.0 }}
         onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
       >
         <span className="text-xs text-muted-foreground/40 uppercase font-medium text-center">Scroll</span>
         <motion.div
           className="w-px h-10 bg-gradient-to-b from-muted-foreground/30 to-transparent"
           animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.4, 0.8, 0.4] }}
           transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
         />
       </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}