import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Sparkles, ArrowRight, BarChart3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AILabPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Research & Portfolio Tool</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
              Keystone AI
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Two tools in one: chat with a senior macro analyst for real-time market views and positioning ideas, or generate illustrative portfolio allocations tailored to your regime, risk appetite, and objectives.
            </p>

            {/* Two feature cards */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">Analyst Chat</p>
                  <p className="text-xs text-muted-foreground">Ask macro questions, get institutional-grade views on markets, policy, and positioning, delivered conversationally.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">Portfolio Lab</p>
                  <p className="text-xs text-muted-foreground">Generate illustrative SAA/TAA allocations based on risk tolerance, time horizon, and market regime. Designed to educate.</p>
                </div>
              </div>
            </div>

            <Link to="/AI">
              <Button className="gap-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                Try Keystone AI
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
            <div className="glass rounded-2xl p-6 glow-accent relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
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