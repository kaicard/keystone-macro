import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Lock, ShieldCheck, Loader2, Sun, Moon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import PageBackground from '@/components/layout/PageBackground';

const markdownComponents = {
  h2: ({ children }) => <h2 className="font-display text-2xl font-semibold mt-10 mb-3 text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="font-display text-xl font-semibold mt-8 mb-2 text-foreground">{children}</h3>,
  p: ({ children }) => <p className="text-[15px] leading-7 text-foreground/85 mb-4">{children}</p>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-4 my-4 text-sm italic text-muted-foreground">{children}</blockquote>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 mb-4 text-foreground/85">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 mb-4 text-foreground/85">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  hr: () => <hr className="my-8 border-border/40" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{children}</a>,
};

export default function NewsletterEdition() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['premium-edition', slug],
    queryFn: async () => {
      try {
        return (await base44.functions.invoke('getPremiumArchive', { slug }))?.data || {};
      } catch (error) {
        return { error: error?.response?.data?.error || 'Unable to load this edition.' };
      }
    },
  });

  const edition = data?.edition;

  if (isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen relative flex items-center justify-center">
        <PageBackground />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40 relative z-10" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="pt-24 pb-20 min-h-screen relative flex items-center">
        <PageBackground />
        <div className="max-w-lg mx-auto px-4 text-center relative z-10">
          <div className="w-14 h-14 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center mx-auto mb-6"><Lock className="w-6 h-6 text-primary" /></div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-4">Subscriber edition</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">{data?.error || 'Full edition content is protected behind a server-verified paid subscription. Sign in and manage access from the newsletter page.'}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 mb-8"><ShieldCheck className="w-4 h-4" />Browser query strings cannot unlock this content</div>
          <Button asChild><Link to="/Newsletter">Check subscription access</Link></Button>
          <Link to="/Newsletter" className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-5"><ArrowLeft className="w-3.5 h-3.5" />Back to newsletter</Link>
        </div>
      </div>
    );
  }

  const isMorning = edition.edition_type === 'morning';
  const formattedDate = edition.publish_date
    ? new Date(`${edition.publish_date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="pt-24 lg:pt-28 pb-20 min-h-screen relative">
      <PageBackground />
      <article className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/Newsletter" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-3.5 h-3.5" />Back to archive</Link>

        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold ${isMorning ? 'border-amber-400/15 bg-amber-400/[0.08] text-amber-400' : 'border-sky-400/15 bg-sky-400/[0.08] text-sky-400'}`}>
            {isMorning ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            {isMorning ? 'Morning Brief' : 'Evening Wrap'}
          </span>
          <span className="text-[11px] text-muted-foreground/50">{formattedDate}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight mb-4">{edition.title}</h1>

        {edition.market_summary && (
          <div className="rounded-xl border border-border/40 bg-card/40 px-4 py-3 mb-8 text-xs leading-relaxed text-muted-foreground">{edition.market_summary}</div>
        )}

        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{edition.body || ''}</ReactMarkdown>

        <p className="mt-12 pt-6 border-t border-border/30 text-xs text-muted-foreground/50">Illustrative research and educational analysis only. Not financial advice.</p>
      </article>
    </div>
  );
}