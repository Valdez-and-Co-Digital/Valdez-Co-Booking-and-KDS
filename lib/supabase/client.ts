'use client';

import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser-side Supabase client (using modern @supabase/ssr).
 * Uses the user's session — RLS is enforced.
 * Use in Client Components and hooks.
 */
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createBrowserClientSSR<Database>(supabaseUrl, supabaseAnonKey);
};
