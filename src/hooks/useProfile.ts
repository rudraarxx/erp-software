// hooks/useProfile.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/rbac';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  company_name: string;
  phone: string | null;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch the profile (e.g., after an update) */
  refresh: () => void;
}

export function useProfile(): UseProfileReturn {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, name, email, role, company_id, phone, companies(name)')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      if (dbError || !data) {
        if (dbError) console.error("useProfile DB Error:", dbError);
        // Fallback: use auth metadata (e.g., first login before trigger fires)
        setProfile({
          id: user.id,
          name:
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'User',
          email: user.email ?? '',
          role: (user.user_metadata?.role as UserRole) ?? 'supervisor',
          company_id: null,
          company_name: 'SolidStonne',
          phone: null,
        });
      } else {
        // @ts-expect-error — Supabase join typing
        const companyName = data.companies?.name ?? 'SolidStonne';
        setProfile({
          id: data.id,
          name: data.name ?? user.email?.split('@')[0] ?? 'User',
          email: data.email,
          role: (data.role as UserRole) ?? 'supervisor',
          company_id: data.company_id,
          company_name: companyName,
          phone: data.phone ?? null,
        });
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, tick]);

  return {
    profile,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}
