import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '@/components/platform-shell';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="paper-grain flex min-h-[100dvh] items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <BrandMark />
        <div className="mx-auto mt-20 flex h-20 w-20 items-center justify-center rounded-[26px] bg-secondary text-primary">
          <Compass className="h-9 w-9" />
        </div>
        <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.25em] text-accent">
          {t('errors.notFound.badge')}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-primary md:text-7xl">
          {t('errors.notFound.title')}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-muted-foreground">
          {t('errors.notFound.subtitle')}
        </p>
        <Link
          to="/"
          data-testid="link-return-home"
          className="focus-ring mt-9 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" /> {t('errors.notFound.returnHomeBtn')}
        </Link>
      </div>
    </main>
  );
}

