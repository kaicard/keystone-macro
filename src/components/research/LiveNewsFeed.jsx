import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Radio, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CATEGORY_STYLES = {
  Macro: 'bg-amber-400/10 text-amber-400',
  Equities: 'bg-emerald-400/10 text-emerald-400',
  Rates: 'bg-blue-400/10 text-blue-400',
  Commodities: 'bg-orange-400/10 text-orange-400',
  Geopolitics: 'bg-red-400/10 text-red-400',
  FX: 'bg-purple-400/10 text-purple-400',
  Credit: 'bg-cyan-400/10 text-cyan-400',
};

const HEADLINE_SCHEMA = {
  type: "object",
  properties: {
    headlines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headline: { type: "string" },
          category: { type: "string" },
          sentiment: { type: "string" },
          impact: { type: "string" },
          desk_view: { type: "string" },
          what_to_watch: { type: "string" }
        }
      }
    }
  }
};

const PROMPT = `Generate 8 realistic, current-feeling macro market news headlines for today (${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}). 
These should sound like real Bloomberg/Reuters headlines covering rates, equities, commodities, geopolitics, FX, and macro themes.
For each headline provide:
- headline: short punchy headline (max 15 words)
- category: one of [Macro, Equities, Rates, Commodities, Geopolitics, FX, Credit]
- sentiment: "positive" | "negative" | "neutral"
- impact: 1-sentence market impact summary
- desk_view: 2-3 sentence analysis (what happened, why it matters, market implications)
- what_to_watch: the key follow-on variable to monitor

Make them feel realistic and varied. Include some tension (rate decisions, geopolitical tension, earnings surprises, commodity moves).`;

export default function LiveNewsFeed() {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchHeadlines = useCallback(async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: PROMPT,
      response_json_schema: HEADLINE_SCHEMA,
    });
    if (res?.headlines) {
      setHeadlines(res.headlines);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHeadlines();
    const interval = setInterval(fetchHeadlines, 60 * 60 * 1000); // hourly
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshCount(c => c + 1);
    fetchHeadlines();
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Intelligence Feed</span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Headlines */}
      <div className="divide-y divide-border/30">
        {loading && headlines.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Loading intelligence feed...</p>
          </div>
        ) : (
          headlines.map((item, i) => (
            <div key={`${refreshCount}-${i}`}>
              <button
                className="w-full text-left px-6 py-4 hover:bg-muted/20 transition-colors group"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                      item.sentiment === 'positive' ? 'bg-emerald-400' :
                      item.sentiment === 'negative' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs shrink-0 ${CATEGORY_STYLES[item.category] || 'bg-muted text-muted-foreground'}`}>
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground/60">
                          {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                        {item.headline}
                      </p>
                      {item.impact && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.impact}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 mt-1 text-muted-foreground">
                    {expanded === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 ml-10 space-y-3 border-l-2 border-primary/20 ml-9">
                      <div className="bg-primary/5 rounded-lg p-4">
                        <p className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wide">Desk View</p>
                        <p className="text-sm text-foreground leading-relaxed">{item.desk_view}</p>
                      </div>
                      {item.what_to_watch && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground shrink-0 mt-0.5">Watch:</span>
                          <p className="text-xs text-muted-foreground">{item.what_to_watch}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}