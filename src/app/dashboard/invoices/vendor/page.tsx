'use client';

import { useState, useEffect } from 'react';
import { useInvoices, VendorInvoice } from '@/hooks/useInvoices';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Plus, Search, CheckCircle2, Factory } from 'lucide-react';
import Link from 'next/link';

export default function VendorInvoicesPage() {
  const { profile } = useProfile();
  const { loading, getVendorInvoices, createVendorInvoice, updateVendorInvoiceStatus } = useInvoices();
  const supabase = createClient();
  
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [grns, setGrns] = useState<any[]>([]); // To resolve GRN matching

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: '', project_id: '', invoice_no: '', amount: '', grn_id: '', due_date: ''
  });

  const fetchData = async () => {
    const data = await getVendorInvoices();
    setInvoices(data);

    if (profile?.company_id) {
      const [{ data: pData }, { data: gData }] = await Promise.all([
        supabase.from('projects').select('id, name').eq('company_id', profile.company_id),
        supabase.from('grn').select('id, grn_no, supplier_name, project_id, status').eq('status', 'received')
      ]);
      if (pData) setProjects(pData);
      if (gData) setGrns(gData);
    }
  };

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return alert('No company associated');
    
    setIsSubmitting(true);
    try {
      await createVendorInvoice({
        company_id: profile.company_id,
        project_id: formData.project_id,
        vendor_name: formData.vendor_name,
        invoice_no: formData.invoice_no,
        amount: parseFloat(formData.amount),
        grn_id: formData.grn_id || null,
        due_date: formData.due_date || null,
        status: 'draft' // Draft = Pending 3-way manual check
      });
      
      setIsModalOpen(false);
      setFormData({ vendor_name: '', project_id: '', invoice_no: '', amount: '', grn_id: '', due_date: '' });
      fetchData();
    } catch(err: any) { alert(err.message); } setIsSubmitting(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateVendorInvoiceStatus(id, newStatus);
      fetchData();
    } catch(err: any){ alert(err.message); }
  };

  // Filter GRNs based on selected project
  const availableGrns = grns.filter(g => formData.project_id ? g.project_id === formData.project_id : true);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard/invoices" className="flex items-center gap-2 text-sm font-semibold text-[#1C1C1C]/60 hover:text-primary transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Master Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
            <Factory className="w-8 h-8 text-red-600" /> Vendor Payables (A/P)
          </h1>
          <p className="text-[#1C1C1C]/60 mt-1">Book incoming supplier bills and verify against received items (GRN).</p>
        </div>
        
        {(profile?.role === 'admin' || profile?.role === 'project_manager' || profile?.role === 'accountant') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Book Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
        {loading && invoices.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : invoices.length === 0 ? (
           <p className="p-8 text-center text-[#1C1C1C]/50 font-medium">No vendor invoices have been booked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70 font-medium">
                <tr>
                  <th className="px-6 py-4">Invoice Info</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">GRN Match</th>
                  <th className="px-6 py-4 text-right">Amount (₹)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C1C]/5">
                {invoices.map(inv => {
                   const matchedGrn = grns.find(g => g.id === inv.grn_id);
                   return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1C1C1C]">{inv.vendor_name}</div>
                        <div className="text-xs font-semibold text-[#1C1C1C]/60 mt-0.5">Inv: {inv.invoice_no} {inv.due_date && `• Due: ${new Date(inv.due_date).toLocaleDateString()}`}</div>
                      </td>
                      <td className="px-6 py-4 text-[#1C1C1C]/70 font-medium">{inv.project_name}</td>
                      <td className="px-6 py-4">
                        {inv.grn_id ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 3-Way Verified ({matchedGrn?.grn_no || 'Valid'})
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-[#1C1C1C] tabular-nums text-base">₹{inv.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          inv.status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {inv.status === 'draft' && profile?.role === 'admin' && (
                            <button onClick={() => handleStatusUpdate(inv.id, 'approved')} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded" title="Approve for Payment">
                              Approve
                            </button>
                          )}
                          {inv.status === 'approved' && profile?.role === 'admin' && (
                            <button onClick={() => handleStatusUpdate(inv.id, 'paid')} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded" title="Mark Paid">
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6 border-b pb-4">Book Vendor Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Vendor / Supplier Name *</label>
                  <input required value={formData.vendor_name} onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                    placeholder="e.g. UltraTech Cement" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-red-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Project Allocation *</label>
                  <select required value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value, grn_id: ''})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-red-500 bg-white">
                    <option value="" disabled>Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Invoice No. *</label>
                  <input required value={formData.invoice_no} onChange={(e) => setFormData({...formData, invoice_no: e.target.value})}
                     className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-red-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Invoice Total (₹) *</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                     className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-red-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Due Date (Optional)</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                     className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-red-500" />
                </div>

                <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">3-Way Match Validation (Link GRN)</label>
                  <p className="text-xs text-gray-500 mb-3 block">Match this invoice against materials actually received at site to prevent overbilling.</p>
                  <select value={formData.grn_id} onChange={(e) => setFormData({...formData, grn_id: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-500 bg-white shadow-sm">
                    <option value="">No GRN Link (Unverified Expense)</option>
                    {availableGrns.map(g => (
                       <option key={g.id} value={g.id}>GRN: {g.grn_no || g.id.slice(0,8)} - {g.supplier_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Book into A/P Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
