import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Sparkles, ArrowRight, Sliders, BarChart3, Shield, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AILabPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Educational Tool</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
              AI Portfolio Lab
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              An intelligent tool that generates illustrative portfolio suggestions based on your selected market regime, 
              risk appetite, and investment objectives. Powered by AI, designed to educate.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Sliders, label: 'Customise Inputs', desc: 'Risk, horizon, regime' },
                { icon: BarChart3, label: 'Visual Outputs', desc: 'Charts & allocation cards' },
                { icon: Shield, label: 'Risk-Aware', desc: 'Regime-sensitive tilts' },
                { icon: Lightbulb, label: 'Educational', desc: 'Learn allocation logic' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/AIPortfolioLab">
              <Button className="gap-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                Try AI Portfolio Lab
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground/50 mt-4">
              Educational only. Illustrative suggestions, not financial advice.
            </p>
          </motion.div>

          {/* Mock interface */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass rounded-2xl p-6 glow-accent">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">ai-portfolio-lab</span>
              </div>
              
              {/* Mock inputs */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Risk Tolerance</span>
                  <span className="text-xs font-medium text-primary">Moderate</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Time Horizon</span>
                  <span className="text-xs font-medium">7–10 Years</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Market Regime</span>
                  <span className="text-xs font-medium text-emerald-400">Risk-On</span>
                </div>
              </div>

              {/* Mock output */}
              <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
                <p className="text-xs font-medium mb-3">Illustrative SAA Suggestion</p>
                <div className="space-y-2">
                  {[
                    { label: 'Global Equities', value: '55%', width: '55%' },
                    { label: 'Fixed Income', value: '25%', width: '25%' },
                    { label: 'Alternatives', value: '10%', width: '10%' },
                    { label: 'Gold', value: '5%', width: '5%' },
                    { label: 'Cash', value: '5%', width: '5%' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">{item.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={inView ? { width: item.width } : {}}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}