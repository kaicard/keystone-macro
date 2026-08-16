import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail } from 'lucide-react';

export default function NewsletterSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
            The Macro Brief
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
            Receive weekly macro commentary, portfolio insights, and research notes.
            Clear, measured, educational.
          </p>

          <Link to="/Newsletter">
            <Button size="lg" className="gap-2 px-7">
              <Mail className="w-4 h-4" />
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground/50 mt-4">
            No spam. Educational content only. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}