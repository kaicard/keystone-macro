import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-border/50">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-mono font-semibold">{payload[0]?.value?.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
    </div>
  );
}

export default function InstrumentChartModal({ item, onClose }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('1d');

  const isUp = item.direction === 'up';
  const isFlat = item.direction === 'flat' || !item.direction;
  const color = isFlat ? '#888' : isUp ? '#34d399' : '#f87171';
  const gradientId = `gradient-${item.ticker?.replace(/[^a-z0-9]/gi, '')}`;

  useEffect(() => {
    setLoading(true);
    setChartData([]);
    base44.functions.invoke('instrumentChart', { ticker: item.ticker, range })
      .then(res => {
        if (res?.data?.points?.length) setChartData(res.data.points);
      })
      .finally(() => setLoading(false));
  }, [item.ticker, range]);

  const changeColor = isFlat ? 'text-muted-foreground' : isUp ? 'text-emerald-400' : 'text-red-400';

  const RANGES = ['1d', '5d', '1mo', '3mo', '1y'];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative glass-strong rounded-2xl w-full max-w-2xl shadow-2xl border border-border/60 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border/40">
            <div>
              <h2 className="text-xl font-bold font-display">{item.name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.ticker}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold font-mono">
                  {item.price?.toLocaleString('en-US', { maximumFractionDigits: item.price < 10 ? 4 : 2 })}
                </p>
                <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${changeColor}`}>
                  {isFlat ? <Minus className="w-3.5 h-3.5" /> : isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {item.change_pct != null ? `${item.change_pct > 0 ? '+' : ''}${item.change_pct.toFixed(2)}%` : '—'}
                </p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex gap-1 px-6 pt-4">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  range === r
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="px-4 pt-2 pb-6 h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No chart data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="t"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickCount={4}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground) / 0.5)', fontFamily: 'var(--font-inter)' }}
                    dy={6}
                    minTickGap={40}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={false}
                    tickCount={4}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground) / 0.5)', fontFamily: 'var(--font-inter)' }}
                    tickFormatter={v => {
                      if (v >= 10000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
                      if (v >= 100) return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
                      if (v >= 1) return v.toFixed(2);
                      return v.toFixed(4);
                    }}
                    width={52}
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.4 }} />
                  <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}