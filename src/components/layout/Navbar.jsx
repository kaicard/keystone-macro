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
  { label: 'Markets', path: '/MarketPulse' },
  { label: 'Portfolio', path: '/Portfolios' },
  { label: 'Keystone AI', path: '/AI' },
  { label: 'Calendar', path: '/EconomicCalendar' },
  { label: 'Newsletter', path: '/Newsletter' },
];

function Brand() {
  return (
    <Link to="/Home" className="group flex items-center gap-2.5" aria-label="Keystone Macro home">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.07] text-[11px] font-semibold text-primary transition-colors group-hover:bg-primary/10">K</span>
      <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground/95">Keystone Macro</span>
    </Link>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => path === '/Home'
    ? location.pathname === '/Home' || location.pathname === '/'
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <motion.nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-border/45 bg-background/92 shadow-[0_12px_40px_-34px_rgba(0,0,0,0.8)] backdrop-blur-xl' : 'border-border/25 bg-background/72 backdrop-blur-lg'}`}
        initial={{ y: -72 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />

          <div className="hidden items-center rounded-xl border border-border/25 bg-card/25 p-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${isActive(link.path) ? 'bg-foreground/[0.07] text-foreground shadow-sm' : 'text-muted-foreground/70 hover:bg-foreground/[0.035] hover:text-foreground'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full text-muted-foreground/65 hover:bg-foreground/[0.05] hover:text-foreground" aria-label="Toggle colour theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-primary/[0.07] text-sm font-semibold text-primary transition-colors hover:bg-primary/12"
                  aria-label="Open account menu"
                >
                  {user.full_name ? user.full_name[0].toUpperCase() : <User className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="glass-strong absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl"
                    >
                      <div className="border-b border-border/35 px-4 py-3">
                        <p className="truncate text-sm font-semibold">{user.full_name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      {user.role === 'admin' && (
                        <>
                          <Link to="/Admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"><Shield className="h-3.5 w-3.5" /> Admin</Link>
                          <Link to="/Insights" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"><BarChart3 className="h-3.5 w-3.5" /> Insights</Link>
                        </>
                      )}
                      <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 border-t border-border/25 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button type="button" onClick={navigateToLogin} className="hidden h-9 items-center gap-1.5 rounded-lg border border-border/40 bg-card/35 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground lg:flex">
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </button>
            )}

            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="h-9 w-9 rounded-full text-muted-foreground lg:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button type="button" aria-label="Close navigation" className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 w-[min(88vw,340px)] border-l border-border/40 bg-background/97 p-6 shadow-2xl backdrop-blur-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Brand />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-9 w-9 rounded-full"><X className="h-4 w-4" /></Button>
              </div>

              {isAuthenticated && user ? (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-border/35 bg-card/45 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{user.full_name ? user.full_name[0].toUpperCase() : <User className="h-4 w-4" />}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.full_name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
                </div>
              ) : (
                <button type="button" onClick={() => { setMobileOpen(false); navigateToLogin(); }} className="mb-5 flex w-full items-center gap-2 rounded-xl border border-border/40 px-4 py-3 text-sm font-medium text-muted-foreground"><LogIn className="h-4 w-4" /> Sign in</button>
              )}

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive(link.path) ? 'bg-primary/[0.08] text-primary' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}>
                    {link.label}<ChevronRight className="h-4 w-4 opacity-35" />
                  </Link>
                ))}
              </div>

              {isAuthenticated && (
                <button type="button" onClick={logout} className="mt-5 flex w-full items-center gap-2 border-t border-border/30 px-4 py-4 text-sm text-muted-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
