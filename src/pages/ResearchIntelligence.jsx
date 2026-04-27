import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import { ArrowLeft, Clock, Radio, Share2, CheckCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CATEGORY_STYLES = {
  Macro:        'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Equities:     'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Rates:        'bg-blue-400/10 text-blue-400 border-blue-400/20',
  Commodities:  'bg-orange-400/10 text-orange-400 border-orange-400/20',
  Geopolitics:  'bg-red-400/10 text-red-400 border-red-400/20',
  FX:           'bg-purple-400/10 text-purple-400 border-purple-400/20',
  Credit:       'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  Technology:   'bg-violet-400/10 text-violet-400 border-violet-400/20',
  'US Economy': 'bg-sky-400/10 text-sky-400 border-sky-400/20',
  'UK Economy': 'bg-rose-400/10 text-rose-400 border-rose-400/20',
  'EU Economy': 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
};

const SENTIMENT_STYLES = {
  positive: { badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  negative: { badge: 'bg-red-400/10 text-red-400 border-red-400/20' },
  neutral:  { badge: 'bg-muted text-muted-foreground border-border/40' },
};

async function loadCachedItems() {
  try {
    const results = await base44.entities.MarketCache.filter({ key: 'intelligenceFeed' });
    if (results?.length) return JSON.parse(results[0].payload);
  } catch (_) {}
  return [];
}

export default function ResearchIntelligence() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCachedItems().then(items => {
      const found = items.find(i => i.slug === slug);
      if (found) {
        setItem(found);
        setRelated(items.filter(i => i.slug !== slug && i.category === found.category).slice(0, 3));
      }
      setLoading(false);
    });
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!item) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Intelligence item not found.</p>
        <Link to="/Research" className="text-primary text-sm hover:underline">Back to Research</Link>
      </div>
    </div>
  );

  const catStyle = CATEGORY_STYLES[item.category] || 'bg-muted text-muted-foreground';
  const sentStyle = SENTIMENT_STYLES[item.sentiment] || SENTIMENT_STYLES.neutral;

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link to="/Research" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Research
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-400/10 mb-4">
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-400">Intelligence Item</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className={`text-xs border ${catStyle}`}>{item.category}</Badge>
            <Badge variant="outline" className={`text-xs border ${sentStyle.badge}`}>{item.sentiment}</Badge>
            {(item.published_time_local || item.published_time) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />{item.published_time_local || item.published_time} {Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || ''}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight mb-4">{item.headline}</h1>
          {item.impact && <p className="text-muted-foreground text-base leading-relaxed">{item.impact}</p>}

          <div className="mt-5">
            <Button variant="outline" size="sm" className="gap-2 glass border-border/30 text-xs" onClick={handleShare}>
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Link copied' : 'Share'}
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">Desk View</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{item.desk_view}</p>
          </div>

          {item.what_to_watch && (
            <div className="glass rounded-xl p-5">
              <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wide mb-2">Instruments to Watch</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.what_to_watch}</p>
            </div>
          )}

          <div className="border-t border-border/30 pt-5">
            <p className="text-xs text-muted-foreground/40 leading-relaxed">
              This intelligence item was generated by Keystone Macro Intelligence and is provided for informational purposes only.
              Nothing herein constitutes financial advice or a recommendation to trade any instrument.
            </p>
          </div>
        </motion.div>

        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
            <h2 className="font-display text-lg font-semibold mb-5">Related Intelligence</h2>
            <div className="space-y-3">
              {related.map((r, i) => (
                <Link key={i} to={`/Research/Intelligence/${r.slug}`} className="flex items-center justify-between glass rounded-xl p-4 hover:border-primary/20 transition-all group">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">{r.headline}</p>
                    {r.published_time && <p className="text-xs text-muted-foreground/50 mt-1 font-mono">{r.published_time}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}