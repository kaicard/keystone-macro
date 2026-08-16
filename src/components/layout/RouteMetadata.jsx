import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const META = {
  '/Home': ['Keystone Macro | Independent Macro Research', 'Source-linked intelligence, cross-asset market context, portfolio frameworks, and independent macro research.'],
  '/Research': ['Macro Research | Keystone Macro', 'Independent, AI-assisted macro and multi-asset research with transparent sourcing.'],
  '/MarketPulse': ['Market Intelligence | Keystone Macro', 'Cross-asset market data, sector performance, yields, movers, and macro-regime context.'],
  '/Portfolios': ['Portfolio Strategy | Keystone Macro', 'Educational model portfolios and risk-aware allocation frameworks.'],
  '/AI': ['Keystone Research Assistant | Keystone Macro', 'Explore macro questions and educational portfolio scenarios with an AI-assisted research tool.'],
  '/Newsletter': ['The Macro Brief | Keystone Macro', 'Choose the free weekly digest or premium morning and evening Keystone Macro briefings.'],
  '/About': ['About | Keystone Macro', 'The people, process, and principles behind Keystone Macro.'],
  '/Privacy': ['Privacy | Keystone Macro', 'How Keystone Macro collects, uses, protects, and retains personal information.'],
  '/Methodology': ['Methodology | Keystone Macro', 'Keystone Macro sourcing, AI assistance, editorial review, market-data, and correction policies.'],
  '/Terms': ['Terms | Keystone Macro', 'Terms, risk disclosures, subscription conditions, and important limitations.'],
};

export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const key = Object.keys(META).find(route => pathname === route || (route !== '/Home' && pathname.startsWith(route + '/'))) || '/Home';
    const [title, description] = META[key];
    document.title = title;
    const setMeta = (selector, attribute, value) => {
      let element = document.head.querySelector(selector);
      if (!element) { element = document.createElement('meta'); document.head.appendChild(element); }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', `https://keystonemacro.com${pathname}`);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `https://keystonemacro.com${pathname}`;
  }, [pathname]);
  return null;
}
