"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Warehouse, Plus, Loader2, X, Search, Calculator } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type WhInventory = {
  id: string; material_id: string; quantity: number; avg_unit_price: number;
  materials: { name: string; unit: string; category: string | null; code: string | null } | null;
};
type Material = { id: string; name: string; unit: string; category: string | null };

export default function WarehouseStockPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [inventory, setInventory] = useState<WhInventory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal for Direct Stock Adjustment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ material_id: "", quantity: "", avg_unit_price: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: inv }, { data: mat }] = await Promise.all([
      supabase.from("warehouse_inventory").select("*, materials(name, unit, category, code)"),
      supabase.from("materials").select("id, name, unit, category").order("name"),
    ]);
    setInventory((inv as any) || []);
    setMaterials(mat || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setIsSaving(true);

    const { data: existing } = await supabase.from("warehouse_inventory")
      .select("id").eq("company_id", profile.company_id).eq("material_id", form.material_id).single();

    if (existing) {
      const { error } = await supabase.from("warehouse_inventory").update({
        quantity: parseFloat(form.quantity),
        avg_unit_price: parseFloat(form.avg_unit_price),
        updated_at: new Date().toISOString()
      }).eq("id", existing.id);
      if (error) alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from("warehouse_inventory").insert({
        company_id: profile.company_id,
        material_id: form.material_id,
        quantity: parseFloat(form.quantity),
        avg_unit_price: parseFloat(form.avg_unit_price)
      });
      if (error) alert("Error: " + error.message);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setForm({ material_id: "", quantity: "", avg_unit_price: "" });
    fetchAll();
  };

  const filtered = inventory.filter(inv => {
    const s = search.toLowerCase();
    const m = inv.materials as any;
    return !search || (m?.name?.toLowerCase().includes(s) || m?.code?.toLowerCase().includes(s));
  });

  const totalValuation = filtered.reduce((sum, item) => sum + (item.quantity * item.avg_unit_price), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Central Stock & Valuation</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Live stock holding at the central godown and its total value.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Direct Adjust Stock
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search central stock..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#1C1C1C]/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Godown Value</p>
            <p className="text-2xl font-bold text-blue-950 mt-1">₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
          <Calculator className="w-8 h-8 text-blue-200" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <Warehouse className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No stock in godown</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Use the Direct Adjust button to set opening balances.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">Category</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Quantity In Stock</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Avg. Unit Price</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {filtered.map(inv => {
                const isOut = inv.quantity <= 0;
                const val = inv.quantity * inv.avg_unit_price;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#1C1C1C]">
                      {(inv.materials as any)?.name}
                      {((inv.materials as any)?.code) && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">{(inv.materials as any)?.code}</span>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-sm text-[#1C1C1C]/50">{(inv.materials as any)?.category || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-lg font-bold ${isOut ? 'text-red-500' : 'text-[#1C1C1C]'}`}>{inv.quantity}</span>
                      <span className="text-xs text-[#1C1C1C]/50 ml-1">{(inv.materials as any)?.unit}</span>
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell text-sm text-[#1C1C1C]/60">
                      ₹{inv.avg_unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-green-700">
                      ₹{val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-xl">Adjust Godown Stock</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Material *</label>
                <select required value={form.material_id} onChange={(e) => {
                    const existing = inventory.find(i => i.material_id === e.target.value);
                    setForm({ ...form, material_id: e.target.value, quantity: existing?.quantity.toString() || "", avg_unit_price: existing?.avg_unit_price.toString() || "" });
                  }}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Godown Quantity *</label>
                  <input required type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Avg. Unit Price (₹) *</label>
                  <input required type="number" step="0.01" value={form.avg_unit_price} onChange={(e) => setForm({ ...form, avg_unit_price: e.target.value })}
                    placeholder="e.g. 350.50"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <p className="text-[11px] text-[#1C1C1C]/50 italic border-l-2 border-primary/30 pl-2">
                This directly overrides the godown quantity and unit price. Use for opening balances or manual corrections.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
