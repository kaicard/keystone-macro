import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const marketData = [
  { name: 'S&P 500', value: '5,892.41', change: '+0.74%', up: true, data: [40, 42, 38, 45, 43, 48, 47, 50, 52, 49, 53, 55] },
  { name: 'NASDAQ', value: '18,421.30', change: '+1.12%', up: true, data: [30, 35, 32, 38, 36, 42, 40, 45, 43, 47, 50, 52] },
  { name: 'FTSE 100', value: '8,234.56', change: '-0.18%', up: false, data: [50, 48, 52, 49, 47, 50, 48, 45, 47, 46, 44, 43] },
  { name: '10Y Yield', value: '4.32%', change: '+3bps', up: true, data: [42, 43, 41, 44, 43, 45, 44, 46, 45, 47, 46, 48] },
  { name: 'VIX', value: '16.42', change: '-4.2%', up: false, data: [28, 25, 30, 22, 24, 20, 22, 18, 20, 17, 19, 16] },
  { name: 'Gold', value: '$2,987.20', change: '+0.55%', up: true, data: [35, 38, 36, 40, 42, 39, 44, 43, 46, 48, 47, 50] },
  { name: 'Brent Oil', value: '$71.45', change: '-1.32%', up: false, data: [60, 58, 62, 56, 58, 54, 56, 52, 55, 50, 52, 48] },
  { name: 'Bitcoin', value: '$87,234', change: '+2.41%', up: true, data: [20, 25, 22, 30, 28, 35, 32, 40, 38, 42, 45, 48] },
];

const regime = { label: 'Risk-On', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };

export default function MarketPulsePreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Market Pulse</h2>
            <p className="text-muted-foreground">Real-time snapshot of global markets and regime indicators.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${regime.bg} ${regime.color} border-0 px-3 py-1`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
              Regime: {regime.label}
            </Badge>
            <Link to="/MarketPulse">
              <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
                Full Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {marketData.map((item, i) => (
            <motion.div
              key={item.name}
              className="glass rounded-xl p-4 hover:border-primary/20 transition-all duration-300 group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
                <div className={`flex items-center gap-1 text-xs font-medium ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.change}
                </div>
              </div>
              <p className="text-lg font-semibold mb-2">{item.value}</p>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.data.map((v, idx) => ({ v, idx }))}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={item.up ? '#34d399' : '#f87171'}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 mt-6 text-center">
          Illustrative data for demonstration purposes. Not real-time.
        </p>
      </div>
    </section>
  );
}