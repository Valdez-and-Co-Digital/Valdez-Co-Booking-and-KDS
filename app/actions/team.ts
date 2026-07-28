'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { logAuditAction } from './audit';

/**
 * Ensures the caller is authenticated and has permission to manage the team.
 * Returns the tenantId and the caller's role.
 */
async function verifyManagerOrOwner() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) throw new Error('Unauthorized');

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('tenant_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser || !['owner', 'manager'].includes(adminUser.role)) {
    throw new Error('Forbidden: Only Owners or Managers can manage the team.');
  }

  return { tenantId: adminUser.tenant_id, role: adminUser.role, callerId: session.user.id };
}

export async function inviteTeamMember(email: string, role: string, displayName: string) {
  try {
    const { tenantId, role: callerRole } = await verifyManagerOrOwner();
    
    // Only Owners can invite new Managers/Owners (Managers can only invite Assistants/Associates)
    if (callerRole === 'manager' && ['owner', 'manager'].includes(role)) {
      throw new Error('Managers cannot invite users with Manager or Owner roles.');
    }

    const adminClient = createAdminClient();

    // 1. Invite the user via Supabase Auth Admin
    // This sends an email and creates the auth.users record
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { tenant_id: tenantId, role: role }
    });

    if (inviteError) {
      if (inviteError.message.includes('already been registered')) {
         throw new Error('This user already has an account on the platform. Currently, multi-tenant accounts must be linked by Support.');
      }
      throw new Error('Failed to invite user: ' + inviteError.message);
    }

    const newUserId = inviteData.user.id;

    // 2. Add them to admin_users for this tenant
    const { error: insertError } = await adminClient
      .from('admin_users')
      .insert({
        user_id: newUserId,
        tenant_id: tenantId,
        role: role,
        display_name: displayName || email.split('@')[0],
      });

    if (insertError) {
      // Rollback auth user creation if inserting into admin_users fails
      await adminClient.auth.admin.deleteUser(newUserId);
      throw new Error('Failed to assign user to tenant: ' + insertError.message);
    }

    // 3. Log the action
    await logAuditAction(tenantId, 'invited_team_member', `Invited ${email} as ${role}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTeamRole(targetUserId: string, newRole: string) {
  try {
    const { tenantId, role: callerRole, callerId } = await verifyManagerOrOwner();

    // Prevent self-demotion accidentally via this endpoint
    if (targetUserId === callerId) {
      throw new Error('You cannot change your own role.');
    }

    // Managers cannot promote someone to Manager/Owner
    if (callerRole === 'manager' && ['owner', 'manager'].includes(newRole)) {
      throw new Error('Managers cannot assign Manager or Owner roles.');
    }

    const adminClient = createAdminClient();
    
    // Check target's current role
    const { data: targetData } = await adminClient
      .from('admin_users')
      .select('role, display_name')
      .eq('user_id', targetUserId)
      .eq('tenant_id', tenantId)
      .single();
      
    if (!targetData) throw new Error('Target user not found in this tenant.');
    
    // Managers cannot edit an Owner's role
    if (callerRole === 'manager' && ['owner', 'manager'].includes(targetData.role)) {
      throw new Error('Managers cannot edit the roles of other Managers or Owners.');
    }

    // Update role
    const { error } = await adminClient
      .from('admin_users')
      .update({ role: newRole })
      .eq('user_id', targetUserId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    await logAuditAction(tenantId, 'role_updated', `Changed ${targetData.display_name}'s role from ${targetData.role} to ${newRole}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeTeamMember(targetUserId: string) {
  try {
    const { tenantId, role: callerRole, callerId } = await verifyManagerOrOwner();

    if (targetUserId === callerId) {
      throw new Error('You cannot remove yourself.');
    }

    const adminClient = createAdminClient();
    
    const { data: targetData } = await adminClient
      .from('admin_users')
      .select('role, display_name')
      .eq('user_id', targetUserId)
      .eq('tenant_id', tenantId)
      .single();

    if (!targetData) throw new Error('User not found.');

    if (callerRole === 'manager' && ['owner', 'manager'].includes(targetData.role)) {
      throw new Error('Managers cannot remove other Managers or Owners.');
    }

    const { error } = await adminClient
      .from('admin_users')
      .delete()
      .eq('user_id', targetUserId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    await logAuditAction(tenantId, 'user_removed', `Removed ${targetData.display_name} from the tenant`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
