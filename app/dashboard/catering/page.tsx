'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Star, Briefcase, Heart, Truck, Users2, MapPin,
  ChevronRight, Loader2, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type ServiceTier = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  basePrice: number;
  perGuestRate: number;
  badge?: string;
};

const TIERS: ServiceTier[] = [
  {
    id: 'corporate',
    icon: Briefcase,
    title: 'Corporate Event',
    description: 'High-efficiency meal service for meetings and conferences.',
    basePrice: 450,
    perGuestRate: 4.5,
    badge: 'Most Popular',
  },
  {
    id: 'private_party',
    icon: Users2,
    title: 'Private Party',
    description: 'Intimate gatherings with personalized chef-curated menus.',
    basePrice: 299,
    perGuestRate: 3.5,
  },
  {
    id: 'wedding',
    icon: Heart,
    title: 'Wedding Gala',
    description: 'Exquisite multi-course service for your most special day.',
    basePrice: 2500,
    perGuestRate: 12,
  },
  {
    id: 'express',
    icon: Truck,
    title: 'Express Drop-off',
    description: 'Rapid gourmet delivery for casual office lunches.',
    basePrice: 150,
    perGuestRate: 2,
  },
];

const DIETARY_THEMES = [
  'Standard Gourmet',
  'Vegan / Plant-Based',
  'Gluten-Free Focus',
  'Mediterranean',
  'BBQ & American',
  'Asian Fusion',
];

export default function CateringPage() {
  const supabase = createBrowserClient();
  const router = useRouter();

  const [selectedTier, setSelectedTier] = useState<ServiceTier>(TIERS[0]);
  const [guestCount, setGuestCount] = useState(50);
  const [eventDate, setEventDate] = useState('');
  const [dietaryTheme, setDietaryTheme] = useState(DIETARY_THEMES[0]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestSurcharge = selectedTier.perGuestRate * Math.max(0, guestCount - 10);
  const estimatedTotal = selectedTier.basePrice + guestSurcharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('tenant_id')
        .eq('user_id', session.user.id)
        .single();

      if (!adminUser) throw new Error('Tenant not found');

      const slotStart = eventDate ? new Date(eventDate).toISOString() : new Date().toISOString();

      await supabase.from('orders_appointments').insert({
        tenant_id: adminUser.tenant_id,
        customer_name: contactName || 'Catering Client',
        customer_phone: contactPhone || null,
        status: 'confirmed',
        slot_start: slotStart,
        slot_end: slotStart,
        total_cents: Math.round(estimatedTotal * 100),
        ordered_at: new Date().toISOString(),
        notes: `[CATERING - ${selectedTier.title}] Guests: ${guestCount} | Dietary: ${dietaryTheme} | Address: ${address} | Notes: ${notes}`,
        cart_items: [
          {
            id: selectedTier.id,
            name: `Catering: ${selectedTier.title}`,
            price_cents: Math.round(selectedTier.basePrice * 100),
            quantity: 1,
          },
        ],
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5 px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="font-display text-2xl font-bold">Booking Confirmed!</h2>
        <p className="text-zinc-400 text-sm">
          Your catering request for <strong className="text-violet-300">{selectedTier.title}</strong> has been submitted. It will appear on your KDS board as a confirmed order.
        </p>
        <div className="glass-card p-4 rounded-xl text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-400">Service Tier</span><span className="text-violet-300 font-medium">{selectedTier.title}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Event Date</span><span>{eventDate || 'TBD'}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Guest Count</span><span>{guestCount}</span></div>
          <div className="flex justify-between border-t border-white/5 pt-2 mt-2"><span className="text-zinc-400">Estimated Total</span><span className="font-bold text-white">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-glow text-white px-6 py-3 rounded-xl font-semibold w-full"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

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
        <p className="text-sm text-zinc-400 ml-9">Design a bespoke culinary experience for your next event.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Tier Selection */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2 text-violet-400">
                <Star className="w-4 h-4" /> Choose Catering Service
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIERS.map(tier => {
                  const Icon = tier.icon;
                  const active = selectedTier.id === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`relative p-4 rounded-xl text-left flex flex-col gap-3 transition-all border ${
                        active
                          ? 'bg-violet-600/10 border-violet-500/40 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                          : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.06]'
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
                          {tier.badge}
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                        <Icon className={`w-5 h-5 ${active ? 'text-violet-400' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tier.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{tier.description}</p>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Starting from <strong className={active ? 'text-violet-300' : 'text-white'}>${tier.basePrice.toLocaleString()}</strong>
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Details */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2 text-violet-400">
                <Users2 className="w-4 h-4" /> Event Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Contact Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    value={guestCount}
                    onChange={e => setGuestCount(parseInt(e.target.value) || 0)}
                    placeholder="50"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Dietary Theme</label>
                  <select
                    value={dietaryTheme}
                    onChange={e => setDietaryTheme(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  >
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
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Enterprise Plaza, Suite 500"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Special Instructions</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Access codes, allergen warnings, setup preferences..."
                    rows={3}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: Summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 glass-card p-6 rounded-2xl space-y-5">
              <div>
                <h2 className="font-display font-semibold text-lg">Booking Summary</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Review before confirming</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Service Tier</span>
                  <span className="font-medium text-violet-300">{selectedTier.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Base Rate</span>
                  <span className="font-mono">${selectedTier.basePrice.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Guest Surcharge ({guestCount} guests)</span>
                  <span className="font-mono">${guestSurcharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Delivery Fee</span>
                  <span className="font-mono text-emerald-400">FREE</span>
                </div>
              </div>

              <div className="border-t-2 border-violet-500/20 pt-4">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Estimated Total</p>
                    <p className="text-3xl font-bold text-violet-300 leading-none">
                      ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400">Excl. taxes</span>
                </div>

                {error && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 btn-glow text-white rounded-xl font-semibold flex items-center justify-center gap-2 group disabled:opacity-60"
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

              {/* Premium Guarantee */}
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-zinc-500">
                  <span className="text-white font-medium">Premium Guarantee:</span> 100% on-time setup or your delivery is free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
