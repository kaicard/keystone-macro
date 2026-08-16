import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveQuotes } from '@/hooks/useLiveQuotes';
import { getExchangeStatus } from '@/lib/marketHours';

function fmtPrice(price, name) {
  if (price == null) return '—';
  if (typeof price === 'string') return price;
  if (name?.includes('/')) return price.toFixed(4);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtPct(val) {
  if (val == null) return '—';
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
}

function InstrumentRow({ item }) {
  if (!item) return null;
  const isUp = item.direction === 'up';
  const isDown = item.direction === 'down';
  const color = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground/80 truncate">{item.name}</span>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-mono font-semibold">{fmtPrice(item.price, item.name)}</span>
        <span className={`text-xs font-mono flex items-center gap-0.5 ${color} w-16 justify-end`}>
          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
          {fmtPct(item.change_pct)}
        </span>
      </div>
    </div>
  );
}

function SessionCard({ title, flag, isOpen, instruments, loading, delay, inView }) {
  return (
    <motion.div
      className="glass flex flex-col rounded-xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase">{flag}</span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <Badge className={isOpen
          ? 'bg-emerald-400/10 text-emerald-400 border-0 text-[10px] px-2 py-0.5'
          : 'bg-muted/50 text-muted-foreground border-0 text-[10px] px-2 py-0.5'
        }>
          {isOpen ? (
            <><div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse inline-block" />Open</>
          ) : (
            <><Clock className="w-2.5 h-2.5 mr-1 inline-block" />Closed</>
          )}
        </Badge>
      </div>
      <div className="flex-1">
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="h-4 bg-muted/40 rounded animate-pulse mb-3" />)
          : instruments.map(item => <InstrumentRow key={item?.ticker} item={item} />)
        }
      </div>
    </motion.div>
  );
}

export default function MarketPulsePreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { data, loading } = useLiveQuotes();

  // FX & commodities are always tradeable — no "closed" issue
  const fx = data?.fx || [];
  const commodities = data?.commodities || [];
  const crypto = data?.crypto || [];

  const usStatus = getExchangeStatus('US');
  const ukStatus = getExchangeStatus('UK');
  // Asia: check JP
  const jpStatus = getExchangeStatus('JP');

  const sessions = [
    {
      title: 'US Session',
      flag: 'US',
      isOpen: usStatus.open,
      instruments: [
        fx.find(f => f.name === 'EUR/USD'),
        fx.find(f => f.name === 'GBP/USD'),
        commodities.find(c => c.name === 'Gold'),
        commodities.find(c => c.name === 'WTI Crude'),
        crypto.find(c => c.name === 'Bitcoin'),
      ].filter(Boolean),
    },
    {
      title: 'UK / EU Session',
      flag: 'EU',
      isOpen: ukStatus.open,
      instruments: [
        fx.find(f => f.name === 'GBP/USD'),
        fx.find(f => f.name === 'EUR/USD'),
        fx.find(f => f.name === 'EUR/GBP'),
        commodities.find(c => c.name === 'Brent Crude'),
        commodities.find(c => c.name === 'Gold'),
      ].filter(Boolean),
    },
    {
      title: 'Asia Session',
      flag: 'APAC',
      isOpen: jpStatus.open,
      instruments: [
        fx.find(f => f.name === 'USD/JPY'),
        fx.find(f => f.name === 'AUD/USD'),
        commodities.find(c => c.name === 'Gold'),
        commodities.find(c => c.name === 'Copper'),
        crypto.find(c => c.name === 'Bitcoin'),
      ].filter(Boolean),
    },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-border/25 bg-card/20 py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.025] via-transparent to-primary/[0.025]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Market Intelligence</h2>
            <p className="text-muted-foreground">Live prices by trading session. Click through for the full dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-400/10 text-emerald-400 border-0 px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
              Live
            </Badge>
            <Link to="/MarketPulse">
              <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
                Open markets <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {sessions.map((s, i) => (
            <SessionCard
              key={s.title}
              title={s.title}
              flag={s.flag}
              isOpen={s.isOpen}
              instruments={s.instruments}
              loading={loading && !data}
              delay={i * 0.1}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}