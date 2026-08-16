import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@/lib/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import FloatingChat from './FloatingChat';
import RouteMetadata from './RouteMetadata';

export default function AppLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <RouteMetadata />
        <Navbar />
        <main className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <Footer />
        <FloatingChat />
      </div>
    </ThemeProvider>
  );
}