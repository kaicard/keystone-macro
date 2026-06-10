import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';

// Existing pages
import Home from '@/pages/Home';
import Research from '@/pages/Research.jsx';
import ResearchArticle from '@/pages/ResearchArticle';         // NEW — individual research note
import ResearchIntelligence from '@/pages/ResearchIntelligence'; // NEW — individual intelligence item
import Portfolios from '@/pages/Portfolios';                   // WealthCases merged in here
import MarketPulse from '@/pages/MarketPulse';                 // Trade Ideas tab added inside
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Admin from '@/pages/Admin';                             // Extended with new tabs
import EconomicCalendar from '@/pages/EconomicCalendar';       // Fixed for all visitors
import Terms from '@/pages/Terms';
import Newsletter from '@/pages/Newsletter';                   // Upgraded to paid subscription
import NewsletterEdition from '@/pages/NewsletterEdition';     // NEW — individual edition archive
import KeystoneAI from '@/pages/KeystoneAI';                  // NEW — dedicated AI chat page
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';

// WealthCases still importable if needed but nav entry removed
import WealthCases from '@/pages/WealthCases';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="font-display text-base font-semibold tracking-tight text-foreground/70">Keystone Macro</span>
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Auth routes — unprotected */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        {/* Core */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />

        {/* Research — notes get their own URL */}
        <Route path="/Research" element={<Research />} />
        <Route path="/Research/:slug" element={<ResearchArticle />} />
        <Route path="/Research/Intelligence/:slug" element={<ResearchIntelligence />} />

        {/* Portfolios — WealthCases merged inside as a tab */}
        <Route path="/Portfolios" element={<Portfolios />} />

        {/* WealthCases legacy route — redirects to Portfolios */}
        <Route path="/WealthCases" element={<Navigate to="/Portfolios" replace />} />

        {/* Market Pulse — Trade Ideas tab inside */}
        <Route path="/MarketPulse" element={<MarketPulse />} />

        {/* AI */}
        <Route path="/AIPortfolioLab" element={<Navigate to="/AI" replace />} />
        <Route path="/AI" element={<KeystoneAI />} />

        {/* Economic Calendar */}
        <Route path="/EconomicCalendar" element={<EconomicCalendar />} />

        {/* Newsletter — paid subscription + edition archive */}
        <Route path="/Newsletter" element={<Newsletter />} />
        <Route path="/Newsletter/:slug" element={<NewsletterEdition />} />

        {/* Static */}
        <Route path="/About" element={<About />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Admin" element={<Admin />} />
        <Route path="/Terms" element={<Terms />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;