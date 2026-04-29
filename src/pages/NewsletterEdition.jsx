import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Calendar, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import PageBackground from '@/components/layout/PageBackground';

export default function NewsletterEdition() {
  const { slug } = useParams();

  const { data: editions = [], isLoading } = useQuery({
    queryKey: ['edition', slug],
    queryFn: () => base44.entities.NewsletterEdition.filter({ slug, status: 'published' }),
  });

  const edition = editions[0];

  if (isLoading) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center relative">
        <PageBackground />
        <div className="max-w-lg mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-3xl font-semibold mb-3">Edition Not Found</h1>
          <p className="text-muted-foreground mb-6">This edition isn't available or hasn't been published yet.</p>
          <Button asChild variant="outline">
            <Link to="/Newsletter" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Newsletter</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isMorning = edition.edition_type === 'morning';

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back */}
          <Link to="/Newsletter" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Newsletter Archive
          </Link>

          {/* Header */}
          <div className="glass rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMorning ? 'bg-amber-400/10' : 'bg-blue-400/10'}`}>
                {isMorning ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <Badge variant="outline" className={`text-xs mb-1 ${isMorning ? 'text-amber-400 border-amber-400/30' : 'text-blue-400 border-blue-400/30'}`}>
                  {isMorning ? 'Morning Brief' : 'Evening Wrap'}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{edition.publish_date}</span>
                  {edition.published_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(edition.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-4">{edition.title}</h1>
            {edition.market_summary && (
              <p className="text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
                {edition.market_summary}
              </p>
            )}
            {edition.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-muted-foreground/50" />
                {edition.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          {edition.body ? (
            <div className="glass rounded-2xl p-8 sm:p-10">
              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none
                [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-8 [&_h2]:mt-10 [&_h2]:text-foreground
                [&_h2:first-child]:mt-0
                [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mb-4 [&_h3]:mt-6 [&_h3]:text-foreground
                [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-6 [&_p]:text-base
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_a]:text-primary [&_a]:font-medium
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:bg-primary/5 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:rounded-lg [&_blockquote]:my-8 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                [&_blockquote_p]:mb-0
                [&_ul]:space-y-2 [&_ul]:my-6
                [&_ol]:space-y-2 [&_ol]:my-6
                [&_li]:text-muted-foreground
                [&_hr]:my-8 [&_hr]:opacity-20
              ">
                {edition.body}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <p>This edition's full content is available to subscribers.</p>
              <Button asChild className="mt-4 gap-2">
                <Link to="/Newsletter">Subscribe — $19.99/month <ArrowLeft className="w-4 h-4 rotate-180" /></Link>
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground/30 text-center mt-8">
            Keystone Macro · For informational purposes only · Not financial advice
          </p>
        </motion.div>
      </div>
    </div>
  );
}