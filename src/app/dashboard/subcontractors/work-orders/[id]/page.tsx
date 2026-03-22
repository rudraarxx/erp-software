"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, CheckCircle2, ClipboardList, TrendingUp, Receipt, Package,
  Plus, Loader2, Trash2, X, Printer
} from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

type WO = {
  id: string; title: string; scope: string | null; status: string;
  billing_type: string; total_value: number | null;
  start_date: string | null; end_date: string | null; penalty_clause: string | null;
  projects: { name: string } | null;
  subcontractors: { name: string; phone: string | null } | null;
};
type WOItem = { id: string; description: string; unit: string | null; rate: number | null; quantity: number | null; completed_qty: number; amount: number | null; };
type Progress = { id: string; date: string; mode: string; value: number; reason: string | null; };
type Bill = { id: string; bill_type: string; amount: number | null; status: string; bill_url: string | null; submitted_at: string; notes: string | null; };
type MaterialIssued = { id: string; quantity: number; unit: string | null; issued_date: string; notes: string | null; };

const STATUS_FLOW: Record<string, string | null> = {
  draft: "approved", approved: "issued", issued: "completed", completed: null, cancelled: null,
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Approve WO", approved: "Mark as Issued", issued: "Mark Complete",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  approved: "bg-blue-50 text-blue-700 border border-blue-200",
  issued: "bg-green-50 text-green-700 border border-green-200",
  completed: "bg-purple-50 text-purple-700 border border-purple-200",
};
const TABS = ["Items", "Progress", "Billing", "Materials"] as const;
type Tab = typeof TABS[number];

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { profile } = useProfile();
  const [wo, setWo] = useState<WO | null>(null);
  const [items, setItems] = useState<WOItem[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [materialsIssued, setMaterialsIssued] = useState<MaterialIssued[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Items");
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Progress Modal
  const [progModal, setProgModal] = useState(false);
  const [progForm, setProgForm] = useState({ mode: "percentage", value: "", item_id: "", reason: "" });
  const [savingProg, setSavingProg] = useState(false);

  // Bill Modal
  const [billModal, setBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ amount: "", bill_url: "", notes: "" });
  const [savingBill, setSavingBill] = useState(false);

  // Materials Modal
  const [matModal, setMatModal] = useState(false);
  const [matForm, setMatForm] = useState({ quantity: "", unit: "", notes: "", issued_date: new Date().toISOString().split("T")[0] });
  const [savingMat, setSavingMat] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: woData }, { data: itemData }, { data: progData }, { data: billData }, { data: matData }] = await Promise.all([
      supabase.from("work_orders").select("*, projects(name), subcontractors(name, phone)").eq("id", params.id).single(),
      supabase.from("work_order_items").select("*").eq("work_order_id", params.id).order("created_at"),
      supabase.from("work_order_progress").select("*").eq("work_order_id", params.id).order("date", { ascending: false }),
      supabase.from("subcontractor_bills").select("*").eq("work_order_id", params.id).order("submitted_at", { ascending: false }),
      supabase.from("material_issued_to_sub").select("*").eq("work_order_id", params.id).order("issued_date", { ascending: false }),
    ]);
    setWo(woData as any);
    setItems((itemData as any) || []);
    setProgress((progData as any) || []);
    setBills((billData as any) || []);
    setMaterialsIssued((matData as any) || []);
    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const canManage = profile?.role === "admin" || profile?.role === "project_manager";

  const advanceStatus = async () => {
    if (!wo || !STATUS_FLOW[wo.status]) return;
    setIsAdvancing(true);
    await supabase.from("work_orders").update({ status: STATUS_FLOW[wo.status] }).eq("id", wo.id);
    await fetchAll();
    setIsAdvancing(false);
  };

  const saveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSavingProg(true);
    await supabase.from("work_order_progress").insert({
      work_order_id: params.id,
      date: new Date().toISOString().split("T")[0],
      mode: progForm.mode,
      value: parseFloat(progForm.value),
      item_id: progForm.item_id || null,
      reason: progForm.reason || null,
      submitted_by: profile.id,
    });
    setSavingProg(false);
    setProgModal(false);
    setProgForm({ mode: "percentage", value: "", item_id: "", reason: "" });
    fetchAll();
  };

  const saveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBill(true);
    await supabase.from("subcontractor_bills").insert({
      work_order_id: params.id,
      bill_type: wo?.billing_type || "lumpsum",
      amount: billForm.amount ? parseFloat(billForm.amount) : null,
      bill_url: billForm.bill_url || null,
      notes: billForm.notes || null,
      status: "submitted",
    });
    setSavingBill(false);
    setBillModal(false);
    setBillForm({ amount: "", bill_url: "", notes: "" });
    fetchAll();
  };

  const saveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSavingMat(true);
    await supabase.from("material_issued_to_sub").insert({
      work_order_id: params.id,
      quantity: parseFloat(matForm.quantity),
      unit: matForm.unit || null,
      issued_date: matForm.issued_date,
      issued_by: profile.id,
      notes: matForm.notes || null,
    });
    setSavingMat(false);
    setMatModal(false);
    setMatForm({ quantity: "", unit: "", notes: "", issued_date: new Date().toISOString().split("T")[0] });
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!wo) return <div className="text-center py-32 text-[#1C1C1C]/50">Work order not found.</div>;

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/subcontractors/work-orders" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg mt-1 transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-heading font-bold text-[#1C1C1C] truncate">{wo.title}</h1>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[wo.status] || 'bg-gray-100 text-gray-700'}`}>
              {wo.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#1C1C1C]/60">
            <span>📁 {(wo.projects as any)?.name}</span>
            <span>🏗 {(wo.subcontractors as any)?.name}</span>
            {wo.total_value && <span>💰 ₹{wo.total_value.toLocaleString('en-IN')}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/subcontractors/work-orders/${params.id}/print`} target="_blank"
            className="flex items-center gap-2 bg-white border border-[#1C1C1C]/15 hover:border-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
            <Printer className="w-4 h-4" /> Print WO
          </Link>
          {canManage && STATUS_FLOW[wo.status] && (
            <button onClick={advanceStatus} disabled={isAdvancing}
              className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50">
              {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {STATUS_LABEL[wo.status]}
            </button>
          )}
        </div>
      </div>

      {/* Scope / Notes */}
      {wo.scope && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-900">
          <span className="font-semibold">Scope: </span>{wo.scope}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#1C1C1C]/10 flex gap-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors rounded-t-lg -mb-px border-b-2 ${
              activeTab === tab
                ? "text-primary border-primary"
                : "text-[#1C1C1C]/50 border-transparent hover:text-[#1C1C1C]"
            }`}>
            {tab === "Items" && <ClipboardList className="w-4 h-4 inline mr-1.5" />}
            {tab === "Progress" && <TrendingUp className="w-4 h-4 inline mr-1.5" />}
            {tab === "Billing" && <Receipt className="w-4 h-4 inline mr-1.5" />}
            {tab === "Materials" && <Package className="w-4 h-4 inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">

        {/* ITEMS TAB */}
        {activeTab === "Items" && (
          <div>
            {items.length === 0 ? (
              <div className="p-12 text-center text-[#1C1C1C]/50">No line items added to this work order.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">#</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Description</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Unit</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Qty</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Rate ₹</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Amount ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]/5">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-5 py-3.5 text-[#1C1C1C]/40">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-[#1C1C1C] font-medium">{item.description}</td>
                      <td className="px-5 py-3.5 text-[#1C1C1C]/60">{item.unit || "—"}</td>
                      <td className="px-5 py-3.5 text-right text-[#1C1C1C]/70">{item.quantity ?? "—"}</td>
                      <td className="px-5 py-3.5 text-right text-[#1C1C1C]/70">{item.rate ? item.rate.toLocaleString('en-IN') : "—"}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[#1C1C1C]">
                        {item.amount ? `₹${item.amount.toLocaleString('en-IN')}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#1C1C1C]/10 bg-gray-50">
                    <td colSpan={5} className="px-5 py-3.5 text-right text-sm font-bold text-[#1C1C1C]">Total</td>
                    <td className="px-5 py-3.5 text-right text-base font-bold text-[#1C1C1C]">₹{totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "Progress" && (
          <div>
            <div className="px-5 py-4 border-b border-[#1C1C1C]/5 flex justify-between items-center">
              <span className="text-sm font-semibold text-[#1C1C1C]/60">{progress.length} entries</span>
              <button onClick={() => setProgModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" /> Log Progress
              </button>
            </div>
            {progress.length === 0 ? (
              <div className="p-12 text-center text-[#1C1C1C]/50">No progress entries yet. Log your first update.</div>
            ) : (
              <div className="divide-y divide-[#1C1C1C]/5">
                {progress.map(p => (
                  <div key={p.id} className="px-5 py-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.mode === 'percentage' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                          {p.mode}
                        </span>
                        <span className="font-bold text-lg text-[#1C1C1C]">
                          {p.value}{p.mode === 'percentage' ? '%' : ' units'}
                        </span>
                      </div>
                      {p.reason && <p className="text-sm text-[#1C1C1C]/60 mt-1">{p.reason}</p>}
                    </div>
                    <span className="text-xs text-[#1C1C1C]/40">{new Date(p.date).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === "Billing" && (
          <div>
            <div className="px-5 py-4 border-b border-[#1C1C1C]/5 flex justify-between items-center">
              <span className="text-sm font-semibold text-[#1C1C1C]/60 capitalize">Billing Type: {wo.billing_type.replace('_', ' ')}</span>
              <button onClick={() => setBillModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" /> Submit Bill
              </button>
            </div>
            {bills.length === 0 ? (
              <div className="p-12 text-center text-[#1C1C1C]/50">No bills submitted yet.</div>
            ) : (
              <div className="divide-y divide-[#1C1C1C]/5">
                {bills.map(bill => (
                  <div key={bill.id} className="px-5 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#1C1C1C]">₹{bill.amount?.toLocaleString('en-IN') ?? "—"}</p>
                      {bill.notes && <p className="text-sm text-[#1C1C1C]/60 mt-0.5">{bill.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full block mb-1 ${
                        bill.status === 'paid' ? 'bg-green-50 text-green-700' :
                        bill.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{bill.status}</span>
                      <span className="text-xs text-[#1C1C1C]/40">{new Date(bill.submitted_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === "Materials" && (
          <div>
            <div className="px-5 py-4 border-b border-[#1C1C1C]/5 flex justify-between items-center">
              <span className="text-sm font-semibold text-[#1C1C1C]/60">{materialsIssued.length} issuances</span>
              <button onClick={() => setMatModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" /> Issue Material
              </button>
            </div>
            {materialsIssued.length === 0 ? (
              <div className="p-12 text-center text-[#1C1C1C]/50">No materials issued to this subcontractor yet.</div>
            ) : (
              <div className="divide-y divide-[#1C1C1C]/5">
                {materialsIssued.map(m => (
                  <div key={m.id} className="px-5 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#1C1C1C]">{m.quantity} {m.unit ?? ""}</p>
                      {m.notes && <p className="text-sm text-[#1C1C1C]/60 mt-0.5">{m.notes}</p>}
                    </div>
                    <span className="text-xs text-[#1C1C1C]/40">{new Date(m.issued_date).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROGRESS MODAL */}
      {progModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setProgModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-bold text-xl mb-5">Log Progress</h2>
            <form onSubmit={saveProgress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Type</label>
                  <select value={progForm.mode} onChange={(e) => setProgForm({ ...progForm, mode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="percentage">Percentage (%)</option>
                    <option value="quantity">Quantity (units)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Value *</label>
                  <input required type="number" min="0" step="0.01" value={progForm.value} onChange={(e) => setProgForm({ ...progForm, value: e.target.value })}
                    placeholder={progForm.mode === "percentage" ? "e.g. 40" : "e.g. 120"}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>
              {items.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Against Line Item (optional)</label>
                  <select value={progForm.item_id} onChange={(e) => setProgForm({ ...progForm, item_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="">Overall progress</option>
                    {items.map(item => <option key={item.id} value={item.id}>{item.description}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Reason / Notes</label>
                <textarea rows={2} value={progForm.reason} onChange={(e) => setProgForm({ ...progForm, reason: e.target.value })}
                  placeholder="Any constraints or delays..."
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setProgModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={savingProg} className="flex-[2] bg-[#1C1C1C] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {savingProg ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL MODAL */}
      {billModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setBillModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-bold text-xl mb-5">Submit Bill</h2>
            <form onSubmit={saveBill} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Bill Amount (₹)</label>
                <input type="number" min="0" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  placeholder="e.g. 250000"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Bill Document URL (optional)</label>
                <input type="url" value={billForm.bill_url} onChange={(e) => setBillForm({ ...billForm, bill_url: e.target.value })}
                  placeholder="https://... (PDF link)"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Notes</label>
                <textarea rows={2} value={billForm.notes} onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                  placeholder="Any notes about this bill..."
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBillModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={savingBill} className="flex-[2] bg-[#1C1C1C] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {savingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATERIALS MODAL */}
      {matModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setMatModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-bold text-xl mb-5">Issue Material</h2>
            <form onSubmit={saveMaterial} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Quantity *</label>
                  <input required type="number" min="0" step="0.01" value={matForm.quantity} onChange={(e) => setMatForm({ ...matForm, quantity: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Unit</label>
                  <input value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}
                    placeholder="e.g. bags, nos"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Issue Date</label>
                <input type="date" value={matForm.issued_date} onChange={(e) => setMatForm({ ...matForm, issued_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Description / Notes *</label>
                <input required value={matForm.notes} onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })}
                  placeholder="e.g. 50 bags of OPC Cement"
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMatModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold text-[#1C1C1C]/60">Cancel</button>
                <button type="submit" disabled={savingMat} className="flex-[2] bg-[#1C1C1C] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {savingMat ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Issuance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
