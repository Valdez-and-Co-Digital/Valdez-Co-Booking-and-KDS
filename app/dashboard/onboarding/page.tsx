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
    <div className="min-h-full p-8 max-w-[1600px] mx-auto text-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Onboarding Pipeline</h1>
          <p className="text-slate-400">Manage client acquisition from prospect to provisioning.</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/onboarding/intake"
            target="_blank"
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-medium shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Prospect
          </Link>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)] overflow-x-auto pb-4 snap-x">
        {STAGES.map(stage => {
          const stageProspects = prospects.filter(p => p.status === stage.id);
          
          return (
            <div 
              key={stage.id}
              className="flex-shrink-0 w-80 flex flex-col bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm p-4 snap-start"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id as Prospect['status'])}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-100">{stage.label}</h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-full font-mono">
                  {stageProspects.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {stageProspects.map(prospect => (
                  <div
                    key={prospect.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 backdrop-blur-md rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white">{prospect.business_name}</h4>
                      <button 
                        onClick={() => router.push(`/dashboard/onboarding/${prospect.id}`)}
                        className="text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-4">{prospect.contact_name}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(prospect.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {stageProspects.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-sm text-slate-500">
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
