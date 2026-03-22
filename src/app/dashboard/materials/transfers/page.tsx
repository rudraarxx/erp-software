"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftRight, Plus, Loader2, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type Transfer = {
  id: string; transfer_type: string; quantity: number; transfer_date: string; notes: string | null;
  source_project: { name: string } | null; dest_project: { name: string } | null;
  materials: { name: string; unit: string } | null;
};
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit: string };

export default function TransfersPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    transfer_type: "site_to_site",
    source_project_id: "",
    dest_project_id: "",
    material_id: "",
    quantity: "",
    transfer_date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: tr }, { data: pr }, { data: mat }] = await Promise.all([
      supabase.from("material_transfers").select("*, source_project:source_project_id(name), dest_project:dest_project_id(name), materials(name, unit)").order("transfer_date", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("materials").select("id, name, unit").order("name"),
    ]);
    setTransfers((tr as any) || []);
    setProjects(pr || []);
    setMaterials(mat || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsSaving(true);

    const isSiteToGodown = form.transfer_type === "site_to_godown";

    const { error } = await supabase.from("material_transfers").insert({
      source_project_id: form.source_project_id || null,
      dest_project_id: isSiteToGodown ? null : form.dest_project_id,
      material_id: form.material_id,
      quantity: parseFloat(form.quantity),
      transfer_date: form.transfer_date,
      transfer_type: form.transfer_type,
      notes: form.notes || null,
      transferred_by: profile.id,
    });

    if (error) { alert("Error: " + error.message); setIsSaving(false); return; }

    // Update site_inventory
    // Decrement from source
    if (form.source_project_id) {
      const { data: sourceInv } = await supabase.from("site_inventory")
        .select("id, quantity").eq("project_id", form.source_project_id).eq("material_id", form.material_id).single();
      if (sourceInv) {
        await supabase.from("site_inventory").update({ quantity: (sourceInv.quantity || 0) - parseFloat(form.quantity) }).eq("id", sourceInv.id);
      }
    }
    
    // Increment to destination (if site to site)
    if (!isSiteToGodown && form.dest_project_id) {
      const { data: destInv } = await supabase.from("site_inventory")
        .select("id, quantity").eq("project_id", form.dest_project_id).eq("material_id", form.material_id).single();
      if (destInv) {
        await supabase.from("site_inventory").update({ quantity: (destInv.quantity || 0) + parseFloat(form.quantity) }).eq("id", destInv.id);
      } else {
        await supabase.from("site_inventory").insert({
          project_id: form.dest_project_id, material_id: form.material_id, quantity: parseFloat(form.quantity)
        });
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ transfer_type: "site_to_site", source_project_id: "", dest_project_id: "", material_id: "", quantity: "", transfer_date: new Date().toISOString().split("T")[0], notes: "" });
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Material Transfers</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Move materials between sites or return to central godown.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : transfers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <ArrowLeftRight className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No transfers yet</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Log your first material transfer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">From</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">To</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {transfers.map(tr => (
                <tr key={tr.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm text-[#1C1C1C]/60">{new Date(tr.transfer_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 font-semibold text-[#1C1C1C]">{(tr.materials as any)?.name}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/70">{(tr.source_project as any)?.name || "—"}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/70">
                    {tr.transfer_type === 'site_to_godown' ? '🏭 Godown' : (tr.dest_project as any)?.name}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-[#1C1C1C]">
                    {tr.quantity} <span className="text-xs font-normal text-[#1C1C1C]/50">{(tr.materials as any)?.unit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl">New Transfer</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Transfer Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="site_to_site" checked={form.transfer_type === "site_to_site"} onChange={(e) => setForm({ ...form, transfer_type: e.target.value })} className="accent-primary" />
                    Site to Site
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="site_to_godown" checked={form.transfer_type === "site_to_godown"} onChange={(e) => setForm({ ...form, transfer_type: e.target.value })} className="accent-primary" />
                    Site to Godown
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">From Project *</label>
                  <select required value={form.source_project_id} onChange={(e) => setForm({ ...form, source_project_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="">Select source...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {form.transfer_type === "site_to_site" && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">To Project *</label>
                    <select required value={form.dest_project_id} onChange={(e) => setForm({ ...form, dest_project_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                      <option value="">Select destination...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
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
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Quantity *</label>
                  <input required type="number" min="0.01" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Transfer Date</label>
                  <input type="date" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Reason / Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Excess material transferred..."
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>

              <p className="text-xs text-[#1C1C1C]/50 italic">Saving this will automatically subtract from the source site and add to the destination.</p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
