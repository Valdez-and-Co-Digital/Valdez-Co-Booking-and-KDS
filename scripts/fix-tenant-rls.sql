-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own tenant
CREATE POLICY "Users can view their own tenant" 
ON public.tenants
FOR SELECT USING (
  id IN (SELECT tenant_id FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow users to update their own tenant
CREATE POLICY "Users can update their own tenant" 
ON public.tenants
FOR UPDATE USING (
  id IN (SELECT tenant_id FROM public.admin_users WHERE user_id = auth.uid())
);
