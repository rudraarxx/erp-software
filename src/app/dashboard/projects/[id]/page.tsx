import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Building2, CalendarDays, MapPin, FileText, ChevronLeft, 
  Activity, AlertTriangle, Image as ImageIcon, Users
} from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Fetch project details
  const { data: project } = await supabase
    .from("projects")
    .select("*, companies(name)")
    .eq("id", params.id)
    .single();

  if (!project) {
    notFound();
  }

  // Fetch some summary stats (simplified for MVP)
  const [{ count: dprCount }, { count: snagCount }] = await Promise.all([
    supabase.from("dpr").select("*", { count: "exact", head: true }).eq("project_id", params.id),
    supabase.from("snags").select("*", { count: "exact", head: true }).eq("project_id", params.id).neq("status", "resolved")
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/projects" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">{project.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              project.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
              project.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              project.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          {project.client_name && (
            <p className="text-[#1C1C1C]/60 mt-1 flex items-center gap-1.5 text-sm">
              <Building2 className="w-4 h-4" /> Client: {project.client_name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Details & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details Card */}
          <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Project Overview</h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1">Contract Value</p>
                <p className="text-2xl font-bold text-[#1C1C1C]">
                  {project.contract_value ? `₹${project.contract_value.toLocaleString('en-IN')}` : "Not Assigned"}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-[#1C1C1C]/40" />
                  <span className="text-[#1C1C1C]/60">Start:</span>
                  <span className="font-semibold text-[#1C1C1C]">{project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : "TBD"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-[#1C1C1C]/40" />
                  <span className="text-[#1C1C1C]/60">End:</span>
                  <span className="font-semibold text-[#1C1C1C]">{project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN') : "TBD"}</span>
                </div>
              </div>
            </div>

            {project.description && (
              <div className="mt-6 pt-6 border-t border-[#1C1C1C]/10">
                <p className="text-sm font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-2">Scope of Work</p>
                <p className="text-sm text-[#1C1C1C]/80 leading-relaxed bg-[#1C1C1C]/2 p-4 rounded-lg">
                  {project.description}
                </p>
              </div>
            )}
          </div>

          {/* Quick Modules */}
          <h2 className="text-lg font-bold text-[#1C1C1C] pt-2">Site Management Modules</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href={`/dashboard/site/dpr?project=${project.id}`} className="bg-white rounded-xl border border-[#1C1C1C]/10 p-5 shadow-sm hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[#1C1C1C]">Daily Progress</h3>
              <p className="text-xs text-[#1C1C1C]/50 mt-1">{dprCount || 0} reports submitted</p>
            </Link>

            <Link href={`/dashboard/site/snags?project=${project.id}`} className="bg-white rounded-xl border border-[#1C1C1C]/10 p-5 shadow-sm hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[#1C1C1C]">Snag List</h3>
              <p className="text-xs text-[#1C1C1C]/50 mt-1">{snagCount || 0} open defects</p>
            </Link>

            <Link href={`/dashboard/site/photos?project=${project.id}`} className="bg-white rounded-xl border border-[#1C1C1C]/10 p-5 shadow-sm hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[#1C1C1C]">Photo Diary</h3>
              <p className="text-xs text-[#1C1C1C]/50 mt-1">Site visual tracker</p>
            </Link>
          </div>
        </div>

        {/* Right Col: Team & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm">
            <h3 className="font-bold text-[#1C1C1C] flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#1C1C1C]/40" /> Project Team
            </h3>
            <p className="text-sm text-[#1C1C1C]/50 text-center py-6 bg-[#1C1C1C]/2 rounded-lg border border-[#1C1C1C]/5">
              Team assignment coming in Sprint 4
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm">
            <h3 className="font-bold text-[#1C1C1C] flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#1C1C1C]/40" /> Recent Documents
            </h3>
            <p className="text-sm text-[#1C1C1C]/50 text-center py-6 bg-[#1C1C1C]/2 rounded-lg border border-[#1C1C1C]/5">
              No documents uploaded yet.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
