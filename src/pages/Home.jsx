import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import CredibilityStrip from '@/components/home/CredibilityStrip';
import FeaturedResearch from '@/components/home/FeaturedResearch';
import MarketPulsePreview from '@/components/home/MarketPulsePreview';
import PortfolioPreview from '@/components/home/PortfolioPreview';
import WealthCasesPreview from '@/components/home/WealthCasesPreview';
import AILabPreview from '@/components/home/AILabPreview';
import NewsletterSection from '@/components/home/NewsletterSection';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CredibilityStrip />
      <FeaturedResearch />
      <MarketPulsePreview />
      <PortfolioPreview />
      <WealthCasesPreview />
      <AILabPreview />
      <NewsletterSection />
    </div>
  );
}