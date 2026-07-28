'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function logAuditAction(tenantId: string, actionType: string, description: string) {
  try {
    const supabase = await createServerClient();
    
    // Call the RPC defined in 0010_rbac_and_audit.sql
    // This runs with SECURITY DEFINER so it will insert the log 
    // without violating RLS for non-owners, while securely stamping the user_id.
    const { error } = await supabase.rpc('log_audit_event', {
      p_tenant_id: tenantId,
      p_action_type: actionType,
      p_description: description,
    });

    if (error) {
      console.error('Audit Log Error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Audit Log Exception:', err.message);
    return { success: false, error: err.message };
  }
}
