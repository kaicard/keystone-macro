import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const indices = [
  { name: 'S&P 500', value: '5,892.41', change: '+0.74%', up: true, data: [40, 42, 38, 45, 43, 48, 47, 50, 52, 49, 53, 55] },
  { name: 'NASDAQ', value: '18,421.30', change: '+1.12%', up: true, data: [30, 35, 32, 38, 36, 42, 40, 45, 43, 47, 50, 52] },
  { name: 'FTSE 100', value: '8,234.56', change: '-0.18%', up: false, data: [50, 48, 52, 49, 47, 50, 48, 45, 47, 46, 44, 43] },
  { name: 'Euro Stoxx 50', value: '5,123.78', change: '+0.45%', up: true, data: [38, 40, 37, 42, 41, 44, 43, 46, 45, 47, 48, 49] },
  { name: 'Nikkei 225', value: '38,456.12', change: '+0.89%', up: true, data: [35, 38, 34, 40, 38, 42, 41, 44, 43, 46, 48, 50] },
  { name: 'DAX', value: '18,234.90', change: '+0.32%', up: true, data: [42, 44, 41, 45, 43, 47, 46, 48, 47, 49, 50, 51] },
];

const bonds = [
  { name: 'US 10Y', value: '4.32%', change: '+3bps', up: true },
  { name: 'US 2Y', value: '4.65%', change: '+1bp', up: true },
  { name: 'UK 10Y Gilt', value: '4.18%', change: '-2bps', up: false },
  { name: 'German Bund', value: '2.45%', change: '+1bp', up: true },
  { name: 'US HY Spread', value: '340bps', change: '-5bps', up: false },
  { name: 'IG Spread', value: '98bps', change: '-2bps', up: false },
];

const commodities = [
  { name: 'Gold', value: '$2,987.20', change: '+0.55%', up: true, data: [35, 38, 36, 40, 42, 39, 44, 43, 46, 48, 47, 50] },
  { name: 'Brent Oil', value: '$71.45', change: '-1.32%', up: false, data: [60, 58, 62, 56, 58, 54, 56, 52, 55, 50, 52, 48] },
  { name: 'WTI Oil', value: '$67.82', change: '-1.18%', up: false, data: [58, 56, 60, 54, 56, 52, 54, 50, 53, 48, 50, 46] },
  { name: 'Silver', value: '$33.45', change: '+0.82%', up: true, data: [28, 30, 27, 32, 31, 34, 33, 35, 34, 36, 37, 38] },
  { name: 'Copper', value: '$4.12', change: '+1.45%', up: true, data: [32, 34, 31, 36, 35, 38, 37, 40, 39, 41, 42, 44] },
  { name: 'Natural Gas', value: '$2.34', change: '-2.1%', up: false, data: [40, 38, 42, 36, 38, 34, 36, 32, 35, 30, 32, 28] },
];

const fx = [
  { name: 'EUR/USD', value: '1.0842', change: '+0.12%', up: true },
  { name: 'GBP/USD', value: '1.2654', change: '-0.08%', up: false },
  { name: 'USD/JPY', value: '149.23', change: '+0.34%', up: true },
  { name: 'DXY', value: '104.52', change: '+0.15%', up: true },
];

const regimeIndicators = [
  { label: 'Current Regime', value: 'Risk-On', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Growth Signal', value: 'Expanding', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Inflation Signal', value: 'Moderating', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { label: 'Policy Stance', value: 'Restrictive', color: 'text-red-400', bg: 'bg-red-400/10' },
  { label: 'Volatility', value: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Leadership', value: 'Growth / Tech', color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

function MarketCard({ item }) {
  return (
    <div className="glass rounded-xl p-4 hover:border-primary/20 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
        <span className={`text-xs font-medium flex items-center gap-1 ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
          {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {item.change}
        </span>
      </div>
      <p className="text-lg font-semibold">{item.value}</p>
      {item.data && (
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.data.map((v, i) => ({ v, i }))}>
              <Line type="monotone" dataKey="v" stroke={item.up ? '#34d399' : '#f87171'} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function MarketPulse() {
  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Market Pulse</h1>
          <p className="text-muted-foreground text-lg">Global market snapshot and regime indicators. Illustrative data.</p>
        </motion.div>

        {/* Regime panel */}
        <motion.div
          className="glass rounded-xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Regime Monitor</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {regimeIndicators.map(r => (
              <div key={r.label} className={`rounded-lg p-3 ${r.bg}`}>
                <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                <p className={`text-sm font-semibold ${r.color}`}>{r.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass border-border/30">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="equities">Equities</TabsTrigger>
            <TabsTrigger value="bonds">Bonds & Yields</TabsTrigger>
            <TabsTrigger value="commodities">Commodities</TabsTrigger>
            <TabsTrigger value="fx">FX</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4">Global Indices</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {indices.map(item => <MarketCard key={item.name} item={item} />)}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Commodities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {commodities.map(item => <MarketCard key={item.name} item={item} />)}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Bonds & Yields</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {bonds.map(item => <MarketCard key={item.name} item={item} />)}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">FX</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fx.map(item => <MarketCard key={item.name} item={item} />)}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equities">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {indices.map(item => <MarketCard key={item.name} item={item} />)}
            </div>
          </TabsContent>

          <TabsContent value="bonds">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bonds.map(item => <MarketCard key={item.name} item={item} />)}
            </div>
          </TabsContent>

          <TabsContent value="commodities">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commodities.map(item => <MarketCard key={item.name} item={item} />)}
            </div>
          </TabsContent>

          <TabsContent value="fx">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fx.map(item => <MarketCard key={item.name} item={item} />)}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground/50 mt-8 text-center">
          All data is illustrative and for demonstration purposes only. Not real-time market data.
        </p>
      </div>
    </div>
  );
}