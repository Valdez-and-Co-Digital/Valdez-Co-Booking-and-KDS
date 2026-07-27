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
    <div className="min-h-screen bg-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-display font-bold text-white tracking-tight">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Start managing your business with SwiftKDS.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="glass-card py-8 px-4 sm:px-10 border-white/10 shadow-2xl shadow-black/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-zinc-300">
                Business Name
              </label>
              <div className="mt-1">
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 placeholder-zinc-500 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors sm:text-sm"
                  placeholder="Acme Bakery"
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-zinc-300">
                Business Type
              </label>
              <div className="mt-1">
                <select
                  id="businessType"
                  name="businessType"
                  required
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors sm:text-sm"
                >
                  <option value="" disabled selected>Select your industry</option>
                  <option value="salon">Salon / Barbershop</option>
                  <option value="foodtruck">Restaurant / Food Truck</option>
                  <option value="agency">Web Design Agency</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 placeholder-zinc-500 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors sm:text-sm"
                  placeholder="admin@acme.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 placeholder-zinc-500 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-glow flex w-full justify-center items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 border-t border-white/5 pt-6 flex flex-col items-center gap-2">
            <p className="text-center text-sm text-zinc-400">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Log in
              </Link>
            </p>
            <p className="text-center text-xs text-zinc-500 mt-2">
              Powered by <a href="https://valdez.co" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">Valdez & Co.</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
