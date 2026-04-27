import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Mail, CheckCircle, ArrowRight, Sun, Moon, BarChart2, Globe, Zap,
  BookOpen, Calendar, Clock, TrendingUp, Shield, Star, ChevronRight
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
  { icon: Moon, label: '5pm Evening Wrap', desc: 'Full day review, desk views, trade ideas, and positioning insights' },
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

  const { data: editions = [] } = useQuery({
    queryKey: ['newsletter-editions-public'],
    queryFn: () => base44.entities.NewsletterEdition.filter({ status: 'published' }, '-publish_date', 6),
  });

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
            <p className="text-muted-foreground/60 text-sm">Morning brief at 7am · Evening wrap at 5pm · Every trading day</p>
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
                    <span className="text-5xl font-bold">$19</span>
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

                  <Button type="submit" disabled={loading || !form.email} className="w-full h-12 text-base gap-2">
                    {loading ? 'Redirecting to checkout…' : (
                      <>Subscribe — $19.99/month <ArrowRight className="w-4 h-4" /></>
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

        {/* Recent editions */}
        {editions.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <h2 className="font-display text-2xl font-semibold mb-6">Recent Editions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editions.map(ed => (
                <Link key={ed.id} to={`/Newsletter/${ed.slug}`} className="glass rounded-xl p-5 hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      {ed.edition_type === 'morning' ? <Sun className="w-3.5 h-3.5 text-primary" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{ed.edition_type} Edition · {ed.publish_date}</span>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-2 line-clamp-2">{ed.title}</h3>
                  {ed.market_summary && <p className="text-xs text-muted-foreground line-clamp-2">{ed.market_summary}</p>}
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary/70">
                    Read <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}