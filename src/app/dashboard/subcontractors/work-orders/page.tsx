"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Plus, Search, Loader2, ChevronRight, X, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";

type WorkOrder = {
  id: string;
  title: string;
  status: string;
  billing_type: string;
  total_value: number | null;
  start_date: string | null;
  end_date: string | null;
  projects: { name: string } | null;
  subcontractors: { name: string } | null;
};
type Project = { id: string; name: string };
type Subcontractor = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  approved: "bg-blue-50 text-blue-700 border border-blue-200",
  issued: "bg-green-50 text-green-700 border border-green-200",
  completed: "bg-purple-50 text-purple-700 border border-purple-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

function WorkOrdersList() {
  const supabase = createClient();
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const filterSubId = searchParams.get("sub") || "";

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    project_id: "", subcontractor_id: filterSubId, title: "",
    scope: "", billing_type: "lumpsum", total_value: "",
    start_date: "", end_date: "", penalty_clause: "",
  });
  const [lineItems, setLineItems] = useState([
    { id: crypto.randomUUID(), description: "", unit: "", rate: "", quantity: "" }
  ]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: wos }, { data: ps }, { data: ss }] = await Promise.all([
      supabase.from("work_orders").select("id, title, status, billing_type, total_value, start_date, end_date, projects(name), subcontractors(name)").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name").eq("status", "active"),
      supabase.from("subcontractors").select("id, name").eq("is_active", true),
    ]);
    setWorkOrders((wos as any) || []);
    setProjects(ps || []);
    setSubs(ss || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addLineItem = () => setLineItems([...lineItems, { id: crypto.randomUUID(), description: "", unit: "", rate: "", quantity: "" }]);
  const removeLineItem = (id: string) => { if (lineItems.length > 1) setLineItems(lineItems.filter(l => l.id !== id)); };
  const updateLineItem = (id: string, field: string, val: string) =>
    setLineItems(lineItems.map(l => l.id === id ? { ...l, [field]: val } : l));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsCreating(true);

    const { data: wo, error } = await supabase.from("work_orders").insert({
      project_id: form.project_id,
      subcontractor_id: form.subcontractor_id,
      title: form.title,
      scope: form.scope || null,
      billing_type: form.billing_type,
      total_value: form.total_value ? parseFloat(form.total_value) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      penalty_clause: form.penalty_clause || null,
      status: "draft",
      created_by: profile.id,
    }).select("id").single();

    if (error || !wo) { alert("Error: " + error?.message); setIsCreating(false); return; }

    // Insert line items
    const validItems = lineItems.filter(l => l.description.trim());
    if (validItems.length > 0) {
      await supabase.from("work_order_items").insert(
        validItems.map(l => ({
          work_order_id: wo.id,
          description: l.description,
          unit: l.unit || null,
          rate: l.rate ? parseFloat(l.rate) : null,
          quantity: l.quantity ? parseFloat(l.quantity) : null,
        }))
      );
    }

    setIsCreating(false);
    setIsModalOpen(false);
    setForm({ project_id: "", subcontractor_id: filterSubId, title: "", scope: "", billing_type: "lumpsum", total_value: "", start_date: "", end_date: "", penalty_clause: "" });
    setLineItems([{ id: crypto.randomUUID(), description: "", unit: "", rate: "", quantity: "" }]);
    fetchAll();
  };

  const canManage = profile?.role === "admin" || profile?.role === "project_manager";

  const filtered = workOrders.filter(wo => {
    const matchSearch = wo.title.toLowerCase().includes(search.toLowerCase()) ||
      ((wo.subcontractors as any)?.name?.toLowerCase().includes(search.toLowerCase()));
    const matchSub = !filterSubId || (wo as any).subcontractor_id === filterSubId;
    return matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Work Orders</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Track subcontractor work orders across all projects.</p>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New Work Order
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search work orders..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <FileText className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No work orders yet</h2>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C1C1C]/5 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide">Work Order</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide hidden md:table-cell">Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide hidden lg:table-cell">Contractor</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide hidden lg:table-cell">Value</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {filtered.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1C1C1C]">{wo.title}</p>
                    <p className="text-xs text-[#1C1C1C]/50 mt-0.5 capitalize">{wo.billing_type.replace('_', ' ')} basis</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-sm text-[#1C1C1C]/70">
                      <MapPin className="w-3.5 h-3.5 text-[#1C1C1C]/30" />
                      {(wo.projects as any)?.name || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-[#1C1C1C]/70">{(wo.subcontractors as any)?.name || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLORS[wo.status] || ''}`}>{wo.status}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm font-semibold text-[#1C1C1C]">
                    {wo.total_value ? `₹${wo.total_value.toLocaleString('en-IN')}` : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/subcontractors/work-orders/${wo.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-all">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl">New Work Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#1C1C1C]/5 rounded-full"><X className="w-5 h-5 text-[#1C1C1C]/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
              {/* Core Fields */}
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
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Subcontractor *</label>
                  <select required value={form.subcontractor_id} onChange={(e) => setForm({ ...form, subcontractor_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="">Select contractor...</option>
                    {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Work Order Title *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. External Plastering - Block A"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Scope of Work</label>
                  <textarea rows={2} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}
                    placeholder="Brief description of what the contractor will do..."
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Billing Type</label>
                  <select value={form.billing_type} onChange={(e) => setForm({ ...form, billing_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="lumpsum">Lump Sum</option>
                    <option value="measurement">Measurement Basis</option>
                    <option value="upload">Bill Upload</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Total Value (₹)</label>
                  <input type="number" min="0" value={form.total_value} onChange={(e) => setForm({ ...form, total_value: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Penalty Clause</label>
                  <input value={form.penalty_clause} onChange={(e) => setForm({ ...form, penalty_clause: e.target.value })}
                    placeholder="e.g. ₹5,000 per day delay beyond agreed date"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-[#1C1C1C]/10 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wide">BOQ / Line Items</h3>
                  <button type="button" onClick={addLineItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <span className="text-xs text-[#1C1C1C]/30 w-5 shrink-0 text-right">{idx + 1}.</span>
                      <input value={item.description} onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder="Item description" className="flex-[4] px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                      <input value={item.unit} onChange={(e) => updateLineItem(item.id, "unit", e.target.value)}
                        placeholder="Unit" className="flex-1 px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                      <input type="number" value={item.rate} onChange={(e) => updateLineItem(item.id, "rate", e.target.value)}
                        placeholder="Rate ₹" className="flex-1 px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                      <input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)}
                        placeholder="Qty" className="flex-1 px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                      <button type="button" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}
                        className="w-9 h-9 flex items-center justify-center text-[#1C1C1C]/30 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#1C1C1C]/10 text-sm font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5">Cancel</button>
                <button type="submit" disabled={isCreating}
                  className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isCreating ? "Creating..." : "Create Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#1C1C1C]/60">Loading...</div>}>
      <WorkOrdersList />
    </Suspense>
  );
}
