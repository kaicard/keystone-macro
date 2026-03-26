import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { useLiveQuotes } from '@/hooks/useLiveQuotes';
import { useMarketData, MarketTile } from '@/components/marketpulse/LiveMarketData';
import RegimePanel from '@/components/marketpulse/RegimePanel';
import MarketSummary from '@/components/marketpulse/MarketSummary';
import TopMovers from '@/components/marketpulse/TopMovers';
import SectorHeatmap from '@/components/marketpulse/SectorHeatmap';
import CreditAndCurve from '@/components/marketpulse/CreditAndCurve';
import LiveTickerBar from '@/components/marketpulse/LiveTickerBar';

function fmtPrice(price, name) {
  if (price == null) return '—';
  if (typeof price === 'string') return price;
  if (name?.includes('/')) return price.toFixed(4);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtChange(changePct) {
  if (changePct == null) return '—';
  if (typeof changePct === 'string') return changePct;
  return `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`;
}

function LiveTile({ item }) {
  return (
    <MarketTile
      name={item.name || item.ticker}
      value={fmtPrice(item.price, item.name)}
      change={fmtChange(item.change_pct)}
      direction={item.direction}
    />
  );
}

function LiveGrid({ items, cols = 4 }) {
  const gridClass = {
    2: 'grid-cols-2',
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[cols] || 'grid-cols-2 md:grid-cols-4';

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
      {items.map(item => <LiveTile key={item.ticker} item={item} />)}
    </div>
  );
}

// LLM-fetched data (regime, summary, sectors, bonds, credit spreads etc)
function useCombinedData() {
  const liveQuotes = useLiveQuotes();
  const llmData = useMarketData();
  return { liveQuotes, llmData };
}

export default function MarketPulse() {
  const { liveQuotes, llmData } = useCombinedData();
  const { data: live, loading: liveLoading, lastFetched, refresh } = liveQuotes;
  const { data: llm, loading: llmLoading } = llmData;

  const loading = liveLoading || llmLoading;

  return (
    <div className="min-h-screen">
      {/* Live Ticker Bar at top */}
      <div className="pt-16 lg:pt-20">
        <LiveTickerBar data={live} />
      </div>

      <div className="pt-6 pb-20">
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
              Real-time prices updating every 2 seconds. Prices from live market sources.
            </p>
          </motion.div>

          {/* Refresh bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
            <span>
              {lastFetched
                ? `Live · Last fetched ${lastFetched.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Fetching live market data...'}
            </span>
            <button
              onClick={refresh}
              disabled={liveLoading}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Regime Panel */}
          <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <RegimePanel regime={llm?.regime} loading={llmLoading} />
          </motion.div>

          {/* Market Summary */}
          <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <MarketSummary summary={llm?.market_summary} loading={llmLoading} />
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
                    <LiveGrid items={live?.indices} cols={4} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Top Movers</h3>
                    <TopMovers topMovers={llm?.top_movers} loading={llmLoading} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Sector Performance</h3>
                    <SectorHeatmap sectors={llm?.sectors} loading={llmLoading} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Credit, Yield Curve & Dollar</h3>
                    <CreditAndCurve creditSpreads={llm?.credit_spreads} yieldCurve={llm?.yield_curve} dxy={live?.dxy} loading={loading} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Bonds & Yields</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(llm?.bonds || []).map(b => (
                        <MarketTile key={b.name} name={b.name} value={b.yield} change={b.change_bps} direction={b.direction} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Commodities</h3>
                    <LiveGrid items={live?.commodities} cols={4} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">FX</h3>
                    <LiveGrid items={live?.fx} cols={4} />
                  </div>
                  {live?.vix && (
                    <div>
                      <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Volatility</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <LiveTile item={live.vix} />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="equities">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Global Indices</h3>
                    <LiveGrid items={live?.indices} cols={4} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Single Names</h3>
                    <LiveGrid items={live?.equities} cols={4} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="etfs">
                <LiveGrid items={live?.etfs} cols={4} />
              </TabsContent>

              <TabsContent value="sectors">
                <div>
                  <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Sector Performance — Today</h3>
                  <SectorHeatmap sectors={llm?.sectors} loading={llmLoading} />
                </div>
              </TabsContent>

              <TabsContent value="bonds">
                <div className="space-y-8">
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Government Yields</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(llm?.bonds || []).map(b => (
                        <MarketTile key={b.name} name={b.name} value={b.yield} change={b.change_bps} direction={b.direction} />
                      ))}
                      {!llm?.bonds?.length && [...Array(8)].map((_, i) => (
                        <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Credit Spreads, Yield Curve & Dollar</h3>
                    <CreditAndCurve creditSpreads={llm?.credit_spreads} yieldCurve={llm?.yield_curve} dxy={live?.dxy} loading={loading} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="commodities">
                <LiveGrid items={live?.commodities} cols={4} />
              </TabsContent>

              <TabsContent value="fx">
                <LiveGrid items={live?.fx} cols={4} />
              </TabsContent>

              <TabsContent value="crypto">
                <LiveGrid items={live?.crypto} cols={4} />
              </TabsContent>
            </Tabs>
          </motion.div>

          <p className="text-xs text-muted-foreground/30 mt-10 text-center">
            Live market data. Prices update every 2 seconds. Not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}