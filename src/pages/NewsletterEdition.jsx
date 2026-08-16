import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageBackground from '@/components/layout/PageBackground';

export default function NewsletterEdition() {
  const { slug } = useParams();
  return (
    <div className="pt-24 pb-20 min-h-screen relative flex items-center">
      <PageBackground />
      <div className="max-w-lg mx-auto px-4 text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center mx-auto mb-6"><Lock className="w-6 h-6 text-primary" /></div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-4">Subscriber edition</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">Full edition content is protected behind a server-verified paid subscription. Sign in and manage access from the newsletter page.</p>
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 mb-8"><ShieldCheck className="w-4 h-4" />Browser query strings cannot unlock this content</div>
        <Button asChild><Link to="/Newsletter">Check subscription access</Link></Button>
        <Link to="/Newsletter" className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-5"><ArrowLeft className="w-3.5 h-3.5" />Back to newsletter</Link>
        <p className="mt-8 text-[10px] text-muted-foreground/40">Edition reference: {slug}</p>
      </div>
    </div>
  );
}
