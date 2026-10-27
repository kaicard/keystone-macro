import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ArticleLoadState({ loading, error, retry }) {
  useEffect(() => {
    if (loading || error) return;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [loading, error]);
  return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-4">
      <div className="text-center" role="status">
        {loading && <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />}
        <h1 className="font-display text-xl mb-4">{loading ? 'Loading article...' : error ? 'Unable to load this article' : 'Article not found'}</h1>
        {!loading && (error ? <Button onClick={retry}>Try again</Button> : <Button asChild><Link to="/Research">Back to research</Link></Button>)}
      </div>
    </div>
  );
}