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
    <footer className="border-t border-border bg-card/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <img
                src="https://media.base44.com/images/public/69b9efd1e34861737a4d8957/11a966beb_Justthebackground.png"
                alt="Keystone Macro"
                className="h-20 w-auto dark:invert"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg font-semibold tracking-wide">Keystone</span>
                <span className="text-xs font-medium tracking-[0.2em] text-primary uppercase">Macro</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              Professional macro research, multi-asset portfolio intelligence, and wealth strategy — built for serious investors.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:hello@keystonemacro.com"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200">
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
                    <Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group/fl">
                      <span>{link.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/fl:opacity-100 group-hover/fl:translate-x-0 transition-all duration-200" />
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
            © {new Date().getFullYear()} Keystone Macro. All rights reserved.
          </p>
          <div className="flex items-center gap-4">

            <Link to="/Terms" className="text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors whitespace-nowrap">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}