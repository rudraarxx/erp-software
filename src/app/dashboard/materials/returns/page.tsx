"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RotateCcw, Plus, Loader2, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type Return = {
  id: string; return_date: string; supplier_name: string | null; quantity: number; reason: string | null;
  projects: { name: string } | null;
  materials: { name: string; unit: string } | null;
};
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit: string };

export default function ReturnsPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [returns, setReturns] = useState<Return[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    project_id: "",
    material_id: "",
    quantity: "",
    supplier_name: "",
    return_date: new Date().toISOString().split("T")[0],
    reason: ""
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ret }, { data: pr }, { data: mat }] = await Promise.all([
      supabase.from("material_returns").select("*, projects(name), materials(name, unit)").order("return_date", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("materials").select("id, name, unit").order("name"),
    ]);
    setReturns((ret as any) || []);
    setProjects(pr || []);
    setMaterials(mat || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsSaving(true);

    const { error } = await supabase.from("material_returns").insert({
      project_id: form.project_id,
      material_id: form.material_id,
      quantity: parseFloat(form.quantity),
      supplier_name: form.supplier_name || null,
      return_date: form.return_date,
      reason: form.reason || null,
      returned_by: profile.id,
    });

    if (error) { alert("Error: " + error.message); setIsSaving(false); return; }

    // Update site_inventory
    const { data: inv } = await supabase.from("site_inventory")
      .select("id, quantity").eq("project_id", form.project_id).eq("material_id", form.material_id).single();
    
    if (inv) {
      await supabase.from("site_inventory").update({ quantity: (inv.quantity || 0) - parseFloat(form.quantity) }).eq("id", inv.id);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ project_id: "", material_id: "", quantity: "", supplier_name: "", return_date: new Date().toISOString().split("T")[0], reason: "" });
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Material Returns</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Log damaged or excess materials returned to vendors. Auto-updates site inventory.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> New Return
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <RotateCcw className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No returns logged</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Log returns for damaged or excess materials.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Supplier</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Quantity</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {returns.map(ret => (
                <tr key={ret.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm text-[#1C1C1C]/60">{new Date(ret.return_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 font-semibold text-[#1C1C1C]">{(ret.materials as any)?.name}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/70">{(ret.projects as any)?.name || "—"}</td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-[#1C1C1C]/70">{ret.supplier_name || "—"}</td>
                  <td className="px-5 py-4 text-right font-bold text-[#1C1C1C]">
                    -{ret.quantity} <span className="text-xs font-normal text-[#1C1C1C]/50">{(ret.materials as any)?.unit}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-[#1C1C1C]/50 max-w-[200px] truncate">{ret.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl">Log Material Return</h2>
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
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Supplier Name</label>
                  <input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    placeholder="e.g. Birla Dealers"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Material *</label>
                <select required value={form.material_id} onChange={(e) => setForm({ ...form, material_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Quantity to Return *</label>
                  <input required type="number" min="0.01" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Return Date</label>
                  <input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Reason *</label>
                <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Damaged during transit"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>

              <p className="text-xs text-[#1C1C1C]/50 italic text-red-600/80">Saving this will subtract the quantity from the site inventory.</p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
