"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Loader2, Search, AlertTriangle } from "lucide-react";

type InventoryItem = {
  id: string; project_id: string; material_id: string; quantity: number;
  projects: { name: string } | null;
  materials: { name: string; unit: string; category: string | null; code: string | null } | null;
};
type Project = { id: string; name: string };

const LOW_STOCK_THRESHOLD = 20; // Generic threshold for MVP

export default function InventoryLedgerPage() {
  const supabase = createClient();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: inv }, { data: pr }] = await Promise.all([
      supabase.from("site_inventory").select("*, projects(name), materials(name, unit, category, code)"),
      supabase.from("projects").select("id, name").eq("status", "active"),
    ]);
    setInventory((inv as any) || []);
    setProjects(pr || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // If no project selected, show all, otherwise filter
  const filtered = inventory.filter(inv => {
    if (selectedProject && inv.project_id !== selectedProject) return false;
    const searchLow = search.toLowerCase();
    const matName = (inv.materials as any)?.name?.toLowerCase() || "";
    const matCode = (inv.materials as any)?.code?.toLowerCase() || "";
    if (search && !matName.includes(searchLow) && !matCode.includes(searchLow)) return false;
    // Don't show strictly 0 unless specifically desired, but for inventory it's okay to show 0
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Site Inventory Ledger</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Real-time material stock per project. Updated by GRNs, Transfers, and Returns.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[200px]">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <BarChart3 className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No stock found</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Adjust filters or record a GRN to add stock.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase hidden lg:table-cell">Category</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase">In Stock</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase pl-10">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {filtered.map(inv => {
                const isLow = inv.quantity <= LOW_STOCK_THRESHOLD && inv.quantity > 0;
                const isOut = inv.quantity <= 0;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-[#1C1C1C]/70">{(inv.projects as any)?.name}</td>
                    <td className="px-5 py-4 font-semibold text-[#1C1C1C]">
                      {(inv.materials as any)?.name}
                      {((inv.materials as any)?.code) && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">{(inv.materials as any)?.code}</span>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-sm text-[#1C1C1C]/50">{(inv.materials as any)?.category || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-lg font-bold ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-[#1C1C1C]'}`}>{inv.quantity}</span>
                      <span className="text-xs text-[#1C1C1C]/50 ml-1">{(inv.materials as any)?.unit}</span>
                    </td>
                    <td className="px-5 py-4 pl-10">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
