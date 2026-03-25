"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Hammer, Search, Loader2 } from "lucide-react";

type Project = { id: string; name: string };
type Laborer = {
  id: string;
  name: string;
  trade: string | null;
  rate_per_day: number | null;
  contact: string | null;
  current_project_id: string | null;
};

export default function LabourDirectoryPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [laborers, setLaborers] = useState<Laborer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const [projRes, labRes] = await Promise.all([
      supabase.from("projects").select("id, name").eq("company_id", profile.company_id).eq("status", "active"),
      supabase.from("labor").select("*").eq("company_id", profile.company_id).eq("is_active", true).order("name")
    ]);

    setProjects(projRes.data ?? []);
    setLaborers(labRes.data ?? []);
    setLoading(false);
  }

  const updateAllocation = async (laborId: string, projectId: string) => {
    setUpdatingId(laborId);
    const newProjectId = projectId === "unassigned" ? null : projectId;
    
    const { error } = await supabase
      .from("labor")
      .update({ current_project_id: newProjectId })
      .eq("id", laborId);
      
    if (!error) {
      setLaborers(prev => prev.map(l => l.id === laborId ? { ...l, current_project_id: newProjectId } : l));
    }
    setUpdatingId(null);
  };

  const filteredLaborers = laborers.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    (l.trade && l.trade.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Labour Directory</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Manage your workforce, assigning and migrating them between sites.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or trade..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1C1C1C]/5 border-b border-[#1C1C1C]/10">
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Labourer Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Trade & Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Site Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-sm text-[#1C1C1C]/40">Loading workforce...</p>
                  </td>
                </tr>
              ) : filteredLaborers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-[#1C1C1C]/10 mb-3" />
                    <p className="text-lg font-medium text-[#1C1C1C]/60">No labourers found.</p>
                  </td>
                </tr>
              ) : (
                filteredLaborers.map((labor) => (
                  <tr key={labor.id} className="hover:bg-[#1C1C1C]/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm">
                          {labor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1C1C1C]">{labor.name}</p>
                          {labor.contact && <p className="text-xs text-[#1C1C1C]/50">{labor.contact}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1C1C]/5 border border-[#1C1C1C]/10 text-xs font-medium text-[#1C1C1C]/70">
                        <Hammer className="w-3 h-3 text-[#1C1C1C]/40" />
                        {labor.trade ?? "Other"}
                      </span>
                      {labor.rate_per_day && (
                        <span className="ml-2 text-xs font-semibold text-[#1C1C1C]/60">₹{labor.rate_per_day}/day</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={updatingId === labor.id}
                          value={labor.current_project_id || "unassigned"}
                          onChange={(e) => updateAllocation(labor.id, e.target.value)}
                          className={`w-full max-w-[200px] px-3 py-2 bg-white border rounded-lg text-sm outline-none transition-all ${labor.current_project_id ? "border-primary/40 text-[#1C1C1C]" : "border-amber-300 text-amber-700 bg-amber-50"}`}
                        >
                          <option value="unassigned">-- Unassigned --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {updatingId === labor.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
