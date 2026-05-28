import React, { useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Area
} from 'recharts';

// Generate realistic OHLCV price data with a directional bias
function generatePriceData(direction, entryRaw, exitRaw, stopRaw, points = 60) {
  const parseLevel = (raw) => {
    if (!raw) return null;
    const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  };

  const entry = parseLevel(entryRaw) || 100;
  const exit  = parseLevel(exitRaw)  || (direction === 'long' ? entry * 1.15 : entry * 0.85);
  const stop  = parseLevel(stopRaw)  || (direction === 'long' ? entry * 0.94 : entry * 1.06);

  const isLong = direction === 'long';
  const totalMove = (exit - entry) / points;
  const noise = Math.abs(entry) * 0.006;

  let price = isLong ? entry * 0.985 : entry * 1.015; // start slightly before entry
  const data = [];

  for (let i = 0; i < points; i++) {
    const trend = totalMove * (i > points * 0.15 ? 1 : 0); // flat before entry, then trending
    const rand = (Math.random() - 0.48) * noise;
    const pullback = i > points * 0.35 && i < points * 0.45 ? (isLong ? -noise * 1.5 : noise * 1.5) : 0;
    price = price + trend + rand + pullback;

    const volatility = noise * 0.8;
    const open  = price + (Math.random() - 0.5) * volatility;
    const close = price;
    const high  = Math.max(open, close) + Math.random() * volatility;
    const low   = Math.min(open, close) - Math.random() * volatility;
    const vol   = Math.floor(800000 + Math.random() * 2200000 + (i === Math.floor(points * 0.15) ? 3000000 : 0));

    data.push({ i, price: parseFloat(price.toFixed(4)), open, close, high, low, volume: vol });
  }

  return { data, entry, exit, stop };
}

// EMA calculation
function calcEMA(data, period, key = 'price') {
  const k = 2 / (period + 1);
  let ema = data[0][key];
  return data.map((d, i) => {
    if (i === 0) { ema = d[key]; return ema; }
    ema = d[key] * k + ema * (1 - k);
    return parseFloat(ema.toFixed(4));
  });
}

// Bollinger Bands
function calcBollinger(data, period = 20, key = 'price') {
  return data.map((_, i) => {
    if (i < period - 1) return { upper: null, lower: null, mid: null };
    const slice = data.slice(i - period + 1, i + 1).map(d => d[key]);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    return {
      upper: parseFloat((mean + 2 * std).toFixed(4)),
      lower: parseFloat((mean - 2 * std).toFixed(4)),
      mid:   parseFloat(mean.toFixed(4)),
    };
  });
}

// Fibonacci levels between swing low and swing high
function calcFibs(entry, exit, stop) {
  const isLong = exit > entry;
  const swingLow  = isLong ? stop  : exit;
  const swingHigh = isLong ? exit  : stop;
  const range = swingHigh - swingLow;
  return {
    fib_236: parseFloat((swingHigh - range * 0.236).toFixed(4)),
    fib_382: parseFloat((swingHigh - range * 0.382).toFixed(4)),
    fib_500: parseFloat((swingHigh - range * 0.500).toFixed(4)),
    fib_618: parseFloat((swingHigh - range * 0.618).toFixed(4)),
    swingLow,
    swingHigh,
  };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-background/95 border border-border/60 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">Bar {label}</p>
      <p className="text-foreground font-mono">Price: <span className="text-primary font-bold">{d.price?.toFixed(4)}</span></p>
      {d.ema9  != null && <p className="text-orange-400 font-mono">EMA9:  {d.ema9?.toFixed(4)}</p>}
      {d.ema21 != null && <p className="text-blue-400  font-mono">EMA21: {d.ema21?.toFixed(4)}</p>}
      {d.bb_upper != null && <p className="text-purple-300/70 font-mono">BB Upper: {d.bb_upper?.toFixed(4)}</p>}
      {d.bb_lower != null && <p className="text-purple-300/70 font-mono">BB Lower: {d.bb_lower?.toFixed(4)}</p>}
      {d.volume && <p className="text-muted-foreground font-mono">Vol: {(d.volume / 1e6).toFixed(2)}M</p>}
    </div>
  );
};

