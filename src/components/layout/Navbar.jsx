import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, ChevronRight, LogIn, LogOut, User, Shield, BarChart3 } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Home', path: '/Home' },
  { label: 'Research', path: '/Research' },
  { label: 'Market Pulse', path: '/MarketPulse' },
  { label: 'Portfolio Lab', path: '/Portfolios' },
  { label: 'Keystone AI', path: '/AI' },
  { label: 'Calendar', path: '/EconomicCalendar' },
  { label: 'Newsletter', path: '/Newsletter' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'glass-strong shadow-lg shadow-black/5 dark:shadow-black/20' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/Home" className="group">
              <span className="font-display text-base font-semibold tracking-tight text-foreground/90 group-hover:text-primary transition-colors duration-300 letter-spacing-tight">
                Keystone Macro
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative px-3 py-2 text-sm font-medium transition-colors duration-200 group/link"
                  >
                    <span className={isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}>
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full shadow-sm shadow-primary/50"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    {!isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground/20 rounded-full scale-x-0 group-hover/link:scale-x-100 transition-transform duration-200 origin-left" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Profile / Sign-in */}
              {isAuthenticated && user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-semibold text-sm"
                  >
                    {user.full_name ? user.full_name[0].toUpperCase() : <User className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-56 glass-strong rounded-xl border border-border/50 shadow-lg shadow-black/10 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border/40">
                          <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary/80 mt-1">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>
                        {user.role === 'admin' && (
                          <>
                            <Link
                              to="/Admin"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                            >
                              <Shield className="w-3.5 h-3.5" /> Admin Panel
                            </Link>
                            <Link
                              to="/Insights"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                            >
                              <BarChart3 className="w-3.5 h-3.5" /> Insights
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={navigateToLogin}
                  className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign in
                </button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden rounded-full w-9 h-9 text-muted-foreground"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-80 bg-card z-50 p-6 overflow-y-auto border-l border-border"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-display text-lg font-semibold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile user info */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-muted/40 border border-border/30">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {user.full_name ? user.full_name[0].toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); navigateToLogin(); }}
                  className="flex items-center gap-2 w-full px-4 py-3 mb-4 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign in to your account
                </button>
              )}

              <div className="space-y-1">
                {navLinks.map(link => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  );
                })}
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="flex items-center gap-2 w-full px-4 py-3 mt-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}