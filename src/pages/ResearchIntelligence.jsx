import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import {
  ArrowLeft, Clock, Radio, Share2, CheckCheck,
  ArrowRight, RefreshCw, AlertTriangle, TrendingUp, Eye, Lightbulb
} from 'lucide-react';
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

// ─── FIND ITEM ACROSS ALL POSSIBLE CACHE KEYS ─────────────────────────────────
async function findItemBySlug(slug) {
  try {
    // Try all cache keys for today — slot 0-11 (every 2 hours)
    const today = new Date().toISOString().split('T')[0];
    const keys = [];
    for (let s = 0; s < 12; s++) keys.push(`intelligenceFeed_${today}_s${s}`);
    // Also try legacy key format
    keys.push(`intelligenceFeed_${today}`);

    const allResults = await Promise.all(
      keys.map(key =>
        base44.entities.MarketCache.filter({ key }).catch(() => [])
      )
    );

    for (const results of allResults) {
      if (!results?.length) continue;
      try {
        const items = JSON.parse(results[0].payload);
        const found = items.find(i => i.slug === slug);
        if (found) return { item: found, allItems: items };
      } catch (_) {}
    }
  } catch (_) {}
  return { item: null, allItems: [] };
}

// ─── ARTICLE CACHE KEY ────────────────────────────────────────────────────────
function getArticleCacheKey(slug) {
  const today = new Date().toISOString().split('T')[0];
  return `intelligenceArticle_${today}_${slug}`;
}

async function loadArticleFromCache(slug) {
  try {
    const key = getArticleCacheKey(slug);
    const results = await base44.entities.MarketCache.filter({ key });
    if (results?.length) return { article: JSON.parse(results[0].payload), recordId: results[0].id };
  } catch (_) {}
  return { article: null, recordId: null };
}

async function saveArticleToCache(slug, article, recordId) {
  const key = getArticleCacheKey(slug);
  const payload = JSON.stringify(article);
  const fetched_at = new Date().toISOString();
  try {
    if (recordId) {
      await base44.entities.MarketCache.update(recordId, { payload, fetched_at, key });
    } else {
      await base44.entities.MarketCache.create({ key, payload, fetched_at });
    }
  } catch (_) {}
}

// ─── GENERATE FULL ARTICLE ────────────────────────────────────────────────────
async function generateArticle(item) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior macro research analyst at Keystone Macro, a Bloomberg-quality intelligence platform. Write a full, professional research article on the following development.

Headline: "${item.headline}"
Category: ${item.category}
Sentiment: ${item.sentiment}
Initial impact: ${item.impact || ''}
Desk view: ${item.desk_view || ''}

Write a complete analytical article with these exact sections. Each section must be substantive — this is institutional-quality research, not a summary.

1. executive_summary: 3-4 sentences. The key development, why it matters, and the immediate market implication.

2. background: 3-4 sentences. The structural context — what led to this development, the macro regime it fits into, recent history of this data/event/policy area.

3. market_reaction: 3-4 sentences. Specific market moves with levels — what happened to currencies, yields, equities, commodities. Name specific instruments and moves (e.g. "EUR/USD fell 0.4% to 1.0820", "US 10-year yields rose 8bp to 4.52%").

4. macro_implications: 4-5 sentences. The deeper structural meaning — what this signals for central bank policy, inflation trajectory, growth outlook, or geopolitical dynamics. Think like a portfolio manager positioning for the next 3-6 months.

5. cross_asset_view: 3-4 sentences. How this affects different asset classes — fixed income, equities, FX, commodities, credit. What trades or positions this supports or undermines.

6. key_risks: 3-4 sentences. What could make this analysis wrong — what data, events, or policy shifts would change the picture.

7. what_to_watch: 3-4 sentences. The specific upcoming catalysts, data releases, or central bank communications that will determine how this develops. Name specific dates or events.

