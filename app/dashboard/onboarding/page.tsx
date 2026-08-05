'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, Calendar, Phone, Mail, ChevronRight, Trash2, User } from 'lucide-react';
import Link from 'next/link';

type Prospect = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  status: 'new' | 'info_collected' | 'meeting_scheduled' | 'meeting_held' | 'converted' | 'lost';
  source: string;
  created_at: string;
};

const STAGES = [
  { id: 'new', label: 'New Lead' },
  { id: 'info_collected', label: 'Info Collected' },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { id: 'meeting_held', label: 'Meeting Held' },
  { id: 'converted', label: 'Converted' },
] as const;

export default function OnboardingPipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadProspects() {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading prospects:', error);
      } else {
        setProspects(data || []);
      }
      setIsLoading(false);
    }
    loadProspects();
  }, [supabase]);

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('prospect_id', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Prospect['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('prospect_id');
    await handleStatusChange(id, newStatus);
  };

  const handleStatusChange = async (id: string, newStatus: Prospect['status']) => {
    // Optimistic update
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

    // Update DB
    const { error } = await supabase
      .from('prospects')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating prospect status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prospect?')) return;
    
    // Optimistic update
    setProspects(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prospect:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-8 max-w-[1200px] mx-auto text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Onboarding Pipeline</h1>
          <p className="text-slate-400 text-sm md:text-base">Manage client acquisition from prospect to provisioning.</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/onboarding/intake"
            target="_blank"
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3 md:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-medium shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all min-h-[44px]"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            Add Prospect
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-12">
        {STAGES.map(stage => {
          const stageProspects = prospects.filter(p => p.status === stage.id);
          
          return (
            <div 
              key={stage.id}
              className="flex flex-col bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id as Prospect['status'])}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  <h3 className="text-xl font-bold text-white tracking-tight">{stage.label}</h3>
                </div>
                <span className="bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full font-semibold border border-cyan-500/20 text-sm">
                  {stageProspects.length} Prospect{stageProspects.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-col p-6 space-y-4">
                {stageProspects.map(prospect => (
                  <div
                    key={prospect.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                    className="group bg-gradient-to-r from-white/5 to-transparent hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />
                    
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-12 pl-2">
                      <div className="min-w-[250px]">
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">{prospect.business_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          <span>{prospect.contact_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-slate-400 flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="hidden lg:inline">{prospect.contact_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-500/70" />
                          <span>{new Date(prospect.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0 mt-2 md:mt-0">
                      <select 
                        value={prospect.status}
                        onChange={(e) => handleStatusChange(prospect.id, e.target.value as Prospect['status'])}
                        className="bg-black/20 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                      >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => router.push(`/dashboard/onboarding/${prospect.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors border border-white/5 hover:border-cyan-500/30 rounded-lg text-sm font-medium"
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(prospect.id)} 
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                          aria-label="Delete prospect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {stageProspects.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-sm font-medium text-slate-500 bg-white/[0.02]">
                    Drop prospects here to move them to this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
