import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, FileText, Briefcase, BarChart3, Clock } from 'lucide-react';

const metrics = [
  { icon: TrendingUp, value: 3.5, suffix: '+', label: 'Years Trading Experience', decimals: 1 },
  { icon: FileText, value: 50, suffix: '+', label: 'Macro Views Published', decimals: 0 },
  { icon: Briefcase, value: 12, suffix: '', label: 'Portfolio Case Studies', decimals: 0 },
  { icon: BarChart3, value: 80, suffix: '+', label: 'Market Research Notes', decimals: 0 },
  { icon: Clock, value: 52, suffix: '/yr', label: 'Weekly Research Updates', decimals: 0 },
];

function AnimatedCounter({ value, suffix, decimals, inView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = 16;
    const steps = duration / step;
    const increment = value / steps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
      {count.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function CredibilityStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 sm:py-20 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                <metric.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="mb-1">
                <AnimatedCounter value={metric.value} suffix={metric.suffix} decimals={metric.decimals} inView={inView} />
              </div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}