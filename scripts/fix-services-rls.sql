-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow users to read services for their tenant
CREATE POLICY "Users can view their own services" 
ON public.services
FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow users to insert services for their tenant
CREATE POLICY "Users can insert their own services" 
ON public.services
FOR INSERT WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow users to update services for their tenant
CREATE POLICY "Users can update their own services" 
ON public.services
FOR UPDATE USING (
  tenant_id IN (SELECT tenant_id FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow users to delete services for their tenant
CREATE POLICY "Users can delete their own services" 
ON public.services
FOR DELETE USING (
  tenant_id IN (SELECT tenant_id FROM public.admin_users WHERE user_id = auth.uid())
);
