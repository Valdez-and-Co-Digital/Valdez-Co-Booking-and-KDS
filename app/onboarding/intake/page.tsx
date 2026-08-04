'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Zap, CheckCircle2, Building, User, Mail, Phone, ArrowRight, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProspectIntakePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [posSystem, setPosSystem] = useState('');
  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      business_name: formData.get('business_name') as string,
      contact_name: formData.get('contact_name') as string,
      contact_email: formData.get('contact_email') as string,
      contact_phone: formData.get('contact_phone') as string,
      source: 'inbound_inquiry',
      status: 'new',
      intake_data: {
        pos_system: posSystem === 'Other' ? formData.get('pos_system_other') as string : posSystem,
        pain_points: formData.get('pain_points') as string,
      }
    };

    const { error } = await supabase.from('prospects').insert([data]);

    if (error) {
      console.error('Submission error:', error);
      setErrorMessage('There was an issue submitting your application. Please check your details and try again.');
    } else {
      setIsSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-200 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative z-10 animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950 font-bold" />
          </div>
          
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-2">Application Received!</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Thank you for your interest in SwiftKDS. Our onboarding team is reviewing your restaurant setup and will reach out shortly.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <Link 
              href="/onboarding" 
              className="w-full h-13 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-2xl border border-white/15 transition-all text-sm"
            >
              Continue to Quick Setup <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950 text-slate-200 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] sm:w-[50%] h-[40%] bg-cyan-500/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] sm:w-[50%] h-[40%] bg-violet-500/20 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 sm:p-8 relative z-10 flex justify-between items-center max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <Zap className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">SwiftKDS</span>
        </div>

        <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Prospect Intake
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 relative z-10 w-full">
        <div className="max-w-xl w-full mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2 sm:mb-3 tracking-tight">
              Upgrade Your Kitchen
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
              Fill out the form below to request a tailored SwiftKDS kitchen & ordering deployment.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-100 text-sm backdrop-blur-md flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-5 relative group overflow-hidden shadow-2xl">
            {/* Top glass shine line */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300">Business Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input 
                    required 
                    name="business_name" 
                    type="text" 
                    className="w-full h-12 bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500" 
                    placeholder="Bangkok Boba" 
                  />
                </div>
              </div>

              {/* Contact Name */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300">Contact Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    required 
                    name="contact_name" 
                    type="text" 
                    className="w-full h-12 bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500" 
                    placeholder="John Doe" 
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    required 
                    name="contact_email" 
                    type="email" 
                    className="w-full h-12 bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input 
                    name="contact_phone" 
                    type="tel" 
                    className="w-full h-12 bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500" 
                    placeholder="(555) 123-4567" 
                  />
                </div>
              </div>
            </div>

            {/* Current POS System */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300">Current POS / Setup</label>
              <div className="relative">
                <select 
                  value={posSystem}
                  onChange={(e) => setPosSystem(e.target.value)}
                  className="w-full h-12 bg-black/30 border border-white/15 rounded-xl px-4 pr-10 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-950 text-slate-400">Select your current POS system...</option>
                  <option value="Square" className="bg-slate-950 text-white">Square</option>
                  <option value="Toast" className="bg-slate-950 text-white">Toast</option>
                  <option value="Clover" className="bg-slate-950 text-white">Clover</option>
                  <option value="Lightspeed" className="bg-slate-950 text-white">Lightspeed</option>
                  <option value="TouchBistro" className="bg-slate-950 text-white">TouchBistro</option>
                  <option value="Pen & Paper" className="bg-slate-950 text-white">Pen & Paper (Manual)</option>
                  <option value="Other" className="bg-slate-950 text-white">Other</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
              </div>
            </div>

            {posSystem === 'Other' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs sm:text-sm font-semibold text-slate-300">Please specify system name</label>
                <input 
                  name="pos_system_other" 
                  type="text" 
                  className="w-full h-12 bg-black/30 border border-white/15 rounded-xl px-4 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500" 
                  placeholder="System name..." 
                />
              </div>
            )}

            {/* Pain Points / Operational Challenges */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300">Operational Challenges</label>
              <textarea 
                name="pain_points" 
                rows={3} 
                className="w-full bg-black/30 border border-white/15 rounded-xl p-3.5 text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500 resize-none" 
                placeholder="e.g. Slow ticket times, missed orders during peak rushes..." 
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-13 sm:h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 text-slate-950 font-bold text-base sm:text-lg rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.35)] hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} SwiftKDS • A Valdez & Co. Platform
      </footer>
    </div>
  );
}
