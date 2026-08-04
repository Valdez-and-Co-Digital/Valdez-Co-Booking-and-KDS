'use client';

import { useState, useEffect, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, CreditCard, FileSpreadsheet, Zap, Loader2, Link as LinkIcon, Building } from 'lucide-react';

type SetupData = {
  helcimAccountId: string;
  helcimApiToken: string;
  accountingSoftware: string;
};

export default function TenantSetupFlow({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [prospect, setProspect] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    helcimAccountId: '',
    helcimApiToken: '',
    accountingSoftware: ''
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadProspect() {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();
      
      if (data) setProspect(data);
      setIsLoading(false);
    }
    loadProspect();
  }, [resolvedParams.id, supabase]);

  const handleNext = () => setCurrentStep(prev => prev + 1);

  const handleProvision = async () => {
    setIsProvisioning(true);
    
    try {
      const response = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: prospect.id,
          setupData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentStep(4); // Success step
      } else {
        alert(result.error || 'Failed to provision tenant.');
        setIsProvisioning(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while provisioning.');
      setIsProvisioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#101415] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!prospect || prospect.status !== 'converted' || prospect.tier_selected !== 'complete_kitchen_suite') {
    return (
      <div className="min-h-[100dvh] bg-[#101415] flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
          <Zap className="w-8 h-8 text-slate-600" />
        </div>
        <h2 className="text-xl text-white font-bold">Invalid Setup Link</h2>
        <p className="max-w-md text-sm text-slate-400">This setup link is invalid, has expired, or the account is not eligible for full Kitchen Suite provisioning.</p>
      </div>
    );
  }

  const STEP_LABELS: Record<number, string> = {
    1: 'Profile Verification',
    2: 'Payments Integration',
    3: 'Accounting Sync'
  };

  return (
    <div className="min-h-[100dvh] bg-[#101415] text-slate-200 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] sm:w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] sm:w-[50%] h-[50%] bg-violet-500/15 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="p-4 sm:p-6 relative z-10 flex justify-center border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <Zap className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">SwiftKDS Setup</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 my-4 sm:my-8">
        <div className="max-w-2xl w-full mx-auto">
          
          {/* Mobile Stepper Banner */}
          {currentStep < 4 && (
            <div className="mb-6">
              {/* Desktop Stepper */}
              <div className="hidden sm:flex items-center justify-center mb-8">
                {[
                  { step: 1, label: 'Profile', icon: Building },
                  { step: 2, label: 'Payments', icon: CreditCard },
                  { step: 3, label: 'Accounting', icon: FileSpreadsheet }
                ].map((s, idx) => (
                  <div key={s.step} className="flex items-center">
                    <div className={`flex flex-col items-center gap-2 transition-all ${currentStep === s.step ? 'scale-105' : currentStep > s.step ? 'opacity-60' : 'opacity-40'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep >= s.step ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-white/20 bg-transparent text-white'
                      }`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${currentStep >= s.step ? 'text-cyan-400' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                    {idx < 2 && <div className={`w-12 md:w-16 h-px mx-3 ${currentStep > s.step ? 'bg-cyan-500' : 'bg-white/10'}`} />}
                  </div>
                ))}
              </div>

              {/* Mobile Stepper Header */}
              <div className="sm:hidden space-y-2 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-cyan-400 uppercase tracking-wider">Step {currentStep} of 3</span>
                  <span className="text-slate-300 font-medium">{STEP_LABELS[currentStep]}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full transition-all duration-300" 
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Steps Card */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-2xl">
            {/* Glass top line */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* STEP 1: Profile */}
            {currentStep === 1 && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Welcome to SwiftKDS</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Verify your business details to configure your kitchen display system.</p>
                </div>
                
                <div className="bg-black/30 rounded-2xl border border-white/10 p-4 sm:p-6 space-y-4">
                  <div>
                    <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Business Name</span>
                    <span className="text-base sm:text-lg font-semibold text-white break-words">{prospect.business_name}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Primary Contact</span>
                      <span className="text-sm sm:text-base text-slate-200">{prospect.contact_name}</span>
                    </div>
                    <div>
                      <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider block mb-1">Email Address</span>
                      <span className="text-sm sm:text-base text-slate-200 break-all">{prospect.contact_email}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleNext} 
                  className="w-full h-13 sm:h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 text-slate-950 font-bold text-base rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-[0.98] transition-all"
                >
                  Confirm & Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2: Payments */}
            {currentStep === 2 && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Connect Payment Processor</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Link your Helcim account to process guest payments directly from your KDS and self-serve kiosks.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-slate-300 block">Helcim Account ID</label>
                    <input 
                      type="text" 
                      value={setupData.helcimAccountId}
                      onChange={e => setSetupData({...setupData, helcimAccountId: e.target.value})}
                      placeholder="e.g. 100012345"
                      className="w-full h-12 bg-black/30 border border-white/15 rounded-xl px-4 text-base text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-slate-300 block">Helcim API Token</label>
                    <input 
                      type="password" 
                      value={setupData.helcimApiToken}
                      onChange={e => setSetupData({...setupData, helcimApiToken: e.target.value})}
                      placeholder="Enter your API token"
                      className="w-full h-12 bg-black/30 border border-white/15 rounded-xl px-4 text-base text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500"
                    />
                  </div>
                  <div className="text-xs text-slate-400 flex items-start gap-2 pt-1">
                    <LinkIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                    <p>Find these in your Helcim Dashboard under All Tools → API Access.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setCurrentStep(1)} 
                    className="h-13 px-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all font-medium active:scale-95 text-sm border border-white/15"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext} 
                    className="flex-1 h-13 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 text-slate-950 font-bold text-base rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-[0.98] transition-all"
                  >
                    Next Step <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Accounting */}
            {currentStep === 3 && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Accounting Sync</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Select your accounting software to automatically sync daily sales and payouts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {['QuickBooks', 'Xero', 'Wave'].map(software => (
                    <button
                      key={software}
                      onClick={() => setSetupData({...setupData, accountingSoftware: software})}
                      className={`p-4 sm:p-5 rounded-2xl border flex flex-row sm:flex-col items-center justify-center gap-3 transition-all active:scale-95 ${
                        setupData.accountingSoftware === software 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                          : 'bg-black/30 border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                      <span className="font-semibold text-sm sm:text-base">{software}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setCurrentStep(2)} 
                    disabled={isProvisioning} 
                    className="h-13 px-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all font-medium text-sm border border-white/15 active:scale-95 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleProvision} 
                    disabled={isProvisioning || !setupData.accountingSoftware} 
                    className="flex-1 h-13 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-bold text-base rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProvisioning ? <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> : 'Finalize & Launch KDS'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in text-center py-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-6">
                  <CheckCircle2 className="w-10 h-10 text-slate-950 font-bold" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Provisioning Complete!</h2>
                <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
                  Your tenant environment has been successfully created. You can now log into your SwiftKDS dashboard.
                </p>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full sm:w-auto px-8 h-13 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-200 transition-colors shadow-lg"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} SwiftKDS • Valdez & Co
      </footer>
    </div>
  );
}
