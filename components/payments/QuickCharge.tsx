'use client';

import { useState, useCallback } from 'react';
import { CreditCard, Smartphone, CheckCircle2, XCircle, Loader2, DollarSign, Receipt } from 'lucide-react';

type PaymentState = 'idle' | 'collecting' | 'processing' | 'success' | 'declined';

const HAPTIC_PATTERNS = {
  tap:      [0, 30],
  success:  [0, 100, 50, 100],   // double pulse
  declined: [0, 200, 100, 200, 100, 200], // triple pulse
};

function haptic(pattern: number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export function QuickCharge({ tenantId }: { tenantId: string }) {
  const [amountStr, setAmountStr] = useState('0');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const amountCents = Math.round(parseFloat(amountStr || '0') * 100);

  const handleNumpad = useCallback((key: string) => {
    haptic(HAPTIC_PATTERNS.tap);
    if (key === '⌫') {
      setAmountStr(s => s.length <= 1 ? '0' : s.slice(0, -1));
      return;
    }
    if (key === '.' && amountStr.includes('.')) return;
    // Max 2 decimal places
    const decimalIdx = amountStr.indexOf('.');
    if (decimalIdx !== -1 && amountStr.length - decimalIdx > 2) return;
    setAmountStr(s => s === '0' && key !== '.' ? key : s + key);
  }, [amountStr]);

  const handleTapToPay = async () => {
    if (amountCents < 50) {
      setErrorMsg('Minimum amount is $0.50');
      return;
    }
    setErrorMsg('');
    setPaymentState('collecting');

    try {
      // 1. Get connection token from backend
      const tokenRes = await fetch('/api/stripe/connection-token', { method: 'POST' });
      const { secret } = await tokenRes.json();

      // 2. Create PaymentIntent server-side
      setPaymentState('processing');
      const piRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          amountCents,
          cartItems: [{ service_id: 'quick-charge', name: 'Quick Charge', price_cents: amountCents, quantity: 1 }],
          customerEmail: 'walk-in@swiftkds.com',
          customerName: 'Walk-in Customer',
        }),
      });
      const { client_secret } = await piRes.json();

      // 3-5. Stripe Terminal SDK handles NFC tap (via Capacitor plugin in native app)
      // In web context, this would use @stripe/terminal-js
      // Simulating success for web preview:
      await new Promise(r => setTimeout(r, 1500));
      setPaymentState('success');
      haptic(HAPTIC_PATTERNS.success);

      // Reset after 3 seconds
      setTimeout(() => {
        setPaymentState('idle');
        setAmountStr('0');
      }, 3000);

    } catch (err: any) {
      setPaymentState('declined');
      setErrorMsg(err.message ?? 'Payment failed');
      haptic(HAPTIC_PATTERNS.declined);
      setTimeout(() => setPaymentState('idle'), 3000);
    }
  };

  const stateConfig = {
    idle: {
      containerClass: 'payment-idle border-zinc-700',
      icon: <Smartphone className="w-8 h-8 text-zinc-400" />,
      text: 'Ready to accept payment',
    },
    collecting: {
      containerClass: 'payment-collecting border-violet-700',
      icon: <CreditCard className="w-8 h-8 text-violet-400" />,
      text: 'Hold card near reader…',
    },
    processing: {
      containerClass: 'payment-processing border-blue-700',
      icon: <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />,
      text: 'Processing payment…',
    },
    success: {
      containerClass: 'payment-success border-emerald-700',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      text: `Payment of ${formatAmount(amountCents)} complete!`,
    },
    declined: {
      containerClass: 'payment-declined border-red-700',
      icon: <XCircle className="w-8 h-8 text-red-400" />,
      text: errorMsg || 'Payment declined',
    },
  };

  const currentState = stateConfig[paymentState];

  return (
    <div className="max-w-sm mx-auto py-8 px-4 flex flex-col gap-6">
      {/* Amount Display */}
      <div className="text-center">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-semibold">Amount</p>
        <div className="font-display text-6xl font-bold gradient-text tracking-tight">
          ${amountStr}
        </div>
        {amountCents > 0 && (
          <p className="text-sm text-zinc-500 mt-1">
            Platform fee: ${(amountCents * 0.01 / 100).toFixed(2)}
          </p>
        )}
      </div>

      {/* Payment State Card */}
      <div className={`glass-card p-5 flex flex-col items-center gap-3 border transition-all ${currentState.containerClass}`}>
        {currentState.icon}
        <p className="text-sm font-medium text-center">{currentState.text}</p>
      </div>

      {/* Tap to Pay Button */}
      {(paymentState === 'idle' || paymentState === 'declined') && (
        <button
          onClick={handleTapToPay}
          disabled={amountCents < 50}
          className="btn-glow w-full py-4 rounded-xl text-white font-semibold text-lg
                     flex items-center justify-center gap-3
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <CreditCard className="w-5 h-5" />
          Tap to Pay
        </button>
      )}

      {/* Numpad */}
      {paymentState === 'idle' && (
        <div className="grid grid-cols-3 gap-2">
          {NUMPAD.map(key => (
            <button
              key={key}
              onClick={() => handleNumpad(key)}
              className="glass-card py-4 rounded-xl font-display font-semibold text-xl
                         hover:bg-white/10 active:scale-95 transition-all duration-100
                         flex items-center justify-center"
            >
              {key}
            </button>
          ))}
        </div>
      )}

      {/* Powered by footer */}
      <p className="powered-by">
        Powered by <a href="https://swiftkds.com" target="_blank" rel="noopener noreferrer">SwiftKDS</a>,
        a Valdez & Co. product
      </p>
    </div>
  );
}
