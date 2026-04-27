import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageBackground from '@/components/layout/PageBackground';

export default function KeystoneAI() {
  const navigate = useNavigate();

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative flex items-center">
      <PageBackground />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Keystone AI</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            AI-powered portfolio construction and macro analysis. Try the Portfolio Lab for asset allocation insights.
          </p>
          <Button onClick={() => navigate('/AIPortfolioLab')} className="gap-2">
            Open Portfolio Lab <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}