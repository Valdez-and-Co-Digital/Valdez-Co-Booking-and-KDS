'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createServiceAction, deleteServiceAction, toggleServiceAction, updateServiceAction } from './actions';

export function ServiceList({ initialServices, isSalon }: { initialServices: any[], isSalon: boolean }) {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Using Next.js Server Actions automatically revalidates and refreshes the page component, 
  // but we'll show loading states during transitions.

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('isSalon', String(isSalon));

    const result = await createServiceAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setIsCreating(false);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('isSalon', String(isSalon));

    const result = await updateServiceAction(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    await deleteServiceAction(id);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleServiceAction(id, currentStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsCreating(true)}
          className="btn-glow flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {isCreating && (
        <div className="glass-card p-6 animate-fade-in border-violet-500/30">
          <h3 className="font-display font-semibold mb-4">Create New {isSalon ? 'Service' : 'Item'}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="text-red-400 text-sm p-2 bg-red-500/10 rounded">{error}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Name</label>
                <input name="name" required className="mt-1 block w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder={isSalon ? "Women's Haircut" : "Spicy Taco"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">Price (USD)</label>
                <input name="price" type="number" step="0.01" min="0" required className="mt-1 block w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="25.00" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Description</label>
              <textarea name="description" className="mt-1 block w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white h-20" placeholder="A brief description..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">{isSalon ? 'Duration (Minutes)' : 'Prep Time (Minutes)'}</label>
              <input name="timeValue" type="number" min="1" required className="mt-1 block w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder={isSalon ? "45" : "10"} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="btn-glow rounded-xl px-4 py-2 text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialServices.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
            No items found. Click "Add New" to get started!
          </div>
        )}
        
        {initialServices.map((service) => (
          editingId === service.id ? (
            <div key={service.id} className="glass-card p-5 animate-fade-in border-violet-500/30">
              <form onSubmit={(e) => handleUpdate(e, service.id)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Name</label>
                    <input name="name" required defaultValue={service.name} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Price (USD)</label>
                    <input name="price" type="number" step="0.01" min="0" required defaultValue={(service.price_cents / 100).toFixed(2)} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">Description</label>
                  <textarea name="description" defaultValue={service.description || ''} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white h-16" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">{isSalon ? 'Duration (Minutes)' : 'Prep Time (Minutes)'}</label>
                  <input name="timeValue" type="number" min="1" required defaultValue={isSalon ? service.duration_minutes : service.prep_time_minutes} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white" />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="btn-glow rounded-lg px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-2 disabled:opacity-50">
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save
                  </button>
                </div>
              </form>
            </div>
          ) : (
          <div key={service.id} className="glass-card p-5 space-y-4 relative group">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-display font-semibold text-lg">{service.name}</h4>
                <p className="text-violet-400 font-mono font-medium">${(service.price_cents / 100).toFixed(2)}</p>
              </div>
              <button 
                onClick={() => handleToggle(service.id, service.is_active)}
                className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 border transition-colors ${service.is_active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'}`}
              >
                {service.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {service.is_active ? 'Active' : 'Draft'}
              </button>
            </div>
            
            <p className="text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem]">{service.description || 'No description provided.'}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-zinc-500 font-medium">
                {isSalon ? `⏱️ ${service.duration_minutes} min` : `🍳 ${service.prep_time_minutes} min prep`}
              </span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingId(service.id)} className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          )
        ))}
      </div>
    </div>
  );
}
