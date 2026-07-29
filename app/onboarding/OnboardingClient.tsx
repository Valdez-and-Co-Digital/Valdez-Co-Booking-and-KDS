'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Layers, Package, CreditCard, ArrowRight, CheckCircle2, Loader2, Sparkles, Building2 } from 'lucide-react';
import { completeOnboardingAction } from './actions';

interface OnboardingClientProps {
  defaultPrices: {
    web_only: number;
    web_and_kds: number;
    platform_fee: number;
  };
}

export default function OnboardingClient({ defaultPrices }: OnboardingClientProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  const router = useRouter();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('businessName', businessName);
    formData.append('businessType', businessType);
    formData.append('experienceLevel', experienceLevel);
    formData.append('selectedPackage', selectedPackage);

    const result = await completeOnboardingAction(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // Success will redirect to dashboard via the action
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-violet-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center">
        
        {/* Step Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-white w-8' : 'bg-white/20 w-4'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-100 text-sm backdrop-blur-md w-full max-w-sm text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Business Name */}
        {step === 1 && (
          <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
              <Building2 className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] relative z-10" />
            </div>
            <h2 className="text-3xl font-display font-bold text-center mb-10 tracking-tight">
              What is your<br/>business name?
            </h2>
            
            <div className="w-full space-y-4">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-center text-xl text-white placeholder-violet-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-md transition-all shadow-lg shadow-white/5"
                placeholder="Acme Bakery"
                autoFocus
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!businessName.trim()}
              className="mt-12 w-full max-w-xs rounded-full bg-cyan-500 text-slate-950 px-6 py-4 text-lg font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 2: Business Type */}
        {step === 2 && (
          <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
              <Target className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] relative z-10" />
            </div>
            <h2 className="text-3xl font-display font-bold text-center mb-10 tracking-tight">
              What type of business<br/>are you running?
            </h2>
            
            <div className="w-full space-y-3">
              {[
                { id: 'restaurant', label: 'Restaurant' },
                { id: 'foodtruck', label: 'Food Truck' },
                { id: 'salon', label: 'Salon / Barbershop' },
                { id: 'retail', label: 'Retail Store' },
                { id: 'other', label: 'Other' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setBusinessType(type.id)}
                  className={`w-full rounded-2xl border px-6 py-4 text-left font-semibold transition-all duration-200 flex justify-between items-center backdrop-blur-sm
                    ${businessType === type.id 
                      ? 'bg-cyan-500/20 text-cyan-50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
                >
                  {type.label}
                  {businessType === type.id && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!businessType}
              className="mt-12 w-full max-w-xs rounded-full bg-cyan-500 text-slate-950 px-6 py-4 text-lg font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 3: Experience Level */}
        {step === 3 && (
          <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
              <Layers className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] relative z-10" />
            </div>
            <h2 className="text-3xl font-display font-bold text-center mb-10 tracking-tight">
              What's your experience<br/>with POS/KDS systems?
            </h2>
            
            <div className="w-full space-y-3">
              {[
                { id: 'none', label: 'Brand New (None)' },
                { id: 'beginner', label: 'Beginner' },
                { id: 'intermediate', label: 'Intermediate' },
                { id: 'advanced', label: 'Advanced' },
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => setExperienceLevel(level.id)}
                  className={`w-full rounded-2xl border px-6 py-4 text-left font-semibold transition-all duration-200 flex justify-between items-center backdrop-blur-sm
                    ${experienceLevel === level.id 
                      ? 'bg-cyan-500/20 text-cyan-50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
                >
                  {level.label}
                  {experienceLevel === level.id && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-12 w-full max-w-xs">
              <button onClick={handleBack} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20">
                <ArrowRight className="w-6 h-6 rotate-180" />
              </button>
              <button
                onClick={handleNext}
                disabled={!experienceLevel}
                className="flex-1 rounded-full bg-cyan-500 text-slate-950 px-6 py-4 text-lg font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Package Selection */}
        {step === 4 && (
          <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
              <Package className="w-16 h-16 text-violet-300 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] relative z-10" />
            </div>
            <h2 className="text-3xl font-display font-bold text-center mb-10 tracking-tight">
              Choose your platform
            </h2>
            
            <div className="w-full space-y-4">
              <button
                onClick={() => setSelectedPackage('web_only')}
                className={`w-full rounded-3xl border p-6 text-left transition-all duration-200 backdrop-blur-sm relative overflow-hidden
                  ${selectedPackage === 'web_only' 
                    ? 'bg-violet-500/20 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)] text-white' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-violet-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">Web Only</h3>
                  {selectedPackage === 'web_only' && <CheckCircle2 className="w-6 h-6 text-violet-400 drop-shadow-md" />}
                </div>
                <p className="text-violet-200/80 text-sm mb-4 leading-relaxed">
                  Perfect for businesses that just need online ordering and a beautiful website.
                </p>
                <div className="text-2xl font-display font-bold">
                  ${(defaultPrices.web_only / 100).toFixed(0)}<span className="text-sm font-normal text-violet-300/70">/mo</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedPackage('web_and_kds')}
                className={`w-full rounded-3xl border p-6 text-left transition-all duration-200 backdrop-blur-sm relative overflow-hidden
                  ${selectedPackage === 'web_and_kds' 
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-white' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-violet-200'}`}
              >
                {selectedPackage === 'web_and_kds' && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
                )}
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">Web + KDS</h3>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  {selectedPackage === 'web_and_kds' && <CheckCircle2 className="w-6 h-6 text-cyan-400 drop-shadow-sm" />}
                </div>
                <p className={`text-sm mb-4 leading-relaxed relative z-10 ${selectedPackage === 'web_and_kds' ? 'text-cyan-50' : 'text-violet-200/80'}`}>
                  The ultimate package. Includes online ordering and an in-store Kitchen Display System.
                </p>
                <div className="text-2xl font-display font-bold relative z-10">
                  ${(defaultPrices.web_and_kds / 100).toFixed(0)}<span className={`text-sm font-normal ${selectedPackage === 'web_and_kds' ? 'text-cyan-300' : 'text-violet-300/70'}`}>/mo</span>
                </div>
              </button>
            </div>

            <div className="flex gap-4 mt-12 w-full max-w-xs">
              <button onClick={handleBack} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20">
                <ArrowRight className="w-6 h-6 rotate-180" />
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedPackage}
                className="flex-1 rounded-full bg-cyan-500 text-slate-950 px-6 py-4 text-lg font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Stripe Integration */}
        {step === 5 && (
          <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
              <CreditCard className="w-16 h-16 text-violet-300 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] relative z-10" />
            </div>
            <h2 className="text-3xl font-display font-bold text-center mb-6 tracking-tight">
              Connect your payouts
            </h2>
            <p className="text-center text-violet-200 mb-10 px-4">
              Link your Stripe account to start accepting payments immediately.
            </p>
            
            <div className="w-full flex flex-col gap-4 max-w-xs">
              <button
                type="button"
                onClick={() => alert("Stripe connection coming soon!")}
                className="w-full flex justify-center items-center gap-2 rounded-full bg-[#635BFF] hover:bg-[#5851E5] px-6 py-4 text-lg font-bold shadow-[0_0_20px_rgba(99,91,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Link Stripe
              </button>
              
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-4 text-lg font-bold transition-all border border-white/10 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Skip for now'}
              </button>
            </div>
            
            <div className="flex mt-8">
              <button onClick={handleBack} className="flex items-center gap-2 text-violet-300 hover:text-white transition-colors text-sm font-semibold">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
