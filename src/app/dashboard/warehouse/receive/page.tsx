"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftRight, Plus, Loader2, X, ArchiveRestore } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type WhReturn = {
  id: string; return_date: string; quantity: number; notes: string | null;
  projects: { name: string } | null;
  materials: { name: string; unit: string } | null;
};
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit: string };

export default function ReceivePage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [returns, setReturns] = useState<WhReturn[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ project_id: "", material_id: "", quantity: "", return_date: new Date().toISOString().split("T")[0], notes: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: p }, { data: m }] = await Promise.all([
      // A return to godown is technically a `material_transfers` record where dest_project_id is null and transfer_type is 'site_to_godown'
      supabase.from("material_transfers").select("*, projects:source_project_id(name), materials(name, unit)").eq("transfer_type", "site_to_godown").order("transfer_date", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("materials").select("id, name, unit").order("name"),
    ]);
    setReturns((r as any) || []);
    setProjects(p || []);
    setMaterials(m || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setIsSaving(true);

    const qty = parseFloat(form.quantity);

    // 1. Insert into material_transfers
    const { error } = await supabase.from("material_transfers").insert({
      source_project_id: form.project_id,
      dest_project_id: null,
      material_id: form.material_id,
      quantity: qty,
      transfer_date: form.return_date,
      transfer_type: "site_to_godown",
      notes: form.notes || null,
      transferred_by: profile.id,
    });

    if (error) { alert("Error: " + error.message); setIsSaving(false); return; }

    // 2. Subtract from site_inventory
    const { data: siteInv } = await supabase.from("site_inventory")
      .select("id, quantity").eq("project_id", form.project_id).eq("material_id", form.material_id).single();
    if (siteInv) {
      await supabase.from("site_inventory").update({ quantity: (siteInv.quantity || 0) - qty }).eq("id", siteInv.id);
    }

    // 3. Add to warehouse_inventory
    const { data: whInv } = await supabase.from("warehouse_inventory")
      .select("id, quantity").eq("company_id", profile.company_id).eq("material_id", form.material_id).single();
    if (whInv) {
      await supabase.from("warehouse_inventory").update({ quantity: (whInv.quantity || 0) + qty }).eq("id", whInv.id);
    } else {
      await supabase.from("warehouse_inventory").insert({
        company_id: profile.company_id, material_id: form.material_id, quantity: qty, avg_unit_price: 0
      });
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ project_id: "", material_id: "", quantity: "", return_date: new Date().toISOString().split("T")[0], notes: "" });
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Receive from Site</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Log surplus materials arriving back from project sites into the godown.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Receive Material
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <ArchiveRestore className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No materials received</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Materials returned from sites will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">From Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Quantity Received</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell pl-10">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {returns.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm text-[#1C1C1C]/60">{new Date(r.transfer_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#1C1C1C]/80">{(r.projects as any)?.name}</td>
                  <td className="px-5 py-4 font-bold text-[#1C1C1C]">{(r.materials as any)?.name}</td>
                  <td className="px-5 py-4 text-right font-bold text-green-600">
                    +{r.quantity} <span className="text-xs font-normal text-[#1C1C1C]/50">{(r.materials as any)?.unit}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/50 pl-10 max-w-[200px] truncate">{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-xl">Receive Material from Site</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Returned From (Project) *</label>
                <select required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select source project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
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
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Quantity Received *</label>
                  <input required type="number" step="0.01" min="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Date Received</label>
                  <input required type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Reason / Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Surplus after phase 1"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>

              <p className="text-[11px] text-green-700/80 italic border-l-2 border-green-500/30 pl-2">
                Saving will ADD quantity to the Central Godown and SUBTRACT from the Site Inventory.
              </p>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
