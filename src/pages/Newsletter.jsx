import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle, ArrowRight, Lock, Sparkles, Sun, Moon, BookOpen, Globe, BarChart2, UserPlus, X } from 'lucide-react';
import PageBackground from '@/components/layout/PageBackground';
import { useAuth } from '@/lib/AuthContext';

const FREE_FEATURES = [
  'Friday macro and market digest',
  'The week’s main cross-asset themes',
  'A concise market snapshot',
  'Clear links to current research',
];

const PREMIUM_FEATURES = [
  { icon: Sun, label: 'Morning Brief', desc: 'Overnight developments and the day ahead.' },
  { icon: Moon, label: 'Evening Wrap', desc: 'Cross-asset close, catalysts, and key risks.' },
  { icon: Globe, label: 'Source-linked intelligence', desc: 'Traceable sources on new intelligence items.' },
  { icon: BookOpen, label: 'Subscriber archive', desc: 'Access to every published premium edition.' },
  { icon: BarChart2, label: 'Market snapshots', desc: 'Rates, equities, FX, commodities, and regime context.' },
  { icon: Sparkles, label: 'AI-assisted analysis', desc: 'Clearly labelled analysis with transparent limitations.' },
];

function AccountNotice({ user, navigateToLogin }) {
  if (user) return <p className="text-xs text-muted-foreground">Subscription email: <span className="text-foreground">{user.email}</span></p>;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/20 p-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><UserPlus className="w-4 h-4" /> Sign in so access is tied securely to your account.</span>
      <Button type="button" size="sm" variant="outline" onClick={navigateToLogin}>Sign in</Button>
    </div>
  );
}

function CancelBox({ type, title, description, user, navigateToLogin }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const cancel = async () => {
    if (!user) return navigateToLogin();
    setLoading(true); setResult(null);
    try {
      const response = await base44.functions.invoke('manageSubscription', { action: type === 'paid' ? 'cancel_paid' : 'cancel_free' });
      setResult(response?.data?.success ? 'done' : response?.data?.error || 'Unable to process this request.');
    } catch (error) {
      setResult(error?.response?.data?.error || 'Unable to process this request.');
    } finally { setLoading(false); }
  };
  return (
    <div className="glass rounded-2xl border border-border/50 p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{type === 'paid' ? 'Premium' : 'Free'}</p>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {result === 'done' ? <p className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle className="w-4 h-4" /> Request confirmed.</p> : (
        <>
          <Button variant="outline" className="w-full gap-2 border-destructive/30 text-destructive" disabled={loading} onClick={cancel}>
            <X className="w-4 h-4" /> {loading ? 'Processing…' : user ? 'Cancel' : 'Sign in to manage'}
          </Button>
          {result && <p className="text-xs text-destructive mt-2">{result}</p>}
        </>
      )}
    </div>
  );
}

