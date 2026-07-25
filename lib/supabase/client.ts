'use client';

import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';
import type { Database } from '@/types/database';

let clientSingleton: ReturnType<typeof createBrowserClientSSR<Database>> | null = null;

/**
 * Browser-side Supabase client (using modern @supabase/ssr).
 * Uses singleton pattern on client-side to prevent memory leaks and infinite re-subscription loops.
 */
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  if (typeof window === 'undefined') {
    return createBrowserClientSSR<Database>(supabaseUrl, supabaseAnonKey);
  }

  if (!clientSingleton) {
    clientSingleton = createBrowserClientSSR<Database>(supabaseUrl, supabaseAnonKey);
  }

  return clientSingleton;
};
