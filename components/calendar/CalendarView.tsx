'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { format, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock, User, Phone, DollarSign } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { DaySchedule } from './DaySchedule';
import * as Dialog from '@radix-ui/react-dialog';
import 'react-day-picker/dist/style.css';

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  slot_start: string;
  slot_end: string;
  cart_items: any[];
  status: string;
  total_cents: number;
}

interface CalendarViewProps {
  tenantId: string;
  businessHours?: {
    start: number; // e.g., 9 for 9 AM
    end: number;   // e.g., 18 for 6 PM
  };
}

export function CalendarView({ tenantId, businessHours }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from('orders_appointments')
        .select('*')
        .gte('slot_start', start)
        .lte('slot_start', end)
        .order('slot_start', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
      } else {
        setAppointments(data as Appointment[]);
      }
      setIsLoading(false);
    };

    fetchAppointments();

    // Set up realtime subscription for this specific day
    const subscription = supabase
      .channel('calendar-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders_appointments',
        },
        (payload) => {
          // Simplest approach: refetch when any appointment changes.
          // Since it's a small dataset per day, refetching is fine and ensures data integrity.
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedDate, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'confirmed': return 'text-blue-400 bg-blue-400/10';
      case 'in_progress': return 'text-violet-400 bg-violet-400/10';
      case 'completed': return 'text-emerald-400 bg-emerald-400/10';
      case 'cancelled':
      case 'no_show':
        return 'text-red-400 bg-red-400/10';
      default: return 'text-zinc-400 bg-zinc-400/10';
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApt) return;
    
    // Optimistic update for snappy UI
    setSelectedApt({ ...selectedApt, status: newStatus });
    
    const { error } = await supabase
      .from('orders_appointments')
      .update({ status: newStatus })
      .eq('id', selectedApt.id);
      
    if (error) {
      console.error('Failed to update status:', error);
      // Let the realtime subscription fix the state if it fails
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full gap-6">
        {/* Sidebar / Mini Calendar */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="glass-card p-4 rounded-xl">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full"
              modifiersClassNames={{
                selected: 'bg-violet-500 text-white hover:bg-violet-600 rounded-lg',
                today: 'text-violet-400 font-bold',
              }}
              styles={{
                head_cell: { color: '#a1a1aa', fontWeight: 'normal', fontSize: '0.875rem' },
                cell: { padding: '0.25rem' },
                day: { borderRadius: '0.5rem', width: '2.25rem', height: '2.25rem' }
              }}
            />
          </div>
          
          <div className="glass-card p-4 rounded-xl flex-1">
            <h3 className="font-semibold text-sm mb-4 text-zinc-300 uppercase tracking-wider">At a Glance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Bookings</span>
                <span className="font-medium">{appointments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Pending</span>
                <span className="font-medium text-yellow-400">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Confirmed</span>
                <span className="font-medium text-emerald-400">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Schedule View */}
        <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col min-w-[300px]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-20">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-violet-400" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 text-sm hover:bg-white/5 rounded-lg transition-colors font-medium"
              >
                Today
              </button>
              <button 
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-zinc-400">
                Loading schedule...
              </div>
            ) : (
              <DaySchedule 
                appointments={appointments} 
                date={selectedDate}
                businessHours={businessHours || { start: 8, end: 19 }} // Default 8am to 7pm
                onAppointmentClick={(apt) => setSelectedApt(apt)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <Dialog.Root open={!!selectedApt} onOpenChange={(open) => !open && setSelectedApt(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 z-50 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            {selectedApt && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <Dialog.Title className="font-display text-xl font-bold">
                    Appointment Details
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${getStatusColor(selectedApt.status)}`}>
                      {selectedApt.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedApt.customer_name}</p>
                        <p className="text-zinc-400 text-xs">Client</p>
                      </div>
                    </div>
                    
                    {selectedApt.customer_phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-zinc-300">{selectedApt.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="bg-white/5 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-violet-400 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-white">
                        {format(parseISO(selectedApt.slot_start), 'EEEE, MMMM d')}
                      </p>
                      <p className="text-zinc-400 text-sm mt-0.5">
                        {format(parseISO(selectedApt.slot_start), 'h:mm a')} - {selectedApt.slot_end ? format(parseISO(selectedApt.slot_end), 'h:mm a') : 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Requested Services</h4>
                    <ul className="space-y-2">
                      {selectedApt.cart_items.map((item, i) => (
                        <li key={i} className="flex justify-between items-center text-sm bg-white/5 p-3 rounded-lg">
                          <span className="text-zinc-200 font-medium">{item.name}</span>
                          <span className="text-zinc-400">${(item.price_cents / 100).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center py-4 border-y border-white/10">
                    <span className="text-zinc-400 text-sm">Total</span>
                    <span className="text-xl font-bold flex items-center gap-1">
                      <DollarSign className="w-5 h-5 text-zinc-400" />
                      {(selectedApt.total_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {selectedApt.status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateStatus('confirmed')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                      >
                        Confirm Appointment
                      </button>
                    )}
                    {selectedApt.status === 'confirmed' && (
                      <button 
                        onClick={() => handleUpdateStatus('in_progress')}
                        className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                      >
                        Start Service
                      </button>
                    )}
                    {selectedApt.status === 'in_progress' && (
                      <button 
                        onClick={() => handleUpdateStatus('completed')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                      >
                        Complete Checkout
                      </button>
                    )}

                    {['pending', 'confirmed'].includes(selectedApt.status) && (
                      <button 
                        onClick={() => handleUpdateStatus('cancelled')}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
