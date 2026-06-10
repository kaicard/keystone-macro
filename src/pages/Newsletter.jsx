import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import {
  Mail, CheckCircle, ArrowRight, Lock, Sparkles, Sun, Moon,
  BookOpen, BarChart2, Globe, TrendingUp, Zap, Shield, X
} from 'lucide-react';
import PageBackground from '@/components/layout/PageBackground';

const FREE_FEATURES = [
  'Weekly digest every Friday at 10pm',
  'Top 4 macro & market themes of the week',
  'Weekly market snapshot (equities, rates, FX, commodities)',
  'Premium content teaser — see what you\'re missing',
];

const PREMIUM_FEATURES = [
  { icon: Sun,       label: 'Morning Brief at 7am',      desc: 'Pre-market overview, overnight developments, what to watch' },
  { icon: Moon,      label: 'Evening Wrap at 10pm',      desc: 'Full-day review, desk views, positioning insights' },
  { icon: BookOpen,  label: 'Deep-Dive Research Notes',  desc: 'Institutional-grade analysis across macro, equities, fixed income' },
  { icon: TrendingUp,label: 'Trade Ideas',               desc: 'Illustrative ideas with full thesis, entry/exit levels, risk analysis' },
  { icon: Sparkles,  label: 'Keystone AI Access',        desc: 'Chat with our macro analyst AI or build a custom portfolio' },
  { icon: Globe,     label: 'Full Archive',              desc: 'Every edition ever published, searchable and categorised' },
];

