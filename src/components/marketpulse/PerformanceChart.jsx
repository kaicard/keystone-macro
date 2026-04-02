import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TIMEFRAMES = ['1W', '1M', '3M', '6M', 'YTD', '1Y'];

// Full palette of available instruments
const ALL_INSTRUMENTS = [
  { key: 'sp500',       label: 'S&P 500',       color: 'hsl(38, 80%, 55%)',   drift: 0.035, vol: 0.7  },
  { key: 'nasdaq',      label: 'NASDAQ 100',    color: 'hsl(210, 60%, 55%)',  drift: 0.05,  vol: 1.1  },
  { key: 'ftse',        label: 'FTSE 100',      color: 'hsl(160, 50%, 48%)',  drift: 0.015, vol: 0.55 },
  { key: 'dax',         label: 'DAX',           color: 'hsl(280, 50%, 58%)',  drift: 0.025, vol: 0.75 },
  { key: 'cac40',       label: 'CAC 40',        color: 'hsl(340, 60%, 58%)',  drift: 0.02,  vol: 0.65 },
  { key: 'nikkei',      label: 'Nikkei 225',    color: 'hsl(0, 70%, 55%)',    drift: 0.03,  vol: 0.9  },
  { key: 'hangseng',    label: 'Hang Seng',     color: 'hsl(195, 60%, 50%)',  drift: -0.01, vol: 1.0  },
  { key: 'bitcoin',     label: 'Bitcoin',       color: 'hsl(38, 95%, 55%)',   drift: 0.12,  vol: 3.5  },
  { key: 'ethereum',    label: 'Ethereum',      color: 'hsl(245, 60%, 60%)',  drift: 0.1,   vol: 4.0  },
  { key: 'gold',        label: 'Gold',          color: 'hsl(48, 90%, 52%)',   drift: 0.02,  vol: 0.5  },
  { key: 'silver',      label: 'Silver',        color: 'hsl(210, 15%, 65%)',  drift: 0.015, vol: 0.8  },
  { key: 'wticrude',    label: 'WTI Crude',     color: 'hsl(25, 80%, 50%)',   drift: 0.01,  vol: 1.2  },
  { key: 'gbpusd',      label: 'GBP/USD',       color: 'hsl(170, 50%, 48%)',  drift: 0.005, vol: 0.3  },
  { key: 'eurusd',      label: 'EUR/USD',       color: 'hsl(220, 60%, 55%)',  drift: 0.003, vol: 0.25 },
  { key: 'usdjpy',      label: 'USD/JPY',       color: 'hsl(0, 55%, 55%)',    drift: -0.005,vol: 0.3  },
  { key: 'apple',       label: 'Apple',         color: 'hsl(200, 70%, 52%)',  drift: 0.045, vol: 1.2  },
  { key: 'nvidia',      label: 'NVIDIA',        color: 'hsl(120, 55%, 45%)',  drift: 0.08,  vol: 2.2  },
  { key: 'tesla',       label: 'Tesla',         color: 'hsl(350, 65%, 52%)',  drift: 0.04,  vol: 2.8  },
  { key: 'microsoft',   label: 'Microsoft',     color: 'hsl(215, 70%, 55%)',  drift: 0.04,  vol: 1.0  },
  { key: 'amazon',      label: 'Amazon',        color: 'hsl(30, 80%, 52%)',   drift: 0.05,  vol: 1.3  },
  { key: 'vix',         label: 'VIX',           color: 'hsl(0, 80%, 60%)',    drift: -0.02, vol: 2.0  },
  { key: 'tlt',         label: 'TLT (20Y Bond)',color: 'hsl(190, 55%, 48%)',  drift: -0.01, vol: 0.6  },
  { key: 'hyg',         label: 'HYG (HY Credit)',color:'hsl(60, 60%, 48%)',   drift: 0.01,  vol: 0.5  },
  { key: 'naturalgas',  label: 'Natural Gas',   color: 'hsl(155, 55%, 45%)',  drift: -0.02, vol: 2.5  },
  { key: 'copper',      label: 'Copper',        color: 'hsl(20, 70%, 50%)',   drift: 0.02,  vol: 1.0  },
];