8. keystone_view: 2-3 sentences. Keystone Macro's bottom line — the key takeaway for positioning and what the team is watching most closely.`,
    response_json_schema: {
      type: 'object',
      properties: {
        executive_summary:  { type: 'string' },
        background:         { type: 'string' },
        market_reaction:    { type: 'string' },
        macro_implications: { type: 'string' },
        cross_asset_view:   { type: 'string' },
        key_risks:          { type: 'string' },
        what_to_watch:      { type: 'string' },
        keystone_view:      { type: 'string' },
      }
    }
  });

  return result;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ResearchIntelligence() {
  const { slug } = useParams();
  const [item, setItem]         = useState(null);
  const [related, setRelated]   = useState([]);
  const [article, setArticle]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. Find the item from cache
      const { item: found, allItems } = await findItemBySlug(slug);

      if (!found) {
        setLoading(false);
        return;
      }

      setItem(found);
      setRelated(
        allItems
          .filter(i => i.slug !== slug && i.category === found.category)
          .slice(0, 3)
      );

      // 2. Check for cached article
      const { article: cached, recordId } = await loadArticleFromCache(slug);
      if (cached) {
        setArticle(cached);
        setLoading(false);
        return;
      }

      setLoading(false);

      // 3. Generate article
      setGenerating(true);
      try {
        const generated = await generateArticle(found);
        setArticle(generated);
        saveArticleToCache(slug, generated, recordId);
      } catch (_) {
        // Generation failed — page still shows item data
      } finally {
        setGenerating(false);
      }
    }

    load();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tzLabel = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(p => p.type === 'timeZoneName')?.value || '';

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  if (!item) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Radio className="w-8 h-8 text-muted-foreground/30 mx-auto" />
        <p className="text-muted-foreground text-sm">Intelligence item not found.</p>
        <p className="text-xs text-muted-foreground/50 max-w-xs mx-auto">
          This item may have expired from the cache. Return to Research to see the latest intelligence.
        </p>
        <Link to="/Research" className="text-primary text-sm hover:underline block">
          Back to Research
        </Link>
      </div>
    </div>
  );

  const catStyle  = CATEGORY_STYLES[item.category] || 'bg-muted text-muted-foreground';
  const sentStyle = SENTIMENT_STYLES[item.sentiment] || SENTIMENT_STYLES.neutral;

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link
            to="/Research"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Research
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-400/10 mb-5">
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-400">Intelligence Analysis</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className={`text-xs border ${catStyle}`}>{item.category}</Badge>
            <Badge variant="outline" className={`text-xs border ${sentStyle.badge}`}>{item.sentiment}</Badge>
            {(item.published_time_local || item.published_time) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {item.published_time_local || item.published_time} {tzLabel}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight mb-5">
            {item.headline}
          </h1>

          {/* Impact line */}
          {item.impact && (
            <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
              {item.impact}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 glass border-border/30 text-xs"
              onClick={handleShare}
            >
              {copied
                ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                : <Share2 className="w-3.5 h-3.5" />
              }
              {copied ? 'Link copied' : 'Share'}
            </Button>
          </div>
        </motion.div>

        {/* Article body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {generating && !article && (
            <div className="glass rounded-xl p-8 flex flex-col items-center gap-3 text-center">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm font-medium">Generating full analysis...</p>
              <p className="text-xs text-muted-foreground/60">
                Writing institutional-quality research on this development
              </p>
            </div>
          )}

          {article && (
            <>
              {/* Executive Summary */}
              {article.executive_summary && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-6">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">
                    Executive Summary
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {article.executive_summary}
                  </p>
                </div>
              )}

              <div className="border-t border-border/30" />

              {/* Background */}
              {article.background && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Background
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {article.background}
                  </p>
                </div>
              )}

              {/* Market Reaction */}
              {article.market_reaction && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Market Reaction
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {article.market_reaction}
                  </p>
                </div>
              )}

              {/* Macro Implications */}
              {article.macro_implications && (
                <div className="glass rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Macro Implications
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {article.macro_implications}
                  </p>
                </div>
              )}

              {/* Cross-Asset View */}
              {article.cross_asset_view && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Cross-Asset View
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {article.cross_asset_view}
                  </p>
                </div>
              )}

              {/* Key Risks */}
              {article.key_risks && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
                  <h2 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Key Risks
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {article.key_risks}
                  </p>
                </div>
              )}

              {/* What to Watch */}
              {article.what_to_watch && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    What to Watch
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {article.what_to_watch}
                  </p>
                </div>
              )}

              {/* Instruments to Watch */}
              {item.what_to_watch && (
                <div className="bg-muted/20 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-muted-foreground/60 mb-3 uppercase tracking-wide">
                    Instruments to Watch
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {item.what_to_watch.split(';').map((w, i) => w.trim() && (
                      <span
                        key={i}
                        className="text-xs bg-accent/10 text-accent/90 border border-accent/20 px-2.5 py-1 rounded-full"
                      >
                        {w.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keystone View */}
              {article.keystone_view && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <h2 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Keystone View
                  </h2>
                  <p className="text-sm leading-relaxed font-medium">
                    {article.keystone_view}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="border-t border-border/30 pt-5">
                <p className="text-xs text-muted-foreground/40 leading-relaxed">
                  This analysis was generated by Keystone Macro Intelligence and is provided for
                  informational and educational purposes only. Nothing herein constitutes financial
                  advice, investment advice, or a recommendation to buy or sell any financial instrument.
                  Always seek independent financial advice before making investment decisions.
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Related */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="font-display text-lg font-semibold mb-5">Related Intelligence</h2>
            <div className="space-y-3">
              {related.map((r, i) => (
                <Link
                  key={i}
                  to={`/Research/Intelligence/${r.slug}`}
                  className="flex items-center justify-between glass rounded-xl p-4 hover:border-primary/20 transition-all group"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">
                      {r.headline}
                    </p>
                    {(r.published_time_local || r.published_time) && (
                      <p className="text-xs text-muted-foreground/50 mt-1 font-mono">
                        {r.published_time_local || r.published_time}
                      </p>
                    )}
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