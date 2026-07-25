'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Plus, MoreVertical, Building2, Mail, Phone, Loader2, Calendar } from 'lucide-react';
import type { Client } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { NewAppointmentForm } from '@/components/calendar/NewAppointmentForm';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [alsoBookAppointment, setAlsoBookAppointment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Appointment booking modal state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingClient, setBookingClient] = useState<{ name: string; phone: string } | null>(null);

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
      
      const savedName = newName;
      const savedPhone = newPhone;

      setNewName(''); setNewEmail(''); setNewPhone(''); setNewCompany('');

      if (alsoBookAppointment) {
        setBookingClient({ name: savedName, phone: savedPhone });
        setIsAppointmentModalOpen(true);
        setAlsoBookAppointment(false);
      }
    } else {
      console.error(error);
      alert('Failed to add client.');
    }
    setSubmitting(false);
  };

  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Client Log & CRM</h1>
          <p className="text-sm text-zinc-400">Manage client profiles and book appointments directly.</p>
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
            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input 
                type="checkbox"
                id="alsoBook"
                checked={alsoBookAppointment}
                onChange={e => setAlsoBookAppointment(e.target.checked)}
                className="rounded border-white/10 bg-black/40 text-violet-500 focus:ring-violet-500"
              />
              <label htmlFor="alsoBook" className="text-sm font-medium text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                <Calendar className="w-4 h-4 text-violet-400" />
                Also book an appointment for this client right after saving
              </label>
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
        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, email, phone..." 
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50" 
            />
          </div>
          <span className="text-xs text-zinc-500">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'} found
          </span>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">No clients found matching your search.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredClients.map(client => (
              <div key={client.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-violet-300 font-display font-bold flex-shrink-0">
                    {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-200">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-500">
                      {client.company_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-zinc-400" /> {client.company_name}</span>}
                      {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-400" /> {client.email}</span>}
                      {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-zinc-400" /> {client.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setBookingClient({ name: client.name, phone: client.phone || '' });
                      setIsAppointmentModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book Appointment
                  </button>
                  <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/5">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tenantId && (
        <NewAppointmentForm
          tenantId={tenantId}
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setBookingClient(null);
          }}
          onSuccess={() => {
            // Success notification
          }}
          initialCustomerName={bookingClient?.name || ''}
          initialCustomerPhone={bookingClient?.phone || ''}
        />
      )}
    </div>
  );
}
