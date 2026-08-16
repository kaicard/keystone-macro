import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Clock, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageBackground from '@/components/layout/PageBackground';

export default function ResearchIntelligence() {
  const { slug } = useParams();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['intelligence-item', slug],
    queryFn: () => base44.entities.IntelligenceItem.filter({ slug }),
  });
  const item = items[0];

  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>;
  if (!item) return (
    <div className="min-h-screen pt-24 flex items-center justify-center"><div className="text-center"><h1 className="font-display text-3xl font-semibold mb-3">Intelligence item not found</h1><Button asChild variant="outline"><Link to="/Research"><ArrowLeft className="w-4 h-4 mr-2" />Back to research</Link></Button></div></div>
  );

  const published = item.source_published_at || item.published_at;
  return (
    <div className="pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link to="/Research" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="w-4 h-4" />Research intelligence</Link>
        <header className="mb-8">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">{item.category}</span>
            {published && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(published).toLocaleString('en-GB')}</span>}
            {item.verification_status === 'verified' && <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" />Verified source</span>}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">{item.headline}</h1>
        </header>

        {item.source_url ? (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[0.045] p-4 mb-6 hover:bg-primary/[0.07] transition-colors">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Primary reference</p><p className="text-sm font-medium">{item.source_name || 'Open source'}</p></div>
            <ExternalLink className="w-4 h-4 text-primary shrink-0" />
          </a>
        ) : (
          <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.045] p-4 mb-6"><AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">This legacy item predates source-link requirements. Treat it as unverified commentary.</p></div>
        )}

        <div className="space-y-3">
          {item.impact && <section className="rounded-xl border border-border/55 bg-card/45 p-5"><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Market impact</h2><p className="leading-relaxed text-foreground/85">{item.impact}</p></section>}
          {item.desk_view && <section className="rounded-xl border border-border/55 bg-card/45 p-5"><h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Keystone view</h2><p className="leading-relaxed text-foreground/85">{item.desk_view}</p></section>}
          {item.what_to_watch && <section className="rounded-xl border border-border/55 bg-card/45 p-5"><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">What to watch</h2><p className="leading-relaxed text-foreground/85">{item.what_to_watch}</p></section>}
        </div>

        <p className="text-xs text-muted-foreground mt-8 leading-relaxed">AI-assisted summary based on the linked source. Informational only; not financial advice. Verify material facts at the source before acting.</p>
      </article>
    </div>
  );
}
