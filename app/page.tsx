'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { signUpAction } from '@/app/signup/actions';
import { Zap, X, Loader2, LogIn, UserPlus, ChevronRight } from 'lucide-react';

type ModalMode = 'signin' | 'signup' | null;

export default function LandingPage() {
  const [modal, setModal] = useState<ModalMode>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient();

  const openModal = (mode: ModalMode) => {
    setError(null);
    setEmail('');
    setPassword('');
    setModal(mode);
  };
  const closeModal = () => setModal(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signUpAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-15%] w-[50vw] h-[50vw] bg-violet-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-violet-800/10 rounded-full blur-[100px]" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">Swift</span>
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">KDS</span>
          </span>
        </div>
        <button
          onClick={() => openModal('signin')}
          className="text-sm font-semibold text-white/80 hover:text-cyan-300 transition-colors border border-white/20 hover:border-cyan-400/50 rounded-full px-4 py-2 hover:bg-cyan-400/5"
        >
          Sign In
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-20 pb-24 sm:pt-28 sm:pb-32 min-h-[90vh]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-cyan-300 tracking-widest uppercase">Powered by Valdez & Co.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-4xl">
          Power Your Kitchen.{' '}
          <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            Grow Your Brand.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed mb-10">
          SwiftKDS gives food trucks, restaurants & salons a real-time kitchen display,
          beautiful online ordering, and smart payments — all in one platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none sm:justify-center">
          <button
            onClick={() => openModal('signup')}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold px-8 py-4 text-base shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] hover:scale-[1.03] active:scale-95 transition-all"
          >
            Get Started Free <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal('signin')}
            className="flex items-center justify-center gap-2 rounded-full border border-white/25 text-white font-semibold px-8 py-4 text-base hover:bg-white/5 hover:border-white/40 hover:scale-[1.02] active:scale-95 transition-all backdrop-blur-sm"
          >
            Sign In
          </button>
        </div>

        {/* Trust text */}
        <p className="mt-8 text-xs text-slate-500 font-mono tracking-widest uppercase">No credit card required · Set up in minutes</p>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-5 sm:px-8 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-mono tracking-widest text-cyan-400 uppercase mb-3">Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">One platform, infinite possibilities</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: '⚡',
              title: 'Live Kitchen Display',
              desc: 'See every order the moment it comes in. Keep your kitchen moving at lightning speed with zero confusion.',
              color: 'from-cyan-400/10 to-cyan-600/5',
              border: 'border-cyan-400/20',
              glow: 'rgba(34,211,238,0.15)',
            },
            {
              icon: '🌐',
              title: 'Online Ordering',
              desc: 'A custom-branded ordering page your customers will love. Your look, your menu, your brand.',
              color: 'from-violet-400/10 to-violet-600/5',
              border: 'border-violet-400/20',
              glow: 'rgba(139,92,246,0.15)',
            },
            {
              icon: '💳',
              title: 'Smart Payments',
              desc: 'Stripe-powered payments with automatic platform insights. Know exactly how your business is performing.',
              color: 'from-cyan-400/5 to-violet-400/10',
              border: 'border-white/10',
              glow: 'rgba(139,92,246,0.1)',
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur-xl p-6 sm:p-7 group hover:scale-[1.02] transition-transform`}
              style={{ boxShadow: `0 0 40px ${f.glow}` }}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="relative z-10 px-5 sm:px-8 py-16 text-center">
        <p className="text-xs font-mono tracking-widest text-violet-400 uppercase mb-3">Industries we serve</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">Built for every business type</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {['🚚 Food Trucks', '🍽️ Restaurants', '💅 Salons', '🧁 Bakeries', '☕ Cafes'].map((b) => (
            <span
              key={b}
              className="rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-cyan-400/40 hover:text-cyan-300 hover:bg-cyan-400/5 transition-all cursor-default"
            >
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="relative z-10 px-5 sm:px-8 py-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { stat: '< 5 min', label: 'Set up time' },
            { stat: 'Zero', label: 'Tech skills needed' },
            { stat: 'Flat', label: 'Monthly pricing' },
          ].map((v) => (
            <div key={v.label} className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-cyan-300 to-violet-400 bg-clip-text text-transparent mb-2">
                {v.stat}
              </span>
              <span className="text-sm font-mono text-slate-400 tracking-wide uppercase">{v.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative z-10 px-5 sm:px-8 py-24 text-center">
        <div className="relative max-w-2xl mx-auto rounded-3xl border border-white/10 bg-white/3 backdrop-blur-xl p-10 sm:p-14 overflow-hidden"
          style={{ boxShadow: '0 0 80px rgba(34,211,238,0.08), 0 0 40px rgba(139,92,246,0.08)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 pointer-events-none" />
          <p className="text-xs font-mono tracking-widest text-cyan-400 uppercase mb-4 relative z-10">Start today</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 relative z-10">Ready to level up?</h2>
          <p className="text-slate-400 mb-8 relative z-10">Join hundreds of businesses already running smarter with SwiftKDS.</p>
          <button
            onClick={() => openModal('signup')}
            className="relative z-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold px-10 py-4 text-base shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] hover:scale-[1.03] active:scale-95 transition-all"
          >
            Get Started Free <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-sm">
            <span className="text-white">Swift</span>
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">KDS</span>
          </span>
        </div>
        <p className="text-xs text-slate-600 font-mono">© 2025 Valdez & Co. All rights reserved.</p>
      </footer>

      {/* ── MODAL BACKDROP ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm relative animate-slide-up">
            <div className="rounded-3xl border border-white/10 bg-[#0a0e1a]/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(34,211,238,0.15)] p-7">
              {/* Close */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">
                  <span className="text-white">Swift</span>
                  <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">KDS</span>
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-1">
                {modal === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                {modal === 'signin' ? 'Sign in to manage your business.' : 'Start managing your business in minutes.'}
              </p>

              {/* Social buttons */}
              <div className="space-y-3 mb-5">
                <button
                  type="button"
                  onClick={() => alert('Apple sign-in coming soon!')}
                  className="w-full flex items-center justify-center gap-3 rounded-full bg-white text-black px-4 py-3 text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.947 1.15-1.688 1.624-3.324 1.65-3.411-.037-.015-3.195-1.226-3.23-4.88-.035-3.056 2.493-4.52 2.613-4.593-1.425-2.083-3.633-2.366-4.42-2.433-2.003-.178-4.045 1.106-5.02 1.106zM15.485 4.314c.834-1.012 1.396-2.418 1.242-3.814-1.192.048-2.673.794-3.535 1.83-.773.92-1.442 2.362-1.26 3.731 1.332.103 2.723-.733 3.553-1.747z"/>
                  </svg>
                  Continue with Apple
                </button>
                <button
                  type="button"
                  onClick={() => alert('Google sign-in coming soon!')}
                  className="w-full flex items-center justify-center gap-3 rounded-full bg-white text-black px-4 py-3 text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-slate-500 bg-[#0a0e1a]">or continue with email</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={modal === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors backdrop-blur-sm"
                  placeholder="you@example.com"
                />
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold py-3.5 text-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 mt-1"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : modal === 'signin'
                      ? <><LogIn className="w-4 h-4" /> Sign In</>
                      : <><UserPlus className="w-4 h-4" /> Create Account</>
                  }
                </button>
              </form>

              {/* Switch mode */}
              <p className="mt-5 text-center text-xs text-slate-500">
                {modal === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => openModal(modal === 'signin' ? 'signup' : 'signin')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  {modal === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
