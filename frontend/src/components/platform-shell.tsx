import { ArrowUpRight, Compass, HandHeart, LayoutDashboard, Menu, ShieldCheck, Sparkles, UsersRound, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FoundationStatus } from '@/components/status-panel';

const navItems = [
  { href: '/customer/dashboard', label: 'Customer view', icon: LayoutDashboard },
  { href: '/worker/dashboard', label: 'Worker view', icon: HandHeart },
  { href: '/admin/dashboard', label: 'Cooperative view', icon: ShieldCheck },
];

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2.5" data-testid="brand-mark">
      <span className={`relative flex h-9 w-9 items-center justify-center rounded-[13px] ${inverse ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
        <span className="absolute top-1.5 h-2 w-2 rounded-full bg-current opacity-90" />
        <span className="absolute bottom-1.5 left-2 h-2 w-2 rounded-full bg-current opacity-75" />
        <span className="absolute bottom-1.5 right-2 h-2 w-2 rounded-full bg-current opacity-55" />
        <span className="h-4 w-px rotate-45 bg-current opacity-70" />
      </span>
      <span className={`font-display text-lg font-semibold tracking-tight ${inverse ? 'text-sidebar-foreground' : 'text-foreground'}`}>CoopGig</span>
    </span>
  );
}

export function PlatformShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="paper-grain min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground shadow-2xl shadow-primary/10 transition-transform duration-300 md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Link to="/" className="focus-ring rounded-xl" data-testid="link-shell-home"><BrandMark inverse /></Link>
          <button type="button" aria-label="Close menu" data-testid="button-close-menu" onClick={() => setMenuOpen(false)} className="focus-ring rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-12">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/45">Prototype routes</p>
          <nav className="mt-3 space-y-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location.pathname === href;
              return (
                <Link key={href} to={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMenuOpen(false)} className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground/80"><Sparkles className="h-3.5 w-3.5 text-sidebar-primary" /> Phase 1 · foundation</div>
            <p className="mt-2 text-xs leading-5 text-sidebar-foreground/52">A clear starting point for a more connected neighborhood.</p>
          </div>
          <FoundationStatus compact />
        </div>
      </aside>

      {menuOpen && <button type="button" aria-label="Close navigation overlay" data-testid="button-overlay-menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-primary/20 backdrop-blur-sm md:hidden" />}
      <main className="min-h-[100dvh] md:pl-[276px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button type="button" aria-label="Open menu" data-testid="button-open-menu" onClick={() => setMenuOpen(true)} className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:flex"><Compass className="h-4 w-4 text-accent" /> Cooperative Gig Services</div>
          <Link to="/" data-testid="link-mobile-brand" className="md:hidden"><BrandMark /></Link>
          <Link to="/" data-testid="link-shell-back" className="focus-ring flex items-center gap-1 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5">Home <ArrowUpRight className="h-4 w-4" /></Link>
        </header>
        {children}
      </main>
    </div>
  );
}

export function RoleIcon({ role }: { role: string }) {
  if (role.toLowerCase().includes('worker')) return <HandHeart className="h-6 w-6" />;
  if (role.toLowerCase().includes('admin')) return <UsersRound className="h-6 w-6" />;
  return <Compass className="h-6 w-6" />;
}