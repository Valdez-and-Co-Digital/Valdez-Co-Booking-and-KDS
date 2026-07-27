'use client';

import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { createServiceAction, deleteServiceAction, toggleServiceAction, updateServiceAction } from './actions';

export function ServiceList({ initialServices, isSalon }: { initialServices: any[], isSalon: boolean }) {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(initialServices.map(s => s.category || 'General'));
    return Array.from(cats).sort();
  }, [initialServices]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || 'General');

  const filteredServices = useMemo(() => {
    return initialServices.filter(s => (s.category || 'General') === activeCategory);
  }, [initialServices, activeCategory]);

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
      {/* Action Row & Category Tabs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">Categories</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="text-primary font-label-caps text-label-caps flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">add</span> ADD ITEM
          </button>
        </div>

        {/* Horizontal Scroll Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x hide-scrollbar">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`snap-start flex-shrink-0 px-6 py-2.5 rounded-full font-label-caps text-label-caps transition-all ${
                  isActive 
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-primary/30'
                    : 'bg-white/5 backdrop-blur-md text-on-surface-variant border border-white/10 hover:bg-white/10'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            )
          })}
        </div>
      </section>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
          <h3 className="font-headline-sm text-headline-sm mb-4">Create New {isSalon ? 'Service' : 'Item'}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="text-red-400 text-sm p-2 bg-red-500/10 rounded">{error}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Name</label>
                <input name="name" required className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" placeholder={isSalon ? "Women's Haircut" : "Spicy Taco"} />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Price (USD)</label>
                <input name="price" type="number" step="0.01" min="0" required className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" placeholder="25.00" />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Category</label>
                <input name="category" required defaultValue={activeCategory} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" placeholder={isSalon ? "Hair" : "Mains"} />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">{isSalon ? 'Duration (Min)' : 'Prep Time (Min)'}</label>
                <input name="timeValue" type="number" min="1" required className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" placeholder={isSalon ? "45" : "10"} />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Description</label>
              <textarea name="description" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none h-16" placeholder="A brief description..." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-on-surface-variant font-medium">Cancel</button>
              <button type="submit" disabled={loading} className="bg-primary-container text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu List View */}
      <section className="space-y-4">
        <div className="flex items-center justify-between opacity-60">
          <p className="font-label-caps text-label-caps tracking-widest uppercase">{activeCategory} ({filteredServices.length} Items)</p>
          <span className="material-symbols-outlined text-lg">sort</span>
        </div>

        {initialServices.length === 0 && !isCreating && (
          <div className="text-center py-12 text-on-surface-variant border border-dashed border-white/10 rounded-xl">
            No items found. Tap ADD ITEM to start.
          </div>
        )}

        <div className="space-y-3">
          {filteredServices.map(service => (
            editingId === service.id ? (
              // EDIT FORM
              <div key={service.id} className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-primary/30">
                <form onSubmit={(e) => handleUpdate(e, service.id)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Name</label>
                      <input name="name" required defaultValue={service.name} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Price (USD)</label>
                      <input name="price" type="number" step="0.01" min="0" required defaultValue={(service.price_cents / 100).toFixed(2)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Category</label>
                      <input name="category" required defaultValue={service.category || 'General'} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-label-caps text-on-surface-variant mb-1">{isSalon ? 'Duration (Min)' : 'Prep Time (Min)'}</label>
                      <input name="timeValue" type="number" min="1" required defaultValue={isSalon ? service.duration_minutes : service.prep_time_minutes} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Description</label>
                    <textarea name="description" defaultValue={service.description || ''} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none h-16" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={() => handleDelete(service.id)} className="text-error font-label-caps text-xs">DELETE</button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-on-surface-variant">Cancel</button>
                      <button type="submit" disabled={loading} className="bg-primary-container text-white rounded-lg px-4 py-1.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              // ITEM CARD
              <div key={service.id} className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex gap-4 items-center border border-white/10 transition-transform active:scale-[0.98]">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-surface-container-highest">
                  {/* Fallback image if no image URL in db */}
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" alt={service.name} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-grow flex flex-col justify-between h-24 py-1">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm leading-tight text-on-surface truncate pr-2">{service.name}</h3>
                    <p className="text-primary font-mono-data text-mono-data mt-1">${(service.price_cents / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between pr-2">
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only toggle-checkbox" 
                          checked={service.is_active}
                          onChange={(e) => handleToggle(service.id, !service.is_active)}
                        />
                        <div className={`w-9 h-5 rounded-full transition-colors border border-white/5 relative ${service.is_active ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
                          <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-transform ${service.is_active ? 'translate-x-full bg-white' : 'bg-on-surface-variant'}`}></div>
                        </div>
                      </label>
                      <span className={`text-[10px] font-label-caps ${service.is_active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {service.is_active ? 'IN STOCK' : 'OUT OF STOCK'}
                      </span>
                    </div>
                    <button onClick={() => setEditingId(service.id)} className="material-symbols-outlined text-on-surface-variant bg-white/5 p-1.5 rounded-lg border border-white/5 active:scale-90 transition-transform text-[20px]">
                      edit
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </section>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