const DEFAULT_KEYS = ['sp500', 'nasdaq', 'ftse', 'dax'];

function generateData(tf, seriesKeys) {
  const points = { '1W': 7, '1M': 22, '3M': 63, '6M': 126, 'YTD': 85, '1Y': 252 }[tf] || 22;

  let seed = tf.charCodeAt(0) * 137 + tf.length * 31;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return ((seed >>> 0) / 0xffffffff) - 0.5;
  };

  const instruments = ALL_INSTRUMENTS.filter(s => seriesKeys.includes(s.key));
  const vals = {};
  instruments.forEach(s => { vals[s.key] = 100; });

  const data = [{ label: '0', ...vals }];

  for (let i = 1; i <= points; i++) {
    const row = { label: String(i) };
    instruments.forEach(s => {
      vals[s.key] = +(vals[s.key] + s.drift / points * 100 + rand() * s.vol).toFixed(2);
      row[s.key] = vals[s.key];
    });
    data.push(row);
  }
  return data;
}

const CustomTooltip = ({ active, payload }) => {
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

function InstrumentPicker({ selectedKeys, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const available = ALL_INSTRUMENTS.filter(
    s => !selectedKeys.includes(s.key) &&
      s.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="absolute top-full left-0 mt-2 z-50 w-64 glass rounded-xl shadow-2xl border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search instrument..."
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        {available.length === 0 && (
          <p className="text-xs text-muted-foreground/50 px-3 py-3 text-center">No results</p>
        )}
        {available.map(s => (
          <button
            key={s.key}
            onClick={() => { onAdd(s.key); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/40 transition-colors text-left"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PerformanceChart() {
  const [tf, setTf] = useState('1M');
  const [selectedKeys, setSelectedKeys] = useState(DEFAULT_KEYS);
  const [activeSeries, setActiveSeries] = useState(DEFAULT_KEYS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const data = useMemo(() => generateData(tf, selectedKeys), [tf, selectedKeys]);

  const visibleInstruments = ALL_INSTRUMENTS.filter(s => selectedKeys.includes(s.key));

  const toggleSeries = (key) => {
    setActiveSeries(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  const addInstrument = (key) => {
    setSelectedKeys(prev => [...prev, key]);
    setActiveSeries(prev => [...prev, key]);
  };

  const removeInstrument = (key) => {
    if (selectedKeys.length <= 1) return;
    setSelectedKeys(prev => prev.filter(k => k !== key));
    setActiveSeries(prev => prev.filter(k => k !== key));
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-sm">Indexed Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Base 100 — illustrative.</p>
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

      {/* Series toggles + Add button */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {visibleInstruments.map(s => (
          <div
            key={s.key}
            className={`flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1 rounded-full border transition-all duration-200 group/chip ${
              activeSeries.includes(s.key) ? 'opacity-100' : 'opacity-35'
            }`}
            style={activeSeries.includes(s.key) ? { borderColor: s.color, background: s.color + '18' } : { borderColor: 'hsl(var(--border))' }}
          >
            <button onClick={() => toggleSeries(s.key)} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </button>
            {selectedKeys.length > 1 && (
              <button
                onClick={() => removeInstrument(s.key)}
                className="ml-0.5 opacity-0 group/chip:opacity-60 hover:!opacity-100 transition-opacity hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add instrument picker */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen(v => !v)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          {pickerOpen && (
            <InstrumentPicker
              selectedKeys={selectedKeys}
              onAdd={addInstrument}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tf + selectedKeys.join()}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                {visibleInstruments.map(s => (
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
              {visibleInstruments.filter(s => activeSeries.includes(s.key)).map(s => (
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