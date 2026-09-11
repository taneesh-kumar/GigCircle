import React from 'react';
import {
  ArrowRight,
  House,
  LogIn,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Tv,
  Paintbrush,
  Wind,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/platform-shell';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from 'react-i18next';
import { getCategoryLabel } from '@/i18n';

const POPULAR_SERVICES_CONFIG = [
  {
    id: 'PLUMBING',
    descKey: 'welcome.popularServices.plumbingDesc',
    icon: Wrench,
    color: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-200/60',
    iconBg: 'bg-blue-600 text-white',
  },
  {
    id: 'ELECTRICAL',
    descKey: 'welcome.popularServices.electricalDesc',
    icon: Zap,
    color: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-200/60',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    id: 'CLEANING',
    descKey: 'welcome.popularServices.cleaningDesc',
    icon: Sparkles,
    color: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/60',
    iconBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'CARPENTRY',
    descKey: 'welcome.popularServices.carpentryDesc',
    icon: Hammer,
    color: 'from-orange-500/10 to-orange-600/5 text-orange-600 border-orange-200/60',
    iconBg: 'bg-orange-500 text-white',
  },
  {
    id: 'APPLIANCE_REPAIR',
    descKey: 'welcome.popularServices.applianceDesc',
    icon: Tv,
    color: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-200/60',
    iconBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'PAINTING',
    descKey: 'welcome.popularServices.paintingDesc',
    icon: Paintbrush,
    color: 'from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-200/60',
    iconBg: 'bg-rose-500 text-white',
  },
  {
    id: 'AC_COOLING',
    descKey: 'welcome.popularServices.acDesc',
    icon: Wind,
    color: 'from-teal-500/10 to-teal-600/5 text-teal-600 border-teal-200/60',
    iconBg: 'bg-teal-600 text-white',
  },
  {
    id: 'HOUSEHOLD',
    descKey: 'welcome.popularServices.householdDesc',
    icon: House,
    color: 'from-purple-500/10 to-purple-600/5 text-purple-600 border-purple-200/60',
    iconBg: 'bg-purple-600 text-white',
  },
];

export default function Welcome() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const userDashboard =
    user?.role === 'CUSTOMER'
      ? '/customer/dashboard'
      : user?.role === 'WORKER'
      ? '/worker/dashboard'
      : '/admin/dashboard';

  return (
    <div className="paper-grain min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* PUBLIC HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 justify-self-start focus:outline-none">
            <BrandMark />
          </Link>

          {/* NAV LINKS — CENTERED */}
          <nav className="hidden md:flex items-center justify-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#" className="text-slate-900 font-bold hover:text-emerald-600 transition-colors">
              {t('welcome.nav.home')}
            </a>
            <a href="#services" className="hover:text-emerald-600 transition-colors">
              {t('welcome.nav.popularServices')}
            </a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
              {t('welcome.nav.howItWorks')}
            </a>
            <a href="#cooperative" className="hover:text-emerald-600 transition-colors">
              {t('welcome.nav.cooperativeModel')}
            </a>
          </nav>

          {/* AUTH BUTTONS & LANGUAGE */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 justify-self-end">
            <LanguageSwitcher variant="light" />
            {isAuthenticated && user ? (
              <Link
                to={userDashboard}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <UserCheck className="h-4 w-4" /> {t('welcome.nav.goToDashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="h-4 w-4 text-slate-500" /> {t('welcome.nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" /> {t('welcome.nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION — CLEAN & MARKETPLACE READY */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-white py-14 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            {/* HERO LEFT */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                {t('welcome.hero.badge')}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
                {t('welcome.hero.titleLine1')}<br />
                <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-emerald-600 bg-clip-text text-transparent">
                  {t('welcome.hero.titleLine2')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {t('welcome.hero.subtitle')}
              </p>

              {/* TRUST INDICATORS ROW */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t('welcome.hero.trust1')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t('welcome.hero.trust2')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t('welcome.hero.trust3')}</span>
                </div>
              </div>

              {/* HERO CTAS */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
                >
                  {t('welcome.hero.exploreBtn')} <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {t('welcome.hero.becomeWorkerBtn')}
                </Link>
              </div>
            </div>

            {/* HERO RIGHT — RICH MARKETPLACE VISUAL COLLAGE */}
            <div className="relative min-h-[380px] sm:min-h-[440px]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-300 tracking-wider">
                      {t('welcome.hero.cardBadge')}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{t('welcome.hero.cardTitle')}</h3>

                  {/* CARDS COLLAGE */}
                  <div className="grid gap-3 pt-2">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300 border border-blue-400/40">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{t('welcome.hero.samplePlumbingTitle')}</p>
                          <p className="text-[11px] text-slate-300">{t('welcome.hero.samplePlumbingDesc')}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                        {t('welcome.hero.availableBadge')}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 border border-amber-400/40">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{t('welcome.hero.sampleElectricalTitle')}</p>
                          <p className="text-[11px] text-slate-300">{t('welcome.hero.sampleElectricalDesc')}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                        {t('welcome.hero.availableBadge')}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 border border-emerald-400/40">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{t('welcome.hero.sampleCleaningTitle')}</p>
                          <p className="text-[11px] text-slate-300">{t('welcome.hero.sampleCleaningDesc')}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                        {t('welcome.hero.availableBadge')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 relative z-10">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> {t('welcome.hero.payoutText')}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{t('welcome.hero.coopPercent')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES SECTION */}
      <section id="services" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              {t('welcome.popularServices.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">{t('welcome.popularServices.title')}</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              {t('welcome.popularServices.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_SERVICES_CONFIG.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <div
                  key={service.id}
                  className={`group rounded-3xl border bg-gradient-to-b ${service.color} p-7 shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all flex flex-col justify-start`}
                >
                  <div className={`h-12 w-12 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform`}>
                    <ServiceIcon className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {getCategoryLabel(t, service.id)}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {t(service.descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW GIGCIRCLE WORKS SECTION */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              {t('welcome.howItWorks.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('welcome.howItWorks.title')}</h2>
            <p className="text-sm text-slate-600">
              {t('welcome.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs relative">
              <span className="font-mono text-3xl font-bold text-emerald-600">01</span>
              <h3 className="text-xl font-bold text-slate-900">{t('welcome.howItWorks.step1Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('welcome.howItWorks.step1Desc')}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs relative">
              <span className="font-mono text-3xl font-bold text-emerald-600">02</span>
              <h3 className="text-xl font-bold text-slate-900">{t('welcome.howItWorks.step2Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('welcome.howItWorks.step2Desc')}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs relative">
              <span className="font-mono text-3xl font-bold text-emerald-600">03</span>
              <h3 className="text-xl font-bold text-slate-900">{t('welcome.howItWorks.step3Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('welcome.howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COOPERATIVE / COMMUNITY SECTION */}
      <section id="cooperative" className="py-16 md:py-24 bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-950 text-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-300 tracking-wider">
              {t('welcome.cooperative.badge')}
            </span>
            <h2 className="text-3xl sm:5xl font-bold text-white leading-tight">
              {t('welcome.cooperative.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              {t('welcome.cooperative.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 pt-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md space-y-2">
              <h4 className="text-2xl font-bold text-emerald-400">{t('welcome.cooperative.payoutTitle')}</h4>
              <p className="text-xs text-slate-300">{t('welcome.cooperative.payoutDesc')}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md space-y-2">
              <h4 className="text-2xl font-bold text-blue-400">{t('welcome.cooperative.platformFeeTitle')}</h4>
              <p className="text-xs text-slate-300">{t('welcome.cooperative.platformFeeDesc')}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md space-y-2">
              <h4 className="text-2xl font-bold text-amber-400">{t('welcome.cooperative.ratingsTitle')}</h4>
              <p className="text-xs text-slate-300">{t('welcome.cooperative.ratingsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION SECTION */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-50 via-white to-emerald-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t('welcome.cta.title')}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {t('welcome.cta.subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              {t('welcome.cta.exploreBtn')} <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t('welcome.cta.joinWorkerBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-self-start gap-3">
            <BrandMark />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-600">
            <a href="#services" className="hover:text-emerald-600">{t('welcome.footer.services')}</a>
            <a href="#how-it-works" className="hover:text-emerald-600">{t('welcome.footer.howItWorks')}</a>
            <Link to="/register" className="hover:text-emerald-600">{t('welcome.footer.becomeWorker')}</Link>
            <Link to="/login" className="hover:text-emerald-600">{t('welcome.footer.login')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}