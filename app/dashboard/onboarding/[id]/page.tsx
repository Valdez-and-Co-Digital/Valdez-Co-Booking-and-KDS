'use client';

import { useState, useEffect, use } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building, User, Mail, Phone, Calendar, 
  CreditCard, CheckCircle2, ChevronRight, Edit2, Save, X, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

type Prospect = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'new' | 'info_collected' | 'meeting_scheduled' | 'meeting_held' | 'converted' | 'lost';
  source: string;
  intake_data: any;
  meeting_id: string;
  meeting_time: string;
  tier_selected: string;
  helcim_customer_id: string;
  created_at: string;
};

const STATUS_STEPS = [
  { id: 'new', label: 'Lead' },
  { id: 'info_collected', label: 'Intake' },
  { id: 'meeting_scheduled', label: 'Meeting' },
  { id: 'meeting_held', label: 'Review' },
  { id: 'converted', label: 'Converted' },
];

export default function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '', contact_name: '', contact_email: '', contact_phone: ''
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadData() {
      const [prospectRes, notesRes] = await Promise.all([
        supabase.from('prospects').select('*').eq('id', resolvedParams.id).single(),
        supabase.from('prospect_notes').select('*').eq('prospect_id', resolvedParams.id).order('created_at', { ascending: false })
      ]);

      if (prospectRes.data) setProspect(prospectRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      setIsLoading(false);
    }
    loadData();
  }, [resolvedParams.id, supabase]);

  const handleEditInfoStart = () => {
    if (!prospect) return;
    setEditForm({
      business_name: prospect.business_name,
      contact_name: prospect.contact_name,
      contact_email: prospect.contact_email,
      contact_phone: prospect.contact_phone || ''
    });
    setIsEditingInfo(true);
  };

  const saveInfoEdits = async () => {
    if (!prospect) return;
    setIsProcessing(true);
    const { error } = await supabase.from('prospects').update(editForm).eq('id', prospect.id);
    if (!error) {
      setProspect({ ...prospect, ...editForm });
      setIsEditingInfo(false);
    }
    setIsProcessing(false);
  };

  const updateStatus = async (newStatus: Prospect['status']) => {
    setIsProcessing(true);
    const { error } = await supabase.from('prospects').update({ status: newStatus }).eq('id', resolvedParams.id);
    if (!error && prospect) {
      setProspect({ ...prospect, status: newStatus });
    }
    setIsProcessing(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setIsProcessing(true);
    const { data, error } = await supabase.from('prospect_notes').insert([
      { prospect_id: resolvedParams.id, note_text: newNote }
    ]).select().single();
    
    if (data && !error) {
      setNotes([data, ...notes]);
      setNewNote('');
    }
    setIsProcessing(false);
  };

  const scheduleMeeting = async () => {
    setIsProcessing(true);
    // Call our Calendar API (mocked for now)
    const res = await fetch('/api/calendar', {
      method: 'POST',
      body: JSON.stringify({ prospectId: prospect?.id })
    });
    const data = await res.json();
    if (data.success) {
      await updateStatus('meeting_scheduled');
    }
    setIsProcessing(false);
  };

  const selectTier = async (tier: string) => {
    setIsProcessing(true);
    await supabase.from('prospects').update({ tier_selected: tier }).eq('id', resolvedParams.id);
    setProspect(prev => prev ? { ...prev, tier_selected: tier } : null);
    setIsProcessing(false);
  };

  const setupBilling = async () => {
    setIsProcessing(true);
    // Call Helcim API (mocked)
    const res = await fetch('/api/billing/helcim', {
      method: 'POST',
      body: JSON.stringify({ prospectId: prospect?.id })
    });
    const data = await res.json();
    if (data.success) {
      setProspect(prev => prev ? { ...prev, helcim_customer_id: data.customerId } : null);
    }
    setIsProcessing(false);
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" /></div>;
  if (!prospect) return <div className="p-8 text-white">Prospect not found.</div>;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === prospect.status);

  return (
    <div className="min-h-full p-8 max-w-[1200px] mx-auto text-slate-200">
      <Link href="/dashboard/onboarding" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </Link>

      <div className="flex items-start justify-between mb-8">
        {isEditingInfo ? (
          <div className="flex-1 max-w-2xl bg-slate-900/40 p-6 rounded-2xl border border-white/10 space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Business Name</label>
              <input value={editForm.business_name} onChange={e => setEditForm({...editForm, business_name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Contact Name</label>
                <input value={editForm.contact_name} onChange={e => setEditForm({...editForm, contact_name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Contact Email</label>
                <input value={editForm.contact_email} onChange={e => setEditForm({...editForm, contact_email: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Contact Phone</label>
              <input value={editForm.contact_phone} onChange={e => setEditForm({...editForm, contact_phone: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditingInfo(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveInfoEdits} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl transition-colors"><Save className="w-4 h-4" /> Save Changes</button>
            </div>
          </div>
        ) : (
          <div className="group relative pr-12">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{prospect.business_name}</h1>
            <div className="flex gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {prospect.contact_name}</span>
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {prospect.contact_email}</span>
              {prospect.contact_phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {prospect.contact_phone}</span>}
            </div>
            <button onClick={handleEditInfoStart} className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-cyan-400 transition-all bg-white/5 rounded-lg border border-white/10"><Edit2 className="w-4 h-4" /></button>
          </div>
        )}
        
        {prospect.status !== 'converted' && (
          <button 
            onClick={() => updateStatus('converted')}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium shadow-[0_0_20px_rgba(16,185,129,0.2)] ml-4"
          >
            <CheckCircle2 className="w-4 h-4" /> Convert to Tenant
          </button>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 relative flex-1">
                <button 
                  onClick={() => updateStatus(step.id as Prospect['status'])}
                  disabled={isProcessing}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 hover:scale-110 transition-transform cursor-pointer
                  ${isCompleted ? 'bg-cyan-500 border-cyan-500 text-slate-900' : 'bg-slate-900 border-white/20 text-slate-500'}
                  ${isActive ? 'shadow-[0_0_15px_rgba(34,211,238,0.5)]' : ''}
                `}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span>{index + 1}</span>}
                </button>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {step.label}
                </span>
                {index < STATUS_STEPS.length - 1 && (
                  <div className={`absolute top-4 left-[50%] w-full h-0.5 -z-0
                    ${index < currentStepIndex ? 'bg-cyan-500' : 'bg-white/10'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          
          {/* Action Center based on Status */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-4">Current Action Required</h2>
            
            {prospect.status === 'new' && (
              <div className="space-y-4">
                <p className="text-slate-400">Review intake data and move to Info Collected when ready.</p>
                <button onClick={() => updateStatus('info_collected')} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  Mark Info Collected
                </button>
              </div>
            )}

            {prospect.status === 'info_collected' && (
              <div className="space-y-4">
                <p className="text-slate-400">Schedule a discovery call with the prospect.</p>
                <button onClick={scheduleMeeting} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors border border-cyan-500/30">
                  <Calendar className="w-4 h-4" /> Generate Google Meet Link
                </button>
              </div>
            )}

            {prospect.status === 'meeting_scheduled' && (
              <div className="space-y-4">
                <p className="text-slate-400">After the meeting, add your notes and update the status.</p>
                <button onClick={() => updateStatus('meeting_held')} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  Mark Meeting Held
                </button>
              </div>
            )}

            {prospect.status === 'meeting_held' && (
              <div className="space-y-4">
                <p className="text-slate-400">Select a tier to prepare for conversion.</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {['digital_foundation', 'connected_ordering', 'complete_kitchen_suite'].map(tier => (
                    <button 
                      key={tier}
                      onClick={() => selectTier(tier)}
                      className={`p-3 text-sm rounded-lg border text-left transition-all ${
                        prospect.tier_selected === tier 
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                          : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {tier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {prospect.status === 'converted' && (
              <div className="space-y-4 animate-fade-in">
                {prospect.tier_selected === 'complete_kitchen_suite' ? (
                  <>
                    <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Ready for Tenant Provisioning
                    </h3>
                    <p className="text-slate-400 text-sm">
                      This prospect has been converted to the Complete Kitchen Suite tier. They need to connect their payment processor and accounting software to finalize provisioning.
                    </p>
                    <div className="flex gap-4 pt-2">
                      <button 
                        onClick={() => {
                          const setupUrl = `${window.location.origin}/onboarding/setup/${prospect.id}`;
                          navigator.clipboard.writeText(setupUrl);
                          alert('Setup link copied to clipboard!');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-semibold"
                      >
                        <LinkIcon className="w-4 h-4" /> Copy Setup Link
                      </button>
                      <button 
                        onClick={() => router.push(`/onboarding/setup/${prospect.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors text-sm font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                      >
                        Complete Setup Manually <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Successfully Converted
                    </h3>
                    <p className="text-slate-400 text-sm">
                      This prospect has been converted to the {prospect.tier_selected?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Standard'} tier.
                    </p>
                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mt-4">
                      <strong>Note:</strong> Automated client provisioning for this tier will be built in a later phase. For now, the KDS acts as an internal tracker.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-4">Internal Notes</h2>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Add a note or Fathom summary..."
                className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-cyan-500"
              />
              <button onClick={addNote} disabled={isProcessing} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">Add</button>
            </div>
            <div className="space-y-4">
              {notes.map(note => (
                <div key={note.id} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                  <p className="text-slate-300 text-sm mb-1">{note.note_text}</p>
                  <span className="text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Building className="w-4 h-4" /> Intake Data</h3>
            {prospect.intake_data ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Current POS</span>
                  <span className="text-slate-300">{prospect.intake_data.pos_system || 'None provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Pain Points</span>
                  <span className="text-slate-300">{prospect.intake_data.pain_points || 'None provided'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No intake data available.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
