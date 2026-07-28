-- Fix missing foreign key relationship between audit_logs and admin_users
ALTER TABLE public.audit_logs
ADD CONSTRAINT fk_audit_logs_admin_users
FOREIGN KEY (user_id, tenant_id) REFERENCES public.admin_users(user_id, tenant_id)
ON DELETE CASCADE;
