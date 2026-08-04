'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, Calendar, Phone, Mail, ChevronRight } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-8 max-w-[1600px] mx-auto text-slate-200">
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

      <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100vh-200px)] md:overflow-x-auto pb-8">
        {STAGES.map(stage => {
          const stageProspects = prospects.filter(p => p.status === stage.id);
          
          return (
            <div 
              key={stage.id}
              className="flex-shrink-0 w-full md:w-80 flex flex-col bg-slate-900/40 md:bg-slate-900/60 rounded-3xl border border-white/5 shadow-xl backdrop-blur-md p-5"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id as Prospect['status'])}
            >
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-lg font-semibold text-slate-100 tracking-tight">{stage.label}</h3>
                <span className="bg-cyan-500/10 text-cyan-400 text-sm px-3 py-1 rounded-full font-medium border border-cyan-500/20">
                  {stageProspects.length}
                </span>
              </div>

              <div className="flex flex-col md:overflow-y-auto space-y-4 md:flex-1">
                {stageProspects.map(prospect => (
                  <div
                    key={prospect.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                    className="group bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/10 hover:border-cyan-500/50 shadow-lg rounded-2xl p-5 cursor-grab active:cursor-grabbing transition-all relative overflow-hidden flex flex-col gap-3"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-lg leading-tight mb-1">{prospect.business_name}</h4>
                        <p className="text-sm font-medium text-slate-400">{prospect.contact_name}</p>
                      </div>
                      <button 
                        onClick={() => router.push(`/dashboard/onboarding/${prospect.id}`)}
                        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-400 transition-colors border border-white/5"
                        aria-label="View Details"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                        <span className="font-medium">{new Date(prospect.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {stageProspects.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-sm font-medium text-slate-500">
                    Drop here
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
