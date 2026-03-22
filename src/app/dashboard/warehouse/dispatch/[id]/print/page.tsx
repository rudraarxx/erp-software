"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Printer } from "lucide-react";

type Challan = {
  id: string; challan_no: string | null; dispatch_date: string;
  driver_name: string | null; vehicle_no: string | null; status: string;
  projects: { name: string; location: string | null; client_name: string | null } | null;
  companies: { name: string; address: string | null; gst_no: string | null; email: string | null; phone: string | null } | null;
};
type Item = { id: string; quantity: number; materials: { name: string; unit: string; code: string | null } | null };

export default function DispatchPrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrintData = useCallback(async () => {
    setLoading(true);
    const [{ data: dc }, { data: itm }] = await Promise.all([
      supabase.from("delivery_challans").select("*, projects(name, location, client_name), companies(name, address, gst_no, email, phone)").eq("id", params.id).single(),
      supabase.from("delivery_challan_items").select("*, materials(name, unit, code)").eq("challan_id", params.id),
    ]);
    setChallan(dc as any);
    setItems((itm as any) || []);
    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => { fetchPrintData(); }, [fetchPrintData]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!challan) return <div className="text-center py-20 text-[#1C1C1C]/50 font-semibold p-4">Delivery Challan not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans text-[#1C1C1C]">
      {/* Print Controls (Hidden when printing) */}
      <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[#1C1C1C]/10 print:hidden">
        <div>
          <h2 className="font-bold text-lg">Delivery Challan Preview</h2>
          <p className="text-sm text-[#1C1C1C]/60">Review before saving as PDF or printing.</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* A4 Document Area */}
      <div className="max-w-[21cm] min-h-[29.7cm] mx-auto bg-white shadow-xl PrintArea pb-24 relative overflow-hidden ring-1 ring-[#1C1C1C]/10">
        
        {/* Header - Letterhead style */}
        <div className="p-10 border-b-2 border-[#1C1C1C] flex justify-between items-start">
          <div className="max-w-[60%]">
            <h1 className="text-3xl font-black font-heading tracking-tight text-primary uppercase">
              {(challan.companies as any)?.name}
            </h1>
            <p className="text-sm mt-2 font-medium text-[#1C1C1C]/70">{(challan.companies as any)?.address || "Head Office / Godown"}</p>
            {((challan.companies as any)?.gst_no) && <p className="text-sm font-mono mt-1 pt-1 border-t w-max">GSTIN: {(challan.companies as any)?.gst_no}</p>}
            <p className="text-xs mt-1 text-[#1C1C1C]/50">
              {[(challan.companies as any)?.email, (challan.companies as any)?.phone].filter(Boolean).join(" • ")}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black tracking-widest text-[#1C1C1C]/20 uppercase">Delivery Challan</h2>
            <div className="mt-4 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg p-3 inline-block text-left min-w-[180px]">
              <p className="text-[10px] font-bold text-[#1C1C1C]/40 uppercase tracking-wider mb-1">DC No / Date</p>
              <p className="font-mono font-bold text-lg">{challan.challan_no || `DC-${challan.id.slice(0,6).toUpperCase()}`}</p>
              <p className="text-sm font-semibold text-primary">{new Date(challan.dispatch_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Dispatch details grid */}
        <div className="px-10 py-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-black text-[#1C1C1C]/40 uppercase tracking-widest mb-3 border-b pb-1">Delivery To (Site)</h3>
            <p className="font-bold text-lg">{(challan.projects as any)?.name}</p>
            {((challan.projects as any)?.client_name) && <p className="text-sm mt-1 font-medium">Client: {(challan.projects as any)?.client_name}</p>}
            {((challan.projects as any)?.location) && <p className="text-sm mt-1 text-[#1C1C1C]/70">Location: {(challan.projects as any)?.location}</p>}
          </div>
          <div>
            <h3 className="text-xs font-black text-[#1C1C1C]/40 uppercase tracking-widest mb-3 border-b pb-1">Transport Details</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-[#1C1C1C]/50">Driver Name:</span>
              <span className="font-semibold">{challan.driver_name || "N/A"}</span>
              <span className="text-[#1C1C1C]/50">Vehicle No:</span>
              <span className="font-semibold uppercase">{challan.vehicle_no || "N/A"}</span>
              <span className="text-[#1C1C1C]/50">Dispatched By:</span>
              <span className="font-semibold">Godown Manager</span>
            </div>
          </div>
        </div>

        {/* Materials Table */}
        <div className="px-10 mb-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1C1C1C] text-white">
                <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider w-16 border border-[#1C1C1C]">Sr.</th>
                <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider border border-[#1C1C1C]">Description of Materials</th>
                <th className="py-2.5 px-4 text-right text-xs font-bold uppercase tracking-wider w-32 border border-[#1C1C1C]">Quantity</th>
                <th className="py-2.5 px-4 text-right text-xs font-bold uppercase tracking-wider w-32 border border-[#1C1C1C]">Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-3 px-4 text-left text-sm font-mono border border-[#1C1C1C]/20">{idx + 1}</td>
                  <td className="py-3 px-4 text-left border border-[#1C1C1C]/20">
                    <span className="font-semibold text-sm">{(item.materials as any)?.name}</span>
                    {((item.materials as any)?.code) && <span className="block text-xs font-mono text-[#1C1C1C]/50 mt-0.5">Code: {(item.materials as any)?.code}</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-bold border border-[#1C1C1C]/20">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-sm border border-[#1C1C1C]/20">{(item.materials as any)?.unit}</td>
                </tr>
              ))}
              {/* Empty rows to fill space if few items */}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                   <td className="py-4 px-4 border border-[#1C1C1C]/20"></td>
                   <td className="py-4 px-4 border border-[#1C1C1C]/20"></td>
                   <td className="py-4 px-4 border border-[#1C1C1C]/20"></td>
                   <td className="py-4 px-4 border border-[#1C1C1C]/20"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="absolute bottom-0 left-0 right-0 px-10 pb-16 pt-8 grid grid-cols-3 gap-8 mt-auto border-t border-dashed border-[#1C1C1C]/20 bg-gray-50">
          <div className="text-center">
            <div className="h-16 border-b border-[#1C1C1C]/30 mx-4"></div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#1C1C1C]/50">Dispatched By</p>
            <p className="text-[10px] text-[#1C1C1C]/40 mt-1">(Authorised Signatory)</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-[#1C1C1C]/30 mx-4"></div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#1C1C1C]/50">Driver's Signature</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-[#1C1C1C]/30 mx-4"></div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#1C1C1C]/50">Received By (Site)</p>
            <p className="text-[10px] text-[#1C1C1C]/40 mt-1">(Sign & Stamp)</p>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .PrintArea, .PrintArea * { visibility: visible; }
          .PrintArea { position: absolute; left: 0; top: 0; width: 21cm; height: 29.7cm; margin: 0; border: none; box-shadow: none; }
          @page { size: A4; margin: 0; }
        }
      `}} />
    </div>
  );
}
