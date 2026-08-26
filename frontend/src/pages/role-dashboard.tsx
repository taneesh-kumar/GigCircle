import { ArrowRight, BellRing, CheckCircle2, Clock3, HandHeart, House, LogOut, MapPin, ShieldCheck, Sparkles, UserCheck, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getPlatformInfo, pingRoleApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { PlatformShell } from '@/components/platform-shell';
import { FoundationStatus } from '@/components/status-panel';

type RoleKey = 'customer' | 'worker' | 'admin';

const roleContent: Record<RoleKey, { eyebrow: string; title: string; intro: string; accent: string; textColor: string; icon: typeof House; steps: { title: string; copy: string; icon: typeof House }[]; stat: string; statLabel: string }> = {
  customer: {
    eyebrow: 'Customer dashboard · Segment 1 Active',
    title: 'A clearer way to ask for help.',
    intro: 'When service features launch, households will describe what they need and match with verified local workers.',
    accent: 'bg-secondary',
    textColor: 'text-secondary-foreground',
    icon: House,
    stat: '01',
    statLabel: 'authenticated customer',
    steps: [
      { title: 'Share what your home needs', copy: 'A simple, human request — coming in Segment 2.', icon: House },
      { title: 'See trusted local options', copy: 'Understand the people and skills nearby.', icon: UsersRound },
      { title: 'Stay in the loop', copy: 'A visible journey from request to done.', icon: BellRing },
    ],
  },
  worker: {
    eyebrow: 'Worker dashboard · Segment 1 Active',
    title: 'Good work should find good people.',
    intro: 'A worker view built around dignity: clear jobs, fair context, and a cooperative record of the work you do.',
    accent: 'bg-accent',
    textColor: 'text-accent-foreground',
    icon: HandHeart,
    stat: '02',
    statLabel: 'authenticated worker',
    steps: [
      { title: 'See nearby opportunities', copy: 'Work that respects your time and your place.', icon: MapPin },
      { title: 'Choose with context', copy: 'Know what a household needs before you say yes.', icon: ShieldCheck },
      { title: 'Build your local record', copy: 'Your contribution is visible to the cooperative.', icon: Sparkles },
    ],
  },
  admin: {
    eyebrow: 'Cooperative dashboard · Segment 1 Active',
    title: 'Make the work visible.',
    intro: 'An oversight view for platform stewards — grounded in participation, transparency, and cooperative trust.',
    accent: 'bg-primary',
    textColor: 'text-primary-foreground',
    icon: ShieldCheck,
    stat: '03',
    statLabel: 'authenticated admin',
    steps: [
      { title: 'See the network breathe', copy: 'A living view of local activity and participation.', icon: UsersRound },
      { title: 'Keep standards clear', copy: 'Shared signals for trust, quality, and care.', icon: ShieldCheck },
      { title: 'Strengthen the cooperative', copy: 'Turn community insight into better systems.', icon: Sparkles },
    ],
  },
};

export default function RoleDashboard({ role }: { role: RoleKey }) {
  const content = roleContent[role];
  const platformQuery = useApi(getPlatformInfo);
  const rbacPingQuery = useApi(() => pingRoleApi(role));
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const Icon = content.icon;

  return (
    <PlatformShell>
      <div className="mx-auto max-w-[1240px] px-5 py-9 md:px-10 md:py-14">
        {/* User Session Banner */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-accent/30 bg-accent/10 p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-bold font-mono text-lg">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{user?.name}</span>
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent uppercase">
                  {user?.role}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-3.5 w-3.5" /> Authenticated ✓
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{user?.email} • {user?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        <div className="animate-rise-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              {content.eyebrow}
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              JWT Session Verified
            </span>
          </div>
          <div className="mt-7 grid gap-10 md:grid-cols-[1fr_300px] md:items-end">
            <div>
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-[-.04em] text-primary md:text-7xl">
                {content.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{content.intro}</p>
            </div>
            <div
              className={`relative flex h-40 w-40 flex-col justify-between overflow-hidden rounded-[32px] p-5 ${content.textColor} md:justify-end ${content.accent}`}
            >
              <Icon className="absolute -right-2 -top-3 h-28 w-28 opacity-15" strokeWidth={1} />
              <span className="font-mono text-xs opacity-70">{content.stat}</span>
              <span className="mt-3 max-w-[120px] text-sm font-semibold leading-5">{content.statLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-[1.4fr_.6fr]">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Journey map</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-primary">Future feature workflow</h2>
              </div>
              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-8 space-y-3">
              {content.steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-background p-4 transition-colors hover:border-accent/60"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        index === 1 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-primary'
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.copy}</p>
                    </div>
                    <span className="ml-auto hidden font-mono text-[10px] text-muted-foreground sm:block">
                      0{index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-5">
            {/* Live Backend RBAC Authorization Status */}
            <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Backend RBAC Ping</span>
              </div>
              {rbacPingQuery.isLoading ? (
                <div className="mt-4 h-4 w-32 animate-pulse rounded bg-primary-foreground/20" />
              ) : rbacPingQuery.isError ? (
                <p className="mt-3 text-sm text-destructive font-semibold">RBAC ping failed: Access Denied.</p>
              ) : (
                <>
                  <p className="mt-4 font-display text-xl font-semibold leading-tight text-accent">
                    {rbacPingQuery.data?.message}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
                    Authorized API endpoint <code className="font-mono text-accent">/api/{role}/ping</code> verified with Bearer token.
                  </p>
                </>
              )}
            </div>

            <FoundationStatus />

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4 text-accent" /> Platform metadata
              </div>
              {platformQuery.isLoading ? (
                <div className="mt-4 h-4 w-36 animate-pulse rounded bg-muted" />
              ) : platformQuery.isError ? (
                <p className="mt-3 text-sm text-destructive">Metadata unavailable right now.</p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {platformQuery.data?.tagline ?? 'A foundation for local cooperative services.'}
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Segment 1 authentication layer active. Future business workflows (requests, matching) unlock in later segments.
          </p>
          <Link
            to="/"
            data-testid="link-dashboard-home"
            className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent"
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PlatformShell>
  );
}