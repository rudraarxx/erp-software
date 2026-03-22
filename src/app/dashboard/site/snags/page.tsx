"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Plus, ChevronLeft, MapPin, Search, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";

type Project = { id: string; name: string };
type Snag = {
  id: string;
  project_id: string;
  location: string;
  description: string;
  photo_url: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;
  reported_date: string;
};

function SnagsList() {
  const supabase = createClient();
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("project") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId);
  const [snags, setSnags] = useState<Snag[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSnag, setNewSnag] = useState({
    location: "",
    description: "",
    priority: "medium",
    assigned_to: "",
  });

  useEffect(() => {
    supabase.from("projects").select("id, name").eq("status", "active")
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data?.[0] && !defaultProjectId) setSelectedProject(data[0].id);
      });
  }, [supabase, defaultProjectId]);

  useEffect(() => {
    if (selectedProject) fetchSnags();
  }, [selectedProject]);

  const fetchSnags = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("snags")
      .select("*")
      .eq("project_id", selectedProject)
      .order("created_at", { ascending: false });
    setSnags(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !selectedProject) return;

    setIsCreating(true);
    const { error } = await supabase.from("snags").insert({
      project_id: selectedProject,
      location: newSnag.location,
      description: newSnag.description,
      priority: newSnag.priority,
      assigned_to: newSnag.assigned_to || null,
      reported_by: profile.id,
    });

    setIsCreating(false);
    if (!error) {
      setIsModalOpen(false);
      setNewSnag({ location: "", description: "", priority: "medium", assigned_to: "" });
      fetchSnags();
    } else {
      alert("Failed to report snag: " + error.message);
    }
  };

  const markResolved = async (id: string) => {
    const { error } = await supabase.from("snags").update({
      status: "resolved",
      resolved_date: new Date().toISOString().split("T")[0]
    }).eq("id", id);
    
    if (!error) fetchSnags();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/site" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-red-500" /> Snag List
            </h1>
            <p className="text-[#1C1C1C]/60 mt-0.5 text-sm">Report and track site defects and punch list items.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedProject}
          className="bg-[#1C1C1C] hover:bg-primary disabled:opacity-50 text-white px-5 py-2.5 rounded-lg border border-transparent shadow-sm hover:shadow-md transition-all font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Report Snag
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#1C1C1C]/10 shadow-sm flex flex-wrap gap-4 items-center">
        <MapPin className="w-5 h-5 text-[#1C1C1C]/40" />
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 bg-gray-50 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all font-semibold"
        >
          {projects.length === 0 && <option value="">Loading projects...</option>}
          <option value="" disabled>Select a project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !selectedProject ? (
        <div className="text-center py-20 text-[#1C1C1C]/50">Please select a project to view its snag list.</div>
      ) : snags.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-[#1C1C1C]">Zero Snags!</h2>
          <p className="text-[#1C1C1C]/50 mt-2">No defects reported for this project.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {snags.map(snag => (
            <div key={snag.id} className="bg-white p-5 rounded-xl border border-[#1C1C1C]/10 shadow-sm flex flex-col hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  snag.priority === 'critical' ? 'bg-red-100 text-red-700' :
                  snag.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  snag.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {snag.priority}
                </span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  snag.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                  snag.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {snag.status.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="font-bold text-[#1C1C1C] mb-1">{snag.location}</h3>
              <p className="text-sm text-[#1C1C1C]/70 mb-4 line-clamp-3">{snag.description}</p>
              
              <div className="mt-auto pt-4 border-t border-[#1C1C1C]/5 flex justify-between items-end">
                <div className="text-xs text-[#1C1C1C]/50">
                  <p>Reported: {new Date(snag.reported_date).toLocaleDateString()}</p>
                  {snag.assigned_to && <p className="mt-0.5">Assigned to: <span className="font-semibold text-[#1C1C1C]/70">{snag.assigned_to}</span></p>}
                </div>
                {snag.status !== 'resolved' && (
                  <button 
                    onClick={() => markResolved(snag.id)}
                    className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Report New Snag</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Location / Area *</label>
                <input required value={newSnag.location} onChange={(e) => setNewSnag({...newSnag, location: e.target.value})}
                  placeholder="e.g. 2nd Floor, Master Bathroom"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Description *</label>
                <textarea required rows={3} value={newSnag.description} onChange={(e) => setNewSnag({...newSnag, description: e.target.value})}
                  placeholder="Describe the defect..."
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Priority</label>
                  <select value={newSnag.priority} onChange={(e) => setNewSnag({...newSnag, priority: e.target.value as any})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Assign To</label>
                  <input value={newSnag.assigned_to} onChange={(e) => setNewSnag({...newSnag, assigned_to: e.target.value})}
                    placeholder="e.g. Plumbing Contractor"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl">Cancel</button>
                <button type="submit" disabled={isCreating}
                  className="bg-[#1C1C1C] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Save Snag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SnagsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#1C1C1C]/60">Loading...</div>}>
      <SnagsList />
    </Suspense>
  );
}
