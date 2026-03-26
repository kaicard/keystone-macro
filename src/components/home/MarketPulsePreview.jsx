import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveQuotes } from '@/hooks/useLiveQuotes';

function fmtPrice(price, name) {
  if (price == null) return '—';
  if (typeof price === 'string') return price;
  if (name?.includes('/')) return price.toFixed(4);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function MiniTile({ item, delay, inView }) {
  const isUp = item.direction === 'up';
  const isDown = item.direction === 'down';
  const color = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-muted-foreground';
  const changePct = item.change_pct != null
    ? `${item.change_pct > 0 ? '+' : ''}${item.change_pct.toFixed(2)}%`
    : '—';

  return (
    <motion.div
      className="glass rounded-xl p-4 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 group"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground truncate">{item.name || item.ticker}</span>
        <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${color}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {changePct}
        </div>
      </div>
      <p className="text-lg font-bold font-mono tracking-tight">{fmtPrice(item.price, item.name)}</p>
    </motion.div>
  );
}

function SkeletonTile({ i }) {
  return <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />;
}

export default function MarketPulsePreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { data, loading } = useLiveQuotes();

  // Pick a representative selection: 4 indices + gold + brent + bitcoin + vix
  const showcase = data
    ? [
        ...(data.indices?.slice(0, 4) || []),
        data.commodities?.find(c => c.name === 'Gold'),
        data.commodities?.find(c => c.name === 'Brent Crude'),
        data.crypto?.find(c => c.name === 'Bitcoin'),
        data.vix,
      ].filter(Boolean)
    : [];

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Market Pulse</h2>
            <p className="text-muted-foreground">Live prices updating every 2 seconds. Click through for the full dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-400/10 text-emerald-400 border-0 px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
              Live
            </Badge>
            <Link to="/MarketPulse">
              <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
                Full Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading && !data
            ? [...Array(8)].map((_, i) => <SkeletonTile key={i} i={i} />)
            : showcase.slice(0, 8).map((item, i) => (
                <MiniTile key={item.ticker} item={item} delay={i * 0.05} inView={inView} />
              ))
          }
        </div>

        <p className="text-xs text-muted-foreground/40 mt-6 text-center">
          Live market data. Not investment advice.
        </p>
      </div>
    </section>
  );
}