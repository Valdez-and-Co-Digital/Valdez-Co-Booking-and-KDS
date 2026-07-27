'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { X, Loader2, Plus, Minus } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface NewOrderFormProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewOrderForm({ tenantId, isOpen, onClose, onSuccess }: NewOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();
  
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [diningOption, setDiningOption] = useState<'dine_in' | 'take_out'>('take_out');
  
  // Very simplified point-of-sale for manual entry
  const [items, setItems] = useState([{ name: 'Custom Item', price: '10.00', qty: 1 }]);

  const addItem = () => setItems([...items, { name: '', price: '0.00', qty: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validItems = items.filter(i => i.name.trim() !== '' && i.qty > 0);
    
    // Calculate total
    let totalCents = 0;
    const cart_items = validItems.map(item => {
      const priceCents = Math.round(parseFloat(item.price) * 100);
      totalCents += (priceCents * item.qty);
      return {
        name: item.name,
        price_cents: priceCents,
        quantity: item.qty,
        prep_time_minutes: 5 // Default prep time
      };
    });

    const { error } = await supabase
      .from('orders_appointments')
      .insert({
        tenant_id: tenantId,
        customer_name: customerName || 'Walk-in Customer',
        cart_items,
        total_cents: totalCents,
        status: 'confirmed', // Starts as confirmed/new order
        notes: notes || null,
        dining_option: diningOption
      });

    setIsLoading(false);

    if (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order');
    } else {
      // Clean up form
      setCustomerName('');
      setNotes('');
      setDiningOption('take_out');
      setItems([{ name: 'Custom Item', price: '10.00', qty: 1 }]);
      onSuccess();
      onClose();
    }
  };

  const totalDisplay = items.reduce((acc, item) => {
    return acc + (parseFloat(item.price || '0') * item.qty);
  }, 0);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 z-50 shadow-2xl focus:outline-none">
          <div className="flex justify-between items-start mb-6">
            <Dialog.Title className="font-display text-xl font-bold">
              New POS Order
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Customer Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Walk-in Customer"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Dining Option</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input 
                      type="radio" 
                      value="take_out"
                      checked={diningOption === 'take_out'}
                      onChange={() => setDiningOption('take_out')}
                      className="text-violet-500 focus:ring-violet-500 bg-black/40 border-white/10"
                    />
                    Take-Out
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input 
                      type="radio" 
                      value="dine_in"
                      checked={diningOption === 'dine_in'}
                      onChange={() => setDiningOption('dine_in')}
                      className="text-violet-500 focus:ring-violet-500 bg-black/40 border-white/10"
                    />
                    Dine-In
                  </label>
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-zinc-300 mb-2 block">Order Items</label>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Item Name"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                      />
                      <input
                        type="number"
                        required min="0" step="0.01"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                        className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                      />
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => updateItem(index, 'qty', Math.max(1, item.qty - 1))} className="px-2 py-2 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                        <span className="w-6 text-center text-sm">{item.qty}</span>
                        <button type="button" onClick={() => updateItem(index, 'qty', item.qty + 1)} className="px-2 py-2 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-3 text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Kitchen Notes</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="e.g. No cilantro"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Total Amount</span>
              <span className="text-2xl font-bold font-display">${totalDisplay.toFixed(2)}</span>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || items.length === 0}
              className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send to Kitchen'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
