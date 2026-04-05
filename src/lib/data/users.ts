import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/hooks/useProfile';
import { UserRole } from '@/lib/rbac';

/**
 * Fetches all user profiles belonging to the same company as the current user.
 * Restricted by RLS, but we'll double check the company_id here for safety.
 */
export async function getCompanyUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  
  // 1. Get current user's profile to find their company_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!myProfile?.company_id) return [];

  // 2. Fetch all profiles in that company
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id, 
      name, 
      email, 
      role, 
      company_id, 
      phone, 
      companies(name)
    `)
    .eq('company_id', myProfile.company_id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching company users:', error);
    return [];
  }

  return (profiles || []).map(p => ({
    id: p.id,
    name: p.name || p.email.split('@')[0],
    email: p.email,
    role: p.role as UserRole,
    company_id: p.company_id,
    // @ts-expect-error — Supabase join typing
    company_name: p.companies?.name || 'SolidStonne',
    phone: p.phone
  }));
}
