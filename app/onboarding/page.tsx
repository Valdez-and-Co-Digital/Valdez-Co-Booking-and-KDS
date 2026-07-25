'use client';

import { useState } from 'react';
import { Zap, ArrowRight, Loader2, DollarSign, Percent } from 'lucide-react';
import { completeOnboardingAction } from './actions';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await completeOnboardingAction(formData);

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
          Welcome to SwiftKDS
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Let's finalize your business settings before you jump in.
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
              <label htmlFor="currency" className="block text-sm font-medium text-zinc-300">
                Default Currency
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-zinc-500" />
                </div>
                <select
                  id="currency"
                  name="currency"
                  required
                  defaultValue="usd"
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-3 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors sm:text-sm"
                >
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                  <option value="gbp">GBP (£)</option>
                  <option value="cad">CAD ($)</option>
                  <option value="aud">AUD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-zinc-300">
                Default Tax Rate (%)
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  defaultValue="0.00"
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-black/40 pl-10 px-4 py-3 placeholder-zinc-500 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors sm:text-sm"
                  placeholder="8.25"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                This will be applied to your services and menu items automatically.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-glow flex w-full justify-center items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
