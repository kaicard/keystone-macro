import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Sparkles, ArrowRight, History, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AILabPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-border/25 bg-card/15 py-16 sm:py-24">
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
              <span className="text-xs font-medium text-primary">AI-assisted research workflow</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
              Keystone Research Assistant
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Chat with a senior macro analyst for real-time market views, policy takes, and positioning ideas. Sign in to save your conversation history and revisit past chats anytime.
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
                  <History className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">Chat History</p>
                  <p className="text-xs text-muted-foreground">Signed-in users get saved conversations — revisit, reference, or delete past chats, just like your favourite AI assistant.</p>
                </div>
              </div>
            </div>

            <Link to="/AI">
              <Button className="gap-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                Open research assistant
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
            <div className="glass relative overflow-hidden rounded-2xl p-6">
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/[0.08] blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">keystone-ai</span>
              </div>
              
              {/* Mock chat */}
              <div className="space-y-3 mb-4">
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                >
                  <div className="px-3 py-2 rounded-xl rounded-tr-sm bg-primary text-primary-foreground text-xs max-w-[70%]">
                    What's your view on Fed policy and duration risk?
                  </div>
                </motion.div>
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 }}
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                  <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-muted/50 border border-border/40 text-xs leading-relaxed max-w-[80%]">
                    The Fed's on hold — sticky services inflation keeps them cautious, but growth softening limits how long they stay hawkish. **Duration looks attractive** into any growth scare; the risk is a tariff-driven inflation re-acceleration.
                  </div>
                </motion.div>
              </div>

              {/* Mock input bar */}
              <div className="rounded-xl bg-muted/30 border border-border/50 px-3 py-2.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground/50 flex-1">Ask about macro, markets, positioning…</span>
                <div className="w-6 h-6 rounded-lg bg-primary/[0.08]0 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}