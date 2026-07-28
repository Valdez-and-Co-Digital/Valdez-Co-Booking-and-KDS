'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { markCashPaid, voidInvoice, sendInvoice } from '@/app/actions/billing';
import {
  FileText, Plus, CheckCircle, Clock, AlertCircle, XCircle,
  Download, ExternalLink, DollarSign, RefreshCw, Banknote, X
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:        { label: 'Draft',        color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',    icon: <FileText className="w-3 h-3" /> },
  sent:         { label: 'Sent',         color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: <Clock className="w-3 h-3" /> },
  paid:         { label: 'Paid',         color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  overdue:      { label: 'Overdue',      color: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: <AlertCircle className="w-3 h-3" /> },
  void:         { label: 'Void',         color: 'bg-zinc-700/20 text-zinc-500 border-zinc-700/20',    icon: <XCircle className="w-3 h-3" /> },
  cash_pending: { label: 'Cash Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Banknote className="w-3 h-3" /> },
};

interface Invoice {
  id: string;
  amount_cents: number;
  description: string;
  status: string;
  is_recurring: boolean;
  payment_type: string;
  stripe_invoice_url: string | null;
  stripe_invoice_pdf: string | null;
  paid_at: string | null;
  created_at: string;
  client: { name: string; business_name: string | null; email: string } | null;
}

interface Client {
  id: string;
  name: string;
  business_name: string | null;
  email: string;
  service_tier: string;
  custom_price_cents: number | null;
}

export default function InvoicesClientPage({
  initialInvoices,
  clients,
}: {
  initialInvoices: Invoice[];
  clients: Client[];
  defaultPrices: { web_only: number; web_and_kds: number; platform_fee: number };
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New invoice form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [description, setDescription] = useState('');
  const [amountDollars, setAmountDollars] = useState('');
  const [paymentType, setPaymentType] = useState<'stripe' | 'cash'>('stripe');
  const [isRecurring, setIsRecurring] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Auto-fill amount when client is selected
  const handleClientSelect = (id: string) => {
    const client = clients.find(c => c.id === id);
    setSelectedClientId(id);
    if (client) {
      const price = client.custom_price_cents ?? (defaultPrices as any)[client.service_tier] ?? 9900;
      setAmountDollars((price / 100).toFixed(2));
      setDescription(client.service_tier === 'web_and_kds' ? 'Web + KDS Platform — Monthly Service' : 'Web Platform — Monthly Service');
    }
  };

  const handleSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    setSending(true);
    try {
      await sendInvoice({
        clientId: selectedClientId,
        amountCents: Math.round(parseFloat(amountDollars) * 100),
        description,
        paymentType,
        isRecurring,
      });
      setShowNewModal(false);
      setSelectedClientId(''); setDescription(''); setAmountDollars('');
      window.location.reload();
    } catch (err: any) {
      setSendError(err.message || 'Failed to send invoice.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkCashPaid = (id: string) => {
    startTransition(async () => {
      await markCashPaid(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid', paid_at: new Date().toISOString() } : inv));
    });
  };

  const handleVoid = (id: string) => {
    if (!confirm('Void this invoice? This cannot be undone.')) return;
    startTransition(async () => {
      await voidInvoice(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'void' } : inv));
    });
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_cents, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_cents, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            Invoices
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Send, track, and manage client invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices/promotions" className="hidden md:flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-xl font-medium text-sm transition-colors">
            🎟 Promotions
          </Link>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Total Paid</p>
          <p className="text-2xl font-display font-bold text-emerald-400">${(totalPaid / 100).toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Outstanding</p>
          <p className="text-2xl font-display font-bold text-amber-400">${(totalOutstanding / 100).toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Total Invoices</p>
          <p className="text-2xl font-display font-bold text-white">{invoices.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Overdue</p>
          <p className="text-2xl font-display font-bold text-red-400">{invoices.filter(i => i.status === 'overdue').length}</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-16 text-center">
            <DollarSign className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-zinc-300 font-semibold text-lg">No invoices yet</h3>
            <p className="text-zinc-500 text-sm mt-1">Create your first invoice to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">Client</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map(inv => {
                    const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                    const clientName = inv.client?.business_name || inv.client?.name || 'Unknown';
                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-200">{clientName}</div>
                          <div className="text-xs text-zinc-500">{inv.client?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 max-w-[200px] truncate">{inv.description}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            inv.is_recurring ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}>
                            {inv.is_recurring ? <><RefreshCw className="w-2.5 h-2.5" /> Recurring</> : 'One-Time'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-white">
                          ${(inv.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.stripe_invoice_url && (
                              <a href={inv.stripe_invoice_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {inv.stripe_invoice_pdf && inv.status === 'paid' && (
                              <a href={inv.stripe_invoice_pdf} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {inv.status === 'cash_pending' && (
                              <button onClick={() => handleMarkCashPaid(inv.id)} disabled={isPending} className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-colors">
                                Mark Paid
                              </button>
                            )}
                            {(inv.status === 'sent' || inv.status === 'draft') && (
                              <button onClick={() => handleVoid(inv.id)} disabled={isPending} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-colors">
                                Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-white/5">
              {invoices.map(inv => {
                const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                const clientName = inv.client?.business_name || inv.client?.name || 'Unknown';
                return (
                  <div key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-white">{clientName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{inv.description}</div>
                      </div>
                      <span className="font-mono font-bold text-white">${(inv.amount_cents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {inv.stripe_invoice_url && (
                          <a href={inv.stripe_invoice_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-violet-400 rounded-lg">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {inv.stripe_invoice_pdf && inv.status === 'paid' && (
                          <a href={inv.stripe_invoice_pdf} target="_blank" rel="noopener noreferrer" className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {inv.status === 'cash_pending' && (
                          <button onClick={() => handleMarkCashPaid(inv.id)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* New Invoice Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl border-white/10 p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-white">New Invoice</h2>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSendInvoice} className="space-y-4">
              {/* Client Select */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Client *</label>
                <select required value={selectedClientId} onChange={e => handleClientSelect(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500">
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name || c.name} — {c.email}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Description *</label>
                <input required value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="Web Platform — Monthly Service" />
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Amount (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input required type="number" min="1" step="0.01" value={amountDollars} onChange={e => setAmountDollars(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="99.00" />
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPaymentType('stripe')}
                    className={`p-3 rounded-xl border text-left transition-all ${paymentType === 'stripe' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
                    <div className="text-xs font-bold text-white mb-1">💳 Stripe</div>
                    <div className="text-[10px] text-zinc-400">Card, Apple Pay, Google Pay</div>
                  </button>
                  <button type="button" onClick={() => setPaymentType('cash')}
                    className={`p-3 rounded-xl border text-left transition-all ${paymentType === 'cash' ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
                    <div className="text-xs font-bold text-white mb-1">💵 Cash</div>
                    <div className="text-[10px] text-zinc-400">Mark paid manually</div>
                  </button>
                </div>
              </div>

              {/* Recurring Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="sr-only" />
                  <div className={`w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Recurring Monthly</div>
                  <div className="text-xs text-zinc-500">Stripe will auto-bill this client every month</div>
                </div>
              </label>

              {sendError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{sendError}</p>}

              <button type="submit" disabled={sending}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? 'Sending...' : paymentType === 'cash' ? '💵 Create Cash Invoice' : '📤 Send Invoice via Stripe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
