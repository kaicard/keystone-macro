import React from 'react';
import { motion } from 'framer-motion';
import { Link2, FileCheck2, BarChart3, Mail, Scale } from 'lucide-react';

const capabilities = [
  { icon: Link2, title: 'Source-linked intelligence', text: 'Direct links and verification status on new intelligence items.' },
  { icon: FileCheck2, title: 'Reviewed research', text: 'AI-assisted drafts remain unpublished until editorial review.' },
  { icon: BarChart3, title: 'Cross-asset context', text: 'Equities, rates, FX, commodities, credit, and regime signals.' },
  { icon: Mail, title: 'Subscriber briefings', text: 'Morning and evening editions with an accessible archive.' },
  { icon: Scale, title: 'Transparent methodology', text: 'Clear sourcing, data-delay, AI, and correction policies.' },
];

export default function CredibilityStrip() {
  return (
    <section className="py-16 sm:py-20 border-y border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-accent/3 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {capabilities.map((item, index) => (
            <motion.div key={item.title} className="glass rounded-2xl p-5" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold mb-2">{item.title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
