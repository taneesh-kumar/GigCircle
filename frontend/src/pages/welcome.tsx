import { ArrowRight, Check, House, LogIn, ShieldCheck, UserCheck, UserPlus, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getPlatformInfo } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { BrandMark, RoleIcon } from '@/components/platform-shell';
import { FoundationStatus, PlatformInfoState } from '@/components/status-panel';

const fallbackRoles = [
  { role: 'Customer', route: '/customer/dashboard', description: 'Describe what your home needs and match with local skills.' },
  { role: 'Worker', route: '/worker/dashboard', description: 'Build your local record and find good jobs close to home.' },
  { role: 'Admin', roleKey: 'ADMIN', route: '/admin/dashboard', description: 'Keep the cooperative visible, transparent, and fair.' },
];

export default function Welcome() {
  const platformQuery = useApi(getPlatformInfo);
  const { user, isAuthenticated } = useAuth();

  const roles = platformQuery.data?.roles?.length ? platformQuery.data.roles : fallbackRoles;
  const architecture = platformQuery.data?.architecture ?? ['Household need', 'Neighborhood skill', 'Cooperative trust'];

  const userDashboard =
    user?.role === 'CUSTOMER'
      ? '/customer/dashboard'
      : user?.role === 'WORKER'
      ? '/worker/dashboard'
      : '/admin/dashboard';

  return (
    <main className="paper-grain min-h-[100dvh] overflow-hidden bg-background">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 md:px-10">
        <BrandMark />
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              to={userDashboard}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <UserCheck className="h-3.5 w-3.5" /> {user.name} ({user.role})
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-secondary"
              >
                <LogIn className="h-3.5 w-3.5" /> Log in
              </Link>
              <Link
                to="/register"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <UserPlus className="h-3.5 w-3.5" /> Register
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-6 pb-20 pt-12 md:grid-cols-[1.05fr_.95fr] md:px-10 md:pb-28 md:pt-20">
        <div className="relative z-10 animate-rise-in">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Community-first cooperative
          </div>
          <h1 className="max-w-3xl font-display text-[clamp(3.4rem,8vw,7.6rem)] font-semibold leading-[.92] tracking-[-.055em] text-primary">
            Good work.<br />
            <span className="text-accent">Close to home.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            A cooperative local-services platform that helps households and neighborhood workers meet with clarity, dignity, and trust.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <Link
                to={userDashboard}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <span className="text-xs font-medium text-muted-foreground">Secured by JWT Authentication</span>
          </div>
        </div>
        <div className="relative min-h-[390px] animate-rise-in delay-2 md:min-h-[510px]">
          <div className="absolute right-3 top-6 h-[78%] w-[78%] rotate-3 rounded-[42%_58%_52%_48%/44%_42%_58%_56%] bg-secondary md:right-10" />
          <div className="absolute bottom-2 left-2 h-[74%] w-[75%] -rotate-6 rounded-[56%_44%_47%_53%/52%_49%_51%_48%] border-[14px] border-accent/30 md:left-8" />
          <div className="absolute left-[15%] top-[18%] flex h-28 w-28 animate-drift items-center justify-center rounded-[37%_63%_61%_39%/51%_34%_66%_49%] bg-primary text-primary-foreground shadow-xl shadow-primary/15 md:h-40 md:w-40">
            <House className="h-11 w-11 md:h-16 md:w-16" strokeWidth={1.4} />
          </div>
          <div className="absolute bottom-[13%] right-[5%] flex h-32 w-32 -rotate-12 flex-col items-center justify-center rounded-[58%_42%_39%_61%/40%_54%_46%_60%] bg-accent text-accent-foreground shadow-lg shadow-accent/20 md:h-44 md:w-44">
            <UsersRound className="h-9 w-9 md:h-12 md:w-12" strokeWidth={1.5} />
            <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest">together</span>
          </div>
          <div className="absolute right-[13%] top-[8%] rounded-2xl border border-border bg-card px-4 py-3 shadow-lg shadow-primary/10">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <ShieldCheck className="h-4 w-4 text-accent" /> local trust
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">visible by design</div>
          </div>
          <div className="absolute bottom-[3%] left-[8%] rounded-xl border border-primary/10 bg-card/90 px-3 py-2 font-mono text-[10px] text-muted-foreground shadow-md">
            neighbourhood / 01
          </div>
        </div>
      </section>

      <section id="role-entry" className="border-y border-border/80 bg-card/45 px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-accent">Choose your lens</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-primary md:text-6xl">
                One platform.<br />Three perspectives.
              </h2>
            </div>
            <div className="max-w-sm">
              <PlatformInfoState />
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Authentic role authentication and local cooperative services.
              </p>
            </div>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {roles.map((item, index) => (
              <Link
                to={item.route}
                key={item.route}
                data-testid={`link-role-${item.role.toLowerCase()}`}
                className={`focus-ring group relative flex min-h-[245px] flex-col overflow-hidden rounded-3xl border border-border bg-background p-6 transition-transform duration-300 hover:-translate-y-1 ${
                  index === 1 ? 'md:translate-y-8' : ''
                }`}
              >
                <div
                  className={`mb-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                    index === 0
                      ? 'bg-secondary text-primary'
                      : index === 1
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <RoleIcon role={item.role} />
                </div>
                <div className="mt-10 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl font-semibold text-primary">{item.role}</p>
                    <p className="mt-2 max-w-[240px] text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-10 px-6 py-16 md:grid-cols-[.7fr_1.3fr] md:px-10 md:py-24">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-accent">The cooperative loop</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-primary md:text-5xl">
            The neighborhood is the network.
          </h2>
        </div>
        <div className="grid gap-3">
          {architecture.map((step, index) => (
            <div key={step} className="flex items-center gap-4 border-b border-border py-5">
              <span className="font-mono text-xs font-semibold text-accent">0{index + 1}</span>
              <span className="text-xl font-semibold text-primary">{step}</span>
              <Check className="ml-auto h-5 w-5 text-accent" />
            </div>
          ))}
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1320px] flex-col gap-5 border-t border-border px-6 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="ml-2">Smart India Hackathon</span>
        </div>
        <FoundationStatus compact />
      </footer>
    </main>
  );
}