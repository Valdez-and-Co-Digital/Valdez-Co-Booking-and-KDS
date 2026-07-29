'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, UserPlus, Loader2 } from 'lucide-react';
import { signUpAction } from './actions';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signUpAction(formData);

    // If we reach here and there is a result, it means it returned an error
    // (A successful signup triggers a redirect in the server action)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
            <Zap className="w-8 h-8 text-white drop-shadow-md" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-display font-bold text-white tracking-tight">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200">
          Join Valdez & Co and manage your business.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl py-8 px-4 sm:px-10 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-100 text-sm backdrop-blur-md">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => alert('Sign in with Apple coming soon!')}
              className="w-full flex justify-center items-center gap-3 rounded-full bg-white text-black px-4 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Sign in with Apple
            </button>

            <button
              type="button"
              onClick={() => alert('Sign in with Google coming soon!')}
              className="w-full flex justify-center items-center gap-3 rounded-full bg-white text-black px-4 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Sign in with Google
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-blue-200 bg-[#3b4c9b]">Or continue with email</span>
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
                  className="block w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 placeholder-blue-300/50 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors sm:text-sm backdrop-blur-sm"
                  placeholder="admin@acme.com"
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
                  autoComplete="new-password"
                  required
                  className="block w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 placeholder-blue-300/50 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors sm:text-sm backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 hover:scale-[1.02] active:scale-95 shadow-lg shadow-white/5"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-center text-sm text-blue-200">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:text-blue-100 font-semibold transition-colors underline decoration-white/30 underline-offset-4">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
