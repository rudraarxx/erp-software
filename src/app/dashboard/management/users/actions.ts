'use server';

import { createClient } from '@/lib/supabase/server';
import { UserRole, isAdmin as rbacIsAdmin } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient();

  // 1. Double check permission
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Fetch current user's role to confirm admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile || !rbacIsAdmin(profile.role as UserRole)) {
    return { success: false, error: 'Forbidden: Admins only' };
  }

  // 2. Perform update
  // The RLS policy 'profiles_update_admin' on the DB should already ensure
  // that admins can only update users within their own company.
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .eq('company_id', profile.company_id); // Explicit safety check

  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/management/users');
  return { success: true };
}
