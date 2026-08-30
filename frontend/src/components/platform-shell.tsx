import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass, HandHeart, UsersRound, ArrowRight } from 'lucide-react';
import { AppHeader } from '@/components/app-shell/AppHeader';
import { HorizontalNav } from '@/components/app-shell/HorizontalNav';

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2.5" data-testid="brand-mark">
      <img
        src="/gigcircle-logo.png?v=4"
        alt="GigCircle Logo"
        className="h-9 w-9 rounded-xl object-cover shadow-sm"
      />
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          inverse ? 'text-white' : 'text-slate-900'
        }`}
      >
        GigCircle
      </span>
    </span>
  );
}

export function RoleIcon({ role }: { role: string }) {
  if (role.toLowerCase().includes('worker')) return <HandHeart className="h-6 w-6" />;
  if (role.toLowerCase().includes('admin')) return <UsersRound className="h-6 w-6" />;
  return <Compass className="h-6 w-6" />;
}

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="paper-grain min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* TOP HEADER */}
      <AppHeader />

      {/* MAIN CONTAINER */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col">
        {/* PAGE CONTENT */}
        <main className="flex-1 w-full">{children}</main>

        {/* OPTIONAL FOOTER */}
        <footer className="mt-16 border-t border-slate-200/80 py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">GigCircle Cooperative Services Platform</span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
          >
            Back to Home <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </div>
  );
}