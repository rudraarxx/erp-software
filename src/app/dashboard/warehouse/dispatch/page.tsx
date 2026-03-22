"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Truck, Plus, Loader2, X, ChevronRight, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

type Challan = {
  id: string; challan_no: string | null; dispatch_date: string; driver_name: string | null; vehicle_no: string | null; status: string;
  projects: { name: string } | null;
};
type Project = { id: string; name: string };
type WhInventory = { material_id: string; quantity: number; avg_unit_price: number; materials: { name: string; unit: string } | null };

export default function DispatchPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stock, setStock] = useState<WhInventory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ project_id: "", driver_name: "", vehicle_no: "", dispatch_date: new Date().toISOString().split("T")[0] });
  const [items, setItems] = useState([{ id: crypto.randomUUID(), material_id: "", quantity: "", unit: "", max_qty: 0 }]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ch }, { data: pr }, { data: st }] = await Promise.all([
      supabase.from("delivery_challans").select("*, projects(name)").order("dispatch_date", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("warehouse_inventory").select("material_id, quantity, avg_unit_price, materials(name, unit)").gt("quantity", 0).order("material_id"),
    ]);
    setChallans((ch as any) || []);
    setProjects(pr || []);
    setStock((st as any) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pickMaterial = (id: string, matId: string) => {
    const s = stock.find(m => m.material_id === matId);
    setItems(items.map(it => it.id === id ? { ...it, material_id: matId, unit: (s?.materials as any)?.unit || "", max_qty: s ? s.quantity : 0 } : it));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setIsSaving(true);

    const validItems = items.filter(it => it.material_id && parseFloat(it.quantity) > 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid material with quantity > 0.");
      setIsSaving(false);
      return;
    }

    // 1. Create DC Header
    const { data: dc, error: dcErr } = await supabase.from("delivery_challans").insert({
      company_id: profile.company_id,
      project_id: form.project_id,
      driver_name: form.driver_name || null,
      vehicle_no: form.vehicle_no || null,
      dispatch_date: form.dispatch_date,
      dispatched_by: profile.id,
      status: "dispatched"
    }).select("id").single();

    if (dcErr || !dc) { alert("Error generating challan: " + dcErr?.message); setIsSaving(false); return; }

    // 2. Create DC Items
    await supabase.from("delivery_challan_items").insert(
      validItems.map(it => ({ challan_id: dc.id, material_id: it.material_id, quantity: parseFloat(it.quantity) }))
    );

    // 3. Update Inventory (Warehouse -, Site +)
    for (const it of validItems) {
      const qty = parseFloat(it.quantity);
      
      // Godown subtract
      const { data: whInv } = await supabase.from("warehouse_inventory")
        .select("id, quantity").eq("company_id", profile.company_id).eq("material_id", it.material_id).single();
      if (whInv) await supabase.from("warehouse_inventory").update({ quantity: (whInv.quantity || 0) - qty }).eq("id", whInv.id);

      // Site add
      const { data: siteInv } = await supabase.from("site_inventory")
        .select("id, quantity").eq("project_id", form.project_id).eq("material_id", it.material_id).single();
      if (siteInv) {
        await supabase.from("site_inventory").update({ quantity: (siteInv.quantity || 0) + qty }).eq("id", siteInv.id);
      } else {
        await supabase.from("site_inventory").insert({ project_id: form.project_id, material_id: it.material_id, quantity: qty });
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ project_id: "", driver_name: "", vehicle_no: "", dispatch_date: new Date().toISOString().split("T")[0] });
    setItems([{ id: crypto.randomUUID(), material_id: "", quantity: "", unit: "", max_qty: 0 }]);
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Dispatch to Site</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Generate Delivery Challans and transfer materials from Godown to Project Sites.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> New Dispatch (DC)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : challans.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <Truck className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No Delivery Challans generated</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Dispatches from godown will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">DC Number</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">To Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Driver / Vehicle</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {challans.map(ch => (
                <tr key={ch.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4 font-semibold text-[#1C1C1C]">{ch.challan_no || `DC-${ch.id.slice(0, 6).toUpperCase()}`}</td>
                  <td className="px-5 py-4 text-sm text-[#1C1C1C]/60">{new Date(ch.dispatch_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/70">{(ch.projects as any)?.name}</td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-[#1C1C1C]/60 truncate max-w-[150px]">
                    {ch.driver_name || ch.vehicle_no ? `${ch.driver_name || ''} ${ch.vehicle_no ? `(${ch.vehicle_no})` : ''}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {ch.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/warehouse/dispatch/${ch.id}/print`} target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-all">
                      <FileText className="w-3.5 h-3.5" /> Print DC
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl">Generate Delivery Challan</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6 overflow-y-auto">
              {stock.length === 0 && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-200">
                  Godown has zero stock left for all materials. You cannot dispatch anything right now. Add stock first.
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Destination Project *</label>
                  <select required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="">Select receiver project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Dispatch Date</label>
                  <input type="date" value={form.dispatch_date} onChange={(e) => setForm({ ...form, dispatch_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Driver Name</label>
                  <input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                    placeholder="e.g. Ramesh Singh" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Vehicle / Lorry No.</label>
                  <input value={form.vehicle_no} onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })}
                    placeholder="e.g. MH-12-AB-1234" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              {/* Items List */}
              <div className="border border-[#1C1C1C]/10 rounded-xl overflow-hidden">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-[#1C1C1C]/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide">Materials to Dispatch</h3>
                  <button type="button" onClick={() => setItems([...items, { id: crypto.randomUUID(), material_id: "", quantity: "", unit: "", max_qty: 0 }])}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <span className="text-xs font-bold text-[#1C1C1C]/30 w-5 pt-3 text-right">{idx + 1}.</span>
                      <div className="flex-[3]">
                        <select required value={item.material_id} onChange={(e) => pickMaterial(item.id, e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                          <option value="">Select material from godown...</option>
                          {stock.map(s => <option key={s.material_id} value={s.material_id}>{(s.materials as any)?.name} (Max {s.quantity})</option>)}
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <input required type="number" min="0.01" step="0.01" max={item.max_qty || undefined} value={item.quantity} onChange={(e) => setItems(items.map(it => it.id === item.id ? { ...it, quantity: e.target.value } : it))}
                          placeholder="Qty" className="w-full pl-3 pr-10 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#1C1C1C]/40">{item.unit}</span>
                      </div>
                      <button type="button" onClick={() => { if (items.length > 1) setItems(items.filter(it => it.id !== item.id)); }} disabled={items.length === 1}
                        className="w-10 h-10 shrink-0 flex items-center justify-center text-[#1C1C1C]/30 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-[#1C1C1C]/40 italic pl-8 mt-2">
                    Saving generates a delivery challan, removes stock from Godown, and adds it to the Site Inventory Ledger.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border text-sm font-bold text-[#1C1C1C]/60 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSaving || stock.length === 0} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Delivery Challan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
