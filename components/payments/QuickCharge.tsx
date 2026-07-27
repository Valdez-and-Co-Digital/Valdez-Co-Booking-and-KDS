'use client';

import { useState, useCallback, useMemo } from 'react';
import { CreditCard, Smartphone, CheckCircle2, XCircle, Loader2, DollarSign, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import type { CartItem, Service } from '@/types/database';

type PaymentState = 'idle' | 'collecting' | 'processing' | 'success' | 'declined';

const HAPTIC_PATTERNS = {
  tap:      [0, 30],
  success:  [0, 100, 50, 100],
  declined: [0, 200, 100, 200, 100, 200],
};

function haptic(pattern: number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export function QuickCharge({ tenantId, initialServices = [] }: { tenantId: string, initialServices?: Service[] }) {
  // Tabs: 'menu' | 'custom'
  const [activeTab, setActiveTab] = useState<'menu' | 'custom'>('menu');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Custom amount state
  const [customAmountStr, setCustomAmountStr] = useState('0');
  
  // Payment state
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(initialServices.map(s => s.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [initialServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (activeCategory === 'All') return initialServices;
    return initialServices.filter(s => (s.category || 'General') === activeCategory);
  }, [initialServices, activeCategory]);

  // Cart math
  const cartTotalCents = useMemo(() => cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0), [cart]);

  // Numpad handler for custom item
  const handleNumpad = useCallback((key: string) => {
    haptic(HAPTIC_PATTERNS.tap);
    if (key === '⌫') {
      setCustomAmountStr(s => s.length <= 1 ? '0' : s.slice(0, -1));
      return;
    }
    if (key === '.' && customAmountStr.includes('.')) return;
    const decimalIdx = customAmountStr.indexOf('.');
    if (decimalIdx !== -1 && customAmountStr.length - decimalIdx > 2) return;
    setCustomAmountStr(s => s === '0' && key !== '.' ? key : s + key);
  }, [customAmountStr]);

  const addCustomItem = () => {
    const cents = Math.round(parseFloat(customAmountStr || '0') * 100);
    if (cents <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.service_id === 'custom' && i.price_cents === cents);
      if (existing) {
        return prev.map(i => i.service_id === 'custom' && i.price_cents === cents 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
        );
      }
      return [...prev, {
        service_id: 'custom',
        name: 'Custom Amount',
        price_cents: cents,
        quantity: 1
      }];
    });
    setCustomAmountStr('0');
    haptic(HAPTIC_PATTERNS.success);
  };

  const addToCart = (service: Service) => {
    haptic(HAPTIC_PATTERNS.tap);
    setCart(prev => {
      const existing = prev.find(i => i.service_id === service.id);
      if (existing) {
        return prev.map(i => i.service_id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        service_id: service.id,
        name: service.name,
        price_cents: service.price_cents,
        duration_minutes: service.duration_minutes || undefined,
        prep_time_minutes: service.prep_time_minutes || undefined,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (service_id: string, price_cents: number, delta: number) => {
    haptic(HAPTIC_PATTERNS.tap);
    setCart(prev => {
      return prev.map(i => {
        if (i.service_id === service_id && i.price_cents === price_cents) {
          return { ...i, quantity: i.quantity + delta };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const handleTapToPay = async () => {
    if (cartTotalCents < 50) {
      setErrorMsg('Minimum order amount is $0.50');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    
    setErrorMsg('');
    setPaymentState('collecting');

    try {
      const tokenRes = await fetch('/api/stripe/connection-token', { method: 'POST' });
      await tokenRes.json();

      setPaymentState('processing');
      const piRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          cartItems: cart,
          customerEmail: 'walk-in@swiftkds.com',
          customerName: 'Walk-in Customer',
        }),
      });
      
      const resData = await piRes.json();
      if (!piRes.ok) throw new Error(resData.error || 'Payment failed');

      // Simulating Stripe Terminal Tap Success
      await new Promise(r => setTimeout(r, 1500));
      setPaymentState('success');
      haptic(HAPTIC_PATTERNS.success);

      setTimeout(() => {
        setPaymentState('idle');
        setCart([]);
      }, 3000);

    } catch (err: any) {
      setPaymentState('declined');
      setErrorMsg(err.message ?? 'Payment failed');
      haptic(HAPTIC_PATTERNS.declined);
      setTimeout(() => setPaymentState('idle'), 3000);
    }
  };

  if (paymentState !== 'idle') {
    const stateConfig = {
      collecting: { containerClass: 'border-violet-700', icon: <CreditCard className="w-12 h-12 text-violet-400" />, text: 'Hold card near reader…' },
      processing: { containerClass: 'border-blue-700', icon: <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />, text: 'Processing payment…' },
      success: { containerClass: 'border-emerald-700', icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" />, text: `Payment of ${formatAmount(cartTotalCents)} complete!` },
      declined: { containerClass: 'border-red-700', icon: <XCircle className="w-12 h-12 text-red-400" />, text: errorMsg || 'Payment declined' },
    } as any;
    
    const currentState = stateConfig[paymentState];
    
    return (
      <div className="max-w-md mx-auto py-20 px-4 flex flex-col gap-6 items-center justify-center animate-fade-in">
        <div className={`glass-card p-12 flex flex-col items-center gap-6 border-2 transition-all w-full ${currentState.containerClass}`}>
          {currentState.icon}
          <p className="text-xl font-medium text-center">{currentState.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Left side: Menu / Custom Input */}
      <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden h-full">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 w-fit">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'menu' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Menu Pre-sets
          </button>
          <button 
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'custom' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Custom Amount
          </button>
        </div>

        {activeTab === 'menu' ? (
          <div className="flex flex-col gap-4 overflow-hidden h-full">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar flex-shrink-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                    activeCategory === cat 
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' 
                      : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pb-6">
              {filteredServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => addToCart(service)}
                  className="glass-card p-4 text-left hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group active:scale-95 flex flex-col justify-between h-32"
                >
                  <div>
                    <h3 className="font-semibold text-white line-clamp-2 leading-tight">{service.name}</h3>
                    {service.prep_time_minutes && (
                      <span className="text-[10px] text-zinc-500 mt-1 block">Prep: {service.prep_time_minutes}m</span>
                    )}
                  </div>
                  <div className="flex justify-between items-end w-full mt-2">
                    <span className="text-violet-300 font-medium">{formatAmount(service.price_cents)}</span>
                    <Plus className="w-5 h-5 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </button>
              ))}
              {filteredServices.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500">
                  No items in this category.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="max-w-sm w-full">
              <div className="text-center mb-8">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-semibold">Custom Item</p>
                <div className="font-display text-6xl font-bold gradient-text tracking-tight">
                  ${customAmountStr}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {NUMPAD.map(key => (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key)}
                    className="glass-card py-5 rounded-2xl font-display font-semibold text-2xl
                               hover:bg-white/10 active:scale-95 transition-all duration-100
                               flex items-center justify-center border-white/5"
                  >
                    {key}
                  </button>
                ))}
              </div>
              
              <button
                onClick={addCustomItem}
                disabled={parseFloat(customAmountStr || '0') <= 0}
                className="btn-glow w-full py-4 rounded-xl text-white font-semibold text-lg
                           flex items-center justify-center gap-2
                           disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Plus className="w-5 h-5" />
                Add to Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Cart */}
      <div className="glass-card flex flex-col h-full border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-400" />
            Current Order
          </h2>
          <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full text-xs font-semibold">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Your order is empty</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.service_id}-${item.price_cents}-${idx}`} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="flex-1 pr-3">
                  <p className="font-medium text-sm text-white line-clamp-1">{item.name}</p>
                  <p className="text-violet-400 text-xs mt-0.5">{formatAmount(item.price_cents)}</p>
                </div>
                <div className="flex items-center gap-3 bg-black/60 rounded-lg p-1 border border-white/5">
                  <button onClick={() => updateQuantity(item.service_id, item.price_cents, -1)} className="p-1 hover:text-white text-zinc-400 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.service_id, item.price_cents, 1)} className="p-1 hover:text-white text-zinc-400 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-white/10">
          {errorMsg && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {errorMsg}
            </div>
          )}
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-zinc-400">Total</span>
            <span className="font-display font-bold text-2xl text-white">{formatAmount(cartTotalCents)}</span>
          </div>
          
          <button
            onClick={handleTapToPay}
            disabled={cartTotalCents === 0}
            className="w-full btn-glow py-4 rounded-xl text-white font-semibold text-lg
                       flex items-center justify-center gap-3
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <CreditCard className="w-5 h-5" />
            Pay & Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
