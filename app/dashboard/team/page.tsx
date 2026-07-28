'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useImpersonation } from '@/providers/ImpersonationProvider';
import { inviteTeamMember, updateTeamRole, removeTeamMember } from '@/app/actions/team';
import { Loader2, Users, UserPlus, Shield, Trash2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('associate');
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('associate');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Editing State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient();
  const { impersonatedTenantId } = useImpersonation();

  const loadTeam = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let targetTenantId = impersonatedTenantId;

    if (!targetTenantId) {
      const { data: me } = await supabase
        .from('admin_users')
        .select('tenant_id, role, is_super_admin')
        .eq('user_id', session.user.id)
        .single();
      
      if (me) {
        targetTenantId = me.tenant_id;
        setCurrentUserRole(me.role);
      }
    } else {
      setCurrentUserRole('owner'); // God mode
    }

    if (targetTenantId) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, role, display_name, created_at')
        .eq('tenant_id', targetTenantId)
        .order('created_at', { ascending: true });

      if (data) {
        setTeam(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTeam();
  }, [supabase, impersonatedTenantId]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError('');

    const res = await inviteTeamMember(inviteEmail, inviteRole, inviteName);
    
    if (res.success) {
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('associate');
      await loadTeam();
    } else {
      setInviteError(res.error || 'Failed to invite user.');
    }
    setIsInviting(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      setIsProcessing(true);
      const res = await updateTeamRole(userId, newRole);
      if (res.success) {
        await loadTeam();
      } else {
        alert(res.error);
      }
      setIsProcessing(false);
      setEditingUserId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (confirm('Are you sure you want to completely remove this user? They will lose all access immediately.')) {
      setIsProcessing(true);
      const res = await removeTeamMember(userId);
      if (res.success) {
        await loadTeam();
      } else {
        alert(res.error);
      }
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-500" />
            Team & Staff
          </h1>
          <p className="text-zinc-400 text-sm">Manage employee access and roles</p>
        </div>
        
        {['owner', 'manager'].includes(currentUserRole) && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl border-white/10 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
            <thead className="bg-[#131315]/80 border-b border-white/5 text-zinc-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {team.map((member) => (
                <tr key={member.user_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-display font-bold text-violet-400">
                        {member.display_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{member.display_name || 'Pending Invite'}</div>
                        <div className="text-xs text-zinc-500">{member.user_id.substring(0, 12)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-semibold border ${
                      member.role === 'owner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      member.role === 'manager' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                      member.role === 'assistant_manager' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {['owner', 'manager'].includes(currentUserRole) && member.role !== 'owner' ? (
                      <div className="flex justify-end gap-2">
                        {editingUserId === member.user_id ? (
                          <div className="flex items-center gap-2">
                            <select
                              className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-xs text-white"
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                              disabled={isProcessing}
                            >
                              {currentUserRole === 'owner' && <option value="manager">Manager</option>}
                              <option value="assistant_manager">Assistant Manager</option>
                              <option value="associate">Associate</option>
                            </select>
                            <button onClick={() => setEditingUserId(null)} className="text-xs text-zinc-400 hover:text-white">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUserId(member.user_id)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors"
                              title="Edit Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(member.user_id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              title="Remove Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleInvite} className="bg-[#131315] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-400" />
                Invite Team Member
              </h2>
              <p className="text-sm text-zinc-400 mt-1">An invitation email will be sent to the employee.</p>
            </div>
            
            <div className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{inviteError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 p-3 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                    placeholder="alex@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Display Name</label>
                <input
                  type="text" required value={inviteName} onChange={e => setInviteName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                  placeholder="Alex T."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Initial Role</label>
                <select
                  value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                >
                  <option value="associate">Associate (Front-line access only)</option>
                  <option value="assistant_manager">Assistant Manager (Shift leader)</option>
                  {currentUserRole === 'owner' && <option value="manager">Manager (Full operational access)</option>}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <button
                type="button" onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={isInviting}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {isInviting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isInviting ? 'Sending Invite...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
