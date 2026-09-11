import { useState, type FormEvent } from 'react';
import { ArrowRight, KeyRound, Mail, Phone, User as UserIcon, AlertCircle, Loader2, House, HandHeart, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/platform-shell';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'CUSTOMER' | 'WORKER'>('CUSTOMER');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);

    try {
      const registeredUser = await register({
        name,
        email,
        phone,
        password,
        role,
      });

      const targetPath = registeredUser.role === 'CUSTOMER' ? '/customer/dashboard' : '/worker/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('auth.register.defaultError');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="paper-grain min-h-[100dvh] flex flex-col justify-between bg-background">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 md:px-10">
        <BrandMark />
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="light" />
          <Link
            to="/"
            className="focus-ring rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-secondary"
          >
            {t('navigation.backToHome')}
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-lg px-6 py-10">
        <div className="animate-rise-in rounded-3xl border border-border bg-card/90 p-8 shadow-xl shadow-primary/5">
          <div className="text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {t('auth.register.badge')}
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-primary">
              {t('auth.register.title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('auth.register.errorTitle')}</p>
                <p className="mt-0.5 text-xs opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Role Selector */}
            <div>
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {t('auth.register.roleLabel')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all ${
                    role === 'CUSTOMER'
                      ? 'border-accent bg-accent/10 text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <House className={`h-6 w-6 mb-1.5 ${role === 'CUSTOMER' ? 'text-accent' : ''}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('auth.register.roleCustomer')}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{t('auth.register.roleCustomerDesc')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('WORKER')}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all ${
                    role === 'WORKER'
                      ? 'border-accent bg-accent/10 text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <HandHeart className={`h-6 w-6 mb-1.5 ${role === 'WORKER' ? 'text-accent' : ''}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('auth.register.roleWorker')}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{t('auth.register.roleWorkerDesc')}</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {t('auth.register.nameLabel')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.register.namePlaceholder')}
                  className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {t('auth.register.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.register.emailPlaceholder')}
                  className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {t('auth.register.phoneLabel')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.register.phonePlaceholder')}
                  className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  {t('auth.register.passwordLabel')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.register.passwordPlaceholder')}
                    className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    aria-label={showPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  {t('auth.register.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.register.confirmPasswordPlaceholder')}
                    className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('auth.register.registeringBtn')}
                </>
              ) : (
                <>
                  {t('auth.register.submitBtn')} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="font-semibold text-primary underline underline-offset-4 hover:text-accent">
              {t('auth.register.loginLink')}
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 text-xs text-muted-foreground md:px-10">
        <span>{t('welcome.footer.copyright')}</span>
        <span className="font-mono text-[10px]">{t('welcome.footer.versionBadge')}</span>
      </footer>
    </main>
  );
}

