import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import PageBackground from '@/components/layout/PageBackground';
import {
  ArrowLeft, Clock, Radio, Share2, CheckCheck,
  ArrowRight, RefreshCw, AlertTriangle, TrendingUp,
  Eye, Lightbulb, Activity, Globe, BarChart2, Zap, DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CATEGORY_STYLES = {
  Macro:        { badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20',   accent: 'from-amber-500/8',   bar: 'from-amber-400 via-primary to-transparent',     glow: 'bg-amber-400' },
  Equities:     { badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', accent: 'from-emerald-500/8', bar: 'from-emerald-400 via-primary to-transparent', glow: 'bg-emerald-400' },
  Rates:        { badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',       accent: 'from-blue-500/8',    bar: 'from-blue-400 via-accent to-transparent',       glow: 'bg-blue-400' },
  Commodities:  { badge: 'bg-orange-400/10 text-orange-400 border-orange-400/20', accent: 'from-orange-500/8',  bar: 'from-orange-400 via-primary to-transparent',   glow: 'bg-orange-400' },
  Geopolitics:  { badge: 'bg-red-400/10 text-red-400 border-red-400/20',          accent: 'from-red-500/8',     bar: 'from-red-400 via-destructive to-transparent',  glow: 'bg-red-400' },
  FX:           { badge: 'bg-purple-400/10 text-purple-400 border-purple-400/20', accent: 'from-purple-500/8',  bar: 'from-purple-400 via-accent to-transparent',    glow: 'bg-purple-400' },
  Credit:       { badge: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',       accent: 'from-cyan-500/8',    bar: 'from-cyan-400 via-accent to-transparent',      glow: 'bg-cyan-400' },
  Technology:   { badge: 'bg-violet-400/10 text-violet-400 border-violet-400/20', accent: 'from-violet-500/8',  bar: 'from-violet-400 via-accent to-transparent',    glow: 'bg-violet-400' },
  'US Economy': { badge: 'bg-sky-400/10 text-sky-400 border-sky-400/20',          accent: 'from-sky-500/8',     bar: 'from-sky-400 via-accent to-transparent',       glow: 'bg-sky-400' },
  'UK Economy': { badge: 'bg-rose-400/10 text-rose-400 border-rose-400/20',       accent: 'from-rose-500/8',    bar: 'from-rose-400 via-destructive to-transparent', glow: 'bg-rose-400' },
  'EU Economy': { badge: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20', accent: 'from-indigo-500/8',  bar: 'from-indigo-400 via-accent to-transparent',    glow: 'bg-indigo-400' },
};

const SENTIMENT_STYLES = {
  positive: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  negative: 'bg-red-400/10 text-red-400 border-red-400/20',
  neutral:  'bg-muted text-muted-foreground border-border/40',
};

const SECTION_CARDS = [
  { key: 'executive_summary',  label: 'Executive Summary',  icon: Activity,      color: 'border-primary/15 bg-primary/5',      iconBg: 'bg-primary/10',      iconColor: 'text-primary',     barFrom: 'from-primary/40' },
  { key: 'background',         label: 'Background',         icon: Globe,         color: 'border-border/25 bg-card/40',         iconBg: 'bg-muted/40',        iconColor: 'text-muted-foreground', barFrom: 'from-border/60' },
  { key: 'market_reaction',    label: 'Market Reaction',    icon: TrendingUp,    color: 'border-emerald-400/15 bg-emerald-400/5', iconBg: 'bg-emerald-400/10', iconColor: 'text-emerald-400', barFrom: 'from-emerald-400/40' },
  { key: 'macro_implications', label: 'Macro Implications', icon: BarChart2,     color: 'border-amber-400/15 bg-amber-400/5',  iconBg: 'bg-amber-400/10',    iconColor: 'text-amber-400',   barFrom: 'from-amber-400/40' },
  { key: 'cross_asset_view',   label: 'Cross-Asset View',   icon: DollarSign,    color: 'border-blue-400/15 bg-blue-400/5',    iconBg: 'bg-blue-400/10',     iconColor: 'text-blue-400',    barFrom: 'from-blue-400/40' },
  { key: 'key_risks',          label: 'Key Risks',          icon: AlertTriangle, color: 'border-red-400/20 bg-red-400/5',      iconBg: 'bg-red-400/10',      iconColor: 'text-red-400',     barFrom: 'from-red-400/40' },
  { key: 'what_to_watch',      label: 'What to Watch',      icon: Eye,           color: 'border-violet-400/15 bg-violet-400/5', iconBg: 'bg-violet-400/10',  iconColor: 'text-violet-400',  barFrom: 'from-violet-400/40' },
  { key: 'keystone_view',      label: 'Keystone View',      icon: Lightbulb,     color: 'border-amber-400/20 bg-amber-400/5',  iconBg: 'bg-amber-400/10',    iconColor: 'text-amber-400',   barFrom: 'from-amber-400/40' },
];

// ─── Data helpers ─────────────────────────────────────────────────────────────
async function findItemBySlug(slug) {
  try {
    const results = await base44.entities.IntelligenceItem.filter({ slug });
    if (results?.length) {
      const item = results[0];
      const related = await base44.entities.IntelligenceItem.filter({ category: item.category });
      return { item, allItems: related || [] };
    }
  } catch (_) {}
  return { item: null, allItems: [] };
}

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

async function generateArticle(item) {
  return base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior macro research analyst at Keystone Macro, a Bloomberg-quality intelligence platform. Write a full, professional research article on the following development.

Headline: "${item.headline}"
Category: ${item.category}
Sentiment: ${item.sentiment}
Initial impact: ${item.impact || ''}
Desk view: ${item.desk_view || ''}

Write a complete analytical article with these exact sections. Each section must be substantive — this is institutional-quality research, not a summary.

1. executive_summary: 3-4 sentences. The key development, why it matters, and the immediate market implication.
2. background: 3-4 sentences. The structural context — what led to this development, the macro regime it fits into.
3. market_reaction: 3-4 sentences. Specific market moves — currencies, yields, equities, commodities with levels.
4. macro_implications: 4-5 sentences. The deeper structural meaning for central bank policy, inflation, growth or geopolitics.
5. cross_asset_view: 3-4 sentences. How this affects fixed income, equities, FX, commodities, credit.
6. key_risks: 3-4 sentences. What could make this analysis wrong.
7. what_to_watch: 3-4 sentences. Specific upcoming catalysts, data releases, central bank communications.
8. keystone_view: 2-3 sentences. Keystone Macro's bottom-line takeaway for positioning.`,
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
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ config, content, index }) {
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${config.color}`}
    >
      <div className={`h-px w-full bg-gradient-to-r ${config.barFrom} via-border/20 to-transparent`} />
      <div className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.iconBg}`}>
            <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${config.iconColor} opacity-80`}>
            {config.label}
          </span>
        </div>
        <p className="text-[15px] leading-[1.9] text-foreground/80">{content}</p>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResearchIntelligence() {
  const { slug } = useParams();
  const [item, setItem]             = useState(null);
  const [related, setRelated]       = useState([]);
  const [article, setArticle]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { item: found, allItems } = await findItemBySlug(slug);
      if (!found) { setLoading(false); return; }
      setItem(found);
      setRelated(allItems.filter(i => i.id !== found.id).slice(0, 3));

      const { article: cached, recordId } = await loadArticleFromCache(slug);
      if (cached) { setArticle(cached); setLoading(false); return; }

      setLoading(false);
      setGenerating(true);
      try {
        const generated = await generateArticle(found);
        setArticle(generated);
        saveArticleToCache(slug, generated, recordId);
      } catch (_) {}
      finally { setGenerating(false); }
    }
    load();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzLabel = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-muted-foreground">Loading intelligence...</p>
      </div>
    </div>
  );

  if (!item) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Radio className="w-8 h-8 text-muted-foreground/30 mx-auto" />
        <p className="text-muted-foreground text-sm">Intelligence item not found.</p>
        <p className="text-xs text-muted-foreground/50 max-w-xs mx-auto">
          This item may have expired. Return to Research to see the latest intelligence.
        </p>
        <Link to="/Research" className="text-primary text-sm hover:underline block">Back to Research</Link>
      </div>
    </div>
  );

  const cfg = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Macro;

  const formattedTime = item.published_at
    ? new Date(item.published_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: userTZ })
    : null;

  const formattedDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: userTZ })
    : null;

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link to="/Research" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-10 group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Research
            </Link>
          </motion.div>

          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/70 backdrop-blur-xl mb-6"
          >
            <div className={`h-1 w-full bg-gradient-to-r ${cfg.bar}`} />
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.05] blur-3xl pointer-events-none ${cfg.glow}`} />

            <div className="p-8 sm:p-10 relative">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-400/10">
                  <Radio className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Intelligence Analysis</span>
                </div>
                <Badge variant="outline" className={`text-xs border ${cfg.badge}`}>{item.category}</Badge>
                <Badge variant="outline" className={`text-xs border ${SENTIMENT_STYLES[item.sentiment] || SENTIMENT_STYLES.neutral}`}>
                  {item.sentiment}
                </Badge>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-foreground mb-5">
                {item.headline}
              </h1>

              {item.impact && (
                <div className="border-l-2 border-primary/30 pl-4 mb-6">
                  <p className="text-base text-muted-foreground leading-relaxed">{item.impact}</p>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground/50">
                {formattedDate && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />{formattedDate}
                    {formattedTime && <span className="font-mono">{formattedTime} {tzLabel}</span>}
                  </span>
                )}
              </div>

              <div className="mt-6">
                <Button variant="outline" size="sm" className="gap-2 glass border-border/30 text-xs" onClick={handleShare}>
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? 'Link copied' : 'Share'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ── GENERATING ───────────────────────────────────────────────── */}
          {generating && !article && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative overflow-hidden rounded-2xl border border-border/25 bg-card/40 backdrop-blur-sm p-10 flex flex-col items-center gap-4 text-center mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Generating full analysis...</p>
                <p className="text-xs text-muted-foreground/60">Writing institutional-quality research on this development</p>
              </div>
            </motion.div>
          )}

          {/* ── ARTICLE SECTIONS ─────────────────────────────────────────── */}
          {article && (
            <div className="space-y-4">
              {SECTION_CARDS.map((cfg, i) =>
                article[cfg.key] ? (
                  <SectionCard key={cfg.key} config={cfg} content={article[cfg.key]} index={i} />
                ) : null
              )}

              {/* Instruments to Watch */}
              {item.what_to_watch && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + SECTION_CARDS.length * 0.06 }}
                  className="relative overflow-hidden rounded-2xl border border-accent/15 bg-accent/5 backdrop-blur-sm"
                >
                  <div className="h-px w-full bg-gradient-to-r from-accent/40 via-border/20 to-transparent" />
                  <div className="p-7 sm:p-8">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent/10">
                        <Zap className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/80">Instruments to Watch</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.what_to_watch.split(';').map((w, i) => w.trim() && (
                        <span key={i} className="text-xs bg-accent/10 text-accent/90 border border-accent/20 px-3 py-1.5 rounded-full">
                          {w.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ── FOOTER ───────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 pt-8 border-t border-border/20 flex items-center justify-between flex-wrap gap-4"
          >
            <Link to="/Research" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Research
            </Link>
            <p className="text-[10px] text-muted-foreground/25">Keystone Macro Intelligence · Not financial advice</p>
          </motion.div>

          {/* ── RELATED ──────────────────────────────────────────────────── */}
          {related.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <h2 className="font-display text-xl font-semibold mb-5">Related Intelligence</h2>
              <div className="space-y-3">
                {related.map((r, i) => {
                  const rcfg = CATEGORY_STYLES[r.category] || CATEGORY_STYLES.Macro;
                  return (
                    <Link
                      key={i}
                      to={`/Research/Intelligence/${r.slug}`}
                      className="group relative overflow-hidden flex items-center justify-between rounded-2xl border border-border/25 bg-card/40 backdrop-blur-sm p-5 hover:border-primary/20 transition-all"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${rcfg.bar} opacity-50`} />
                      <div className="flex-1 min-w-0 mr-3">
                        <Badge variant="outline" className={`text-[10px] border mb-2 ${rcfg.badge}`}>{r.category}</Badge>
                        <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                          {r.headline}
                        </p>
                        {r.published_at && (
                          <p className="text-xs text-muted-foreground/40 mt-1 font-mono">
                            {new Date(r.published_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: userTZ })} {tzLabel}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}