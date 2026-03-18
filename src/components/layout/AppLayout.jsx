import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@/lib/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}