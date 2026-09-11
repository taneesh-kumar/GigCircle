import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/platform-shell';
import { useTranslation } from 'react-i18next';

export default function AccessBoundary() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const userDashboard =
    user?.role === 'CUSTOMER'
      ? '/customer/dashboard'
      : user?.role === 'WORKER'
      ? '/worker/dashboard'
      : '/admin/dashboard';

  return (
    <main className="paper-grain flex min-h-[100dvh] items-center justify-center overflow-hidden bg-primary px-6 py-16 text-primary-foreground">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[32px] border-accent/20" />
      <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border-[48px] border-primary-foreground/5" />
      <div className="relative w-full max-w-lg text-center">
        <div className="flex justify-center">
          <BrandMark inverse />
        </div>
        <div className="mx-auto mt-16 flex h-20 w-20 items-center justify-center rounded-[26px] bg-primary-foreground/10 text-accent">
          <LockKeyhole className="h-9 w-9" />
        </div>
        <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.25em] text-accent">
          {t('errors.accessBoundary.badge')}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight md:text-6xl">
          {t('errors.accessBoundary.title')}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-primary-foreground/70">
          {t('errors.accessBoundary.subtitle')}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to={userDashboard}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" /> {t('errors.accessBoundary.returnDashboardBtn')}
            </Link>
          ) : (
            <Link
              to="/login"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5"
            >
              {t('errors.accessBoundary.loginBtn')}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}