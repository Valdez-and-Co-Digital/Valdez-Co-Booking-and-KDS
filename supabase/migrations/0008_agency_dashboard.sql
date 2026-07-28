-- Add referral code for tracking signups
ALTER TABLE public.tenants
ADD COLUMN referral_code TEXT;

-- Add super admin flag for agency access
ALTER TABLE public.admin_users
ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster filtering on the agency dashboard
CREATE INDEX idx_tenants_referral_code ON public.tenants(referral_code) WHERE referral_code IS NOT NULL;
