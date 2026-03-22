"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Activity, ChevronLeft, Plus, Trash2, Save, Loader2, CalendarDays, MapPin 
} from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";

type Project = { id: string; name: string };
type ActivityRow = { id: string; description: string; uom: string; qty_done: string };

const WEATHER_OPTS = ["sunny", "cloudy", "rainy", "windy"];

function DPRForm() {
  const supabase = createClient();
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("project") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Form State
  const [weather, setWeather] = useState("sunny");
  const [activities, setActivities] = useState<ActivityRow[]>([
    { id: crypto.randomUUID(), description: "", uom: "sq.m", qty_done: "" }
  ]);
  const [manpower, setManpower] = useState(""); // Simplified to string for MVP instead of jsonb builder
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [materialNotes, setMaterialNotes] = useState("");
  const [delays, setDelays] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase.from("projects").select("id, name").eq("status", "active")
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data?.[0] && !defaultProjectId) setSelectedProject(data[0].id);
      });
  }, [supabase, defaultProjectId]);

  const addActivity = () => {
    setActivities([...activities, { id: crypto.randomUUID(), description: "", uom: "sq.m", qty_done: "" }]);
  };

  const removeActivity = (id: string) => {
    if (activities.length > 1) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const updateActivity = (id: string, field: keyof ActivityRow, value: string) => {
    setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSave = async () => {
    if (!selectedProject || !profile?.id) return;
    
    // Validate
    const validActivities = activities.filter(a => a.description.trim() !== "");
    if (validActivities.length === 0) {
      setErrorMsg("Please add at least one activity description.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSaved(false);

    // 1. Convert manpower string to jsonb (simple key-value for MVP)
    const manpowerJson = { summary: manpower };

    // 2. Insert DPR header
    const { data: dprData, error: dprError } = await supabase.from("dpr").insert({
      project_id: selectedProject,
      date,
      weather,
      manpower_count: manpowerJson as any,
      equipment_notes: equipmentNotes || null,
      material_notes: materialNotes || null,
      delays: delays || null,
      submitted_by: profile.id
    }).select("id").single();

    if (dprError) {
      setErrorMsg(dprError.message.includes("unique") ? "A DPR for this project and date already exists." : dprError.message);
      setSaving(false);
      return;
    }

    // 3. Insert Activities
    if (dprData) {
      const activitiesToInsert = validActivities.map(a => ({
        dpr_id: dprData.id,
        description: a.description,
        uom: a.uom || null,
        qty_done: a.qty_done ? parseFloat(a.qty_done) : 0
      }));

      const { error: actError } = await supabase.from("dpr_activities").insert(activitiesToInsert);
      
      if (actError) {
        setErrorMsg("DPR saved, but failed to save some activities: " + actError.message);
      } else {
        setSaved(true);
        // Reset form for next entry
        setActivities([{ id: crypto.randomUUID(), description: "", uom: "sq.m", qty_done: "" }]);
        setManpower("");
        setEquipmentNotes("");
        setMaterialNotes("");
        setDelays("");
      }
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/site" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
            <Activity className="w-7 h-7 text-blue-500" /> Daily Progress Report
          </h1>
          <p className="text-[#1C1C1C]/60 mt-0.5 text-sm">Submit your end-of-day site activities and constraints.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
          DPR submitted successfully for {date}. You can now submit another or return to the dashboard.
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
        
        {/* Top Controls */}
        <div className="p-6 border-b border-[#1C1C1C]/10 bg-gray-50/50 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium"
            >
              {projects.length === 0 && <option value="">Loading active projects...</option>}
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Date
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2.5 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5">
              Weather
            </label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="px-3 py-2.5 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all capitalize font-medium"
            >
              {WEATHER_OPTS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-8">
          
          {/* Section 1: Activities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide">1. Activities Completed</h2>
              <button 
                onClick={addActivity}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            
            <div className="space-y-3">
              {activities.map((act, idx) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-10 flex items-center justify-center text-xs font-bold text-[#1C1C1C]/30 shrink-0">
                    {idx + 1}.
                  </div>
                  <input 
                    type="text" 
                    placeholder="E.g. Plastering of 3rd floor west wing"
                    value={act.description}
                    onChange={(e) => updateActivity(act.id, "description", e.target.value)}
                    className="flex-[3] px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary"
                  />
                  <input 
                    type="number" 
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={act.qty_done}
                    onChange={(e) => updateActivity(act.id, "qty_done", e.target.value)}
                    className="flex-1 min-w-[80px] px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={act.uom}
                    onChange={(e) => updateActivity(act.id, "uom", e.target.value)}
                    className="flex-1 min-w-[80px] px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white"
                  >
                    <option value="sq.m">sq.m</option>
                    <option value="cu.m">cu.m</option>
                    <option value="rft">rft</option>
                    <option value="nos">nos</option>
                    <option value="tons">tons</option>
                    <option value="kg">kg</option>
                    <option value="lumpsum">lumpsum</option>
                  </select>
                  <button 
                    onClick={() => removeActivity(act.id)}
                    disabled={activities.length === 1}
                    className="w-10 h-10 flex items-center justify-center text-[#1C1C1C]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1C1C1C]/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-[#1C1C1C]/10" />

          {/* Section 2: Resources & Notes */}
          <section className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide mb-3">2. Manpower Summary</h2>
              <textarea 
                rows={3}
                placeholder="E.g. Masons: 5, Helpers: 12, Carpenters: 3..."
                value={manpower}
                onChange={(e) => setManpower(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none" 
              />
            </div>
            
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide mb-3">3. Equipment Usage</h2>
              <textarea 
                rows={3}
                placeholder="E.g. JCB running for 6 hours. Concrete mixer broke down at 3 PM."
                value={equipmentNotes}
                onChange={(e) => setEquipmentNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none" 
              />
            </div>
            
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide mb-3">4. Material Receipts / Issues</h2>
              <textarea 
                rows={3}
                placeholder="E.g. Received 500 bags of cement. Steel binding wire running low."
                value={materialNotes}
                onChange={(e) => setMaterialNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none" 
              />
            </div>
            
            <div>
              <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3">5. Constraints / Delays</h2>
              <textarea 
                rows={3}
                placeholder="E.g. Rain delayed concreting by 2 hours. Awaiting drawing approval for slab."
                value={delays}
                onChange={(e) => setDelays(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all resize-none" 
              />
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1C1C1C]/10 bg-gray-50 flex items-center justify-end gap-3">
          <Link 
            href="/dashboard/site"
            className="px-5 py-2.5 rounded-xl border border-[#1C1C1C]/10 text-sm font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 transition-all"
          >
            Cancel
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving || !selectedProject}
            className="bg-[#1C1C1C] hover:bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Submitting..." : "Submit DPR"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function DPRPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#1C1C1C]/60">Loading form...</div>}>
      <DPRForm />
    </Suspense>
  );
}