function CancelBox({ title, description, badge, badgeColor, type }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'done' | 'not_found' | 'error'

  const badgeClasses = badgeColor === 'emerald'
    ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-500'
    : 'bg-primary/10 border-primary/20 text-primary';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus(null);
    const res = await base44.functions.invoke('manageSubscription', { action: 'cancel', email });
    if (res?.data?.success) {
      setStatus('done');
    } else if (res?.data?.error?.includes('No subscription')) {
      setStatus('not_found');
    } else {
      setStatus('error');
    }
    setLoading(false);
  };

  return (
    <div className="glass rounded-2xl border border-border/50 p-6 flex flex-col">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border self-start mb-3 ${badgeClasses}`}>
        <span className="text-xs font-semibold">{badge}</span>
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{description}</p>

      {status === 'done' ? (
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-muted-foreground">Done. Confirmation email on its way.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus(null); }}
            required
            className="h-10"
          />
          <Button
            type="submit"
            variant="outline"
            className="w-full h-10 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive text-sm"
            disabled={loading || !email}
          >
            {loading ? 'Processing…' : <><X className="w-3.5 h-3.5" /> Cancel</>}
          </Button>
          {status === 'not_found' && (
            <p className="text-xs text-destructive">No active subscription found for that email.</p>
          )}
          {status === 'error' && (
            <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
          )}
        </form>
      )}
    </div>
  );
}

export default function Newsletter() {
  // Free signup
  const [freeEmail, setFreeEmail] = useState('');
  const [freeName, setFreeName] = useState('');
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);

  // Paid signup
  const [paidEmail, setPaidEmail] = useState('');
  const [paidName, setPaidName] = useState('');
  const [paidLoading, setPaidLoading] = useState(false);

  // (cancel state is handled per-box in CancelBox component below)

  // Check for ?subscribed=true from Stripe redirect
  const urlParams = new URLSearchParams(window.location.search);
  const justSubscribed = urlParams.get('subscribed') === 'true';

  const handleFreeSignup = async (e) => {
    e.preventDefault();
    if (!freeEmail) return;
    setFreeLoading(true);
    // Check for existing subscriber
    const existing = await base44.entities.NewsletterSubscriber.filter({ email: freeEmail });
    if (!existing?.length) {
      await base44.entities.NewsletterSubscriber.create({ email: freeEmail, name: freeName, status: 'active' });
    }
    // Send welcome email
    await base44.functions.invoke('welcomeSubscriber', { email: freeEmail, name: freeName, type: 'free' });
    setFreeSuccess(true);
    setFreeLoading(false);
  };

  const handlePaidSignup = async (e) => {
    e.preventDefault();
    if (!paidEmail) return;
    setPaidLoading(true);
    // Create or find subscription record
    const existing = await base44.entities.NewsletterSubscription.filter({ email: paidEmail });
    if (!existing?.length) {
      await base44.entities.NewsletterSubscription.create({ email: paidEmail, name: paidName, status: 'pending' });
    }
    // Redirect to Stripe
    const res = await base44.functions.invoke('createNewsletterCheckout', { email: paidEmail, name: paidName });
    if (res?.data?.url) {
      window.location.href = res.data.url;
    }
    setPaidLoading(false);
  };



  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center pt-8 pb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Macro Research · Delivered</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-4 leading-tight">
            The Keystone<br />
            <span className="text-gradient">Macro Brief</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Institutional-grade macro research and market intelligence — in your inbox.
          </p>
        </motion.div>

        {/* ── FREE TIER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-border/50 p-6 sm:p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-500">Free</span>
              </div>
              <h2 className="font-display text-2xl font-semibold">Weekly Digest</h2>
              <p className="text-muted-foreground text-sm mt-1">Every Friday at 10pm</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-bold">£0</span>
              <div className="text-xs text-muted-foreground">always free</div>
            </div>
          </div>

          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>

          {freeSuccess ? (
            <div className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">You're on the list.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Check your inbox — first edition arrives this Friday at 10pm.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFreeSignup} className="space-y-3">
              <Input
                placeholder="Your name (optional)"
                value={freeName}
                onChange={(e) => setFreeName(e.target.value)}
                className="h-11"
              />
              <Input
                type="email"
                placeholder="your@email.com"
                value={freeEmail}
                onChange={(e) => setFreeEmail(e.target.value)}
                required
                className="h-11"
              />
              <Button type="submit" variant="outline" className="w-full h-11 gap-2" disabled={freeLoading || !freeEmail}>
                {freeLoading ? 'Signing up…' : <><Mail className="w-4 h-4" /> Sign Up Free</>}
              </Button>
            </form>
          )}
        </motion.div>

        {/* ── PREMIUM TIER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-primary/40 bg-card p-6 sm:p-8 mb-6 relative overflow-hidden glow-primary"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-primary" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-primary">Premium</span>
              </div>
              <h2 className="font-display text-2xl font-semibold">Full Access</h2>
              <p className="text-muted-foreground text-sm mt-1">10 editions per week · Mon–Fri</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-bold">£9.99</span>
              <div className="text-xs text-muted-foreground">/month</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {justSubscribed ? (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Welcome aboard.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Check your inbox for a welcome email with everything you need to know.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePaidSignup} className="space-y-3 mb-4">
              <Input
                placeholder="Your name (optional)"
                value={paidName}
                onChange={(e) => setPaidName(e.target.value)}
                className="h-11"
              />
              <Input
                type="email"
                placeholder="your@email.com"
                value={paidEmail}
                onChange={(e) => setPaidEmail(e.target.value)}
                required
                className="h-11"
              />
              <Button type="submit" className="w-full h-11 gap-2 text-base" disabled={paidLoading || !paidEmail}>
                {paidLoading ? 'Redirecting to checkout…' : <>Subscribe — £9.99/month <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          )}

          <div className="flex flex-col gap-1.5">
            {['Secure payment via Stripe', 'Cancel anytime — no questions asked', 'No setup fees or hidden charges'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CANCEL / MANAGE ── */}
        <motion.div
          id="manage"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Cancel Free */}
          <CancelBox
            title="Cancel Free Digest"
            description="Unsubscribe from the weekly free newsletter."
            badge="Free"
            badgeColor="emerald"
            type="free"
          />
          {/* Cancel Paid */}
          <CancelBox
            title="Cancel Premium"
            description="Cancel your £9.99/month paid subscription."
            badge="Premium"
            badgeColor="amber"
            type="paid"
          />
        </motion.div>

      </div>
    </div>
  );
}