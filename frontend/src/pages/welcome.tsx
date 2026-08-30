import React from 'react';
import {
  ArrowRight,
  Check,
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
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/platform-shell';

const POPULAR_SERVICES = [
  {
    id: 'PLUMBING',
    name: 'Plumbing',
    description: 'Pipe repairs, leak fixing, tap installation & drainage',
    icon: Wrench,
    color: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-200/60',
    iconBg: 'bg-blue-600 text-white',
  },
  {
    id: 'ELECTRICAL',
    name: 'Electrical',
    description: 'Wiring, switchboard repair, light fixtures & appliance safety',
    icon: Zap,
    color: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-200/60',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    id: 'CLEANING',
    name: 'Home Cleaning',
    description: 'Deep house cleaning, kitchen scrubbing & bathroom sanitation',
    icon: Sparkles,
    color: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/60',
    iconBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'CARPENTRY',
    name: 'Carpentry',
    description: 'Furniture assembly, door lock repair & custom woodwork',
    icon: Hammer,
    color: 'from-orange-500/10 to-orange-600/5 text-orange-600 border-orange-200/60',
    iconBg: 'bg-orange-500 text-white',
  },
  {
    id: 'APPLIANCE_REPAIR',
    name: 'Appliance Repair',
    description: 'Washing machine, refrigerator, microwave & TV servicing',
    icon: Tv,
    color: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-200/60',
    iconBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'PAINTING',
    name: 'Painting',
    description: 'Interior wall painting, touch-ups & waterproof coating',
    icon: Paintbrush,
    color: 'from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-200/60',
    iconBg: 'bg-rose-500 text-white',
  },
  {
    id: 'AC_COOLING',
    name: 'AC & Cooling',
    description: 'Air conditioner filter cleaning, gas refilling & installation',
    icon: Wind,
    color: 'from-teal-500/10 to-teal-600/5 text-teal-600 border-teal-200/60',
    iconBg: 'bg-teal-600 text-white',
  },
  {
    id: 'HOUSEHOLD',
    name: 'Household Help',
    description: 'General assistance, gardening & neighborhood odd jobs',
    icon: House,
    color: 'from-purple-500/10 to-purple-600/5 text-purple-600 border-purple-200/60',
    iconBg: 'bg-purple-600 text-white',
  },
];

export default function Welcome() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
              Home
            </a>
            <a href="#services" className="hover:text-emerald-600 transition-colors">
              Popular Services
            </a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
              How It Works
            </a>
            <a href="#cooperative" className="hover:text-emerald-600 transition-colors">
              Cooperative Model
            </a>
          </nav>

          {/* AUTH BUTTONS */}
          <div className="flex items-center justify-end gap-3 justify-self-end">
            {isAuthenticated && user ? (
              <Link
                to={userDashboard}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <UserCheck className="h-4 w-4" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="h-4 w-4 text-slate-500" /> Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" /> Register
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
                Community-First Cooperative
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
                Good work.<br />
                <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-emerald-600 bg-clip-text text-transparent">
                  Close to home.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Connect directly with skilled, verified local workers for household services with transparent pricing, dignity, and neighborhood trust.
              </p>

              {/* TRUST INDICATORS ROW */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Verified local workers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Transparent 90/10 fee split</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Community trust</span>
                </div>
              </div>

              {/* HERO CTAS */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
                >
                  Explore Services <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Become a Worker
                </Link>
              </div>
            </div>

            {/* HERO RIGHT — RICH MARKETPLACE VISUAL COLLAGE */}
            <div className="relative min-h-[380px] sm:min-h-[440px]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-300 tracking-wider">
                      LOCAL SERVICE NETWORK
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">Trusted Skilled Professionals</h3>

                  {/* CARDS COLLAGE */}
                  <div className="grid gap-3 pt-2">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300 border border-blue-400/40">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Plumbing & Repairs</p>
                          <p className="text-[11px] text-slate-300">Pipe leaks, fixtures & drainage</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                        Available
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 border border-amber-400/40">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Electrical Servicing</p>
                          <p className="text-[11px] text-slate-300">Wiring, switchboards & safety</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                        Available
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 border border-emerald-400/40">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Deep House Cleaning</p>
                          <p className="text-[11px] text-slate-300">Full home sanitation & care</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                        Available
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 relative z-10">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Transparent 90% Worker Net Payout
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">100% Cooperative</span>
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
              MARKETPLACE CATEGORIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">Popular Services</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Find trusted professionals for everyday household service needs.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_SERVICES.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <div
                  key={service.id}
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate(`${userDashboard}?tab=requests&category=${service.id}`);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className={`group rounded-3xl border bg-gradient-to-b ${service.color} p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    <div className={`h-12 w-12 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-sm`}>
                      <ServiceIcon className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    <span>Book Service</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              TRANSPARENT PROCESS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How GigCircle Works</h2>
            <p className="text-sm text-slate-600">
              A simple, dignified process connecting households with trusted local skills.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs relative">
              <span className="font-mono text-3xl font-bold text-emerald-600">01</span>
              <h3 className="text-xl font-bold text-slate-900">Find a Service</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Describe your household need, specify your budget, and search matching service categories.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs relative">
              <span className="font-mono text-3xl font-bold text-emerald-600">02</span>
              <h3 className="text-xl font-bold text-slate-900">Connect with a Worker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review available local workers, accept matches, and manage job initiation smoothly.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs relative">
              <span className="font-mono text-3xl font-bold text-emerald-600">03</span>
              <h3 className="text-xl font-bold text-slate-900">Get the Work Done</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track completion, inspect transparent earnings breakdowns, and build trust through verified ratings.
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
              COOPERATIVE MODEL
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
              The neighborhood is the network.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              GigCircle operates as a cooperative platform ensuring 90% of job earnings go directly to workers, while 10% supports platform maintenance and community trust.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 pt-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md space-y-2">
              <h4 className="text-2xl font-bold text-emerald-400">90% Payout</h4>
              <p className="text-xs text-slate-300">Direct net earnings to worker accounts for every completed job.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md space-y-2">
              <h4 className="text-2xl font-bold text-blue-400">10% Platform Fee</h4>
              <p className="text-xs text-slate-300">Transparent fee ensuring system stability, verification & support.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md space-y-2">
              <h4 className="text-2xl font-bold text-amber-400">Verified Ratings</h4>
              <p className="text-xs text-slate-300">Genuine reviews built strictly through completed service requests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION SECTION */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-50 via-white to-emerald-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Need help with home repairs or services?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Explore our popular service categories or join GigCircle as a skilled local worker.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              Explore Services <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Join as a Worker
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
            <a href="#services" className="hover:text-emerald-600">Services</a>
            <a href="#how-it-works" className="hover:text-emerald-600">How It Works</a>
            <Link to="/register" className="hover:text-emerald-600">Become a Worker</Link>
            <Link to="/login" className="hover:text-emerald-600">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}