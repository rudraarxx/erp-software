"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users, ChevronLeft, Loader2, Save, Search,
  Plus, X, IndianRupee, Hammer
} from "lucide-react";
import Link from "next/link";

type Project = { id: string; name: string };
type Laborer = {
  id: string;
  name: string;
  trade: string | null;
  rate_per_day: number | null;
  contact: string | null;
};
type AttendanceRecord = {
  id?: string;
  labor_id: string;
  present: boolean;
  hours_worked: number;
};

const TRADES = ["Mason", "Carpenter", "Helper", "Bar Bender", "Painter", "Plumber", "Electrician", "Welder", "Tiler", "Driver", "Other"];

export default function LabourAttendancePage() {
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [laborers, setLaborers] = useState<Laborer[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Add Labor Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrade, setNewTrade] = useState("Mason");
  const [newRate, setNewRate] = useState("");
  const [newContact, setNewContact] = useState("");
  const [addingLabor, setAddingLabor] = useState(false);

  useEffect(() => {
    supabase.from("projects").select("id, name").eq("status", "active")
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data?.[0]) setSelectedProject(data[0].id);
      });
  }, []);

  // Load labourers for selected company
  const loadLaborers = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", userData.user.id).single();
    if (!profile?.company_id || !selectedProject) return;
    const { data } = await supabase.from("labor").select("*")
      .eq("company_id", profile.company_id)
      .eq("current_project_id", selectedProject)
      .eq("is_active", true).order("trade").order("name");
    setLaborers(data ?? []);
  }, [supabase, selectedProject]);

  useEffect(() => { loadLaborers(); }, [loadLaborers]);

  // Load existing attendance
  const loadAttendance = useCallback(async () => {
    if (!selectedProject || !date || laborers.length === 0) return;
    setLoading(true);
    const { data } = await supabase.from("labor_attendance")
      .select("id, labor_id, present, hours_worked")
      .eq("project_id", selectedProject).eq("date", date);

    const map: Record<string, AttendanceRecord> = {};
    // Pre-fill all laborers as present by default
    laborers.forEach((l) => {
      map[l.id] = { labor_id: l.id, present: true, hours_worked: 8 };
    });
    // Override with saved records
    (data ?? []).forEach((r) => {
      map[r.labor_id] = { id: r.id, labor_id: r.labor_id, present: r.present, hours_worked: r.hours_worked ?? 8 };
    });
    setAttendance(map);
    setLoading(false);
  }, [selectedProject, date, laborers, supabase]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const togglePresent = (laborId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [laborId]: { ...prev[laborId], present: !prev[laborId]?.present },
    }));
    setSaved(false);
  };

  const setHours = (laborId: string, hours: number) => {
    setAttendance((prev) => ({ ...prev, [laborId]: { ...prev[laborId], hours_worked: hours } }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedProject) return;
    setSaving(true);
    const upserts = laborers.map((l) => ({
      ...(attendance[l.id]?.id ? { id: attendance[l.id].id } : {}),
      labor_id: l.id,
      project_id: selectedProject,
      date,
      present: attendance[l.id]?.present ?? true,
      hours_worked: attendance[l.id]?.hours_worked ?? 8,
    }));
    await supabase.from("labor_attendance").upsert(upserts, { onConflict: "project_id,labor_id,date" });
    setSaving(false); setSaved(true);
    loadAttendance();
  };

  const handleAddLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingLabor(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setAddingLabor(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", userData.user.id).single();
    if (!profile?.company_id) { setAddingLabor(false); return; }
    await supabase.from("labor").insert({
      company_id: profile.company_id,
      current_project_id: selectedProject,
      name: newName.trim(),
      trade: newTrade,
      rate_per_day: newRate ? parseFloat(newRate) : null,
      contact: newContact || null,
    });
    setAddingLabor(false);
    setAddModalOpen(false);
    setNewName(""); setNewTrade("Mason"); setNewRate(""); setNewContact("");
    loadLaborers();
  };

  // Summary stats
  const presentCount = Object.values(attendance).filter((a) => a.present).length;
  const absentCount  = Object.values(attendance).filter((a) => !a.present).length;
  const totalWages   = laborers.reduce((sum, l) => {
    const att = attendance[l.id];
    if (!att?.present || !l.rate_per_day) return sum;
    return sum + (l.rate_per_day * (att.hours_worked / 8));
  }, 0);

  // Trade-wise summary
  const tradeSummary = TRADES.map((trade) => {
    const inTrade = laborers.filter((l) => l.trade === trade || (trade === "Other" && !TRADES.slice(0, -1).includes(l.trade ?? "")));
    const presentInTrade = inTrade.filter((l) => attendance[l.id]?.present).length;
    return { trade, total: inTrade.length, present: presentInTrade };
  }).filter((t) => t.total > 0);

  const filteredLaborers = laborers.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchTrade  = tradeFilter === "All" || l.trade === tradeFilter;
    return matchSearch && matchTrade;
  });

  const uniqueTrades = ["All", ...Array.from(new Set(laborers.map((l) => l.trade ?? "Other")))];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/attendance" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
              <Users className="w-7 h-7 text-orange-500" /> Labour Attendance
            </h1>
            <p className="text-[#1C1C1C]/60 mt-0.5 text-sm">Daily muster roll — trade-wise headcount and wages.</p>
          </div>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Labourer
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5">Project</label>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all">
            {projects.length === 0 && <option value="">No active projects</option>}
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5">Date</label>
          <input type="date" value={date} max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all" />
        </div>
        <button onClick={handleSave} disabled={saving || !selectedProject}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Muster"}
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium text-green-700">Present</span>
          <span className="text-2xl font-bold text-green-700">{presentCount}</span>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium text-red-700">Absent</span>
          <span className="text-2xl font-bold text-red-700">{absentCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex justify-between items-center col-span-2 md:col-span-1">
          <span className="text-sm font-medium text-amber-700 flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />Est. Wages</span>
          <span className="text-2xl font-bold text-amber-700">₹{totalWages.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Trade-wise Breakdown */}
      {tradeSummary.length > 0 && (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1C1C1C]/60 uppercase tracking-wide mb-4">Trade-wise Headcount</h3>
          <div className="flex flex-wrap gap-2">
            {tradeSummary.map(({ trade, total, present }) => (
              <button
                key={trade}
                onClick={() => setTradeFilter(tradeFilter === trade ? "All" : trade)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  tradeFilter === trade
                    ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                    : "border-[#1C1C1C]/10 text-[#1C1C1C]/70 hover:bg-[#1C1C1C]/5"
                }`}
              >
                <Hammer className="w-3 h-3" />
                {trade}
                <span className={`font-bold ${tradeFilter === trade ? "text-white" : "text-[#1C1C1C]"}`}>{present}/{total}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Muster Table */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#1C1C1C]/8 flex items-center gap-3">
          <Search className="w-4 h-4 text-[#1C1C1C]/30 shrink-0" />
          <input type="text" placeholder="Search labourers..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#1C1C1C]/30" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : filteredLaborers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-[#1C1C1C]/10 mb-3" />
            <p className="text-sm text-[#1C1C1C]/40">
              {laborers.length === 0 ? 'No labourers added yet. Click "Add Labourer" to get started.' : "No results."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1C1C1C]/3 border-b border-[#1C1C1C]/8">
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Labourer</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Trade</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider text-right">Day Wage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C1C]/5">
                {filteredLaborers.map((l) => {
                  const att = attendance[l.id] ?? { present: true, hours_worked: 8 };
                  const wage = att.present && l.rate_per_day ? (l.rate_per_day * att.hours_worked / 8) : 0;
                  return (
                    <tr key={l.id} className={`transition-colors ${att.present ? "hover:bg-[#1C1C1C]/2" : "bg-red-50/40 hover:bg-red-50/60"}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${att.present ? "bg-orange-500 text-white" : "bg-[#1C1C1C]/10 text-[#1C1C1C]/30"}`}>
                            {l.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1C1C1C]">{l.name}</p>
                            {l.rate_per_day && <p className="text-xs text-[#1C1C1C]/40">₹{l.rate_per_day}/day</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-medium text-[#1C1C1C]/60 px-2 py-1 bg-[#1C1C1C]/5 rounded-full">{l.trade ?? "—"}</span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => togglePresent(l.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${att.present ? "bg-green-500" : "bg-[#1C1C1C]/20"}`}
                          title={att.present ? "Mark Absent" : "Mark Present"}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${att.present ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          min={0.5} max={12} step={0.5}
                          value={att.hours_worked}
                          disabled={!att.present}
                          onChange={(e) => setHours(l.id, parseFloat(e.target.value) || 8)}
                          className="w-16 px-2 py-1 border border-[#1C1C1C]/15 rounded-lg text-sm text-center outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`text-sm font-semibold ${wage > 0 ? "text-[#1C1C1C]" : "text-[#1C1C1C]/30"}`}>
                          {wage > 0 ? `₹${wage.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Labourer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10">
            <div className="px-6 py-4 border-b border-[#1C1C1C]/10 flex items-center justify-between">
              <h2 className="font-heading font-bold text-xl text-[#1C1C1C]">Add Labourer</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 hover:bg-[#1C1C1C]/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#1C1C1C]/40" />
              </button>
            </div>
            <form onSubmit={handleAddLabor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C1C]/70 mb-1.5">Full Name *</label>
                <input required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C1C]/70 mb-1.5">Trade</label>
                <select value={newTrade} onChange={(e) => setNewTrade(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all">
                  {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C1C]/70 mb-1.5">Rate per Day (₹)</label>
                <input type="number" min={0} step={10} value={newRate} onChange={(e) => setNewRate(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C1C]/70 mb-1.5">Contact (optional)</label>
                <input value={newContact} onChange={(e) => setNewContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#1C1C1C]/10 text-sm font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={addingLabor}
                  className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
                  {addingLabor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addingLabor ? "Adding..." : "Add Labourer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
