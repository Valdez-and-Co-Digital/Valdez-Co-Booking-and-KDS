'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Zap, CheckCircle2, Building, User, Mail, Phone, ArrowRight } from 'lucide-react';

export default function ProspectIntakePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [posSystem, setPosSystem] = useState('');
  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      alert('There was an issue submitting your information. Please try again.');
    } else {
      setIsSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center p-6 text-slate-200 font-sans">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center space-y-6 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Application Received</h2>
          <p className="text-slate-400">
            Thank you for your interest in SwiftKDS. Our team will review your information and reach out to schedule a consultation shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101415] text-slate-200 font-sans relative overflow-hidden flex flex-col">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-8 relative z-10 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SwiftKDS</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Upgrade Your Kitchen</h1>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">
              Join the next generation of restaurant operators. Fill out the form below to get started with a custom SwiftKDS deployment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 relative group overflow-hidden">
            {/* Top glass shine */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Business Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                    <Building className="w-4 h-4" />
                  </div>
                  <input required name="business_name" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="e.g. Bangkok Boba" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Contact Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input required name="contact_name" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="John Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input required name="contact_email" type="email" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="john@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Phone Number (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input name="contact_phone" type="tel" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="(555) 123-4567" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Current POS / Setup</label>
              <select 
                value={posSystem}
                onChange={(e) => setPosSystem(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-slate-900">Select your current setup...</option>
                <option value="Square" className="bg-slate-900">Square</option>
                <option value="Toast" className="bg-slate-900">Toast</option>
                <option value="Clover" className="bg-slate-900">Clover</option>
                <option value="Lightspeed" className="bg-slate-900">Lightspeed</option>
                <option value="TouchBistro" className="bg-slate-900">TouchBistro</option>
                <option value="Pen & Paper" className="bg-slate-900">Pen & Paper</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
            </div>

            {posSystem === 'Other' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium text-slate-300">Please specify</label>
                <input name="pos_system_other" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600" placeholder="What system are you using?" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">What's your biggest operational challenge?</label>
              <textarea name="pain_points" rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600 resize-none" placeholder="Missed orders, slow ticket times, poor integration..." />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
