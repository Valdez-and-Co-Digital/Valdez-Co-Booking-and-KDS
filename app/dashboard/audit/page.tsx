'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useImpersonation } from '@/providers/ImpersonationProvider';
import { Loader2, FileText, User, Clock, AlertCircle } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();
  const { impersonatedTenantId } = useImpersonation();

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        let tenantId = impersonatedTenantId;

        if (!tenantId) {
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('tenant_id, role')
            .eq('user_id', session.user.id)
            .single();
          
          if (adminUser) {
            if (adminUser.role !== 'owner') {
              throw new Error('Access Denied. Only Owners can view audit logs.');
            }
            tenantId = adminUser.tenant_id;
          }
        }

        if (tenantId) {
          // Fetch audit logs with the associated user's display name
          const { data, error } = await supabase
            .from('audit_logs')
            .select(`
              *,
              admin_users ( display_name, role )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;
          
          // Note: Because user_id in audit_logs points to auth.users, and admin_users also points to auth.users,
          // the foreign key relationship across schemas can be tricky to join directly in some setups.
          // To ensure we get the display name, we might need a custom view or handle mapping if the auto-join fails.
          // Assuming standard Supabase join works via foreign key references:
          setLogs(data || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [supabase, impersonatedTenantId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <div>
          <h3 className="font-semibold text-lg">Audit Log Error</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-500" />
          System Audit Log
        </h1>
        <p className="text-zinc-400 text-sm">A tamper-proof record of critical actions taken within your business.</p>
      </div>

      <div className="glass-card rounded-2xl border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#131315]/80">
          <h2 className="text-sm font-semibold text-zinc-300">Recent Activity</h2>
          <span className="text-xs text-zinc-500">Last 100 events</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {logs.map((log) => {
            const date = new Date(log.created_at);
            // Example mapping for action types to colors/labels
            let badgeColor = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            if (log.action_type.includes('refund') || log.action_type.includes('delete') || log.action_type.includes('void')) {
              badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
            } else if (log.action_type.includes('update') || log.action_type.includes('edit')) {
              badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            } else if (log.action_type.includes('complete') || log.action_type.includes('create')) {
              badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
            }

            return (
              <div key={log.id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-violet-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {log.description}
                    </p>
                    <span className="text-xs text-zinc-500 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">
                      by <span className="font-semibold text-violet-300">{log.admin_users?.display_name || 'Unknown User'}</span>
                    </span>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className="text-xs text-zinc-500 uppercase">
                      {log.admin_users?.role || 'Staff'}
                    </span>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {log.action_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {logs.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No audit logs recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
