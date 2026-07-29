'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Zap, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-slate-950 to-violet-950 flex flex-col justify-center p-4 sm:p-6 lg:p-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl relative">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-3xl blur-md" />
            <Zap className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] relative z-10" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-display font-bold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-sm text-violet-200">
          Sign in to manage your business.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in flex-1 max-h-full overflow-y-auto" style={{ animationDelay: '100ms' }}>
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl py-6 px-4 sm:px-10 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-100 text-sm backdrop-blur-md">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => alert('Sign in with Apple coming soon!')}
              className="w-full flex justify-center items-center gap-3 rounded-full bg-white text-black px-4 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.947 1.15-1.688 1.624-3.324 1.65-3.411-.037-.015-3.195-1.226-3.23-4.88-.035-3.056 2.493-4.52 2.613-4.593-1.425-2.083-3.633-2.366-4.42-2.433-2.003-.178-4.045 1.106-5.02 1.106zM15.485 4.314c.834-1.012 1.396-2.418 1.242-3.814-1.192.048-2.673.794-3.535 1.83-.773.92-1.442 2.362-1.26 3.731 1.332.103 2.723-.733 3.553-1.747z"/>
              </svg>
              Sign in with Apple
            </button>

            <button
              type="button"
              onClick={() => alert('Sign in with Google coming soon!')}
              className="w-full flex justify-center items-center gap-3 rounded-full bg-white text-black px-4 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-violet-200 bg-[#1e1b4b]">Or continue with email</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 ml-1">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder-violet-300/50 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors sm:text-sm backdrop-blur-sm"
                  placeholder="admin@valdez.co"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 ml-1">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder-violet-300/50 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors sm:text-sm backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-center text-sm text-violet-200">
              Don't have an account?{' '}
              <Link href="/signup" className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors underline decoration-cyan-400/30 underline-offset-4">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
