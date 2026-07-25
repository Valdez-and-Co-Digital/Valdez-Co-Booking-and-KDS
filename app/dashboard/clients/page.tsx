'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Plus, MoreVertical, Building2, Mail, Phone, Loader2 } from 'lucide-react';
import type { Client } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase/client';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadClients() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('tenant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (adminUser?.tenant_id) {
        setTenantId(adminUser.tenant_id);
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', adminUser.tenant_id)
          .order('created_at', { ascending: false });
          
        if (clientsData) setClients(clientsData);
      }
      setLoading(false);
    }
    loadClients();
  }, [supabase]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSubmitting(true);
    
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenantId,
        name: newName,
        email: newEmail,
        phone: newPhone,
        company_name: newCompany
      })
      .select()
      .single();
      
    if (newClient && !error) {
      setClients([newClient, ...clients]);
      setIsAdding(false);
      setNewName(''); setNewEmail(''); setNewPhone(''); setNewCompany('');
    } else {
      console.error(error);
      alert('Failed to add client.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Client CRM</h1>
          <p className="text-sm text-zinc-400">Manage your agency clients and contact info.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn-glow px-4 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2">
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Client</>}
        </button>
      </div>
      
      {isAdding && (
        <form onSubmit={handleAddClient} className="glass-card p-6 border-violet-500/30 animate-fade-in space-y-4">
          <h3 className="font-semibold text-lg text-white mb-2">New Client Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
              <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Company</label>
              <input value={newCompany} onChange={e => setNewCompany(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="512-555-0199" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button disabled={submitting} type="submit" className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Client'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search clients..." className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50" />
          </div>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">No clients found. Click "Add Client" to create one.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {clients.map(client => (
              <div key={client.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-violet-300 font-display font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-200">{client.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {client.company_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {client.company_name}</span>}
                      {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>}
                      {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>}
                    </div>
                  </div>
                </div>
                <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/5"><MoreVertical className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
