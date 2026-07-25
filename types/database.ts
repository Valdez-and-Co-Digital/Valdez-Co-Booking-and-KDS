/**
 * SwiftKDS Database Types
 * Auto-generated types for Supabase tables.
 * Run `supabase gen types typescript --local > types/database.ts` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          domain: string | null;
          stripe_account_id: string | null;
          settings: TenantSettings;
          business_hours: BusinessHours;
          latitude: number | null;
          longitude: number | null;
          last_heartbeat: string | null;
          logo_url: string | null;
          brand_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          role: AdminRole;
          display_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          price_cents: number;
          duration_minutes: number | null;
          prep_time_minutes: number | null;
          category: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      orders_appointments: {
        Row: {
          id: string;
          tenant_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          slot_start: string;
          slot_end: string | null;
          cart_items: CartItem[];
          total_cents: number;
          status: OrderStatus;
          notes: string | null;
          stripe_payment_intent_id: string | null;
          stripe_transfer_id: string | null;
          payment_status: PaymentStatus;
          stripe_terminal_payment_id: string | null;
          ordered_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['orders_appointments']['Row'], 'id' | 'ordered_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['orders_appointments']['Insert']>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          endpoint: string;
          p256dh: string;
          auth_key: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['push_subscriptions']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string;
          amount_cents: number;
          description: string;
          status: InvoiceStatus;
          due_date: string | null;
          stripe_payment_link_url: string | null;
          stripe_invoice_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at' | 'paid_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
    };
    Functions: {
      custom_access_token_hook: {
        Args: { event: Json };
        Returns: Json;
      };
    };
  };
}

// ============================================================
// Domain Types
// ============================================================

export type AdminRole = 'owner' | 'manager' | 'staff';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface CartItem {
  service_id: string;
  name: string;
  price_cents: number;
  duration_minutes?: number;
  prep_time_minutes?: number;
  quantity: number;
}

export interface TenantSettings {
  is_salon: boolean;
  is_foodtruck: boolean;
  is_agency?: boolean;
  max_capacity: number;
  slot_interval_minutes: number;
  currency: string;
  booking_advance_days: number;
}

export interface BusinessHourSlot {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface BusinessHours {
  mon: BusinessHourSlot;
  tue: BusinessHourSlot;
  wed: BusinessHourSlot;
  thu: BusinessHourSlot;
  fri: BusinessHourSlot;
  sat: BusinessHourSlot;
  sun: BusinessHourSlot;
}

// Convenience type aliases
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Order = Database['public']['Tables']['orders_appointments']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