export default function TradeChart({ direction, entryLevel, exitLevel, stopLevel }) {
  const { data: raw, entry, exit, stop } = useMemo(
    () => generatePriceData(direction, entryLevel, exitLevel, stopLevel),
    [direction, entryLevel, exitLevel, stopLevel]
  );

  const ema9  = useMemo(() => calcEMA(raw, 9),  [raw]);
  const ema21 = useMemo(() => calcEMA(raw, 21), [raw]);
  const bbs   = useMemo(() => calcBollinger(raw, 20), [raw]);
  const fibs  = useMemo(() => calcFibs(entry, exit, stop), [entry, exit, stop]);

  const chartData = raw.map((d, i) => ({
    ...d,
    ema9:     ema9[i],
    ema21:    ema21[i],
    bb_upper: bbs[i].upper,
    bb_lower: bbs[i].lower,
    bb_mid:   bbs[i].mid,
  }));

  const isLong    = direction === 'long';
  const entryBar  = Math.floor(raw.length * 0.15);
  const priceMin  = Math.min(...raw.map(d => d.price));
  const priceMax  = Math.max(...raw.map(d => d.price));
  const priceRange = priceMax - priceMin;
  const yDomain  = [
    parseFloat((priceMin - priceRange * 0.08).toFixed(4)),
    parseFloat((priceMax + priceRange * 0.08).toFixed(4)),
  ];
  const volMax = Math.max(...raw.map(d => d.volume));

  const fmt = (v) => {
    if (v == null) return '';
    if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return v.toFixed(4);
  };

  return (
    <div className="space-y-1">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1 pb-1">
        {[
          { color: 'bg-orange-400', label: 'EMA 9' },
          { color: 'bg-blue-400', label: 'EMA 21' },
          { color: 'bg-purple-400/60', label: 'BB Bands' },
          { color: isLong ? 'bg-emerald-400' : 'bg-red-400', label: 'Price' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-0.5 rounded-full inline-block ${l.color}`} />
            <span className="text-[10px] text-muted-foreground/70">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full inline-block bg-primary/70 border-dashed" style={{ borderTop: '1px dashed' }} />
          <span className="text-[10px] text-muted-foreground/70">Fib Levels</span>
        </div>
      </div>

      {/* Main price chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 50, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(220 20% 14%)" vertical={false} />
          <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 9, fill: 'hsl(215 15% 45%)' }}
            tickFormatter={fmt}
            width={54}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Bollinger band area fill */}
          <Area type="monotone" dataKey="bb_upper" stroke="hsl(270 50% 65% / 0.4)" strokeWidth={1} dot={false}
            fill="hsl(270 50% 65% / 0.06)" fillOpacity={1} strokeDasharray="3 3" activeDot={false} />
          <Area type="monotone" dataKey="bb_lower" stroke="hsl(270 50% 65% / 0.4)" strokeWidth={1} dot={false}
            fill="hsl(270 50% 65% / 0.0)" fillOpacity={1} strokeDasharray="3 3" activeDot={false} />
          <Line type="monotone" dataKey="bb_mid" stroke="hsl(270 50% 65% / 0.25)" strokeWidth={1} dot={false} strokeDasharray="4 4" activeDot={false} />

          {/* EMAs */}
          <Line type="monotone" dataKey="ema21" stroke="#60a5fa" strokeWidth={1.5} dot={false} activeDot={false} />
          <Line type="monotone" dataKey="ema9"  stroke="#fb923c" strokeWidth={1.5} dot={false} activeDot={false} />

          {/* Price */}
          <Line
            type="monotone" dataKey="price"
            stroke={isLong ? '#34d399' : '#f87171'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: isLong ? '#34d399' : '#f87171' }}
          />

          {/* Entry zone shading */}
          <ReferenceArea x1={entryBar - 1} x2={entryBar + 2}
            fill={isLong ? 'hsl(160 50% 40% / 0.12)' : 'hsl(0 80% 50% / 0.12)'}
            stroke="none"
          />

          {/* Fibonacci levels */}
          <ReferenceLine y={fibs.fib_618} stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 3"
            label={{ value: '61.8%', position: 'right', fontSize: 8, fill: '#f59e0b' }} />
          <ReferenceLine y={fibs.fib_500} stroke="#a78bfa" strokeWidth={1} strokeDasharray="5 3"
            label={{ value: '50.0%', position: 'right', fontSize: 8, fill: '#a78bfa' }} />
          <ReferenceLine y={fibs.fib_382} stroke="#38bdf8" strokeWidth={1} strokeDasharray="5 3"
            label={{ value: '38.2%', position: 'right', fontSize: 8, fill: '#38bdf8' }} />
          <ReferenceLine y={fibs.fib_236} stroke="#4ade80" strokeWidth={1} strokeDasharray="5 3"
            label={{ value: '23.6%', position: 'right', fontSize: 8, fill: '#4ade80' }} />

          {/* Entry / Target / Stop */}
          <ReferenceLine y={entry} stroke={isLong ? '#34d399' : '#f87171'} strokeWidth={1.5}
            label={{ value: 'ENTRY', position: 'insideLeft', fontSize: 8, fill: isLong ? '#34d399' : '#f87171', fontWeight: 700 }} />
          <ReferenceLine y={exit} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2"
            label={{ value: 'TARGET', position: 'insideLeft', fontSize: 8, fill: '#f59e0b', fontWeight: 700 }} />
          <ReferenceLine y={stop} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2"
            label={{ value: 'STOP', position: 'insideLeft', fontSize: 8, fill: '#ef4444', fontWeight: 700 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume bars */}
      <ResponsiveContainer width="100%" height={52}>
        <ComposedChart data={chartData} margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
          <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={false} axisLine={false} tickLine={false} width={54} domain={[0, volMax * 2.5]} />
          <Bar dataKey="volume" fill="hsl(215 20% 40% / 0.5)" radius={[1, 1, 0, 0]} />
          <ReferenceLine y={0} stroke="hsl(220 20% 20%)" strokeWidth={1} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-[9px] text-muted-foreground/30 text-center">Illustrative technical chart — educational reference only. Not based on real historical price data.</p>
    </div>
  );
}