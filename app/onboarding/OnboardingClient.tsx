'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Target, Layers, Package, CreditCard, ArrowRight, CheckCircle2, 
  Loader2, Sparkles, Building2, UtensilsCrossed, Truck, Scissors, Store, HelpCircle, ArrowLeft
} from 'lucide-react';
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

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

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
  };

  const isStepValid = () => {
    if (step === 1) return businessName.trim().length > 0;
    if (step === 2) return businessType !== '';
    if (step === 3) return experienceLevel !== '';
    if (step === 4) return selectedPackage !== '';
    return true;
  };

  const progressPercentage = (step / 5) * 100;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950 text-white relative flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Dynamic Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-cyan-500/15 rounded-full blur-[100px] sm:blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-violet-500/20 rounded-full blur-[100px] sm:blur-[140px]" />
      </div>

      {/* TOP BAR & PROGRESS INDICATOR */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-2">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <span className="font-display font-bold text-sm tracking-tight text-white/90">SwiftKDS</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
              Step {step} of 5
            </span>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </header>

      {/* MAIN STEP CONTENT AREA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-lg w-full mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-100 text-sm backdrop-blur-md w-full text-center shadow-lg animate-fade-in">
            {error}
          </div>
        )}

        {/* STEP 1: Business Name */}
        {step === 1 && (
          <div className="w-full animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-xl animate-pulse" />
              <div className="w-full h-full rounded-2xl bg-white/5 border border-cyan-400/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-center mb-2 tracking-tight text-white">
              What is your business name?
            </h1>
            <p className="text-sm text-slate-400 text-center mb-6 sm:mb-8">
              We'll use this to set up your online store and KDS terminals.
            </p>
            
            <div className="w-full">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isStepValid() && handleNext()}
                className="w-full h-14 px-5 sm:px-6 bg-white/10 border border-white/20 rounded-2xl text-center text-lg sm:text-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-md transition-all shadow-lg shadow-black/20"
                placeholder="e.g. Acme Bakery & Bistro"
                autoFocus
                autoComplete="organization"
                inputMode="text"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Business Type */}
        {step === 2 && (
          <div className="w-full animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-xl animate-pulse" />
              <div className="w-full h-full rounded-2xl bg-white/5 border border-cyan-400/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                <Target className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-center mb-2 tracking-tight text-white">
              What type of business are you?
            </h1>
            <p className="text-sm text-slate-400 text-center mb-6">
              Select the option that best describes your store.
            </p>
            
            <div className="w-full space-y-2.5 sm:space-y-3">
              {[
                { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, desc: 'Dine-in, takeout, or full service' },
                { id: 'foodtruck', label: 'Food Truck / Pop-up', icon: Truck, desc: 'Mobile food vendor or pop-up kitchen' },
                { id: 'salon', label: 'Salon / Barbershop', icon: Scissors, desc: 'Services, bookings, and product sales' },
                { id: 'retail', label: 'Retail Store', icon: Store, desc: 'Physical storefront and merchandise' },
                { id: 'other', label: 'Other Business', icon: HelpCircle, desc: 'Custom operations setup' },
              ].map(type => {
                const Icon = type.icon;
                const isSelected = businessType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setBusinessType(type.id)}
                    className={`w-full rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 flex items-center gap-4 backdrop-blur-md active:scale-[0.98]
                      ${isSelected 
                        ? 'bg-cyan-500/20 text-cyan-50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-white/10 text-slate-300'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base text-white">{type.label}</div>
                      <div className="text-xs text-slate-400 truncate">{type.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Experience Level */}
        {step === 3 && (
          <div className="w-full animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-xl animate-pulse" />
              <div className="w-full h-full rounded-2xl bg-white/5 border border-cyan-400/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-center mb-2 tracking-tight text-white">
              POS / KDS Experience
            </h1>
            <p className="text-sm text-slate-400 text-center mb-6">
              How familiar are you with digital kitchen & point-of-sale systems?
            </p>
            
            <div className="w-full space-y-2.5 sm:space-y-3">
              {[
                { id: 'none', label: 'Brand New (None)', desc: 'First time moving off paper tickets or manual orders' },
                { id: 'beginner', label: 'Beginner', desc: 'Used basic iPad POS or online ordering tools' },
                { id: 'intermediate', label: 'Intermediate', desc: 'Familiar with Square, Toast, or Clover systems' },
                { id: 'advanced', label: 'Advanced', desc: 'Experienced managing multi-terminal KDS setups' },
              ].map(level => {
                const isSelected = experienceLevel === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setExperienceLevel(level.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 flex justify-between items-center backdrop-blur-md active:scale-[0.98]
                      ${isSelected 
                        ? 'bg-cyan-500/20 text-cyan-50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <div>
                      <div className="font-semibold text-base text-white mb-0.5">{level.label}</div>
                      <div className="text-xs text-slate-400">{level.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Package Selection */}
        {step === 4 && (
          <div className="w-full animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-500/25 rounded-2xl blur-xl animate-pulse" />
              <div className="w-full h-full rounded-2xl bg-white/5 border border-violet-400/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-violet-300 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-center mb-2 tracking-tight text-white">
              Choose Your Platform
            </h1>
            <p className="text-sm text-slate-400 text-center mb-5">
              Select the plan that fits your current operational needs.
            </p>
            
            <div className="w-full space-y-3.5">
              {/* Web Only */}
              <button
                onClick={() => setSelectedPackage('web_only')}
                className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 backdrop-blur-md relative overflow-hidden active:scale-[0.98]
                  ${selectedPackage === 'web_only' 
                    ? 'bg-violet-500/20 border-violet-400 shadow-[0_0_25px_rgba(139,92,246,0.3)] text-white' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <h3 className="text-lg font-bold text-white">Web Only</h3>
                    <p className="text-xs text-slate-400">Online ordering website & digital menu</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-bold text-white">${(defaultPrices.web_only / 100).toFixed(0)}</span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-xs text-violet-300">
                  <span>✓ Web Ordering</span>
                  <span>✓ Menu Management</span>
                  <span>✓ Digital Receipts</span>
                </div>
              </button>

              {/* Web + KDS (Recommended) */}
              <button
                onClick={() => setSelectedPackage('web_and_kds')}
                className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 backdrop-blur-md relative overflow-hidden active:scale-[0.98]
                  ${selectedPackage === 'web_and_kds' 
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)] text-white ring-1 ring-cyan-400/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'}`}
              >
                <div className="absolute top-3 right-3 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                  Most Popular
                </div>

                <div className="flex justify-between items-start mb-1.5 pr-20">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-bold text-white">Web + KDS</h3>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-400">Complete kitchen display & online ordering</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-bold text-cyan-300">${(defaultPrices.web_and_kds / 100).toFixed(0)}</span>
                    <span className="text-xs text-cyan-400/80">/mo</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-xs text-cyan-300">
                  <span>✓ Kitchen Display System</span>
                  <span>✓ Real-time Order Sync</span>
                  <span>✓ Online Store</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Stripe / Payout Connection */}
        {step === 5 && (
          <div className="w-full animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-500/25 rounded-2xl blur-xl animate-pulse" />
              <div className="w-full h-full rounded-2xl bg-white/5 border border-violet-400/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-violet-300 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-center mb-2 tracking-tight text-white">
              Connect Your Payouts
            </h1>
            <p className="text-sm text-slate-400 text-center mb-6">
              Link Stripe to begin receiving payouts directly into your bank account.
            </p>
            
            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={() => alert("Stripe connection coming soon!")}
                className="w-full h-14 flex justify-center items-center gap-2 rounded-2xl bg-[#635BFF] hover:bg-[#5851E5] active:scale-[0.98] text-white text-base font-bold shadow-[0_0_20px_rgba(99,91,255,0.4)] transition-all"
              >
                <CreditCard className="w-5 h-5" />
                Link Stripe Account
              </button>
              
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="w-full h-14 flex justify-center items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] backdrop-blur-md text-white text-base font-semibold border border-white/15 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> : 'Complete Setup (Skip Stripe)'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* STICKY BOTTOM ACTION DOCK (Optimized for Mobile Thumbs) */}
      <footer className="sticky bottom-0 left-0 right-0 z-30 w-full p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 sm:border-0 sm:bg-transparent sm:relative pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all border border-white/15 flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 text-slate-950 text-base sm:text-lg font-bold shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
