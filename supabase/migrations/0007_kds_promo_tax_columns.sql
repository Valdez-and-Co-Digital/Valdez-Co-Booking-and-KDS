-- Add columns for POS tax and promo codes
ALTER TABLE orders_appointments 
ADD COLUMN discount_cents INTEGER DEFAULT 0,
ADD COLUMN tax_cents INTEGER DEFAULT 0,
ADD COLUMN promo_code TEXT;
