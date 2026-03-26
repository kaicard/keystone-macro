import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMarketData, MarketTile, RefreshBar } from '@/components/marketpulse/LiveMarketData';
import RegimePanel from '@/components/marketpulse/RegimePanel';
import MarketSummary from '@/components/marketpulse/MarketSummary';
import TopMovers from '@/components/marketpulse/TopMovers';
import SectorHeatmap from '@/components/marketpulse/SectorHeatmap';
import CreditAndCurve from '@/components/marketpulse/CreditAndCurve';

function SectionGrid({ items, cols = 6, keyField = 'name', valueField, changeField, directionField, subtextField, withSpark }) {
  const gridClass = {
    2: 'grid-cols-2 md:grid-cols-2',
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[cols] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';

  if (!items?.length) {
    return (
      <div className={`grid ${gridClass} gap-4`}>
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {items.map(item => (
        <MarketTile
          key={item[keyField] || item.pair}
          name={item.name || item.pair}
          value={item.price || item.yield || item.rate}
          change={item.change_pct || item.change_bps || item.change || '—'}
          direction={item.direction}
          subtext={item.change_abs || subtextField}
          sparkData={withSpark ? [...Array(12)].map((_, i) => ({ v: Math.random() * 20 + 40 })) : undefined}
        />
      ))}
    </div>
  );
}

export default function MarketPulse() {
  const { data, loading, lastUpdated, refresh } = useMarketData();

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold">Market Pulse</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Real-time market prices and macro regime analysis. Updates every 15 minutes.
          </p>
        </motion.div>

        <RefreshBar lastUpdated={lastUpdated} loading={loading} onRefresh={refresh} />

        {/* Regime Panel */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <RegimePanel regime={data?.regime} loading={loading} />
        </motion.div>

        {/* Market Summary */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <MarketSummary summary={data?.market_summary} loading={loading} />
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass border-border/30 flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="equities">Equities</TabsTrigger>
              <TabsTrigger value="sectors">Sectors</TabsTrigger>
              <TabsTrigger value="etfs">ETFs</TabsTrigger>
              <TabsTrigger value="bonds">Bonds & Credit</TabsTrigger>
              <TabsTrigger value="commodities">Commodities</TabsTrigger>
              <TabsTrigger value="fx">FX</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Global Indices</h3>
                  <SectionGrid items={data?.indices} cols={4} withSpark />
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Top Movers</h3>
                  <TopMovers topMovers={data?.top_movers} loading={loading} />
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Sector Performance</h3>
                  <SectorHeatmap sectors={data?.sectors} loading={loading} />
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Credit, Yield Curve & Dollar</h3>
                  <CreditAndCurve creditSpreads={data?.credit_spreads} yieldCurve={data?.yield_curve} dxy={data?.dxy} loading={loading} />
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Bonds & Yields</h3>
                  <SectionGrid items={data?.bonds} cols={4} />
                </div>
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Commodities</h3>
                  <SectionGrid items={data?.commodities} cols={4} withSpark />
                </div>
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">FX</h3>
                  <SectionGrid items={data?.fx} cols={4} keyField="pair" />
                </div>
                {data?.vix && (
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Volatility</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MarketTile name="VIX" value={data.vix.value} change={data.vix.change} direction={data.vix.direction} subtext={data.vix.regime} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="equities">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Global Indices</h3>
                  <SectionGrid items={data?.indices} cols={4} withSpark />
                </div>
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Single Names</h3>
                  <SectionGrid items={data?.equities?.map(e => ({ ...e, name: e.ticker || e.name }))} cols={4} withSpark />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="etfs">
              <SectionGrid items={data?.etfs?.map(e => ({ ...e, name: e.ticker || e.name }))} cols={4} withSpark />
            </TabsContent>

            <TabsContent value="sectors">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Sector Performance — Today</h3>
                  <SectorHeatmap sectors={data?.sectors} loading={loading} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bonds">
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Government Yields</h3>
                  <SectionGrid items={data?.bonds} cols={4} />
                </div>
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Credit Spreads, Yield Curve & Dollar</h3>
                  <CreditAndCurve creditSpreads={data?.credit_spreads} yieldCurve={data?.yield_curve} dxy={data?.dxy} loading={loading} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="commodities">
              <SectionGrid items={data?.commodities} cols={6} withSpark />
            </TabsContent>

            <TabsContent value="fx">
              <SectionGrid items={data?.fx} cols={6} keyField="pair" />
            </TabsContent>

            <TabsContent value="crypto">
              {data?.crypto?.length ? (
                <SectionGrid items={data.crypto} cols={4} withSpark />
              ) : (
                <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">Loading...</div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        <p className="text-xs text-muted-foreground/30 mt-10 text-center">
          Live market data. Delayed where applicable. Not investment advice.
        </p>
      </div>
    </div>
  );
}