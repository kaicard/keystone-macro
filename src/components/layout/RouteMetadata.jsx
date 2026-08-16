import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const META = {
  '/Home': ['Keystone Macro | Macro Research & Market Intelligence', 'Macro research, portfolio intelligence and live cross-asset market insight for serious investors.'],
  '/Research': ['Macro Research | Keystone Macro', 'Independent, AI-assisted macro and multi-asset research with transparent sourcing.'],
  '/MarketPulse': ['Market Intelligence | Keystone Macro', 'Cross-asset market data, sector performance, yields, movers, and macro-regime context.'],
  '/Portfolios': ['Portfolio Strategy | Keystone Macro', 'Educational model portfolios and risk-aware allocation frameworks.'],
  '/AIPortfolioLab': ['Portfolio Analytics | Keystone Macro', 'Interactive portfolio analytics, risk diagnostics, and educational allocation tools.'],
  '/AI': ['Keystone Research Assistant | Keystone Macro', 'Explore macro questions and educational portfolio scenarios with an AI-assisted research tool.'],
  '/EconomicCalendar': ['Economic Calendar | Keystone Macro', 'Track the economic releases and policy events that matter across global markets.'],
  '/Newsletter': ['The Macro Brief | Keystone Macro', 'Choose the free weekly digest or premium morning and evening Keystone Macro briefings.'],
  '/WealthCases': ['Portfolio Case Studies | Keystone Macro', 'Practical portfolio case studies built around objectives, constraints, and risk.'],
  '/Insights': ['Platform Analytics | Keystone Macro', 'Keystone Macro platform activity and research analytics.'],
  '/About': ['About | Keystone Macro', 'The people, process, and principles behind Keystone Macro.'],
  '/Contact': ['Contact | Keystone Macro', 'Contact Keystone Macro with research questions, collaboration enquiries, or early-career interest.'],
  '/Privacy': ['Privacy | Keystone Macro', 'How Keystone Macro collects, uses, protects, and retains personal information.'],
  '/Methodology': ['Research Methodology | Keystone Macro', 'Keystone Macro sourcing, AI assistance, editorial review, market-data, and correction policies.'],
  '/Terms': ['Terms | Keystone Macro', 'Terms, risk disclosures, subscription conditions, and important limitations.'],
};

export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const key = Object.keys(META).find(route => pathname === route || (route !== '/Home' && pathname.startsWith(route + '/'))) || '/Home';
    const [title, description] = META[key];
    const publicPath = key === '/Home' ? '/' : pathname;
    const pageUrl = `https://keystonemacro.com${publicPath}`;
    document.title = title;
    const setMeta = (selector, attribute, value) => {
      let element = document.head.querySelector(selector);
      if (!element) { element = document.createElement('meta'); document.head.appendChild(element); }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = pageUrl;
  }, [pathname]);
  return null;
}
