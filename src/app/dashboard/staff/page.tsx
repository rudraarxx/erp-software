"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreHorizontal, 
  Search,
  Filter,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  status?: "active" | "pending";
};

const ROLES = [
  { id: "admin", name: "Admin", description: "Full access to all modules and settings" },
  { id: "project_manager", name: "Project Manager", description: "Manage assigned projects and work orders" },
  { id: "accountant", name: "Accountant", description: "Manage finances, invoices, and payments" },
  { id: "supervisor", name: "Site Supervisor", description: "Log daily activities and attendance" },
];

export default function StaffPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("supervisor");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data: activeProfiles, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: pendingInvites } = await supabase
      .from("staff_invites")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profileErr && activeProfiles) {
      const active = activeProfiles.map((p) => ({ ...p, status: "active" as const }));
      const pending = (pendingInvites || []).map((i) => ({
        id: i.id,
        email: i.email,
        name: null,
        role: i.role,
        created_at: i.created_at,
        status: "pending" as const
      }));
      setProfiles([...active, ...pending].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
    setLoading(false);
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("You must belong to a company to invite staff.");
      }

      const { error } = await supabase.from("staff_invites").insert({
        company_id: profile.company_id,
        email: inviteEmail,
        role: inviteRole,
        invited_by: session.user.id
      });

      if (error) {
        if (error.code === '23505') throw new Error("An invite for this email already exists.");
        throw error;
      }

      setInviteStatus({
        type: "success",
        message: `Invite sent to ${inviteEmail}. Please ask them to sign up.`
      });
      fetchProfiles();
    } catch (err: any) {
      setInviteStatus({
        type: "error",
        message: err.message || "Failed to send invite."
      });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Staff Management</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Manage your team members and their access levels.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Onboard New Staff
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg flex items-center gap-2 text-sm text-[#1C1C1C]/70 hover:bg-[#1C1C1C]/5 transition-colors">
            <Filter className="w-4 h-4" />
            Roles
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1C1C1C]/5 border-b border-[#1C1C1C]/10">
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-sm text-[#1C1C1C]/40">Loading team members...</p>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-[#1C1C1C]/10 mb-3" />
                    <p className="text-lg font-medium text-[#1C1C1C]/60">No staff members found.</p>
                    <p className="text-sm text-[#1C1C1C]/40 mt-1">Start by clicking 'Onboard New Staff' above.</p>
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-[#1C1C1C]/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm">
                          {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1C1C1C]">{profile.name || "Unnamed User"}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-xs text-[#1C1C1C]/50">{profile.email}</p>
                             {profile.status === "pending" && (
                               <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-sm">Pending</span>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1C1C]/5 border border-[#1C1C1C]/10 text-xs font-medium text-[#1C1C1C]/70 capitalize">
                        <Shield className="w-3 h-3 text-primary" />
                        {profile.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1C1C1C]/50">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[#1C1C1C]/30 hover:text-[#1C1C1C] hover:bg-[#1C1C1C]/5 rounded-lg transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#1C1C1C]/10 flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl text-[#1C1C1C]">Onboard New Staff</h2>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-[#1C1C1C]/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#1C1C1C]/40" />
                </button>
              </div>

              <div className="p-6">
                {inviteStatus ? (
                  <div className={`p-4 rounded-xl flex items-start gap-4 ${inviteStatus.type === 'success' ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                    {inviteStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{inviteStatus.message}</p>
                      <button 
                        onClick={() => {
                          setIsInviteModalOpen(false);
                          setInviteStatus(null);
                          fetchProfiles();
                        }}
                        className="mt-3 bg-white px-4 py-1.5 rounded-lg text-xs font-bold border border-[#1C1C1C]/10 hover:bg-[#1C1C1C]/5 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1C1C1C]/70 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
                        <input 
                          type="email" 
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="staff@solidstonne.com"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-[#1C1C1C]/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1C1C1C]/70 mb-3">Assign Role</label>
                      <div className="grid grid-cols-1 gap-3">
                        {ROLES.map((role) => (
                          <label 
                            key={role.id}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${inviteRole === role.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-[#1C1C1C]/5 hover:border-[#1C1C1C]/20'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${inviteRole === role.id ? 'bg-primary text-white' : 'bg-[#1C1C1C]/5 text-[#1C1C1C]/30'}`}>
                                <Shield className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${inviteRole === role.id ? 'text-[#1C1C1C]' : 'text-[#1C1C1C]/70'}`}>{role.name}</p>
                                <p className="text-xs text-[#1C1C1C]/40">{role.description}</p>
                              </div>
                            </div>
                            <input 
                              type="radio" 
                              name="role" 
                              className="sr-only"
                              checked={inviteRole === role.id}
                              onChange={() => setInviteRole(role.id)}
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${inviteRole === role.id ? 'border-primary' : 'border-[#1C1C1C]/10'}`}>
                              {inviteRole === role.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsInviteModalOpen(false)}
                        className="flex-1 px-4 py-3 rounded-xl border border-[#1C1C1C]/10 text-sm font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={inviteLoading}
                        className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50"
                      >
                        {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {inviteLoading ? "Generating..." : "Invite Member"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
