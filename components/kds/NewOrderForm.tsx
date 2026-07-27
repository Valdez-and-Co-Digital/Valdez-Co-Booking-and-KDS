'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { X, Loader2, Plus, Minus, ShoppingCart, Coffee } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface NewOrderFormProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Service {
  id: string;
  name: string;
  price_cents: number;
  prep_time_minutes: number | null;
  category: string | null;
}

interface CartItem {
  serviceId: string;
  name: string;
  priceCents: number;
  qty: number;
  prepTime: number;
}

export function NewOrderForm({ tenantId, isOpen, onClose, onSuccess }: NewOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();
  
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [diningOption, setDiningOption] = useState<'dine_in' | 'take_out'>('take_out');
  
  const [services, setServices] = useState<Service[]>([]);
  const [isFetchingMenu, setIsFetchingMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsFetchingMenu(true);
      supabase
        .from('services')
        .select('id, name, price_cents, prep_time_minutes, category')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('category')
        .then(({ data }) => {
          setServices(data || []);
          setIsFetchingMenu(false);
        });
    } else {
      // Reset state when closed
      setCart([]);
      setCustomerName('');
      setNotes('');
      setDiningOption('take_out');
      setActiveCategory('All');
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
      const existing = prev.find(item => item.serviceId === service.id);
      if (existing) {
        return prev.map(item => 
          item.serviceId === service.id 
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        serviceId: service.id,
        name: service.name,
        priceCents: service.price_cents,
        qty: 1,
        prepTime: service.prep_time_minutes || 5
      }];
    });
  };

  const updateCartQty = (serviceId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.serviceId === serviceId) {
          const newQty = item.qty + delta;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const addCustomItem = () => {
    if (!customName || !customPrice) return;
    const priceCents = Math.round(parseFloat(customPrice) * 100);
    if (isNaN(priceCents) || priceCents < 0) return;

    setCart(prev => [...prev, {
      serviceId: 'custom-' + Date.now(),
      name: customName,
      priceCents,
      qty: 1,
      prepTime: 5
    }]);

    setCustomName('');
    setCustomPrice('');
  };

  const totalCents = cart.reduce((acc, item) => acc + (item.priceCents * item.qty), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsLoading(true);

    const cart_items = cart.map(item => ({
      service_id: item.serviceId,
      name: item.name,
      price_cents: item.priceCents,
      quantity: item.qty,
      prep_time_minutes: item.prepTime
    }));

    const { error } = await supabase
      .from('orders_appointments')
      .insert({
        tenant_id: tenantId,
        customer_name: customerName || 'Walk-in Customer',
        cart_items,
        total_cents: totalCents,
        status: 'confirmed',
        notes: notes || null,
        dining_option: diningOption
      });

    setIsLoading(false);

    if (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order');
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl h-[85vh] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl focus:outline-none flex flex-col">
          
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/[0.02]">
            <Dialog.Title className="font-display text-xl font-bold flex items-center gap-2">
              <Coffee className="w-5 h-5 text-violet-400" />
              Point of Sale
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-zinc-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane: Menu Items */}
            <div className="flex-1 flex flex-col border-r border-white/10 bg-zinc-950/50">
              
              {/* Category Tabs */}
              <div className="p-4 border-b border-white/5 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                      activeCategory === cat 
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' 
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {isFetchingMenu ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                    <p>Loading menu...</p>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <p>No items found in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredServices.map(service => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => addToCart(service)}
                        className="glass-card p-4 text-left hover:bg-white/[0.04] transition-colors border-white/5 group active:scale-[0.98]"
                      >
                        <h4 className="font-semibold text-sm text-zinc-200 group-hover:text-white mb-1 line-clamp-2">
                          {service.name}
                        </h4>
                        <p className="text-violet-400 font-mono text-sm">
                          ${(service.price_cents / 100).toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Item Footer */}
              <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom Item Name"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomItem}
                    disabled={!customName || !customPrice}
                    className="p-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Pane: Cart & Checkout */}
            <div className="w-[350px] lg:w-[400px] flex flex-col bg-zinc-900/50">
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-zinc-400" />
                  Current Order
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm">
                    <ShoppingCart className="w-8 h-8 mb-3 opacity-20" />
                    <p>Cart is empty</p>
                    <p className="text-xs mt-1">Select items from the menu</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.serviceId} className="flex flex-col bg-black/40 border border-white/5 rounded-xl p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                        <span className="text-sm text-violet-300 font-mono">${(item.priceCents * item.qty / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">${(item.priceCents / 100).toFixed(2)} ea</span>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                          <button type="button" onClick={() => updateCartQty(item.serviceId, -1)} className="px-2.5 py-1.5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                          <button type="button" onClick={() => updateCartQty(item.serviceId, 1)} className="px-2.5 py-1.5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-black/20 space-y-4">
                <div className="space-y-1">
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none placeholder:text-zinc-600"
                    placeholder="Customer Name (Optional)"
                  />
                </div>
                
                <div className="space-y-1">
                  <input 
                    type="text" 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none placeholder:text-zinc-600"
                    placeholder="Kitchen Notes (e.g. No onions)"
                  />
                </div>

                <div className="flex p-1 bg-black/40 border border-white/10 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDiningOption('take_out')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${diningOption === 'take_out' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >Take-Out</button>
                  <button
                    type="button"
                    onClick={() => setDiningOption('dine_in')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${diningOption === 'dine_in' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >Dine-In</button>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <span className="text-zinc-400 text-sm">Total</span>
                  <span className="text-3xl font-bold font-display text-emerald-400">${(totalCents / 100).toFixed(2)}</span>
                </div>

                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || cart.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
