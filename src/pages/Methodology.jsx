import React from 'react';

const sections = [
  ['Sourcing', 'New intelligence items must carry a direct source URL, named publisher, source timestamp, and verification timestamp. Primary and authoritative sources are preferred. Legacy items without provenance are marked accordingly.'],
  ['AI assistance', 'AI may help scan, summarise, structure, and draft analysis. It is not treated as a source. Automated long-form research is saved as an unpublished draft until editorial review.'],
  ['Market data', 'Market figures come from third-party feeds and may be delayed, incomplete, adjusted, or unavailable. The displayed update time describes the app cache, not an exchange-grade real-time guarantee.'],
  ['Editorial review', 'Published research should distinguish sourced facts from Keystone Macro interpretation, state key risks, and identify what evidence would change the view.'],
  ['Corrections', 'Material errors should be corrected promptly. Contact hello@keystonemacro.com with the page URL and supporting evidence.'],
  ['Scope', 'All content is general information and education. It is not personalised investment advice, a recommendation, or an offer to transact.'],
];

export default function Methodology() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12"><h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Research Methodology</h1><p className="text-muted-foreground">How Keystone Macro sources, reviews, and labels its work.</p></header>
        <div className="glass rounded-2xl p-8 sm:p-12 space-y-9">
          {sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold mb-3">{title}</h2><p className="text-sm leading-relaxed text-muted-foreground">{body}</p></section>)}
        </div>
      </article>
    </div>
  );
}
