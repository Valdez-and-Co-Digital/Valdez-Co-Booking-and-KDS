'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, ExternalLink, MoreVertical, CreditCard, Loader2 } from 'lucide-react';
import type { Invoice, Client } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase/client';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [newClientId, setNewClientId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('tenant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (adminUser?.tenant_id) {
        setTenantId(adminUser.tenant_id);
        
        // Fetch clients for dropdown
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', adminUser.tenant_id)
          .order('name');
        if (clientsData) setClients(clientsData);

        // Fetch invoices with client info
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*, client:clients(name)')
          .eq('tenant_id', adminUser.tenant_id)
          .order('created_at', { ascending: false });
        if (invoicesData) setInvoices(invoicesData);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !newClientId) return;
    setSubmitting(true);
    
    // Create DB row as Draft
    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        client_id: newClientId,
        amount_cents: Math.round(parseFloat(newAmount) * 100),
        description: newDesc,
        status: 'draft',
        notes: isRecurring ? JSON.stringify({ is_recurring: true }) : null
      })
      .select('*, client:clients(name)')
      .single();
      
    if (newInvoice && !error) {
      setInvoices([newInvoice, ...invoices]);
      setIsAdding(false);
      setNewClientId(''); setNewAmount(''); setNewDesc(''); setIsRecurring(false);
    } else {
      console.error(error);
      alert('Failed to create invoice.');
    }
    setSubmitting(false);
  };

  const generateStripeLink = async (invoiceId: string) => {
    try {
      const res = await fetch('/api/invoices/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId })
      });
      const data = await res.json();
      if (data.url) {
        // Update local state to reflect open status
        setInvoices(invoices.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'open', stripe_payment_link_url: data.url } 
            : inv
        ));
        window.open(data.url, '_blank');
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (e) {
      alert('Error connecting to Stripe API.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Invoices & Billing</h1>
          <p className="text-sm text-zinc-400">Manage high-ticket payments and billing links.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn-glow px-4 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2">
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Create Invoice</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateInvoice} className="glass-card p-6 border-blue-500/30 animate-fade-in space-y-4">
          <h3 className="font-semibold text-lg text-white mb-2">New Invoice Draft</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Select Client</label>
              <select required value={newClientId} onChange={e => setNewClientId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">-- Choose Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
              <input required value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Website Design Retainer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Amount ($ USD)</label>
              <input required type="number" step="0.01" min="1" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="1500.00" />
            </div>
            <div className="md:col-span-3 flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="isRecurring" 
                checked={isRecurring} 
                onChange={e => setIsRecurring(e.target.checked)} 
                className="rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-zinc-300">Make this a recurring monthly subscription</label>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button disabled={submitting} type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Draft'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : invoices.length === 0 ? (
           <div className="p-12 text-center text-zinc-500">No invoices yet. Create your first draft above!</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                <th className="p-4 font-medium">Invoice ID</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 text-sm font-mono text-zinc-300">{invoice.id.split('-')[0]}...</td>
                  <td className="p-4 text-sm font-medium text-zinc-200">{invoice.client?.name || 'Unknown'}</td>
                  <td className="p-4 text-sm text-zinc-400">{invoice.description}</td>
                  <td className="p-4 text-sm font-mono text-zinc-200">${(invoice.amount_cents / 100).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`status-badge status-${invoice.status === 'open' ? 'in_progress' : invoice.status === 'paid' ? 'ready' : 'pending'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {invoice.status === 'draft' ? (
                        <button onClick={() => generateStripeLink(invoice.id)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition-colors flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          Generate Link
                        </button>
                      ) : invoice.status === 'open' ? (
                        <a href={invoice.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Copy Link
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
