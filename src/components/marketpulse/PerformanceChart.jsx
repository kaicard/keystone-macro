import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const TIMEFRAMES = ['1W', '1M', '3M', '6M', 'YTD', '1Y'];

const SERIES = [
  { key: 'sp500',   label: 'S&P 500',   color: 'hsl(38, 80%, 55%)' },
  { key: 'nasdaq',  label: 'NASDAQ',    color: 'hsl(210, 60%, 55%)' },
  { key: 'ftse',    label: 'FTSE 100',  color: 'hsl(160, 50%, 48%)' },
  { key: 'dax',     label: 'DAX',       color: 'hsl(280, 50%, 58%)' },
];

// Generate plausible illustrative indexed performance data (base 100)
function generateData(tf) {
  const points = { '1W': 7, '1M': 22, '3M': 63, '6M': 126, 'YTD': 85, '1Y': 252 }[tf] || 22;
  const trends = {
    sp500:  { drift: 0.035, vol: 0.7 },
    nasdaq: { drift: 0.05,  vol: 1.1 },
    ftse:   { drift: 0.015, vol: 0.55 },
    dax:    { drift: 0.025, vol: 0.75 },
  };

  // Deterministic seed per timeframe so it doesn't re-jitter on re-render
  let seed = tf.charCodeAt(0) * 137 + tf.length * 31;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return ((seed >>> 0) / 0xffffffff) - 0.5;
  };

  const vals = { sp500: 100, nasdaq: 100, ftse: 100, dax: 100 };
  const data = [{ label: '0', ...vals }];

  for (let i = 1; i <= points; i++) {
    const row = {};
    SERIES.forEach(s => {
      const { drift, vol } = trends[s.key];
      vals[s.key] = +(vals[s.key] + drift / points * 100 + rand() * vol).toFixed(2);
      row[s.key] = vals[s.key];
    });
    row.label = String(i);
    data.push(row);
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs space-y-1 shadow-xl">
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-semibold ml-auto pl-4">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export default function PerformanceChart() {
  const [tf, setTf] = useState('1M');
  const [activeSeries, setActiveSeries] = useState(SERIES.map(s => s.key));

  const data = useMemo(() => generateData(tf), [tf]);

  const toggleSeries = (key) => {
    setActiveSeries(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-sm">Indexed Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Illustrative — base 100. Educational only.</p>
        </div>
        <div className="flex gap-1">
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                tf === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      <div className="flex flex-wrap gap-3 mb-4">
        {SERIES.map(s => (
          <button
            key={s.key}
            onClick={() => toggleSeries(s.key)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
              activeSeries.includes(s.key)
                ? 'border-transparent opacity-100'
                : 'opacity-40 border-border'
            }`}
            style={activeSeries.includes(s.key) ? { borderColor: s.color, background: s.color + '18' } : {}}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tf}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                {SERIES.map(s => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={s.color} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              {SERIES.filter(s => activeSeries.includes(s.key)).map(s => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}