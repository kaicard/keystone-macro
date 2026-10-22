import React from 'react';
import { FileText, Layers, TrendingUp, Compass, Eye, AlertTriangle } from 'lucide-react';
import { cleanMarketCopy } from '@/lib/cleanMarketCopy';

function toParagraphs(value) {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value
    .split(/\n+/)
    .map((line) => cleanMarketCopy(line))
    .filter(Boolean);
}

function SectionCard({ icon: Icon, label, tone = 'text-primary', ring = 'border-primary/15 bg-primary/5', children }) {
  return (
    <section className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${ring}`}>
      <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/[0.04]">
            <Icon className={`h-3.5 w-3.5 ${tone}`} />
          </div>
          <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${tone}`}>{label}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function Prose({ value, className = '' }) {
  const paragraphs = toParagraphs(value);
  if (!paragraphs.length) return null;
  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-[15px] leading-[1.85] text-foreground/75">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-[15px] leading-7 text-foreground/75">
          <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const SCENARIO_TONES = [
  { key: 'base_case', label: 'Base case', tone: 'text-foreground/70', ring: 'border-border/25 bg-foreground/[0.02]' },
  { key: 'upside', label: 'Upside', tone: 'text-emerald-400', ring: 'border-emerald-400/20 bg-emerald-400/[0.04]' },
  { key: 'downside', label: 'Downside', tone: 'text-rose-400', ring: 'border-rose-400/20 bg-rose-400/[0.04]' },
];

export default function IntelligenceAnalysisBody({ analysis, item }) {
  if (!analysis) {
    const fallbackWatch = (item?.what_to_watch || '')
      .split(/[;\n]/)
      .map((value) => cleanMarketCopy(value))
      .filter(Boolean);

    return (
      <div className="space-y-4">
        {item?.impact && (
          <SectionCard icon={TrendingUp} label="Market impact">
            <Prose value={item.impact} />
          </SectionCard>
        )}
        {item?.desk_view && (
          <SectionCard icon={FileText} label="Keystone view">
            <Prose value={item.desk_view} />
          </SectionCard>
        )}
        {fallbackWatch.length > 0 && (
          <SectionCard icon={Eye} label="What to watch">
            <BulletList items={fallbackWatch} />
          </SectionCard>
        )}
      </div>
    );
  }

  const implications = (analysis.market_implications || []).filter((row) => row?.read);
  const scenarios = analysis.scenarios || {};
  const watch = (analysis.what_to_watch || []).map((value) => cleanMarketCopy(value)).filter(Boolean);

  return (
    <div className="space-y-4">
      <SectionCard icon={FileText} label="What happened">
        <Prose value={analysis.what_happened} />
      </SectionCard>

      <SectionCard icon={Layers} label="Why it matters" ring="border-border/25 bg-card/40">
        <Prose value={analysis.why_it_matters} />
      </SectionCard>

      {implications.length > 0 && (
        <SectionCard icon={TrendingUp} label="Market implications" ring="border-border/25 bg-card/40">
          <div className="divide-y divide-border/15">
            {implications.map((row, index) => (
              <div key={index} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:gap-6">
                <span className="w-full shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/80 sm:w-32 sm:pt-1">
                  {row.asset_class}
                </span>
                <p className="text-[15px] leading-[1.8] text-foreground/75">{cleanMarketCopy(row.read)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {(scenarios.base_case || scenarios.upside || scenarios.downside) && (
        <SectionCard icon={Compass} label="Scenarios" ring="border-border/25 bg-card/40">
          <div className="grid gap-3 sm:grid-cols-3">
            {SCENARIO_TONES.map((scenario) => {
              const text = cleanMarketCopy(scenarios[scenario.key] || '');
              if (!text) return null;
              return (
                <div key={scenario.key} className={`rounded-xl border p-4 ${scenario.ring}`}>
                  <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.16em] ${scenario.tone}`}>
                    {scenario.label}
                  </p>
                  <p className="text-sm leading-[1.75] text-foreground/70">{text}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {watch.length > 0 && (
        <SectionCard icon={Eye} label="What to watch" ring="border-border/25 bg-card/40">
          <BulletList items={watch} />
        </SectionCard>
      )}

      {analysis.risks_to_view && (
        <SectionCard
          icon={AlertTriangle}
          label="Risks to the view"
          tone="text-red-400"
          ring="border-red-400/20 bg-red-400/5"
        >
          <Prose value={analysis.risks_to_view} />
        </SectionCard>
      )}
    </div>
  );
}