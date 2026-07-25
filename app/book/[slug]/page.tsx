'use client';

import { useState } from 'react';
import { useCartStore, useCartTotalFormatted, useCartTotalDuration, useCartMaxPrepTime, useCartItemCount } from '@/lib/store/cart';
import { Clock, ShoppingBag, Check, Zap, ArrowRight, Sparkles } from 'lucide-react';

const MOCK_SERVICES = {
  salon: [
    { id: 's1', name: "Women's Haircut", price_cents: 6500, duration_minutes: 60, category: 'Hair' },
    { id: 's2', name: "Men's Haircut", price_cents: 3500, duration_minutes: 30, category: 'Hair' },
    { id: 's3', name: "Full Color Treatment", price_cents: 12000, duration_minutes: 120, category: 'Color' },
    { id: 's4', name: "Highlights", price_cents: 9500, duration_minutes: 90, category: 'Color' },
    { id: 's5', name: "Blowout & Styling", price_cents: 4500, duration_minutes: 45, category: 'Styling' },
  ],
  foodtruck: [
    { id: 'f1', name: "Birria Tacos (3)", price_cents: 1299, prep_time_minutes: 8, category: 'Tacos' },
    { id: 'f2', name: "Al Pastor Tacos (3)", price_cents: 1099, prep_time_minutes: 5, category: 'Tacos' },
    { id: 'f3', name: "Quesabirria Special", price_cents: 1499, prep_time_minutes: 10, category: 'Specialties' },
    { id: 'f4', name: "Loaded Nachos", price_cents: 1099, prep_time_minutes: 7, category: 'Sides' },
    { id: 'f5', name: "Fresh Horchata (L)", price_cents: 499, prep_time_minutes: 1, category: 'Drinks' },
  ],
};

export default function PublicBookingWidgetPage() {
  const [businessType, setBusinessType] = useState<'salon' | 'foodtruck'>('salon');
  const items = useCartStore(s => s.items);
  const addItem = useCartStore(s => s.addItem);
  const removeItem = useCartStore(s => s.removeItem);

  const totalFormatted = useCartTotalFormatted();
  const totalDuration = useCartTotalDuration();
  const maxPrepTime = useCartMaxPrepTime();
  const itemCount = useCartItemCount();

  const services = MOCK_SERVICES[businessType];

  return (
    <div className="min-h-screen bg-mesh p-4 md:p-8 max-w-4xl mx-auto pb-32">
      {/* Business Header */}
      <div className="glass-card p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {businessType === 'salon' ? '✂️ Time-Based Salon' : '🚚 Volume-Based Food Truck'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold">
            {businessType === 'salon' ? 'Glamour Studio' : 'Tacos El Rey'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {businessType === 'salon'
              ? 'Select multiple services. Sequential time stacking applies.'
              : 'Order delicious food. Parallel prep time applies with slot throttling.'}
          </p>
        </div>

        {/* Mode Switcher for Demo */}
        <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setBusinessType('salon')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              businessType === 'salon' ? 'bg-violet-600 text-white' : 'text-zinc-400'
            }`}
          >
            Salon Mode
          </button>
          <button
            onClick={() => setBusinessType('foodtruck')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              businessType === 'foodtruck' ? 'bg-violet-600 text-white' : 'text-zinc-400'
            }`}
          >
            Food Truck Mode
          </button>
        </div>
      </div>

      {/* Service Selection Cards Grid */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Select Services / Items
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const inCart = items.some(i => i.service_id === service.id);
            return (
              <div
                key={service.id}
                onClick={() => {
                  if (inCart) {
                    removeItem(service.id);
                  } else {
                    addItem({
                      service_id: service.id,
                      name: service.name,
                      price_cents: service.price_cents,
                      duration_minutes: service.duration_minutes ?? 0,
                      prep_time_minutes: service.prep_time_minutes ?? 0,
                    });
                  }
                }}
                className={`service-card ${inCart ? 'selected' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {service.category}
                    </span>
                    <h3 className="font-display font-semibold text-base text-zinc-100">{service.name}</h3>
                  </div>
                  <span className="font-mono font-bold text-violet-300">
                    ${(service.price_cents / 100).toFixed(2)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {businessType === 'salon'
                      ? `${service.duration_minutes} min duration`
                      : `${service.prep_time_minutes} min prep`}
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    inCart
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}>
                    {inCart ? <><Check className="w-3 h-3" /> Added</> : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Smart Cart Summary Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto glass-card p-4 border-violet-500/40 shadow-2xl shadow-violet-950/80 animate-slide-up flex items-center justify-between gap-4 z-50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white">{totalFormatted}</span>
              <span className="text-xs text-zinc-400 font-mono">({itemCount} items)</span>
            </div>
            <p className="text-xs text-violet-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {businessType === 'salon'
                ? `Sequential Slot Needed: ${totalDuration} mins`
                : `Max Parallel Prep Time: ${maxPrepTime} mins`}
            </p>
          </div>

          <button
            onClick={() => alert(`Proceeding to checkout for ${totalFormatted}`)}
            className="btn-glow px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2"
          >
            Continue to Slot <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
