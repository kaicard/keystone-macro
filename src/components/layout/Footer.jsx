import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Linkedin, Mail } from 'lucide-react';

const footerLinks = [
  { title: 'Research', links: [
    { label: 'Research', path: '/Research' },
    { label: 'Market Pulse', path: '/MarketPulse' },
    { label: 'Portfolio Lab', path: '/Portfolios' },
    { label: 'Keystone AI', path: '/AI' },
  ]},
  { title: 'Publishing', links: [
    { label: 'Newsletter', path: '/Newsletter' },
    { label: 'Methodology', path: '/Methodology' },
    { label: 'Economic Calendar', path: '/EconomicCalendar' },
  ]},
  { title: 'Company', links: [
    { label: 'About', path: '/About' },
    { label: 'Contact', path: '/Contact' },
    { label: 'Privacy', path: '/Privacy' },
    { label: 'Terms', path: '/Terms' },
  ]},
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <span className="font-display text-base font-semibold tracking-tight">Keystone Macro</span>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm my-4">
              Independent, AI-assisted macro research with source-linked intelligence and cross-asset market context.
            </p>
            <div className="flex items-center gap-3">
              <a aria-label="Keystone Macro on LinkedIn" href="https://www.linkedin.com/company/keystone-macro/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary"><Linkedin className="w-4 h-4" /></a>
              <a aria-label="Email Keystone Macro" href="mailto:hello@keystonemacro.com" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
          {footerLinks.map(section => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.links.map(link => <li key={link.label}><Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="font-medium text-sm mb-1">The Keystone Macro Brief</h2>
            <p className="text-muted-foreground text-xs">Free weekly digest or premium morning and evening editions.</p>
          </div>
          <Button asChild size="sm"><Link to="/Newsletter" className="gap-2">View newsletter options <ArrowRight className="w-4 h-4" /></Link></Button>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Keystone Macro. Informational content only; not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}
