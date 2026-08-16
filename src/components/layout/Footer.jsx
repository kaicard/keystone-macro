import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Linkedin, Mail } from 'lucide-react';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { label: 'Research', path: '/Research' },
      { label: 'Markets', path: '/MarketPulse' },
      { label: 'Portfolio', path: '/Portfolios' },
      { label: 'Keystone AI', path: '/AI' },
    ],
  },
  {
    title: 'Publishing',
    links: [
      { label: 'Newsletter', path: '/Newsletter' },
      { label: 'Economic Calendar', path: '/EconomicCalendar' },
      { label: 'Methodology', path: '/Methodology' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', path: '/About' },
      { label: 'Contact', path: '/Contact' },
      { label: 'Privacy', path: '/Privacy' },
      { label: 'Terms', path: '/Terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border/35 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.07] text-[11px] font-semibold text-primary">K</span>
              <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">Keystone Macro</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground/70">
              Independent macro research, portfolio intelligence, and live cross-asset market context.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a aria-label="Keystone Macro on LinkedIn" href="https://www.linkedin.com/company/keystone-macro/" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/60 transition-colors hover:border-primary/25 hover:text-primary"><Linkedin className="h-3.5 w-3.5" /></a>
              <a aria-label="Email Keystone Macro" href="mailto:hello@keystonemacro.com" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/60 transition-colors hover:border-primary/25 hover:text-primary"><Mail className="h-3.5 w-3.5" /></a>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/45">{section.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}><Link to={link.path} className="text-sm text-muted-foreground/70 transition-colors hover:text-foreground">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-border/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-foreground/80">The Keystone Macro Brief</p>
            <p className="mt-1 text-xs text-muted-foreground/55">A concise view of the macro week and what matters next.</p>
          </div>
          <Link to="/Newsletter" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/80 transition-colors hover:text-primary">
            Newsletter options <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border/25 pt-5 text-[10px] text-muted-foreground/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Keystone Macro</p>
          <p>General information only. Not investment advice.</p>
        </div>
      </div>
    </footer>
  );
}
