import React from 'react';
import { Star, X, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketTile } from './LiveMarketData';
import { getInstrumentStatus } from '@/lib/marketHours';

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

// Merge live data into watchlist items
function enrichItem(item, liveData) {
  if (!liveData) return item;
  const allItems = [
    ...(liveData.indices || []),
    ...(liveData.equities || []),
    ...(liveData.fx || []),
    ...(liveData.commodities || []),
    ...(liveData.crypto || []),
    ...(liveData.etfs || []),
    liveData.vix,
    liveData.dxy,
  ].filter(Boolean);

  const live = allItems.find(l => l?.ticker === item.ticker);
  return live || item;
}

export default function WatchlistPanel({ watchlist, onRemove, liveData, onSelect }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Star className="w-4 h-4 text-primary fill-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">My Watchlist</h3>
        <span className="ml-auto text-xs text-muted-foreground/50">{watchlist.length} asset{watchlist.length !== 1 ? 's' : ''}</span>
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <Inbox className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/50">No assets added yet.</p>
          <p className="text-xs text-muted-foreground/35">Click the ★ on any tile to add it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {watchlist.map(item => {
              const enriched = enrichItem(item, liveData);
              const status = getInstrumentStatus(enriched.name || enriched.ticker);
              return (
                <motion.div
                  key={item.ticker}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group/watch"
                >
                  <div onClick={() => onSelect?.(enriched)} className="cursor-pointer">
                    <MarketTile
                      name={enriched.name || enriched.ticker}
                      value={fmtPrice(enriched.price, enriched.name)}
                      change={fmtChange(enriched.change_pct)}
                      direction={enriched.direction}
                      closed={!status.open}
                    />
                  </div>
                  <button
                    onClick={() => onRemove(item.ticker)}
                    className="absolute bottom-2.5 right-3 opacity-0 group-hover/watch:opacity-60 transition-opacity hover:!opacity-100 hover:text-red-400 text-muted-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}