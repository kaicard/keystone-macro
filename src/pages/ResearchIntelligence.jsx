import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import PageBackground from '@/components/layout/PageBackground';

export default function ResearchIntelligence() {
  const navigate = useNavigate();

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/Research')} className="gap-2 mb-6 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Button>
          <p className="text-muted-foreground">Intelligence item not found.</p>
        </motion.div>
      </div>
    </div>
  );
}