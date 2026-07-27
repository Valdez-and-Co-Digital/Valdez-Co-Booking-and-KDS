-- ============================================================
-- SwiftKDS — KDS Dining Options
-- A Valdez & Co. Product
-- ============================================================

-- Add dining_option to orders_appointments for KDS sorting
ALTER TABLE public.orders_appointments
ADD COLUMN dining_option text NOT NULL DEFAULT 'take_out'
CHECK (dining_option IN ('dine_in', 'take_out', 'delivery'));

-- Index for querying
CREATE INDEX idx_orders_appointments_dining_option ON public.orders_appointments(dining_option);
