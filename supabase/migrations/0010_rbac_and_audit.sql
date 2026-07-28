-- ============================================================
-- Migration: 0010_rbac_and_audit.sql
-- Description: Introduces RBAC roles, audit logging
-- ============================================================

-- 1. Migrate existing 'staff' roles to 'associate'
UPDATE public.admin_users 
SET role = 'associate' 
WHERE role = 'staff';

-- 2. Drop the old constraint on admin_users role
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.admin_users'::regclass 
    AND contype = 'c' 
    AND conname LIKE '%role%';
    
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.admin_users DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- 3. Add the new constraint
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('owner', 'manager', 'assistant_manager', 'associate'));

-- 4. Update the default role
ALTER TABLE public.admin_users
  ALTER COLUMN role SET DEFAULT 'associate';

-- 5. Create Audit Logs Table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast tenant querying
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id, created_at desc);

-- 6. Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated in the tenant can insert (to log their own actions)
CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Only the owner can view the audit logs
CREATE POLICY "Owners can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'owner');

-- 7. Audit Logging RPC helper
-- Easily log an action from a server route without bypassing RLS
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_tenant_id uuid,
  p_action_type text,
  p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the definer to allow insertion even if the user RLS context is tricky
AS $$
BEGIN
  INSERT INTO public.audit_logs (tenant_id, user_id, action_type, description)
  VALUES (p_tenant_id, auth.uid(), p_action_type, p_description);
END;
$$;
