"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Plus, Search, Loader2, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type Material = {
  id: string; name: string; code: string | null;
  unit: string; category: string | null; description: string | null;
};

const CATEGORIES = ["Cement & Concrete", "Steel & Metal", "Sand & Aggregate", "Bricks & Blocks", "Timber & Wood", "Electrical", "Plumbing", "Finishing", "Hardware", "Other"];

export default function MaterialMasterPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", unit: "nos", category: "", description: "" });

  useEffect(() => { fetchMaterials(); }, []);

  async function fetchMaterials() {
    setLoading(true);
    const { data } = await supabase.from("materials").select("*").order("category").order("name");
    setMaterials(data || []);
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setIsSaving(true);
    const { error } = await supabase.from("materials").insert({
      company_id: profile.company_id,
      name: form.name, code: form.code || null,
      unit: form.unit, category: form.category || null,
      description: form.description || null,
    });
    setIsSaving(false);
    if (!error) {
      setIsModalOpen(false);
      setForm({ name: "", code: "", unit: "nos", category: "", description: "" });
      fetchMaterials();
    } else alert("Error: " + error.message);
  };

  const canManage = profile?.role === "admin" || profile?.role === "storekeeper";
  const filtered = materials.filter(m =>
    (m.name.toLowerCase().includes(search.toLowerCase()) || (m.code?.toLowerCase().includes(search.toLowerCase()))) &&
    (!filterCat || m.category === filterCat)
  );

  // Group by category
  const grouped = filtered.reduce((acc, mat) => {
    const cat = mat.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mat);
    return acc;
  }, {} as Record<string, Material[]>);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Material Master</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Your central catalogue of all construction materials.</p>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <Package className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No materials yet</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Add materials to start tracking inventory.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, mats]) => (
            <div key={category}>
              <h2 className="text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-widest mb-2">{category}</h2>
              <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1C1C1C]/5 bg-gray-50/50">
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden md:table-cell">Code</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Unit</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C1C]/5">
                    {mats.map(mat => (
                      <tr key={mat.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-[#1C1C1C]">{mat.name}</td>
                        <td className="px-5 py-3.5 hidden md:table-cell font-mono text-sm text-[#1C1C1C]/50">{mat.code || "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70 text-xs font-bold px-2 py-1 rounded">{mat.unit}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-[#1C1C1C]/50">{mat.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-xl">Add Material</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Material Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. OPC Cement 53 Grade"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Item Code</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. CEM-001"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Unit *</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    {["bags", "kg", "tons", "nos", "rft", "sq.m", "cu.m", "liters", "sets", "pairs"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Any specs or notes..."
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
