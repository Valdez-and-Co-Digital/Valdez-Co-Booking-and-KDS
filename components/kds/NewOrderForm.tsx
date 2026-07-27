'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  X, Loader2, Plus, Minus, ShoppingCart, Settings,
  BookOpen, Clock, MoreHorizontal
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface NewOrderFormProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requireConfirmation?: boolean;
}

interface Service {
  id: string;
  name: string;
  price_cents: number;
  prep_time_minutes: number | null;
  category: string | null;
  image_url?: string | null;
}

interface CartItem {
  serviceId: string;
  name: string;
  priceCents: number;
  qty: number;
  prepTime: number;
}

type POSTab = 'menu' | 'cart' | 'history' | 'more';

export function NewOrderForm({ tenantId, isOpen, onClose, onSuccess, requireConfirmation = false }: NewOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [diningOption, setDiningOption] = useState<'dine_in' | 'take_out'>('take_out');

  const [services, setServices] = useState<Service[]>([]);
  const [isFetchingMenu, setIsFetchingMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [posTab, setPosTab] = useState<POSTab>('menu');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsFetchingMenu(true);
      supabase
        .from('services')
        .select('id, name, price_cents, prep_time_minutes, category, image_url')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('category')
        .then(({ data }) => {
          setServices(data || []);
          setIsFetchingMenu(false);
        });
    } else {
      setCart([]);
      setCustomerName('');
      setNotes('');
      setDiningOption('take_out');
      setActiveCategory('All');
      setPosTab('menu');
    }
  }, [isOpen, tenantId, supabase]);

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeCategory === 'All') return services;
    return services.filter(s => (s.category || 'General') === activeCategory);
  }, [services, activeCategory]);

  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(i => i.serviceId === service.id);
      if (existing) return prev.map(i => i.serviceId === service.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { serviceId: service.id, name: service.name, priceCents: service.price_cents, qty: 1, prepTime: service.prep_time_minutes || 5 }];
    });
  };

  const updateCartQty = (serviceId: string, delta: number) => {
    setCart(prev => prev.map(i => i.serviceId === serviceId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const addCustomItem = () => {
    if (!customName || !customPrice) return;
    const priceCents = Math.round(parseFloat(customPrice) * 100);
    if (isNaN(priceCents) || priceCents < 0) return;
    setCart(prev => [...prev, { serviceId: 'custom-' + Date.now(), name: customName, priceCents, qty: 1, prepTime: 5 }]);
    setCustomName('');
    setCustomPrice('');
  };

  const totalCents = cart.reduce((acc, i) => acc + i.priceCents * i.qty, 0);
  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    const cart_items = cart.map(i => ({
      service_id: i.serviceId,
      name: i.name,
      price_cents: i.priceCents,
      quantity: i.qty,
      prep_time_minutes: i.prepTime
    }));
    const { error } = await supabase.from('orders_appointments').insert({
      tenant_id: tenantId,
      customer_name: customerName || 'Walk-in Customer',
      customer_email: 'walkin@local',
      slot_start: new Date().toISOString(),
      cart_items,
      total_cents: totalCents,
      // If confirmation required, start as 'confirmed'; otherwise auto-start as 'in_progress'
      status: requireConfirmation ? 'confirmed' : 'in_progress',
      notes: notes || null,
      dining_option: diningOption,
    });
    setIsLoading(false);
    if (error) {
      alert(`Failed to create order: ${error.message}`);
    } else {
      onSuccess();
      onClose();
    }
  };

  const getQty = (serviceId: string) => cart.find(i => i.serviceId === serviceId)?.qty ?? 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed inset-0 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:inset-auto md:w-[95vw] md:max-w-5xl md:h-[85vh] md:rounded-2xl bg-zinc-950 border border-white/10 z-[60] shadow-2xl focus:outline-none flex flex-col overflow-hidden">

          {/* ── Top Bar ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-violet-400" />
              <Dialog.Title className="font-display font-bold text-lg">Point of Sale</Dialog.Title>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <Dialog.Close asChild>
                <button className="text-zinc-400 hover:text-white transition-colors md:block hidden">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* ── Desktop: two-pane layout / Mobile: single pane with tabs ── */}
          <div className="flex-1 flex overflow-hidden">

            {/* ── Menu pane (always visible on desktop, tab-controlled on mobile) ── */}
            <div className={`flex-1 flex flex-col overflow-hidden ${posTab !== 'menu' ? 'hidden md:flex' : 'flex'}`}>
              {/* Category chips */}
              <div className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar border-b border-white/5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                      activeCategory === cat
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Item grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {isFetchingMenu ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
                    <p className="text-sm">Loading menu…</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredServices.map(service => {
                      const qty = getQty(service.id);
                      return (
                        <div
                          key={service.id}
                          className={`relative aspect-[4/3] rounded-2xl overflow-hidden text-left transition-all border-2 ${
                            qty > 0 ? 'border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'border-transparent hover:border-white/10'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => addToCart(service)}
                            className="absolute inset-0 w-full h-full active:scale-95 transition-transform"
                          >
                            {/* Background */}
                            {service.image_url ? (
                              <img src={service.image_url} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                                <span className="text-3xl font-bold text-zinc-600">{service.name.charAt(0)}</span>
                              </div>
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Name + price */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="font-semibold text-white text-sm leading-tight">{service.name}</p>
                              <p className="text-zinc-300 text-xs mt-0.5">${(service.price_cents / 100).toFixed(2)}</p>
                            </div>
                          </button>

                          {/* Qty controls */}
                          {qty > 0 && (
                            <div className="absolute top-2 right-2 flex items-center bg-violet-600 text-white rounded-lg p-0.5 shadow-lg z-10">
                              <button
                                type="button"
                                onClick={() => updateCartQty(service.id, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-violet-700 active:bg-violet-800 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(service.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-violet-700 active:bg-violet-800 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom item card */}
                    <button
                      type="button"
                      onClick={() => setPosTab('more')}
                      className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all active:scale-95"
                    >
                      <Plus className="w-7 h-7" strokeWidth={1.5} />
                      <span className="text-xs font-bold uppercase tracking-wide">Custom Item</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Floating cart button — mobile only */}
              {totalItems > 0 && (
                <button
                  onClick={() => setPosTab('cart')}
                  className="md:hidden fixed bottom-20 right-4 z-10 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-full pl-3 pr-4 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.5)] transition-all active:scale-95"
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white text-violet-700 text-[9px] font-bold flex items-center justify-center">{totalItems}</span>
                  </div>
                  <span className="font-bold">${(totalCents / 100).toFixed(2)}</span>
                </button>
              )}
            </div>

            {/* ── Cart pane ──────────────────────────────────────── */}
            <div className={`md:w-[340px] lg:w-[380px] md:border-l border-white/10 flex flex-col ${posTab !== 'cart' ? 'hidden md:flex' : 'flex flex-1'}`}>
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                {/* Back to menu — mobile only */}
                <button
                  onClick={() => setPosTab('menu')}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                </button>
                <ShoppingCart className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold">Current Order</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm gap-2">
                    <ShoppingCart className="w-8 h-8 opacity-20" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.serviceId} className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500">${(item.priceCents / 100).toFixed(2)} ea</p>
                      </div>
                      <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => updateCartQty(item.serviceId, -1)} className="px-2.5 py-1.5 hover:bg-zinc-700 text-zinc-400 transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                        <button type="button" onClick={() => updateCartQty(item.serviceId, 1)} className="px-2.5 py-1.5 hover:bg-zinc-700 text-zinc-400 transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-sm font-mono text-violet-300 w-14 text-right">${(item.priceCents * item.qty / 100).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout form */}
              <div className="p-4 border-t border-white/10 space-y-3">
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer Name (Optional)"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600" />
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Kitchen Notes (e.g. No onions)"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600" />
                <div className="flex p-1 bg-zinc-900 border border-white/10 rounded-xl gap-1">
                  {(['take_out', 'dine_in'] as const).map(opt => (
                    <button key={opt} type="button" onClick={() => setDiningOption(opt)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${diningOption === opt ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>
                      {opt === 'take_out' ? 'Take-Out' : 'Dine-In'}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Total</span>
                  <span className="text-2xl font-bold text-emerald-400">${(totalCents / 100).toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || cart.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order →'}
                </button>
              </div>
            </div>

            {/* ── More tab (Custom Item + close) ─────────────────── */}
            <div className={`flex flex-col flex-1 overflow-y-auto p-4 space-y-4 ${posTab !== 'more' ? 'hidden md:hidden' : 'flex'}`}>
              <h3 className="font-semibold text-lg">Custom Item</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Item name" value={customName} onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600" />
                <input type="number" step="0.01" min="0" placeholder="Price (e.g. 12.00)" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600" />
                <button type="button" onClick={() => { addCustomItem(); setPosTab('menu'); }}
                  disabled={!customName || !customPrice}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                  Add to Cart
                </button>
                <button type="button" onClick={() => setPosTab('menu')} className="w-full text-sm text-zinc-500 hover:text-white py-2">
                  ← Back to Menu
                </button>
              </div>
            </div>
          </div>

          {/* ── Mobile Bottom Tab Bar ───────────────────────────── */}
          <div className="md:hidden flex-shrink-0 flex border-t border-white/10 bg-zinc-950">
            {([
              { id: 'menu',    icon: BookOpen,      label: 'Menu' },
              { id: 'cart',    icon: ShoppingCart,  label: 'Cart' },
              { id: 'history', icon: Clock,         label: 'History' },
              { id: 'more',    icon: MoreHorizontal, label: 'More' },
            ] as const).map(tab => {
              const Icon = tab.icon;
              const isActive = posTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'history') { onClose(); return; }
                    setPosTab(tab.id);
                  }}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className="text-[10px] font-semibold">{tab.label.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
