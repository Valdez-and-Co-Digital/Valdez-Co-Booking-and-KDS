-- ============================================================
-- SwiftKDS — Seed Data for Development
-- A Valdez & Co. Product
-- ============================================================

-- Demo Salon Tenant
insert into public.tenants (id, slug, name, settings, business_hours, brand_color)
values (
  'a0000000-0000-0000-0000-000000000001',
  'glamour-studio',
  'Glamour Studio',
  '{
    "is_salon": true,
    "is_foodtruck": false,
    "max_capacity": 4,
    "slot_interval_minutes": 15,
    "currency": "usd",
    "booking_advance_days": 30
  }',
  '{
    "mon": {"open": "09:00", "close": "18:00", "closed": false},
    "tue": {"open": "09:00", "close": "18:00", "closed": false},
    "wed": {"open": "09:00", "close": "18:00", "closed": false},
    "thu": {"open": "09:00", "close": "18:00", "closed": false},
    "fri": {"open": "09:00", "close": "20:00", "closed": false},
    "sat": {"open": "10:00", "close": "16:00", "closed": false},
    "sun": {"open": null, "close": null, "closed": true}
  }',
  '#7c3aed'
);

-- Demo Food Truck Tenant
insert into public.tenants (id, slug, name, settings, business_hours, brand_color)
values (
  'b0000000-0000-0000-0000-000000000002',
  'tacos-el-rey',
  'Tacos El Rey',
  '{
    "is_salon": false,
    "is_foodtruck": true,
    "max_capacity": 8,
    "slot_interval_minutes": 15,
    "currency": "usd",
    "booking_advance_days": 1
  }',
  '{
    "mon": {"open": null, "close": null, "closed": true},
    "tue": {"open": "11:00", "close": "20:00", "closed": false},
    "wed": {"open": "11:00", "close": "20:00", "closed": false},
    "thu": {"open": "11:00", "close": "20:00", "closed": false},
    "fri": {"open": "11:00", "close": "22:00", "closed": false},
    "sat": {"open": "10:00", "close": "22:00", "closed": false},
    "sun": {"open": "11:00", "close": "18:00", "closed": false}
  }',
  '#dc2626'
);

-- Salon Services
insert into public.services (tenant_id, name, description, price_cents, duration_minutes, category, sort_order)
values
  ('a0000000-0000-0000-0000-000000000001', 'Women''s Haircut', 'Wash, cut, and style', 6500, 60, 'Hair', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Men''s Haircut', 'Cut and style', 3500, 30, 'Hair', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Full Color', 'Single process color treatment', 12000, 120, 'Color', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Highlights', 'Partial or full highlights', 9500, 90, 'Color', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Blowout', 'Wash and blowout styling', 4500, 45, 'Styling', 5),
  ('a0000000-0000-0000-0000-000000000001', 'Manicure', 'Classic manicure with polish', 3000, 30, 'Nails', 6);

-- Food Truck Services (Menu Items)
insert into public.services (tenant_id, name, description, price_cents, prep_time_minutes, category, sort_order)
values
  ('b0000000-0000-0000-0000-000000000002', 'Birria Tacos (3)', 'Slow-braised beef birria with consommé', 1299, 8, 'Tacos', 1),
  ('b0000000-0000-0000-0000-000000000002', 'Al Pastor Tacos (3)', 'Marinated pork with pineapple', 1099, 5, 'Tacos', 2),
  ('b0000000-0000-0000-0000-000000000002', 'Quesabirria', 'Crispy birria quesadilla + dip', 1499, 10, 'Specialties', 3),
  ('b0000000-0000-0000-0000-000000000002', 'Nachos', 'Loaded nachos with all toppings', 1099, 7, 'Sides', 4),
  ('b0000000-0000-0000-0000-000000000002', 'Horchata (Large)', 'Fresh-made rice horchata', 499, 1, 'Drinks', 5),
  ('b0000000-0000-0000-0000-000000000002', 'Agua Fresca', 'Daily seasonal flavor', 399, 1, 'Drinks', 6);
