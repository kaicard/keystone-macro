import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Shield, TrendingUp, Target, Umbrella } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const portfolios = [
  {
    name: 'Balanced Growth',
    icon: TrendingUp,
    risk: 'Moderate',
    investor: 'Mid-career accumulator',
    horizon: '7–10 years',
    mix: '60% Equity · 25% Bonds · 10% Alternatives · 5% Cash',
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    name: 'Global Equity Tilt',
    icon: Target,
    risk: 'Growth',
    investor: 'Higher risk tolerance, long horizon',
    horizon: '10+ years',
    mix: '80% Equity · 10% Bonds · 5% Gold · 5% Alternatives',
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
  },
  {
    name: 'Defensive Income',
    icon: Shield,
    risk: 'Conservative',
    investor: 'Income-focused, lower volatility',
    horizon: '3–5 years',
    mix: '30% Equity · 50% Bonds · 10% Cash · 10% Gold',
    color: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-400',
  },
  {
    name: 'Inflation Resilience',
    icon: Umbrella,
    risk: 'Moderate',
    investor: 'Inflation-aware investor',
    horizon: '5–7 years',
    mix: '40% Equity · 20% Bonds · 15% Commodities · 15% TIPS · 10% Alternatives',
    color: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-400',
  },
];

const riskColors = {
  Conservative: 'bg-emerald-400/10 text-emerald-400',
  Moderate: 'bg-amber-400/10 text-amber-400',
  Growth: 'bg-blue-400/10 text-blue-400',
  Aggressive: 'bg-red-400/10 text-red-400',
};

export default function PortfolioPreview() {
  const ref = useRef(null);
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
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Model Portfolios</h2>
            <p className="text-muted-foreground">Illustrative portfolio ideas for different risk profiles and objectives.</p>
          </div>
          <Link to="/Portfolios">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
              All Portfolios <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {portfolios.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to="/Portfolios" className="block group">
                <div className="glass rounded-xl p-6 h-full hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${p.color} blur-2xl opacity-60 -translate-y-8 translate-x-8`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4`}>
                      <p.icon className={`w-5 h-5 ${p.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-base mb-3 group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <Badge className={`${riskColors[p.risk]} border-0 text-xs mb-3`}>
                      {p.risk}
                    </Badge>
                    <p className="text-xs text-muted-foreground mb-2">{p.investor}</p>
                    <p className="text-xs text-muted-foreground mb-2">Horizon: {p.horizon}</p>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{p.mix}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 mt-6 text-center">
          Illustrative portfolio ideas only. Not financial advice.
        </p>
      </div>
    </section>
  );
}