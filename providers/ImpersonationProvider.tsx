'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface ImpersonationContextType {
  impersonatedTenantId: string | null;
  setImpersonatedTenantId: (id: string | null) => void;
  isSuperAdmin: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonatedTenantId: null,
  setImpersonatedTenantId: () => {},
  isSuperAdmin: false,
});

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [impersonatedTenantId, setImpersonatedTenantIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swiftkds_impersonated_tenant');
    }
    return null;
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Check if the user is a super admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.is_super_admin) {
              setIsSuperAdmin(true);
            }
          });
      }
    });
  }, [supabase]);

  const setImpersonatedTenantId = (id: string | null) => {
    setImpersonatedTenantIdState(id);
    if (id) {
      localStorage.setItem('swiftkds_impersonated_tenant', id);
    } else {
      localStorage.removeItem('swiftkds_impersonated_tenant');
    }
  };

  return (
    <ImpersonationContext.Provider value={{ impersonatedTenantId, setImpersonatedTenantId, isSuperAdmin }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
