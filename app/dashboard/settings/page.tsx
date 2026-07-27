'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Settings, Save, Loader2, Clock, CheckSquare } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createBrowserClient();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [warningMins, setWarningMins] = useState(15);
  const [overdueMins, setOverdueMins] = useState(30);
  const [enableReservations, setEnableReservations] = useState(false);
  const [enableCatering, setEnableCatering] = useState(false);
  const [requireOrderConfirmation, setRequireOrderConfirmation] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from('admin_users')
        .select('tenants(*)')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          const t = data?.tenants as any;
          if (t) {
            setTenant(t);
            setWarningMins(t.settings?.kds_warning_mins ?? 15);
            setOverdueMins(t.settings?.kds_overdue_mins ?? 30);
            setEnableReservations(!!t.settings?.enable_reservations);
            setEnableCatering(!!t.settings?.enable_catering);
            setRequireOrderConfirmation(!!t.settings?.require_order_confirmation);
          }
          setLoading(false);
        });
    });
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);

    const newSettings = {
      ...tenant.settings,
      kds_warning_mins: warningMins,
      kds_overdue_mins: overdueMins,
      enable_reservations: enableReservations,
      enable_catering: enableCatering,
      require_order_confirmation: requireOrderConfirmation,
    };

    const { error } = await supabase
      .from('tenants')
      .update({ settings: newSettings })
      .eq('id', tenant.id);

    setSaving(false);
    if (error) {
      alert('Failed to save settings: ' + error.message);
    } else {
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between glass-card p-5">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-400" />
            Business Settings
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your operational preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {tenant?.settings?.is_foodtruck && (
          <div className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Kitchen Display (KDS) Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Warning Time (minutes)</label>
                <input
                  type="number" min="1" required value={warningMins}
                  onChange={(e) => setWarningMins(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-1 focus:ring-violet-500 outline-none"
                />
                <p className="text-xs text-zinc-500">Tickets turn yellow after this time.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Overdue Time (minutes)</label>
                <input
                  type="number" min="1" required value={overdueMins}
                  onChange={(e) => setOverdueMins(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-1 focus:ring-violet-500 outline-none"
                />
                <p className="text-xs text-zinc-500">Tickets turn red after this time.</p>
              </div>
            </div>

            {/* Restaurant Features */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Restaurant Features
              </h2>

              {/* Reservations Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={enableReservations}
                    onChange={(e) => setEnableReservations(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${enableReservations ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enableReservations ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm">Enable Reservations Calendar</div>
                  <div className="text-xs text-zinc-500">Show the reservations tab in your sidebar.</div>
                </div>
              </label>

              {/* Catering Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={enableCatering}
                    onChange={(e) => setEnableCatering(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${enableCatering ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enableCatering ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm">Enable Catering Bookings</div>
                  <div className="text-xs text-zinc-500">Show the catering booking page in your sidebar. Clients can book corporate events, private parties, and more.</div>
                </div>
              </label>

              {/* Require Order Confirmation Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={requireOrderConfirmation}
                    onChange={(e) => setRequireOrderConfirmation(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${requireOrderConfirmation ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${requireOrderConfirmation ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm">Require Order Confirmation</div>
                  <div className="text-xs text-zinc-500">New orders will go to a "Pending" tab on the KDS and must be accepted manually before starting.</div>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
