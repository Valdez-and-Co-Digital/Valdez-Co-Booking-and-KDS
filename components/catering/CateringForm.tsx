'use client';

import { useState, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  MapPin, ChevronRight, Loader2, CheckCircle2,
  ArrowLeft, Plus, Minus, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Service = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string | null;
  duration_minutes: number | null;
  prep_time_minutes: number | null;
};

type CartEntry = { service: Service; qty: number };

const DIETARY_THEMES = [
  'Standard Gourmet',
  'Vegan / Plant-Based',
  'Gluten-Free Focus',
  'Mediterranean',
  'BBQ & American',
  'Asian Fusion',
];

export function CateringForm({
  tenantId,
  services,
}: {
  tenantId: string;
  services: Service[];
}) {
  const supabase = createBrowserClient();
  const router = useRouter();

  // Group services by category
  const categories = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const cat = s.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [services]);

  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());
  const [activeCategory, setActiveCategory] = useState<string>(
    categories.keys().next().value ?? ''
  );

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState(50);
  const [dietaryTheme, setDietaryTheme] = useState(DIETARY_THEMES[0]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustQty = (service: Service, delta: number) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(service.id);
      const newQty = (existing?.qty ?? 0) + delta;
      if (newQty <= 0) {
        next.delete(service.id);
      } else {
        next.set(service.id, { service, qty: newQty });
      }
      return next;
    });
  };

  const cartItems = Array.from(cart.values());
  const estimatedTotal = cartItems.reduce(
    (sum, { service, qty }) => sum + (service.price_cents / 100) * qty,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Please select at least one service.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const slotStart = eventDate ? new Date(eventDate).toISOString() : new Date().toISOString();

      await supabase.from('orders_appointments').insert({
        tenant_id: tenantId,
        customer_name: contactName || 'Catering Client',
        customer_phone: contactPhone || null,
        status: 'confirmed',
        slot_start: slotStart,
        slot_end: slotStart,
        total_cents: Math.round(estimatedTotal * 100),
        ordered_at: new Date().toISOString(),
        notes: `[CATERING] Guests: ${guestCount} | Dietary: ${dietaryTheme} | Address: ${address} | Notes: ${notes}`,
        cart_items: cartItems.map(({ service, qty }) => ({
          id: service.id,
          name: service.name,
          price_cents: service.price_cents,
          quantity: qty,
        })),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5 px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="font-display text-2xl font-bold">Booking Confirmed!</h2>
        <p className="text-zinc-400 text-sm">
          Your catering request has been submitted and will appear on the KDS board as a confirmed order.
        </p>
        <div className="glass-card p-4 rounded-xl text-left space-y-2 text-sm">
          {cartItems.map(({ service, qty }) => (
            <div key={service.id} className="flex justify-between">
              <span className="text-zinc-400">{service.name} ×{qty}</span>
              <span>${((service.price_cents / 100) * qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/5 pt-2 mt-2 font-bold">
            <span className="text-zinc-400">Estimated Total</span>
            <span className="text-white">${estimatedTotal.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-glow text-white px-6 py-3 rounded-xl font-semibold w-full">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Empty state: no services configured ──────────────────────────
  if (services.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4 px-4">
        <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="font-display text-xl font-bold">No Catering Services Yet</h2>
        <p className="text-zinc-400 text-sm">
          Add your catering packages in the Menu Manager first. Create items under any category — they'll appear here as selectable services.
        </p>
        <Link href="/dashboard/services" className="btn-glow text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
          Go to Menu Manager
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const allCategoryNames = Array.from(categories.keys());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <h1 className="font-display text-2xl font-bold">Book Catering Appointment</h1>
        </div>
        <p className="text-sm text-zinc-400 ml-9">Select services and provide event details to confirm a booking.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Service Selection */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-violet-400">Select Services</h2>

              {/* Category tabs */}
              {allCategoryNames.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {allCategoryNames.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        activeCategory === cat
                          ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                          : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Service cards */}
              <div className="space-y-2.5">
                {(categories.get(activeCategory) ?? []).map(service => {
                  const entry = cart.get(service.id);
                  const qty = entry?.qty ?? 0;
                  return (
                    <div
                      key={service.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        qty > 0
                          ? 'bg-violet-600/10 border-violet-500/40'
                          : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.06]'
                      }`}
                    >
                      {/* Letter avatar */}
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 font-bold text-lg leading-none">
                          {service.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-zinc-500 mt-0.5 truncate">{service.description}</p>
                        )}
                        <p className="text-violet-300 text-xs font-mono mt-1">
                          ${(service.price_cents / 100).toFixed(2)}
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {qty > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => adjustQty(service, -1)}
                              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-bold text-sm">{qty}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => adjustQty(service, 1)}
                          className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center hover:bg-violet-600/40 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-violet-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Details */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-violet-400">Event Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Contact Name</label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Contact Phone</label>
                  <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Event Date</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Guest Count</label>
                  <input type="number" min={1} value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Dietary Theme</label>
                  <select value={dietaryTheme} onChange={e => setDietaryTheme(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                    {DIETARY_THEMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2 text-violet-400">
                <MapPin className="w-4 h-4" /> Logistics &amp; Delivery
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Delivery Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Enterprise Plaza, Suite 500"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Special Instructions</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Access codes, allergen warnings, setup preferences..." rows={3}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 glass-card p-6 rounded-2xl space-y-5">
              <div>
                <h2 className="font-display font-semibold text-lg">Booking Summary</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Review before confirming</p>
              </div>

              {cartItems.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center border border-dashed border-white/10 rounded-xl">
                  No services selected yet.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {cartItems.map(({ service, qty }) => (
                    <div key={service.id} className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-300 truncate pr-2">{service.name} ×{qty}</span>
                      <span className="font-mono flex-shrink-0">${((service.price_cents / 100) * qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t-2 border-violet-500/20 pt-4">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Estimated Total</p>
                    <p className="text-3xl font-bold text-violet-300 leading-none">
                      ${estimatedTotal.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">Excl. taxes</span>
                </div>

                {error && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="w-full py-3.5 btn-glow text-white rounded-xl font-semibold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Confirm Booking
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-zinc-600 mt-3">
                  By confirming, you agree to our{' '}
                  <a href="#" className="underline hover:text-violet-400 transition-colors">Service Agreement</a>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
