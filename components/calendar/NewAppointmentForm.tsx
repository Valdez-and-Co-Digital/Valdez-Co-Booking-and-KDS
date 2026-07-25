'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { CalendarIcon, X, Loader2, Repeat, Clock } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { addWeeks, parseISO, format, setHours, setMinutes, startOfDay } from 'date-fns';

interface NewAppointmentFormProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
}

export function NewAppointmentForm({ 
  tenantId, 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedDate = new Date(),
  initialCustomerName = '',
  initialCustomerPhone = ''
}: NewAppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();
  
  const [formData, setFormData] = useState({
    customer_name: initialCustomerName,
    customer_phone: initialCustomerPhone,
    dateStr: format(selectedDate, 'yyyy-MM-dd'),
    timeStr: '10:00',
    durationMins: '60',
    serviceName: 'Haircut & Styling',
    price: '50.00',
    isRecurring: false,
    recurrenceWeeks: '4'
  });

  // Keep form data synced when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        customer_name: initialCustomerName || prev.customer_name,
        customer_phone: initialCustomerPhone || prev.customer_phone,
        dateStr: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [isOpen, initialCustomerName, initialCustomerPhone, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const [hours, minutes] = formData.timeStr.split(':').map(Number);
    const parsedDate = parseISO(formData.dateStr);
    const baseDate = startOfDay(isNaN(parsedDate.getTime()) ? selectedDate : parsedDate);
    const slotStart = setMinutes(setHours(baseDate, hours), minutes);
    const slotEnd = new Date(slotStart.getTime() + parseInt(formData.durationMins) * 60000);
    const priceCents = Math.round(parseFloat(formData.price) * 100);

    const baseAppointment = {
      tenant_id: tenantId,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      cart_items: [{ name: formData.serviceName, price_cents: priceCents }],
      total_cents: priceCents,
      status: 'confirmed',
      slot_start: slotStart.toISOString(),
      slot_end: slotEnd.toISOString()
    };

    const appointmentsToInsert = [baseAppointment];

    if (formData.isRecurring) {
      const weeksCount = parseInt(formData.recurrenceWeeks) || 1;
      for (let i = 1; i < weeksCount; i++) {
        const nextStart = addWeeks(slotStart, i);
        const nextEnd = addWeeks(slotEnd, i);
        appointmentsToInsert.push({
          ...baseAppointment,
          slot_start: nextStart.toISOString(),
          slot_end: nextEnd.toISOString()
        });
      }
    }

    const { error } = await supabase
      .from('orders_appointments')
      .insert(appointmentsToInsert);

    setIsLoading(false);

    if (error) {
      console.error('Failed to create appointment:', error);
      alert('Failed to create appointment');
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 z-50 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-start mb-6">
            <Dialog.Title className="font-display text-xl font-bold">
              New Appointment
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Customer Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  value={formData.customer_phone}
                  onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Appointment Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.dateStr}
                  onChange={e => setFormData({...formData, dateStr: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Time</label>
                <input 
                  type="time" 
                  required
                  value={formData.timeStr}
                  onChange={e => setFormData({...formData, timeStr: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Duration (mins)</label>
                <input 
                  type="number" 
                  required min="5" step="5"
                  value={formData.durationMins}
                  onChange={e => setFormData({...formData, durationMins: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Service Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.serviceName}
                  onChange={e => setFormData({...formData, serviceName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-zinc-300">Price ($)</label>
                <input 
                  type="number" 
                  required min="0" step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${formData.isRecurring ? 'bg-violet-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                />
                <span className="text-zinc-300 font-medium flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Make this a recurring appointment
                </span>
              </label>

              {formData.isRecurring && (
                <div className="mt-4 bg-white/5 p-4 rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <span className="text-sm text-zinc-400">Repeat weekly for</span>
                  <input 
                    type="number" 
                    min="2" max="52"
                    value={formData.recurrenceWeeks}
                    onChange={(e) => setFormData({...formData, recurrenceWeeks: e.target.value})}
                    className="w-20 bg-black/50 border border-white/10 rounded p-1.5 text-center text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                  <span className="text-sm text-zinc-400">weeks</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-6 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Appointment'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
