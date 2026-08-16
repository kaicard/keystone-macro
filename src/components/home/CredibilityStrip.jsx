import React from 'react';
import { Link2, FileCheck2, BarChart3, Mail, Scale } from 'lucide-react';

const capabilities = [
  { icon: Link2, title: 'Transparent sourcing', text: 'Direct source links on new intelligence.' },
  { icon: FileCheck2, title: 'Editorial control', text: 'Long-form drafts require review.' },
  { icon: BarChart3, title: 'Cross-asset coverage', text: 'Rates, FX, equities, credit and commodities.' },
  { icon: Mail, title: 'Concise briefings', text: 'Morning, evening and weekly formats.' },
  { icon: Scale, title: 'Clear methodology', text: 'Data limits and process disclosed.' },
];

export default function CredibilityStrip() {
  return (
    <section className="relative border-y border-border/30 bg-card/20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        {capabilities.map((item, index) => (
          <div key={item.title} className={`flex gap-3 py-5 sm:px-4 lg:py-6 ${index > 0 ? 'border-t border-border/25 sm:border-t-0' : ''} ${index % 2 === 1 ? 'sm:border-l' : ''} ${index > 0 ? 'lg:border-l' : ''}`}>
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/75" />
            <div>
              <h2 className="text-xs font-semibold text-foreground/85">{item.title}</h2>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground/55">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
