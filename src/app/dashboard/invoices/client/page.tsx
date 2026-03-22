'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download, CheckCircle, Clock, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useInvoices, ClientInvoiceWithItems, ClientInvoiceItem } from '@/hooks/useInvoices';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ClientInvoicePDF } from '@/components/pdf/ClientInvoicePDF';
import Link from 'next/link';

export default function ClientInvoicesPage() {
  const { profile } = useProfile();
  const { getClientInvoices, createClientInvoice, updateClientInvoiceStatus, loading } = useInvoices();
  const supabase = createClient();
  
  const [invoices, setInvoices] = useState<ClientInvoiceWithItems[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '', ra_bill_no: '', deductions: '0', gst_amount: '0', invoice_date: new Date().toISOString().split('T')[0], notes: 'Payment is due within 15 days.'
  });

  const [items, setItems] = useState<ClientInvoiceItem[]>([
    { boq_item: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  const loadData = async () => {
    const data = await getClientInvoices();
    setInvoices(data);
    
    if (profile?.company_id) {
      const { data: projData } = await supabase.from('projects').select('id, name').eq('company_id', profile.company_id);
      if (projData) setProjects(projData);
    }
  };

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item: any = newItems[index];
    item[field] = value;
    
    if (field === 'quantity' || field === 'rate') {
      item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { boq_item: '', quantity: 1, rate: 0, amount: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const totalClaim = items.reduce((sum, item) => sum + item.amount, 0);
  
  const getNet = () => {
    const deds = parseFloat(formData.deductions) || 0;
    const gst = parseFloat(formData.gst_amount) || 0;
    return totalClaim - deds + gst;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return alert('Company profile required');
    if (!formData.project_id) return alert('Project required');
    if (items.some(i => !i.boq_item)) return alert('All items must have a description');
    
    setSubmitting(true);
    try {
      await createClientInvoice({
        company_id: profile.company_id,
        project_id: formData.project_id,
        ra_bill_no: formData.ra_bill_no,
        claim_amount: totalClaim,
        deductions: parseFloat(formData.deductions),
        gst_amount: parseFloat(formData.gst_amount),
        net_amount: getNet(),
        invoice_date: formData.invoice_date,
        notes: formData.notes,
        status: 'draft'
      }, items);

      setIsModalOpen(false);
      setFormData({ project_id: '', ra_bill_no: '', deductions: '0', gst_amount: '0', invoice_date: new Date().toISOString().split('T')[0], notes: 'Payment is due within 15 days.'});
      setItems([{ boq_item: '', quantity: 1, rate: 0, amount: 0 }]);
      loadData();
    } catch (error: any) { alert(error.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard/invoices" className="flex items-center gap-2 text-sm font-semibold text-[#1C1C1C]/60 hover:text-primary transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Master Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] text-blue-900">Client RA Bills (A/R)</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Generate itemized PDF Sales Invoices / Running Account bills.</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'project_manager' || profile?.role === 'accountant') && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Create Client RA Bill
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70 font-medium">
              <tr>
                <th className="px-6 py-4">RA Bill No & Date</th>
                <th className="px-6 py-4">Client / Project</th>
                <th className="px-6 py-4 text-right">Net Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions & Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading && invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#1C1C1C]/60"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#1C1C1C]/40">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No client invoices generated yet</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1C1C1C]">{inv.ra_bill_no || 'DRAFT'}</p>
                      <p className="text-xs font-semibold text-[#1C1C1C]/50 mt-0.5">{new Date(inv.invoice_date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#1C1C1C]">{inv.project_name || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-[#1C1C1C] tabular-nums text-base">₹{inv.net_amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-[#1C1C1C]/40 mt-0.5 uppercase tracking-wider">incl. GST</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        inv.status === 'certified' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                        inv.status === 'submitted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === 'draft' && profile?.role === 'admin' && (
                          <button onClick={() => updateClientInvoiceStatus(inv.id, 'submitted')} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded" title="Submit">Submit</button>
                        )}
                        {inv.status === 'submitted' && profile?.role === 'admin' && (
                          <button onClick={() => updateClientInvoiceStatus(inv.id, 'certified')} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded" title="Mark Certified">Certify</button>
                        )}
                        {inv.status === 'certified' && profile?.role === 'admin' && (
                          <button onClick={() => updateClientInvoiceStatus(inv.id, 'paid')} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded" title="Mark Paid">Pay</button>
                        )}
                        
                        <PDFDownloadLink 
                          document={<ClientInvoicePDF invoice={inv} companyName={profile?.company_name || 'SolidStonne'} />} 
                          fileName={`Invoice_${inv.ra_bill_no || 'Draft'}.pdf`}
                          className="p-1.5 text-[#1C1C1C] bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </PDFDownloadLink>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto pt-24 pb-10">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col">
            <div className="p-6 border-b border-[#1C1C1C]/10 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-xl">
              <div>
                <h2 className="text-xl font-heading font-bold text-[#1C1C1C]">Create RA Bill (Sales Invoice)</h2>
                <p className="text-sm text-[#1C1C1C]/60">Dynamically add BOQ line items</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 font-bold text-[#1C1C1C]/60">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* META INFO */}
              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-1 space-y-2">
                  <label className="text-sm font-semibold text-[#1C1C1C]/70">Project *</label>
                  <select required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}
                    className="w-full px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-sm font-semibold text-[#1C1C1C]/70">Invoice/RA Bill No. *</label>
                  <input type="text" required value={formData.ra_bill_no} onChange={e => setFormData({...formData, ra_bill_no: e.target.value})}
                    placeholder="e.g. RA-001" className="w-full px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-sm font-semibold text-[#1C1C1C]/70">Invoice Date *</label>
                  <input type="date" required value={formData.invoice_date} onChange={e => setFormData({...formData, invoice_date: e.target.value})}
                    className="w-full px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* LINE ITEMS */}
              <div className="border border-[#1C1C1C]/10 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-[#1C1C1C]/10 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-[#1C1C1C]">BOQ Line Items</h3>
                  <button type="button" onClick={addItem} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input required placeholder="Item description..." value={item.boq_item} onChange={(e) => updateItem(idx, 'boq_item', e.target.value)}
                           className="w-full px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div className="w-24">
                        <input required type="number" step="0.01" min="0" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                           className="w-full px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div className="w-32">
                        <input required type="number" step="0.01" min="0" placeholder="Rate (₹)" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                           className="w-full px-3 py-2 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div className="w-32 text-right px-3 py-2 bg-gray-50 border border-transparent font-bold text-[#1C1C1C] rounded-lg">
                        ₹{item.amount.toLocaleString()}
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* FINANCIAL TOTALS */}
              <div className="bg-blue-50/30 border border-blue-100 p-5 rounded-xl space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-[#1C1C1C]/70">Total Gross Work Claim (A):</span>
                  <span className="font-bold tabular-nums">₹{totalClaim.toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1C1C]/60 uppercase tracking-wider">Less: Deductions (B)</label>
                    <div className="flex bg-white rounded-lg border border-[#1C1C1C]/15 overflow-hidden">
                      <span className="bg-gray-50 px-3 py-2 text-sm font-semibold border-r border-[#1C1C1C]/15 flex items-center justify-center">₹</span>
                      <input type="number" min="0" step="0.01" value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})}
                        className="w-full px-3 py-2 text-sm outline-none focus:bg-blue-50/30" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1C1C]/60 uppercase tracking-wider">Add: GST (C)</label>
                    <div className="flex bg-white rounded-lg border border-[#1C1C1C]/15 overflow-hidden">
                      <span className="bg-gray-50 px-3 py-2 text-sm font-semibold border-r border-[#1C1C1C]/15 flex items-center justify-center">₹</span>
                      <input type="number" required min="0" step="0.01" value={formData.gst_amount} onChange={e => setFormData({...formData, gst_amount: e.target.value})}
                        className="w-full px-3 py-2 text-sm outline-none focus:bg-blue-50/30" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-base pt-3 border-t border-blue-200">
                  <span className="font-bold text-blue-900">Net Invoice Amount (A - B + C):</span>
                  <span className="text-xl font-bold font-heading text-blue-700 tabular-nums">₹{getNet().toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-[#1C1C1C]/60 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Final Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
