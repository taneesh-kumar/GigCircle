import { useState, type FormEvent } from 'react';
import { ArrowRight, KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/platform-shell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const loggedUser = await login({ email, password });
      const targetPath =
        from ||
        (loggedUser.role === 'CUSTOMER'
          ? '/customer/dashboard'
          : loggedUser.role === 'WORKER'
          ? '/worker/dashboard'
          : '/admin/dashboard');

      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="paper-grain min-h-[100dvh] flex flex-col justify-between bg-background">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 md:px-10">
        <BrandMark />
        <Link
          to="/"
          className="focus-ring rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-secondary"
        >
          Back to Home
        </Link>
      </header>

      <section className="mx-auto w-full max-w-md px-6 py-12">
        <div className="animate-rise-in rounded-3xl border border-border bg-card/90 p-8 shadow-xl shadow-primary/5">
          <div className="text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">Authentication</span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-primary">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Log in to access your cooperative portal.</p>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5 text-xs opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-primary placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loggin in...
                </>
              ) : (
                <>
                  Log In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary underline underline-offset-4 hover:text-accent">
              Register here
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 text-xs text-muted-foreground md:px-10">
        <span>GigCircle Cooperative Gig Services Platform</span>
        <span className="font-mono text-[10px]">Segment 1 MVP</span>
      </footer>
    </main>
  );
}
