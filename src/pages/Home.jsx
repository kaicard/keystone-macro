import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import CredibilityStrip from '@/components/home/CredibilityStrip';
import FeaturedResearch from '@/components/home/FeaturedResearch';
import MarketPulsePreview from '@/components/home/MarketPulsePreview';
import PortfolioPreview from '@/components/home/PortfolioPreview';
import AILabPreview from '@/components/home/AILabPreview';
import NewsletterSection from '@/components/home/NewsletterSection';
import ParticleBackground from '@/components/home/ParticleBackground';

export default function Home() {
  return (
    <div className="relative">
      <ParticleBackground />
      <HeroSection />
      <CredibilityStrip />
      <FeaturedResearch />
      <MarketPulsePreview />
      <PortfolioPreview />
      <AILabPreview />
      <NewsletterSection />
    </div>
  );
}