import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';

const TIMEFRAMES = ['1M', '3M', '6M', '1Y', '3Y', '5Y'];

const RISK_PARAMS = {
  Conservative: { drift: 0.018, vol: 0.35, color: 'hsl(210, 60%, 55%)' },
  Moderate:     { drift: 0.032, vol: 0.60, color: 'hsl(38, 80%, 55%)' },
  Growth:       { drift: 0.048, vol: 0.90, color: 'hsl(280, 50%, 58%)' },
  Aggressive:   { drift: 0.065, vol: 1.30, color: 'hsl(340, 65%, 58%)' },
};

function generatePortfolioData(tf, risk) {
  const points = { '1M': 22, '3M': 63, '6M': 126, '1Y': 252, '3Y': 756, '5Y': 1260 }[tf] || 63;
  const { drift, vol } = RISK_PARAMS[risk] || RISK_PARAMS.Moderate;
  const step = drift / points;

  let seed = tf.charCodeAt(0) * 97 + risk.length * 53;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return ((seed >>> 0) / 0xffffffff) - 0.5;
  };

  let val = 100;
  const data = [{ idx: 0, value: 100 }];
  for (let i = 1; i <= points; i++) {
    val = +(val + step * 100 + rand() * vol).toFixed(2);
    data.push({ idx: i, value: Math.max(val, 20) });
  }
  return data;
}

const CustomTooltip = ({ active, payload, color }) => {
  if (!active || !payload?.[0]) return null;
  const v = payload[0].value;
  const change = v - 100;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold" style={{ color }}>{v.toFixed(1)}</p>
      <p className={`mt-0.5 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs. start
      </p>
    </div>
  );
};

export default function PortfolioPerformanceChart({ risk }) {
  const [tf, setTf] = useState('1Y');
  const { color } = RISK_PARAMS[risk] || RISK_PARAMS.Moderate;
  const data = useMemo(() => generatePortfolioData(tf, risk), [tf, risk]);
  const finalVal = data[data.length - 1]?.value ?? 100;
  const totalReturn = (finalVal - 100).toFixed(1);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold text-sm">Illustrative Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Base 100 · Educational only</p>
        </div>
        <div className="flex gap-1 flex-wrap">
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

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold tracking-tight" style={{ color }}>{finalVal.toFixed(1)}</span>
        <span className={`text-sm font-medium ${+totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {+totalReturn >= 0 ? '+' : ''}{totalReturn}%
        </span>
        <span className="text-xs text-muted-foreground">over {tf}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tf + risk}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="portfolio-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" vertical={false} />
              <XAxis dataKey="idx" hide />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v.toFixed(0)}
              />
              <ReferenceLine y={100} stroke="hsl(215 15% 40%)" strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip color={color} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#portfolio-grad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-muted-foreground/50 mt-3">
        Simulated illustrative data only. Not indicative of actual returns.
      </p>
    </div>
  );
}