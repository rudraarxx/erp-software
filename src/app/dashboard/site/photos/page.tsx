"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Image as ImageIcon, Plus, ChevronLeft, MapPin, Loader2, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";

type Project = { id: string; name: string };
type SitePhoto = {
  id: string;
  photo_url: string;
  description: string | null;
  date: string;
  created_at: string;
};

function PhotosGallery() {
  const supabase = createClient();
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("project") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId);
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({ url: "", description: "" });

  useEffect(() => {
    supabase.from("projects").select("id, name").eq("status", "active")
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data?.[0] && !defaultProjectId) setSelectedProject(data[0].id);
      });
  }, [supabase, defaultProjectId]);

  useEffect(() => {
    if (selectedProject) fetchPhotos();
  }, [selectedProject]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_photos")
      .select("*")
      .eq("project_id", selectedProject)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setPhotos(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !selectedProject || !uploadData.url) return;

    setIsUploading(true);
    const { error } = await supabase.from("site_photos").insert({
      project_id: selectedProject,
      photo_url: uploadData.url,
      description: uploadData.description || null,
      date: new Date().toISOString().split("T")[0],
      uploaded_by: profile.id,
    });

    setIsUploading(false);
    if (!error) {
      setIsModalOpen(false);
      setUploadData({ url: "", description: "" });
      fetchPhotos();
    } else {
      alert("Failed to save photo: " + error.message);
    }
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
              <ImageIcon className="w-7 h-7 text-orange-500" /> Photo Diary
            </h1>
            <p className="text-[#1C1C1C]/60 mt-0.5 text-sm">Visual timeline of site progress.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedProject}
          className="bg-[#1C1C1C] hover:bg-primary disabled:opacity-50 text-white px-5 py-2.5 rounded-lg border border-transparent shadow-sm hover:shadow-md transition-all font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Photo
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

      {/* Gallery */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !selectedProject ? (
        <div className="text-center py-20 text-[#1C1C1C]/50">Select a project to view its photo diary.</div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <ImageIcon className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold text-[#1C1C1C]">No Photos Yet</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Start documenting site progress by adding photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-[#1C1C1C]/10">
              {/* Fallback to simple image tag for external URLs. In Prod, use next/image with domains */}
              <img 
                src={photo.photo_url} 
                alt={photo.description || "Site Photo"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400?text=Invalid+Image+URL" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-sm font-medium line-clamp-2">{photo.description}</p>
                <div className="flex items-center gap-1.5 text-white/70 text-xs mt-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(photo.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (Simplified MVP without Storage setup) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Add Site Photo</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Image URL (MVP) *</label>
                <input required type="url" value={uploadData.url} onChange={(e) => setUploadData({...uploadData, url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                <p className="text-xs text-[#1C1C1C]/40 mt-1">Direct upload to Storage is scoped for v2. Paste an image URL for now.</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Caption / Notes</label>
                <textarea rows={2} value={uploadData.description} onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  placeholder="What does this show?"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary resize-none" />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={isUploading}
                  className="bg-[#1C1C1C] text-white px-5 py-2 rounded-xl font-bold flex items-center justify-center min-w-[100px] text-sm gap-2">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#1C1C1C]/60">Loading...</div>}>
      <PhotosGallery />
    </Suspense>
  );
}
