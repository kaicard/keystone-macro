import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await base44.entities.NewsletterSubscriber.create({ email });
    setSubmitted(true);
    setLoading(false);
    toast({ title: 'Subscribed', description: 'Welcome to the weekly macro and portfolio digest.' });
  };

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {submitted ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Welcome Aboard</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
              You're now subscribed to our weekly macro research, portfolio insights, and market commentary.
            </p>
            <p className="text-sm text-muted-foreground/60">
              Expect your first digest in the next 7 days.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Mail className="w-12 h-12 text-primary mx-auto mb-6" />
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Weekly Macro Digest</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-10">
              Research notes, portfolio analysis, market commentary, and investment ideas delivered every week.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12 text-base"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gap-2 text-base"
              >
                {loading ? 'Subscribing...' : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground/50 mt-6">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}