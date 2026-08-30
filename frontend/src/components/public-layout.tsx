import React, { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, LogIn, Sparkles, User } from 'lucide-react';

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5" data-testid="brand-mark">
      <img
        src="/gigcircle-logo.png"
        alt="GigCircle Logo"
        className="h-9 w-9 rounded-xl object-cover shadow-xs border border-border"
      />
      <span className="font-display text-xl font-bold tracking-tight text-primary">
        GigCircle
      </span>
    </span>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/';
    return `/${user.role.toLowerCase()}/dashboard`;
  };

  return (
    <div className="paper-grain min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Public Top Header Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <BrandMark />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <Link
              to="/#how-it-works"
              className="hover:text-accent transition-colors"
            >
              How it works
            </Link>
            <Link
              to="/#services"
              className="hover:text-accent transition-colors"
            >
              Services
            </Link>
            <Link
              to="/#cooperative"
              className="hover:text-accent transition-colors"
            >
              Cooperative Model
            </Link>
          </nav>

          {/* Public Action Buttons / Authenticated User Pill Button (Exact Screenshot Match) */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
              >
                <User className="h-3.5 w-3.5" />
                <span>{user.name} ({user.role})</span>
              </button>
            ) : (
              <>
                {location.pathname !== '/login' && (
                  <Link
                    to="/login"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-secondary"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Log in
                  </Link>
                )}
                {location.pathname !== '/register' && (
                  <Link
                    to="/register"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Get Started <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-border bg-card py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-muted-foreground/40">|</span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Empowering Local Service Communities
            </span>
          </div>

          <p className="text-center md:text-right font-mono text-[11px]">
            © {new Date().getFullYear()} GigCircle Cooperative Services Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
