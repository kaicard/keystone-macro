import React, { useState } from 'react';
import { TrendingUp, Zap, AlertTriangle, Globe, DollarSign, Building, ChevronRight } from 'lucide-react';
import ThemeModal from './ThemeModal';

const themes = [
  {
    icon: DollarSign,
    title: 'Higher-for-Longer Rates',
    description: 'Central banks signalling persistent restrictive policy, reshaping duration and equity multiples.',
    count: 12,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Zap,
    title: 'AI Equity Leadership',
    description: 'Semiconductor and software names driving index returns amid accelerating capital expenditure.',
    count: 9,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: AlertTriangle,
    title: 'Oil Supply Risk',
    description: 'Geopolitical tensions in key producing regions creating supply uncertainty and price volatility.',
    count: 7,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: Globe,
    title: 'EM Divergence',
    description: 'Emerging markets split between commodity exporters benefiting from price strength and importers facing pressure.',
    count: 6,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: TrendingUp,
    title: 'UK Fiscal Reset',
    description: 'Gilt market digesting new spending trajectory with implications for sterling and domestic asset allocation.',
    count: 5,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Building,
    title: 'Real Estate Distress',
    description: 'Commercial property under pressure from refinancing risk and higher capitalisation rates.',
    count: 4,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
];

export default function TrendingThemes() {
  const [activeTheme, setActiveTheme] = useState(null);

  return (
    <>
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Trending Themes</h3>
          </div>
          <span className="text-xs text-muted-foreground">Click any theme to explore</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map(theme => (
            <button
              key={theme.title}
              onClick={() => setActiveTheme(theme)}
              className="p-4 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <theme.icon className={`w-4 h-4 ${theme.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors">{theme.title}</h4>
                    <ChevronRight className={`w-3.5 h-3.5 ${theme.color} opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 shrink-0 ml-1`} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{theme.description}</p>
                  <p className={`text-xs font-medium mt-2 ${theme.color}`}>{theme.count} related items →</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeTheme && (
        <ThemeModal theme={activeTheme} onClose={() => setActiveTheme(null)} />
      )}
    </>
  );
}