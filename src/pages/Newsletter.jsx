import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Mail, CheckCircle, ArrowRight, Sun, Moon, BarChart2, Globe, Zap,
  BookOpen, Calendar, TrendingUp, Shield, Star, ChevronRight, Lock
} from 'lucide-react';
import PageBackground from '@/components/layout/PageBackground';

const TOPICS = [
  { id: 'macro', label: 'Global Macro', icon: Globe },
  { id: 'rates', label: 'Rates & Fixed Income', icon: BarChart2 },
  { id: 'equities', label: 'Equities', icon: TrendingUp },
  { id: 'commodities', label: 'Commodities', icon: Zap },
  { id: 'fx', label: 'FX & EM', icon: Globe },
  { id: 'geopolitics', label: 'Geopolitics', icon: Shield },
  { id: 'ma', label: 'M&A & Corporate', icon: Star },
  { id: 'forecasts', label: 'Forecasts & Views', icon: BarChart2 },
];

const INCLUDES = [
  { icon: Sun, label: '7am Morning Brief', desc: 'Markets, macro headlines, and what to watch for the day ahead' },
  { icon: Moon, label: '10pm Evening Wrap', desc: 'Full day review, desk views, trade ideas, and positioning insights' },
  { icon: Calendar, label: '10 Editions Per Week', desc: 'Monday through Friday, every trading week of the year' },
  { icon: BarChart2, label: 'Trade Ideas', desc: 'Historical and illustrative trade ideas with full thesis and levels' },
  { icon: BookOpen, label: 'Full Archive Access', desc: 'Every edition ever published, searchable and categorised' },
  { icon: Globe, label: 'Cross-Asset Coverage', desc: 'Macro, equities, rates, FX, commodities, credit, and geopolitics' },
];

