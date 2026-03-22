"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, CheckCircle2, XCircle, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

type IndentDetail = {
  id: string; indent_no: string | null; status: string; urgency: string;
  notes: string | null; created_at: string;
  projects: { name: string } | null;
};
type IndentItem = {
  id: string; quantity_requested: number; quantity_approved: number | null;
  materials: { name: string; unit: string } | null;
};

export default function IndentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { profile } = useProfile();
  const [indent, setIndent] = useState<IndentDetail | null>(null);
  const [items, setItems] = useState<IndentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ind }, { data: itm }] = await Promise.all([
      supabase.from("material_indents").select("*, projects(name)").eq("id", params.id).single(),
      supabase.from("material_indent_items").select("*, materials(name, unit)").eq("indent_id", params.id),
    ]);
    setIndent(ind as any);
    setItems((itm as any) || []);
    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (status: "approved" | "rejected") => {
    setIsActing(true);
    await supabase.from("material_indents").update({ status }).eq("id", params.id);
    await fetchAll();
    setIsActing(false);
  };

  const canApprove = profile?.role === "admin" || profile?.role === "project_manager";

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!indent) return <div className="text-center py-32 text-[#1C1C1C]/50">Indent not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/materials/indents" className="p-2 hover:bg-[#1C1C1C]/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#1C1C1C]/60" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-[#1C1C1C]">
              {indent.indent_no || `IND-${indent.id.slice(0, 6).toUpperCase()}`}
            </h1>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
              indent.status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              indent.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
              indent.status === 'fulfilled' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>{indent.status}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
              indent.urgency === 'urgent' ? 'bg-red-50 text-red-700' :
              indent.urgency === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}>{indent.urgency}</span>
          </div>
          <p className="text-sm text-[#1C1C1C]/60 mt-1">
            Project: <strong>{(indent.projects as any)?.name}</strong> •
            Raised: {new Date(indent.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      {indent.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">Notes: </span>{indent.notes}
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50/50">
          <h2 className="font-semibold text-[#1C1C1C]">Materials Requested</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1C1C1C]/5">
              <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">#</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Material</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Requested Qty</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-[#1C1C1C]/40 uppercase">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1C1C]/5">
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="px-5 py-3.5 text-[#1C1C1C]/40 text-sm">{idx + 1}</td>
                <td className="px-5 py-3.5 font-semibold text-[#1C1C1C]">{(item.materials as any)?.name}</td>
                <td className="px-5 py-3.5 text-right font-bold text-[#1C1C1C]">{item.quantity_requested}</td>
                <td className="px-5 py-3.5 text-right text-sm text-[#1C1C1C]/50">{(item.materials as any)?.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approval Actions */}
      {canApprove && indent.status === "pending" && (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm p-5 flex gap-3">
          <button onClick={() => updateStatus("rejected")} disabled={isActing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={() => updateStatus("approved")} disabled={isActing}
            className="flex-[2] flex items-center justify-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50">
            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve Indent
          </button>
        </div>
      )}
    </div>
  );
}
