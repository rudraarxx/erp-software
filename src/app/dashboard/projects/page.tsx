"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FolderKanban, Plus, Search, Loader2, X, MapPin, CalendarDays, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

type Project = {
  id: string;
  name: string;
  client_name: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  status: "planned" | "active" | "on_hold" | "completed";
  description: string | null;
};

export default function ProjectsPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    client_name: "",
    contract_value: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (!error && data) {
      setProjects(data as Project[]);
    }
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id || !formData.name) return;
    
    setIsCreating(true);
    const { error } = await supabase.from("projects").insert({
      company_id: profile.company_id,
      name: formData.name,
      client_name: formData.client_name || null,
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      description: formData.description || null,
      status: "active",
    });

    setIsCreating(false);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ name: "", client_name: "", contract_value: "", start_date: "", end_date: "", description: "" });
      fetchProjects();
    } else {
      alert("Failed to create project: " + error.message);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase()))
  );

  const canCreate = profile?.role === "admin" || profile?.role === "project_manager";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Projects</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Manage all your construction sites and contracts.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
          <input 
            type="text" 
            placeholder="Search projects or clients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <FolderKanban className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold text-[#1C1C1C]">No projects found</h2>
          <p className="text-[#1C1C1C]/50 mt-2 max-w-md">
            {projects.length === 0 
              ? "Get started by creating your first construction project." 
              : "No projects match your search criteria."}
          </p>
          {canCreate && projects.length === 0 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex items-center gap-2 bg-white border border-[#1C1C1C]/20 hover:bg-[#1C1C1C]/5 text-[#1C1C1C] px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link 
              href={`/dashboard/projects/${project.id}`} 
              key={project.id}
              className="group bg-white rounded-xl border border-[#1C1C1C]/10 p-5 shadow-sm hover:shadow-md hover:border-[#1C1C1C]/20 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  project.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                  project.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  project.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {project.status.replace('_', ' ')}
                </div>
                <button className="text-[#1C1C1C]/30 hover:text-[#1C1C1C] transition-colors p-1" onClick={(e) => e.preventDefault()}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="font-bold text-[#1C1C1C] text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </h3>
              
              {project.client_name && (
                <div className="flex items-center gap-1.5 text-sm text-[#1C1C1C]/60 mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{project.client_name}</span>
                </div>
              )}
              
              <div className="mt-auto pt-4 border-t border-[#1C1C1C]/5 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[#1C1C1C]/40 text-[11px] uppercase font-semibold tracking-wider mb-0.5">Contract Value</p>
                  <p className="font-medium text-[#1C1C1C]">
                    {project.contract_value ? `₹${project.contract_value.toLocaleString('en-IN')}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#1C1C1C]/40 text-[11px] uppercase font-semibold tracking-wider mb-0.5">Timeline</p>
                  <div className="flex items-center gap-1 text-[#1C1C1C] font-medium">
                    <CalendarDays className="w-3.5 h-3.5 text-[#1C1C1C]/40" />
                    <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', {month:'short', year:'numeric'}) : "TBD"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10">
            <div className="px-6 py-4 border-b border-[#1C1C1C]/10 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-heading font-bold text-xl text-[#1C1C1C]">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#1C1C1C]/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#1C1C1C]/40" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Project Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Skyline Towers Phase 1"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Client Name</label>
                  <input value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Contract Value (₹)</label>
                  <input type="number" min="0" value={formData.contract_value} onChange={(e) => setFormData({...formData, contract_value: e.target.value})}
                    placeholder="e.g. 15000000"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all text-[#1C1C1C]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all text-[#1C1C1C]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Description / Scope of Work</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the project scope..."
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#1C1C1C]/10 text-sm font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}
                  className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderKanban className="w-4 h-4" />}
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