export default function Newsletter() {
  const { user, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const [freeName, setFreeName] = useState('');
  const [paidName, setPaidName] = useState('');
  const [freeLoading, setFreeLoading] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [checkoutState, setCheckoutState] = useState(null);
  const sessionId = new URLSearchParams(window.location.search).get('checkout_session_id');

  const { data: access = {}, isLoading: accessLoading } = useQuery({
    queryKey: ['newsletter-access', user?.id],
    queryFn: async () => (await base44.functions.invoke('getNewsletterAccess', {}))?.data || {},
  });

  useEffect(() => {
    if (!sessionId || !user) return;
    let cancelled = false;
    setCheckoutState('confirming');
    base44.functions.invoke('confirmNewsletterCheckout', { session_id: sessionId })
      .then(response => {
        if (cancelled) return;
        if (response?.data?.active) {
          setCheckoutState('confirmed');
          queryClient.invalidateQueries({ queryKey: ['newsletter-access'] });
          window.history.replaceState({}, '', '/Newsletter');
        } else setCheckoutState('error');
      })
      .catch(() => !cancelled && setCheckoutState('error'));
    return () => { cancelled = true; };
  }, [sessionId, user, queryClient]);

  const subscribeFree = async (event) => {
    event.preventDefault();
    if (!user) return navigateToLogin();
    setFreeLoading(true);
    try {
      const response = await base44.functions.invoke('subscribeNewsletter', { name: freeName });
      if (response?.data?.success) setFreeSuccess(true);
    } finally { setFreeLoading(false); }
  };

  const subscribePaid = async (event) => {
    event.preventDefault();
    if (!user) return navigateToLogin();
    setPaidLoading(true);
    try {
      const response = await base44.functions.invoke('createNewsletterCheckout', { name: paidName });
      if (response?.data?.url) window.location.href = response.data.url;
    } finally { setPaidLoading(false); }
  };

  const isPaid = access?.active || checkoutState === 'confirmed';

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-8 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"><Mail className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-medium text-primary">Macro research · Delivered</span></div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-4">The <span className="text-gradient">Macro Brief</span></h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Independent, source-conscious macro research in a concise morning, evening, or weekly format.</p>
        </motion.header>

        {checkoutState && (
          <div className={`rounded-xl border p-4 mb-6 ${checkoutState === 'confirmed' ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-primary/20 bg-primary/10'}`}>
            <p className="text-sm font-medium">{checkoutState === 'confirming' ? 'Confirming your Stripe subscription…' : checkoutState === 'confirmed' ? 'Premium access is active.' : 'Checkout could not be confirmed. Please contact support if you were charged.'}</p>
          </div>
        )}

        <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 sm:p-8 mb-6 relative overflow-hidden" data-premium-tier>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-primary" />
          <div className="flex items-start justify-between mb-6"><div><p className="text-xs font-semibold text-primary mb-2">Premium</p><h2 className="font-display text-2xl font-semibold">Morning + Evening</h2><p className="text-sm text-muted-foreground mt-1">Monday to Friday · Archive included</p></div><div className="text-right"><span className="text-3xl font-bold">£9.99</span><p className="text-xs text-muted-foreground">per month</p></div></div>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => <div key={label} className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div><div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-muted-foreground mt-1">{desc}</p></div></div>)}
          </div>
          {isPaid ? (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-400" /><div><p className="text-sm font-semibold">Premium access active</p><p className="text-xs text-muted-foreground">{access?.status === 'cancelling' ? 'Access continues until the current billing period ends.' : 'Your archive entitlement is verified server-side.'}</p></div></div>
          ) : (
            <form onSubmit={subscribePaid} className="space-y-3">
              <AccountNotice user={user} navigateToLogin={navigateToLogin} />
              {user && <div className="flex flex-col sm:flex-row gap-3"><Input placeholder="Your name (optional)" value={paidName} onChange={e => setPaidName(e.target.value)} /><Button type="submit" disabled={paidLoading} className="gap-2 whitespace-nowrap">{paidLoading ? 'Redirecting…' : <>Subscribe securely <ArrowRight className="w-4 h-4" /></>}</Button></div>}
            </form>
          )}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground"><span>Stripe checkout</span><span>Cancel at period end</span><Link className="hover:text-foreground underline" to="/Terms">Subscription terms</Link></div>
        </div>

        <section className="glass rounded-2xl border border-border/50 p-6 sm:p-8 mb-8">
          <div className="flex justify-between gap-4 mb-5"><div><p className="text-xs font-semibold text-emerald-400 mb-2">Free</p><h2 className="font-display text-2xl font-semibold">Weekly Digest</h2><p className="text-sm text-muted-foreground mt-1">Every Friday</p></div><span className="text-3xl font-bold">£0</span></div>
          <div className="grid sm:grid-cols-2 gap-2 mb-6">{FREE_FEATURES.map(item => <p key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />{item}</p>)}</div>
          {freeSuccess ? <p className="flex items-center gap-2 text-emerald-400"><CheckCircle className="w-4 h-4" /> You’re subscribed.</p> : <form onSubmit={subscribeFree} className="space-y-3"><AccountNotice user={user} navigateToLogin={navigateToLogin} />{user && <div className="flex flex-col sm:flex-row gap-3"><Input placeholder="Your name (optional)" value={freeName} onChange={e => setFreeName(e.target.value)} /><Button type="submit" variant="outline" disabled={freeLoading}>{freeLoading ? 'Subscribing…' : 'Join free digest'}</Button></div>}</form>}
        </section>

        <section className="glass rounded-2xl border border-border/50 p-8 text-center mb-8">
          <Lock className="w-5 h-5 text-primary mx-auto mb-3" />
          <h2 className="font-display text-2xl font-semibold mb-2">Premium archive</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{accessLoading ? 'Checking your access…' : isPaid ? 'Your subscription is active. Archive delivery is restricted to your verified account.' : 'Full edition bodies are available only after a paid subscription is verified.'}</p>
        </section>

        <div id="manage" className="grid sm:grid-cols-2 gap-4">
          <CancelBox type="free" title="Leave the free digest" description="Stops future free weekly email." user={user} navigateToLogin={navigateToLogin} />
          <CancelBox type="paid" title="Cancel premium" description="Stops renewal; access continues to the end of the paid period." user={user} navigateToLogin={navigateToLogin} />
        </div>
      </div>
    </div>
  );
}
