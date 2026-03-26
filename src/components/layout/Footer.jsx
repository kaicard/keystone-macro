import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Linkedin, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { label: 'Research', path: '/Research' },
      { label: 'Portfolios', path: '/Portfolios' },
      { label: 'AI Portfolio Lab', path: '/AIPortfolioLab' },
      { label: 'Market Pulse', path: '/MarketPulse' },
    ]
  },
  {
    title: 'Insights',
    links: [
      { label: 'Wealth Cases', path: '/WealthCases' },
      { label: 'Monthly Letter', path: '/Research' },
      { label: 'Trade Reviews', path: '/Research' },
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', path: '/About' },
      { label: 'Contact', path: '/Contact' },
    ]
  }
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    await base44.entities.NewsletterSubscriber.create({ email });
    toast({ title: 'Subscribed', description: 'Welcome to the weekly macro and portfolio digest.' });
    setEmail('');
    setSubmitting(false);
  };

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <div>
                <span className="font-display text-lg font-semibold">Macro Memoir</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              Professional macro research, multi-asset portfolio intelligence, and wealth strategy — built for serious investors.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:hello@macromemoir.com"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map(section => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="font-medium text-sm mb-1">Weekly Macro & Portfolio Digest</h4>
              <p className="text-muted-foreground text-xs">Research notes, market commentary, and portfolio insights delivered weekly.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm w-full">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-muted/50 border-border/50 text-sm"
              />
              <Button type="submit" size="sm" disabled={submitting} className="shrink-0">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Macro Memoir. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Live market data. Delayed where applicable. Opinions expressed are not investment recommendations.
          </p>
        </div>
      </div>
    </footer>
  );
}