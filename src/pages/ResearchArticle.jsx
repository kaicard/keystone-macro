import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useResearchArticle from '@/hooks/useResearchArticle';
import ArticleLoadState from '@/components/research/ArticleLoadState';
import ResearchPaperHeader from '@/components/research/ResearchPaperHeader';
import ResearchPaperBody from '@/components/research/ResearchPaperBody';
import ResearchPaperClosing from '@/components/research/ResearchPaperClosing';
import ResearchPaperRelated from '@/components/research/ResearchPaperRelated';
import researchPaperPhotos from '@/components/research/researchPaperPhotos';
import '@/components/research/ResearchPaper.css';

export default function ResearchArticle() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);
  const { data: note, related, isLoading, error, refetch } = useResearchArticle(slug);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || error || !note) return <ArticleLoadState loading={isLoading} error={error} retry={refetch} />;

  return <div className="research-paper-shell">
    <article className="research-paper">
      <ResearchPaperHeader note={note} copied={copied} onShare={handleShare} />
      <ResearchPaperBody note={note} photos={researchPaperPhotos(note)} />
      <ResearchPaperClosing note={note} />
      <ResearchPaperRelated related={related} />
      <footer className="paper-footer">
        <Link to="/Research"><ArrowLeft size={14} />Back to Research</Link>
        <p>Keystone Macro · For informational purposes only · Not financial advice</p>
      </footer>
    </article>
  </div>;
}