'use client';

import { useState, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { createServiceAction, deleteServiceAction, toggleServiceAction, updateServiceAction } from './actions';

export function ServiceList({ initialServices, isSalon }: { initialServices: any[], isSalon: boolean }) {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique categories
  const allCategories = useMemo(() => {
    const cats = new Set(initialServices.map(s => s.category || 'General'));
    return Array.from(cats).sort();
  }, [initialServices]);

  const [activeCategory, setActiveCategory] = useState<string>(allCategories[0] || 'General');

  // Filter items by search OR category
  const filteredServices = useMemo(() => {
    if (searchTerm.trim()) {
      return initialServices.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || 'General').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return initialServices.filter(s => (s.category || 'General') === activeCategory);
  }, [initialServices, activeCategory, searchTerm]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('isSalon', String(isSalon));
    const result = await createServiceAction(formData);
    if (result?.error) setError(result.error);
    else setIsCreating(false);
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('isSalon', String(isSalon));
    const result = await updateServiceAction(id, formData);
    if (result?.error) setError(result.error);
    else setEditingId(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await deleteServiceAction(id);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleServiceAction(id, currentStatus);
  };

  const inputCls = 'w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none';
  const labelCls = 'block text-xs font-medium text-zinc-400 mb-1';

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {/* Category pills + Add button — hidden when searching */}
      {!searchTerm && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar flex-1">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex-shrink-0 flex items-center gap-1 text-violet-400 text-xs font-semibold hover:text-violet-300 transition-colors"
          >
            <span className="text-lg leading-none">+</span> ADD
          </button>
        </div>
      )}

      {/* Section label */}
      <div className="flex items-center justify-between text-zinc-500">
        <p className="text-[10px] font-semibold uppercase tracking-widest">
          {searchTerm ? `Results (${filteredServices.length})` : `${activeCategory} (${filteredServices.length} items)`}
        </p>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white/5 rounded-xl p-4 border border-violet-500/30">
          <h3 className="text-sm font-semibold mb-3">New {isSalon ? 'Service' : 'Item'}</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            {error && <div className="text-red-400 text-xs p-2 bg-red-500/10 rounded">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Name</label><input name="name" required className={inputCls} placeholder={isSalon ? "Women's Cut" : "Spicy Taco"} /></div>
              <div><label className={labelCls}>Price (USD)</label><input name="price" type="number" step="0.01" min="0" required className={inputCls} placeholder="25.00" /></div>
              <div><label className={labelCls}>Category</label><input name="category" required defaultValue={activeCategory} className={inputCls} /></div>
              <div><label className={labelCls}>{isSalon ? 'Duration (min)' : 'Prep time (min)'}</label><input name="timeValue" type="number" min="1" required className={inputCls} placeholder="10" /></div>
            </div>
            <div><label className={labelCls}>Description</label><textarea name="description" className={`${inputCls} h-14 resize-none`} /></div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsCreating(false)} className="text-sm text-zinc-400 px-3 py-1.5">Cancel</button>
              <button type="submit" disabled={loading} className="bg-violet-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item List */}
      <div className="space-y-2.5">
        {filteredServices.length === 0 && !isCreating && (
          <div className="text-center py-10 text-zinc-600 border border-dashed border-white/10 rounded-xl text-sm">
            {searchTerm ? 'No items match your search.' : 'No items in this category. Tap + ADD to start.'}
          </div>
        )}

        {filteredServices.map(service =>
          editingId === service.id ? (
            // Edit form
            <div key={service.id} className="bg-white/5 rounded-xl p-4 border border-violet-500/30">
              <form onSubmit={(e) => handleUpdate(e, service.id)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name</label><input name="name" required defaultValue={service.name} className={inputCls} /></div>
                  <div><label className={labelCls}>Price (USD)</label><input name="price" type="number" step="0.01" min="0" required defaultValue={(service.price_cents / 100).toFixed(2)} className={inputCls} /></div>
                  <div><label className={labelCls}>Category</label><input name="category" required defaultValue={service.category || 'General'} className={inputCls} /></div>
                  <div><label className={labelCls}>{isSalon ? 'Duration (min)' : 'Prep time (min)'}</label><input name="timeValue" type="number" min="1" required defaultValue={isSalon ? service.duration_minutes : service.prep_time_minutes} className={inputCls} /></div>
                </div>
                <div><label className={labelCls}>Description</label><textarea name="description" defaultValue={service.description || ''} className={`${inputCls} h-14 resize-none`} /></div>
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={() => handleDelete(service.id)} className="text-red-400 text-xs font-medium">Delete</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="text-sm text-zinc-400 px-3 py-1.5">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-violet-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            // Item card — no image
            <div key={service.id} className="bg-white/[0.04] border border-white/8 rounded-xl p-3.5 flex items-center gap-3">
              {/* Category dot / icon */}
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-400 text-lg font-bold leading-none">{service.name.charAt(0).toUpperCase()}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{service.name}</p>
                <p className="text-violet-300 text-xs font-mono mt-0.5">${(service.price_cents / 100).toFixed(2)}</p>
              </div>

              {/* Stock toggle + Edit */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="flex flex-col items-center gap-0.5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={service.is_active}
                      onChange={() => handleToggle(service.id, service.is_active)}
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${service.is_active ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${service.is_active ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-zinc-400'}`} />
                    </div>
                  </label>
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${service.is_active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {service.is_active ? 'In Stock' : 'Out'}
                  </span>
                </div>

                <button
                  onClick={() => setEditingId(service.id)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
