import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp, Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BEATS = [
  { key: 'markets',      label: 'Markets' },
  { key: 'us_economy',   label: 'US Economy' },
  { key: 'uk_economy',   label: 'UK Economy' },
  { key: 'eu_economy',   label: 'EU Economy' },
  { key: 'commodities',  label: 'Commodities' },
  { key: 'tech',         label: 'Technology' },
  { key: 'geopolitics',  label: 'Geopolitics' },
  { key: 'rates_credit', label: 'Rates & Credit' },
];

const SENTIMENT_STYLES = {
  positive: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  negative: 'bg-red-400/10 text-red-400 border-red-400/20',
  neutral:  'bg-muted/60 text-muted-foreground border-border/40',
};

function ArticleCard({ article, index }) {
  const [expanded, setExpanded] = useState(false);
  const domain = article.url_hint || '';
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(article.headline)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="border-b border-border/20 last:border-0"
    >
      <button
        className="w-full text-left px-5 py-4 hover:bg-muted/10 transition-colors group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
            article.sentiment === 'positive' ? 'bg-emerald-400' :
            article.sentiment === 'negative' ? 'bg-red-400' : 'bg-amber-400/50'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {article.source && (
                <span className="text-xs font-semibold text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded">
                  {article.source}
                </span>
              )}
              {article.published_time && (
                <span className="text-xs text-muted-foreground/40 font-mono">{article.published_time}</span>
              )}
              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 border ${SENTIMENT_STYLES[article.sentiment] || SENTIMENT_STYLES.neutral}`}>
                {article.sentiment}
              </Badge>
            </div>
            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
              {article.headline}
            </p>
          </div>
          <span className="text-muted-foreground/30 shrink-0 mt-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pl-10 border-l-2 border-primary/15 ml-5 mr-5">
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{article.summary}</p>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Find on {domain || 'the web'}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BeatFeed({ beat }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasFetched = useRef(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const res = await base44.functions.invoke('beatNews', { beat });
    if (res?.data?.articles?.length) {
      setArticles(res.data.articles);
      setLastUpdated(new Date(res.data.fetched_at));
    }
    setLoading(false);
  }, [beat]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchArticles();
    }
  }, [fetchArticles]);

  return (
    <div>
      {/* Feed header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
        {lastUpdated && !loading && (
          <span className="text-xs text-muted-foreground/50">
            Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {loading && <span className="text-xs text-muted-foreground/50">Fetching latest...</span>}
        <button
          onClick={fetchArticles}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Articles */}
      <div>
        {loading && articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Scanning live sources...</p>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article, i) => (
            <ArticleCard key={i} article={article} index={i} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No stories loaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsHub() {
  const [activeBeat, setActiveBeat] = useState('markets');

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
        <Newspaper className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">News by Beat</h3>
        <span className="text-xs text-muted-foreground ml-1">Click any story to expand</span>
      </div>

      {/* Beat tabs — horizontal scroll */}
      <div className="flex overflow-x-auto gap-1 p-3 border-b border-border/30 scrollbar-hide">
        {BEATS.map(beat => (
          <button
            key={beat.key}
            onClick={() => setActiveBeat(beat.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeBeat === beat.key
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {beat.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBeat}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <BeatFeed beat={activeBeat} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}