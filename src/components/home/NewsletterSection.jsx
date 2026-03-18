import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    await base44.entities.NewsletterSubscriber.create({ email });
    setSubmitted(true);
    setSubmitting(false);
    toast({ title: 'Welcome aboard', description: 'You\'ll receive our weekly macro digest.' });
  };

  return (
    <section ref={ref} className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
            Stay Informed
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
            Receive weekly macro commentary, portfolio insights, and research notes. 
            Clear, measured, educational.
          </p>

          {submitted ? (
            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass text-primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">You're subscribed. Welcome.</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="glass border-border/30 text-center sm:text-left h-12"
                required
              />
              <Button type="submit" disabled={submitting} className="h-12 px-6 gap-2 rounded-lg shrink-0">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground/50 mt-4">
            No spam. Educational content only. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}