export default function Newsletter() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [cancelEmail, setCancelEmail] = useState('');
  const [cancelStatus, setCancelStatus] = useState(null);
  const [showAllEditions, setShowAllEditions] = useState(false);

  const { data: editions = [] } = useQuery({
    queryKey: ['newsletter-editions-public'],
    queryFn: () => base44.entities.NewsletterEdition.filter({ status: 'published' }, '-publish_date', 6),
  });

  const checkSubscription = async (email) => {
    if (!email) return;
    const results = await base44.entities.NewsletterSubscription.filter({ email, status: 'active' });
    setIsSubscribed(results?.length > 0);
  };

  React.useEffect(() => {
    const checkOwner = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.email === 'kaicard05@gmail.com') {
          setIsSubscribed(true);
        }
      } catch {
        // User not authenticated
      }
    };
    checkOwner();
  }, []);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelEmail) return;
    const results = await base44.entities.NewsletterSubscription.filter({ email: cancelEmail });
    if (!results?.length) { setCancelStatus('not_found'); return; }
    await base44.entities.NewsletterSubscription.update(results[0].id, { status: 'unsubscribed' });
    await base44.integrations.Core.SendEmail({
      to: cancelEmail,
      subject: 'Your Keystone Macro subscription has been cancelled',
      body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <div style="font-size:10px;letter-spacing:2px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:8px;">Keystone Macro</div>
        <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px;font-family:Georgia,serif;">Subscription Cancelled</h1>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">Your subscription to The Keystone Macro Brief has been cancelled. You will not receive any further editions.</p>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 24px;">If you cancelled by mistake, you can resubscribe at any time at <a href="https://keystonemacro.com/Newsletter" style="color:#d97706;">keystonemacro.com/Newsletter</a>.</p>
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#9ca3af;">Keystone Macro &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence</div>
      </div>`,
      from_name: 'Keystone Macro',
    });
    setCancelStatus('cancelled');
  };

  const toggleTopic = (id) => {
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    setLoading(true);

    // Save subscriber record
    await base44.entities.NewsletterSubscription.create({
      email: form.email,
      name: form.name,
      preferences: selectedTopics,
      status: 'pending',
    });

    // Attempt Stripe checkout redirect
    const res = await base44.functions.invoke('createNewsletterCheckout', {
      email: form.email,
      name: form.name,
    });

    if (res?.data?.url) {
      window.location.href = res.data.url;
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center relative">
        <PageBackground />
        <div className="max-w-lg mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="font-display text-4xl font-semibold mb-3">You're In</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Welcome to Keystone Macro. Your first edition arrives tomorrow morning at 7am.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="relative z-10">

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">10 editions per week · Monday to Friday</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold mb-4 leading-tight">
              The Keystone<br />
              <span className="text-gradient">Macro Brief</span>
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto mb-3">
              Institutional-grade macro research, markets analysis, trade ideas, and geopolitical intelligence — delivered twice daily.
            </p>
            <p className="text-muted-foreground/60 text-sm">Morning brief at 7am · Evening wrap at 9pm · Every trading day</p>
          </motion.div>
        </div>

        {/* Main content: pricing + form */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* What's included */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold mb-2">What you get</h2>
                <p className="text-muted-foreground text-sm">Every edition is written with the same rigour as institutional research desks.</p>
              </div>
              <div className="space-y-3">
                {INCLUDES.map(item => (
                  <div key={item.label} className="flex items-start gap-4 glass rounded-xl p-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Subscribe card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <div className="glass-strong rounded-2xl p-8 border border-border/50 sticky top-28">
                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-end justify-center gap-1 mb-1">
                    <span className="text-5xl font-bold">£9</span>
                    <span className="text-2xl font-bold text-muted-foreground">.99</span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Cancel anytime · No long-term commitment</p>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your name</label>
                    <Input
                      placeholder="Full name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email address</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      className="h-11"
                    />
                  </div>

                  {/* Topic preferences */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Your interests (optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTopic(t.id)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            selectedTopics.includes(t.id)
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !form.email}
                    className="w-full h-12 text-base gap-2"
                    onClick={() => checkSubscription(form.email)}
                  >
                    {loading ? 'Redirecting to checkout…' : (
                      <>Subscribe — £9.99/month <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </form>

                <div className="mt-4 space-y-2">
                  {['Secure payment via Stripe', 'Cancel anytime from your account', 'No setup fees or hidden charges'].map(t => (
                    <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recent editions — subscribers only */}
        {editions.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
            <div className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-3xl font-semibold">Recent Editions</h2>
              </div>
              <p className="text-muted-foreground text-sm">Latest market analysis and research insights</p>
            </div>

            {isSubscribed ? (
              <div className="space-y-4">
                {editions.slice(0, showAllEditions ? editions.length : 4).map((ed, idx) => {
                  const marketItems = ed.market_summary ? ed.market_summary.split(' · ').slice(0, 3) : [];
                  return (
                    <Link key={ed.id} to={`/Newsletter/${ed.slug}`} className="group block">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border border-border/40 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm"
                      >
                        {/* Header section */}
                        <div className="px-7 pt-7 pb-5 border-b border-border/20">
                          <div className="flex items-center gap-2 mb-3">
                            {ed.edition_type === 'morning' ? (
                              <>
                                <Sun className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary">Morning Brief</span>
                              </>
                            ) : (
                              <>
                                <Moon className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary">Evening Wrap</span>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground/50">·</span>
                            <span className="text-xs text-muted-foreground/60">{ed.publish_date}</span>
                          </div>
                          <h3 className="font-display text-2xl font-semibold leading-tight group-hover:text-primary transition-colors">
                            {ed.title}
                          </h3>
                        </div>

                        {/* Market snapshot */}
                        {marketItems.length > 0 && (
                          <div className="px-7 py-5 bg-muted/30 border-b border-border/20">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Market Snapshot</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {marketItems.map((item, i) => (
                                <div key={i} className="text-sm">
                                  <div className="text-muted-foreground/70 text-xs mb-1">{item.split(':')[0]?.trim()}</div>
                                  <div className="font-semibold text-foreground">{item.split(':')[1]?.trim()}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer - Read more */}
                        <div className="px-7 py-5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-primary/70 group-hover:text-primary transition-colors font-medium">
                            Read full edition
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                          {ed.tags && ed.tags.length > 0 && (
                            <div className="text-xs text-muted-foreground/60">{ed.tags.length} sections</div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
                {!showAllEditions && editions.length > 4 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowAllEditions(true)}
                    className="w-full py-4 mt-2 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border/40 rounded-xl hover:border-primary/20 hover:bg-primary/5"
                  >
                    View {editions.length - 4} more editions
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center border border-border/50">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Premium Editions</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">Subscribe to access the complete archive of every edition, including full market analysis, trade ideas, and desk commentary.</p>
                <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mx-auto">
                  View Subscription Plans
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Manage subscription */}
        <div id="manage" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="glass rounded-2xl p-8 border border-border/50">
            <h2 className="font-display text-lg font-semibold mb-1">Already subscribed?</h2>
            <p className="text-sm text-muted-foreground mb-6">Need to cancel your subscription? Enter your email below and we'll unsubscribe you immediately.</p>
            {cancelStatus === 'cancelled' ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                You have been unsubscribed. No further editions will be sent to this address.
              </div>
            ) : (
              <form onSubmit={handleCancel} className="flex gap-3 flex-col sm:flex-row">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={cancelEmail}
                  onChange={e => { setCancelEmail(e.target.value); setCancelStatus(null); }}
                  className="h-10 flex-1"
                  required
                />
                <Button type="submit" variant="outline" className="h-10 shrink-0">Cancel Subscription</Button>
              </form>
            )}
            {cancelStatus === 'not_found' && (
              <p className="text-xs text-destructive mt-2">No active subscription found for that email address.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}