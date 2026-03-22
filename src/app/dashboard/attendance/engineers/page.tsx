"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  HardHat, ChevronLeft, CalendarDays, CheckCircle2,
  XCircle, MinusCircle, Loader2, Search, Save
} from "lucide-react";
import Link from "next/link";

type Project = { id: string; name: string };
type StaffMember = { id: string; name: string; email: string; role: string };
type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ElementType; cls: string; activeCls: string }> = {
  present:  { label: "Present",  icon: CheckCircle2, cls: "text-[#1C1C1C]/40 hover:text-green-600 hover:bg-green-50",  activeCls: "bg-green-50 text-green-600 border-green-200" },
  absent:   { label: "Absent",   icon: XCircle,      cls: "text-[#1C1C1C]/40 hover:text-red-600 hover:bg-red-50",     activeCls: "bg-red-50 text-red-600 border-red-200" },
  half_day: { label: "Half Day", icon: MinusCircle,  cls: "text-[#1C1C1C]/40 hover:text-amber-600 hover:bg-amber-50", activeCls: "bg-amber-50 text-amber-600 border-amber-200" },
  leave:    { label: "Leave",    icon: CalendarDays, cls: "text-[#1C1C1C]/40 hover:text-purple-600 hover:bg-purple-50",activeCls: "bg-purple-50 text-purple-600 border-purple-200" },
};

export default function EngineersAttendancePage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [existing, setExisting] = useState<Record<string, string>>({}); // user_id -> record id
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load projects
  useEffect(() => {
    supabase.from("projects").select("id, name").eq("status", "active")
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data?.[0]) setSelectedProject(data[0].id);
      });
  }, []);

  // Load engineers & supervisors (staff with roles)
  useEffect(() => {
    supabase.from("profiles")
      .select("id, name, email, role")
      .in("role", ["admin", "project_manager", "supervisor"])
      .order("name")
      .then(({ data }) => setStaff(data ?? []));
  }, []);

  // Load existing attendance for selected date + project
  const loadAttendance = useCallback(async () => {
    if (!selectedProject || !date) return;
    setLoading(true);
    const { data } = await supabase
      .from("staff_attendance")
      .select("id, user_id, status")
      .eq("project_id", selectedProject)
      .eq("date", date)
      .eq("type", "engineer");

    const statusMap: Record<string, AttendanceStatus> = {};
    const idMap: Record<string, string> = {};
    (data ?? []).forEach((r) => {
      statusMap[r.user_id] = r.status as AttendanceStatus;
      idMap[r.user_id] = r.id;
    });
    setAttendance(statusMap);
    setExisting(idMap);
    setLoading(false);
  }, [selectedProject, date, supabase]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const setStatus = (userId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [userId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedProject) return;
    setSaving(true);
    const upserts = staff.map((s) => ({
      ...(existing[s.id] ? { id: existing[s.id] } : {}),
      user_id: s.id,
      project_id: selectedProject,
      date,
      type: "engineer" as const,
      status: attendance[s.id] ?? "present",
    }));
    await supabase.from("staff_attendance").upsert(upserts, { onConflict: "user_id,project_id,date" });
    setSaving(false);
    setSaved(true);
    loadAttendance();
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const absentCount  = Object.values(attendance).filter((v) => v === "absent").length;
  const halfCount    = Object.values(attendance).filter((v) => v === "half_day").length;
  const leaveCount   = Object.values(attendance).filter((v) => v === "leave").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/attendance" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
            <HardHat className="w-7 h-7 text-blue-500" /> Engineers Attendance
          </h1>
          <p className="text-[#1C1C1C]/60 mt-0.5 text-sm">Mark daily attendance for site engineers and supervisors.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          >
            {projects.length === 0 && <option value="">No active projects</option>}
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1C1C1C]/50 uppercase tracking-wide mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-white border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selectedProject}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Attendance"}
        </button>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Present",  count: presentCount, cls: "bg-green-50 text-green-700 border-green-100" },
          { label: "Absent",   count: absentCount,  cls: "bg-red-50 text-red-700 border-red-100" },
          { label: "Half Day", count: halfCount,     cls: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: "On Leave", count: leaveCount,    cls: "bg-purple-50 text-purple-700 border-purple-100" },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 flex items-center justify-between ${cls}`}>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-2xl font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#1C1C1C]/8 flex items-center gap-3">
          <Search className="w-4 h-4 text-[#1C1C1C]/30 shrink-0" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#1C1C1C]/30"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HardHat className="w-10 h-10 text-[#1C1C1C]/10 mb-3" />
            <p className="text-sm text-[#1C1C1C]/40">
              {staff.length === 0 ? "No staff found. Add team members first." : "No results for your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1C1C1C]/3 border-b border-[#1C1C1C]/8">
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wider">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C1C]/5">
                {filteredStaff.map((member) => {
                  const currentStatus = attendance[member.id];
                  return (
                    <tr key={member.id} className="hover:bg-[#1C1C1C]/2 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {member.name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1C1C1C]">{member.name ?? "—"}</p>
                            <p className="text-xs text-[#1C1C1C]/40">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#1C1C1C]/60 capitalize px-2 py-1 bg-[#1C1C1C]/5 rounded-full">
                          {member.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([status, cfg]) => {
                            const Icon = cfg.icon;
                            const isActive = currentStatus === status;
                            return (
                              <button
                                key={status}
                                onClick={() => setStatus(member.id, status)}
                                title={cfg.label}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                  isActive ? cfg.activeCls + " shadow-sm" : "border-transparent " + cfg.cls
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
