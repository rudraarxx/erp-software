"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Truck, Plus, X, Loader2, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type GRN = {
  id: string; grn_no: string | null; supplier_name: string; invoice_no: string | null;
  delivery_date: string; status: string; created_at: string;
  projects: { name: string } | null;
};
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit: string };

export default function GRNPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ project_id: "", supplier_name: "", invoice_no: "", delivery_date: new Date().toISOString().split("T")[0] });
  const [items, setItems] = useState([{ id: crypto.randomUUID(), material_id: "", qty_received: "", unit: "" }]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: g }, { data: p }, { data: m }] = await Promise.all([
      supabase.from("grn").select("*, projects(name)").order("delivery_date", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("materials").select("id, name, unit").order("name"),
    ]);
    setGrns((g as any) || []);
    setProjects(p || []);
    setMaterials(m || []);
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

    // 1. Insert GRN header
    const { data: grn, error } = await supabase.from("grn").insert({
      project_id: form.project_id,
      supplier_name: form.supplier_name,
      invoice_no: form.invoice_no || null,
      delivery_date: form.delivery_date,
      received_by: profile.id,
      status: "received",
    }).select("id").single();

    if (error || !grn) { alert("Error: " + error?.message); setIsSaving(false); return; }

    // 2. Insert GRN items
    const validItems = items.filter(it => it.material_id && it.qty_received);
    await supabase.from("grn_items").insert(
      validItems.map(it => ({
        grn_id: grn.id,
        material_id: it.material_id,
        qty_received: parseFloat(it.qty_received),
      }))
    );

    // 3. Update site_inventory — upsert for each material/project
    for (const it of validItems) {
      const { data: existing } = await supabase
        .from("site_inventory")
        .select("id, quantity")
        .eq("project_id", form.project_id)
        .eq("material_id", it.material_id)
        .single();

      if (existing) {
        await supabase.from("site_inventory").update({
          quantity: (existing.quantity || 0) + parseFloat(it.qty_received)
        }).eq("id", existing.id);
      } else {
        await supabase.from("site_inventory").insert({
          project_id: form.project_id,
          material_id: it.material_id,
          quantity: parseFloat(it.qty_received),
        });
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ project_id: "", supplier_name: "", invoice_no: "", delivery_date: new Date().toISOString().split("T")[0] });
    setItems([{ id: crypto.randomUUID(), material_id: "", qty_received: "", unit: "" }]);
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Goods Receipt Notes (GRN)</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Record materials received at site from vendors. Auto-updates site inventory.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> New GRN
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : grns.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <Truck className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No GRNs yet</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Create a GRN when materials arrive at site.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">GRN No.</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Supplier</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Invoice No.</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {grns.map(grn => (
                <tr key={grn.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-[#1C1C1C]">{grn.grn_no || `GRN-${grn.id.slice(0, 6).toUpperCase()}`}</td>
                  <td className="px-5 py-4 text-sm text-[#1C1C1C]/70">{grn.supplier_name}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/60">{(grn.projects as any)?.name}</td>
                  <td className="px-5 py-4 hidden lg:table-cell font-mono text-sm text-[#1C1C1C]/60">{grn.invoice_no || "—"}</td>
                  <td className="px-5 py-4 text-sm text-[#1C1C1C]/60">{new Date(grn.delivery_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{grn.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New GRN Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl">New GRN</h2>
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
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Delivery Date</label>
                  <input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Supplier Name *</label>
                  <input required value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    placeholder="e.g. Birla Cement Distributors"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Invoice / DC No.</label>
                  <input value={form.invoice_no} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })}
                    placeholder="e.g. INV-2024-345"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-[#1C1C1C]/10 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide">Materials Received</h3>
                  <button type="button" onClick={() => setItems([...items, { id: crypto.randomUUID(), material_id: "", qty_received: "", unit: "" }])}
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
                      <input type="number" min="0" step="0.01" value={item.qty_received} onChange={(e) => setItems(items.map(it => it.id === item.id ? { ...it, qty_received: e.target.value } : it))}
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
                <p className="text-xs text-[#1C1C1C]/40 mt-3 italic">Saving this GRN will automatically update the site inventory for the selected project.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  {isSaving ? "Saving & Updating Stock..." : "Save GRN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
