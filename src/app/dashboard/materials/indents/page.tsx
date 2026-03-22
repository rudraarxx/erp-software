"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, Plus, Loader2, X, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

type Indent = {
  id: string; indent_no: string | null; status: string; urgency: string;
  notes: string | null; created_at: string;
  projects: { name: string } | null;
};
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-blue-50 text-blue-700 border border-blue-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  fulfilled: "bg-green-50 text-green-700 border border-green-200",
};

export default function IndentsPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [indents, setIndents] = useState<Indent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ project_id: "", urgency: "normal", notes: "" });
  const [items, setItems] = useState([{ id: crypto.randomUUID(), material_id: "", quantity: "", unit: "" }]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ind }, { data: pr }, { data: mat }] = await Promise.all([
      supabase.from("material_indents").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("materials").select("id, name, unit").order("name"),
    ]);
    setIndents((ind as any) || []);
    setProjects(pr || []);
    setMaterials(mat || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pickMaterial = (id: string, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    setItems(items.map(it => it.id === id ? { ...it, material_id: matId, unit: mat?.unit || "" } : it));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsSaving(true);

    const { data: indent, error } = await supabase.from("material_indents").insert({
      project_id: form.project_id,
      urgency: form.urgency,
      notes: form.notes || null,
      status: "pending",
      requested_by: profile.id,
    }).select("id").single();

    if (error || !indent) { alert("Error: " + error?.message); setIsSaving(false); return; }

    const validItems = items.filter(it => it.material_id && it.quantity);
    await supabase.from("material_indent_items").insert(
      validItems.map(it => ({
        indent_id: indent.id,
        material_id: it.material_id,
        quantity_requested: parseFloat(it.quantity),
      }))
    );

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ project_id: "", urgency: "normal", notes: "" });
    setItems([{ id: crypto.randomUUID(), material_id: "", quantity: "", unit: "" }]);
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Material Indents</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Request materials for your site and track approval.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Raise Indent
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : indents.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <ClipboardList className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No indents raised yet</h2>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Indent</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Urgency</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">Date</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {indents.map(ind => (
                <tr key={ind.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4 font-semibold text-[#1C1C1C]">{ind.indent_no || `IND-${ind.id.slice(0, 6).toUpperCase()}`}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/70">{(ind.projects as any)?.name}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${ind.urgency === 'urgent' ? 'bg-red-50 text-red-700' : ind.urgency === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {ind.urgency}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLORS[ind.status] || ''}`}>{ind.status}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/50">{new Date(ind.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/materials/indents/${ind.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-all">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raise Indent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl">Raise Material Indent</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Project *</label>
                  <select required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Urgency</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special instructions..."
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-[#1C1C1C]/10 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide">Materials Required</h3>
                  <button type="button" onClick={() => setItems([...items, { id: crypto.randomUUID(), material_id: "", quantity: "", unit: "" }])}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <span className="text-xs text-[#1C1C1C]/30 w-5 text-right shrink-0">{idx + 1}.</span>
                      <select value={item.material_id} onChange={(e) => pickMaterial(item.id, e.target.value)}
                        className="flex-[3] px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                        <option value="">Select material...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => setItems(items.map(it => it.id === item.id ? { ...it, quantity: e.target.value } : it))}
                        placeholder="Qty" className="flex-1 px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                      <span className="text-xs font-semibold text-[#1C1C1C]/40 w-10 shrink-0">{item.unit}</span>
                      <button type="button" onClick={() => { if (items.length > 1) setItems(items.filter(it => it.id !== item.id)); }}
                        disabled={items.length === 1}
                        className="w-9 h-9 flex items-center justify-center text-[#1C1C1C]/30 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Indent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
