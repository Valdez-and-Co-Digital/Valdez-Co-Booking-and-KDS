'use client';

import { useState, useEffect, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import Script from 'next/script';

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [prospect, setProspect] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (data) {
        setProspect(data);
        
        // Generate a checkout token for this tier
        if (data.tier_selected) {
          const res = await fetch('/api/billing/invoice', {
            method: 'POST',
            body: JSON.stringify({ prospectId: data.id, tier: data.tier_selected })
          });
          const invoiceData = await res.json();
          if (invoiceData.success) {
            setCheckoutToken(invoiceData.checkoutToken);
          }
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [resolvedParams.id, supabase]);

  const handlePayment = () => {
    if (!checkoutToken) return;
    setIsProcessing(true);
    
    // HelcimPay.js integration
    try {
      // @ts-ignore
      if (window.appendHelcimPayIframe) {
        // @ts-ignore
        window.appendHelcimPayIframe(checkoutToken);
      } else {
        // Fallback or mock for development
        setTimeout(() => {
          setPaymentSuccess(true);
          setIsProcessing(false);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!prospect || !prospect.tier_selected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Invoice not found or tier not selected.
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/40 border border-white/10 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-slate-400 mb-8">
            Thank you, {prospect.contact_name}. Your account is now being provisioned.
          </p>
        </div>
      </div>
    );
  }

  const tierName = prospect.tier_selected.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <Script src="https://secure.myhelcim.com/js/version2.js" strategy="lazyOnload" />
      
      <div className="max-w-md w-full bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Setup</h1>
          <p className="text-slate-400">{prospect.business_name}</p>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 mb-8 border border-white/5">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
            <span className="text-slate-400">Description</span>
            <span className="text-white font-medium">{tierName} — Setup</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-300">Total</span>
            <span className="text-cyan-400 font-bold">
              {prospect.tier_selected === 'digital_foundation' ? '$500.00' : 
               prospect.tier_selected === 'connected_ordering' ? '$1,000.00' : '$1,500.00'}
            </span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing || !checkoutToken}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        >
          {isProcessing ? (
            <div className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
          ) : (
            <>
              <CreditCard className="w-5 h-5" /> Pay Now
            </>
          )}
        </button>
        
        <p className="text-center text-slate-500 text-xs mt-6 flex items-center justify-center gap-1">
          Secure payment powered by Helcim
        </p>
      </div>
    </div>
  );
}
