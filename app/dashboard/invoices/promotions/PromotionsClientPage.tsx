'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { createCoupon, toggleCoupon } from '@/app/actions/billing';
import { Tag, Plus, X, ArrowLeft, RefreshCw, Clock, Infinity } from 'lucide-react';

interface Coupon {
  id: string;
  name: string;
  percent_off: number | null;
  amount_off_cents: number | null;
  duration: string;
  duration_in_months: number | null;
  active: boolean;
  created_at: string;
}

const DURATION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  once:       { label: 'One-Time',  icon: <Clock className="w-3 h-3" /> },
  repeating:  { label: 'Repeating', icon: <RefreshCw className="w-3 h-3" /> },
  forever:    { label: 'Forever',   icon: <Infinity className="w-3 h-3" /> },
};

export default function PromotionsClientPage({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [percentOff, setPercentOff] = useState('');
  const [amountOff, setAmountOff] = useState('');
  const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>('repeating');
  const [months, setMonths] = useState('3');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await createCoupon({
        name,
        percentOff: discountType === 'percent' ? parseInt(percentOff) : undefined,
        amountOffCents: discountType === 'amount' ? Math.round(parseFloat(amountOff) * 100) : undefined,
        duration,
        durationInMonths: duration === 'repeating' ? parseInt(months) : undefined,
      });
      setShowModal(false);
      setName(''); setPercentOff(''); setAmountOff('');
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to create promotion.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      await toggleCoupon(id, !currentActive);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !currentActive } : c));
    });
  };

  const formatDiscount = (c: Coupon) => {
    if (c.percent_off) return `${c.percent_off}% off`;
    if (c.amount_off_cents) return `$${(c.amount_off_cents / 100).toFixed(2)} off`;
    return '—';
  };

  const formatDuration = (c: Coupon) => {
    if (c.duration === 'repeating' && c.duration_in_months) return `for ${c.duration_in_months} month${c.duration_in_months > 1 ? 's' : ''}`;
    if (c.duration === 'once') return 'one-time';
    return 'forever';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices" className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Tag className="w-6 h-6 text-violet-400" />
              Promotions
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Create reusable discount templates for client invoices.</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {/* Quick Templates */}
      <div className="glass-card p-5 rounded-2xl border-white/5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">💡 Popular Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: '1 Month Free', desc: '100% off for 1 month', action: () => { setName('1 Month Free'); setDiscountType('percent'); setPercentOff('100'); setDuration('repeating'); setMonths('1'); setShowModal(true); }},
            { label: '50% Off 3 Months', desc: '50% off for 3 months', action: () => { setName('50% Off for 3 Months'); setDiscountType('percent'); setPercentOff('50'); setDuration('repeating'); setMonths('3'); setShowModal(true); }},
            { label: 'First Month $1', desc: '$1 for the first month', action: () => { setName('First Month $1'); setDiscountType('amount'); setAmountOff('98'); setDuration('once'); setShowModal(true); }},
          ].map(t => (
            <button key={t.label} onClick={t.action} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-left transition-all">
              <div className="font-semibold text-white text-sm mb-1">{t.label}</div>
              <div className="text-xs text-zinc-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Promotions List */}
      {coupons.length === 0 ? (
        <div className="glass-card p-16 rounded-2xl border-white/5 text-center">
          <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-zinc-300 font-semibold">No promotions yet</h3>
          <p className="text-zinc-500 text-sm mt-1">Create a promotion template to use when sending invoices.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map(c => {
            const dur = DURATION_LABELS[c.duration] ?? DURATION_LABELS.once;
            return (
              <div key={c.id} className={`glass-card p-5 rounded-2xl border flex flex-col gap-3 transition-all ${c.active ? 'border-violet-500/20' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      <span className="font-mono font-bold text-violet-300">{formatDiscount(c)}</span>{' '}
                      <span className="text-zinc-500">{formatDuration(c)}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${c.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/20 text-zinc-500 border-zinc-700/20'}`}>
                    {dur.icon} {dur.label}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-zinc-600">{new Date(c.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleToggle(c.id, c.active)}
                    disabled={isPending}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      c.active
                        ? 'bg-zinc-700/20 text-zinc-400 border-zinc-700/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Promotion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-white">New Promotion</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. 3 Months 50% Off" />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Discount Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setDiscountType('percent')}
                    className={`p-3 rounded-xl border text-left transition-all ${discountType === 'percent' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-black/20'}`}>
                    <div className="text-xs font-bold text-white">% Percent Off</div>
                    <div className="text-[10px] text-zinc-400">e.g. 50% off</div>
                  </button>
                  <button type="button" onClick={() => setDiscountType('amount')}
                    className={`p-3 rounded-xl border text-left transition-all ${discountType === 'amount' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-black/20'}`}>
                    <div className="text-xs font-bold text-white">$ Amount Off</div>
                    <div className="text-[10px] text-zinc-400">e.g. $50 off</div>
                  </button>
                </div>
              </div>

              {discountType === 'percent' ? (
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Percent Off *</label>
                  <div className="relative">
                    <input required type="number" min="1" max="100" value={percentOff} onChange={e => setPercentOff(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                      placeholder="50" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Amount Off *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input required type="number" min="0.01" step="0.01" value={amountOff} onChange={e => setAmountOff(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                      placeholder="50.00" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['once', 'repeating', 'forever'] as const).map(d => (
                    <button key={d} type="button" onClick={() => setDuration(d)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${duration === d ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-black/20'}`}>
                      <div className="text-xs font-bold text-white capitalize">{d}</div>
                    </button>
                  ))}
                </div>
              </div>

              {duration === 'repeating' && (
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Number of Months *</label>
                  <input required type="number" min="1" value={months} onChange={e => setMonths(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="3" />
                </div>
              )}

              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

              <button type="submit" disabled={creating}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Promotion'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
