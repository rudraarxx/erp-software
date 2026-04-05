'use client';

import { useProfile } from '@/hooks/useProfile';
import { ROLE_LABELS, UserRole, isAdmin as rbacIsAdmin } from '@/lib/rbac';
import { useEffect, useState } from 'react';
import { ShieldCheck, Search, Loader2, CheckCircle2, UserCog, User, Activity } from 'lucide-react';
import { getCompanyUsers } from '@/lib/data/users'; // wait, getCompanyUsers is server-side
// Actually, I'll fetch data in a server component or use an effect here.
// I'll re-fetch it in an effect since Profile is client-side.
import { createClient } from '@/lib/supabase/client';
import { updateUserRole } from './actions';

export default function UserManagementPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  const fetchUsers = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name');
    
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchUsers();
  }, [profile]);

  if (profileLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Double check admin status on client as well
  if (!profile || !rbacIsAdmin(profile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
          <ShieldCheck className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Access Denied</h1>
        <p className="text-[#1C1C1C]/60 max-w-md">
          This section is restricted to administrators. Please contact your system admin if you believe this is an error.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      setSuccessMessage('Role updated successfully');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      alert(result.error || 'Failed to update role');
    }
    setUpdatingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1C1C1C] tracking-tight">User Management</h1>
          <p className="text-[#1C1C1C]/50 mt-1">Manage team members and assign dashboard roles</p>
        </div>
        
        {successMessage && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100 animate-in zoom-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: User, color: 'text-blue-500' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: 'text-purple-500' },
          { label: 'Field Staff', value: users.filter(u => u.role === 'supervisor' || u.role === 'project_manager').length, icon: Activity, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#1C1C1C]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1C1C1C]">{stat.value}</p>
            <p className="text-sm text-[#1C1C1C]/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#1C1C1C]/10 rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80">
        <div className="p-6 border-b border-[#1C1C1C]/10 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative group min-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-[#1C1C1C]/30 text-sm"
            />
          </div>
          
          <button 
            onClick={fetchUsers}
            className="text-xs font-bold text-primary hover:text-primary/70 transition-colors px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 shrink-0"
          >
            Refresh List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#1C1C1C]/5 bg-gray-50/30">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-widest">Current Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-widest">Assign Role</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-widest">Quick Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto opacity-40" />
                    <p className="text-sm text-[#1C1C1C]/40 mt-4">Fetching team members...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-[#1C1C1C]/50">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1C1C1C]">{u.name || 'Anonymous'}</p>
                          <p className="text-xs text-[#1C1C1C]/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-tight ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                        u.role === 'project_manager' ? 'bg-blue-50 text-blue-600' :
                        u.role === 'supervisor' ? 'bg-green-50 text-green-600' :
                        u.role === 'accountant' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {ROLE_LABELS[u.role as UserRole]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        disabled={updatingId === u.id || u.id === profile.id}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-white border border-[#1C1C1C]/10 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all cursor-pointer hover:border-[#1C1C1C]/30"
                      >
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <option key={role} value={role}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {updatingId === u.id ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto" />
                      ) : (
                        <button 
                          className="text-[#1C1C1C]/30 hover:text-primary transition-colors group/edit"
                          disabled={u.id === profile.id}
                          title={u.id === profile.id ? "Cannot edit your own role" : "Edit user permissions"}
                        >
                          <UserCog className="w-5 h-5 group-hover/edit:rotate-12 transition-transform" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
        <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Admin Responsibility</h4>
          <p className="text-sm text-amber-800/80 leading-relaxed">
            Assigning roles directly influences which dashboard modules and financial records a user can access. 
            <strong> Ensure you verify a user's identity before promoting them to highly sensitive roles like Admin or Accountant.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
