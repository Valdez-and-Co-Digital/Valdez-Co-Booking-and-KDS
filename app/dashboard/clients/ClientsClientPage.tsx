'use client';

import { useState, useTransition } from 'react';
import { createClient, updateClientStatus, deleteClient } from '@/app/actions/billing';
import { DEFAULT_PRICES } from '@/app/actions/billing';
import { Users, Plus, X, Briefcase, Monitor, Layers, MoreVertical, Mail, Phone, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

const TIER_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  web_only: {
    label: 'Web Only',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: <Monitor className="w-3 h-3" />,
  },
  web_and_kds: {
    label: 'Web + KDS',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: <Layers className="w-3 h-3" />,
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  prospect: { label: 'Prospect', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  inactive: { label: 'Inactive', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: <XCircle className="w-3 h-3" /> },
};

interface Client {
  id: string;
  name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  service_tier: string;
  custom_price_cents: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function ClientsClientPage({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [form, setForm] = useState({
    name: '', business_name: '', email: '', phone: '',
    service_tier: 'web_only', custom_price: '', notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => {
      await createClient(fd);
      setShowAddModal(false);
      setForm({ name: '', business_name: '', email: '', phone: '', service_tier: 'web_only', custom_price: '', notes: '' });
      window.location.reload();
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      await updateClientStatus(id, status);
      setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      setActiveMenu(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
      setActiveMenu(null);
    });
  };

  const defaultPrice = (tier: string) =>
    `$${((DEFAULT_PRICES as any)[tier] / 100).toFixed(0)}/mo`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-400" />
            Clients
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your web clients and service tiers.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['prospect', 'active', 'inactive'] as const).map(s => (
          <div key={s} className="glass-card p-4 rounded-2xl border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">{STATUS_CONFIG[s].label}</span>
              {STATUS_CONFIG[s].icon}
            </div>
            <span className="text-3xl font-display font-bold text-white">
              {clients.filter(c => c.status === s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Client Cards */}
      {clients.length === 0 ? (
        <div className="glass-card p-16 rounded-2xl border-white/5 text-center">
          <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-zinc-300 font-semibold text-lg">No clients yet</h3>
          <p className="text-zinc-500 text-sm mt-1">Add your first client to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => {
            const tier = TIER_LABELS[client.service_tier] ?? TIER_LABELS.web_only;
            const status = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.prospect;
            const price = client.custom_price_cents
              ? `$${(client.custom_price_cents / 100).toFixed(0)}/mo`
              : defaultPrice(client.service_tier);

            return (
              <div key={client.id} className="glass-card p-5 rounded-2xl border-white/5 bg-[#131315]/60 flex flex-col gap-4 relative">
                {/* Menu button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenu === client.id && (
                    <div className="absolute right-0 top-8 z-20 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden w-44 text-sm">
                      <button onClick={() => handleStatusChange(client.id, 'active')} className="w-full px-4 py-2.5 text-left text-emerald-400 hover:bg-white/5">Mark Active</button>
                      <button onClick={() => handleStatusChange(client.id, 'prospect')} className="w-full px-4 py-2.5 text-left text-amber-400 hover:bg-white/5">Mark Prospect</button>
                      <button onClick={() => handleStatusChange(client.id, 'inactive')} className="w-full px-4 py-2.5 text-left text-zinc-400 hover:bg-white/5">Mark Inactive</button>
                      <div className="border-t border-white/5" />
                      <button onClick={() => handleDelete(client.id)} className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-white/5 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 pr-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/20 border border-violet-500/20 flex items-center justify-center font-display font-bold text-violet-300 text-sm flex-shrink-0">
                    {(client.business_name || client.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{client.business_name || client.name}</h3>
                    <p className="text-xs text-zinc-500 truncate">{client.name}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${tier.color}`}>
                    {tier.icon} {tier.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      {client.phone}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-zinc-500">Monthly Rate</span>
                  <span className="font-mono font-bold text-white">{price}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl border-white/10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-white">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Contact Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Business Name</label>
                  <input value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="Acme Co." />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="jane@acme.com" />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="+1 (555) 000-0000" />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Service Tier *</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(TIER_LABELS).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({...form, service_tier: key})}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.service_tier === key
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {t.icon}
                        <span className="text-xs font-bold text-white">{t.label}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">Default: {defaultPrice(key)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Custom Monthly Price (leave blank for default)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input type="number" min="0" step="0.01" value={form.custom_price} onChange={e => setForm({...form, custom_price: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder={`${((DEFAULT_PRICES as any)[form.service_tier] / 100).toFixed(0)}`} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Internal Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Anything relevant about this client..." />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Add Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
