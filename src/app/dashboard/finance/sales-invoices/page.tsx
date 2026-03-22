'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download, CheckCircle, Clock } from 'lucide-react';
import { useFinance, ClientInvoice } from '@/hooks/useFinance';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ClientInvoicePDF } from '@/components/pdf/ClientInvoicePDF';

export default function SalesInvoicesPage() {
  const { profile } = useProfile();
  const { getClientInvoices, createClientInvoice, loading } = useFinance();
  const supabase = createClient();
  
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    ra_bill_no: '',
    claim_amount: '',
    deductions: '0',
    gst_amount: '0',
    invoice_date: new Date().toISOString().split('T')[0],
    notes: 'Payment is due within 15 days.'
  });

  const loadData = async () => {
    const data = await getClientInvoices();
    setInvoices(data);
    
    if (profile?.company_id) {
      const { data: projData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', profile.company_id);
      if (projData) setProjects(projData);
    }
  };

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  // Recalculate net amount automatically in form
  const getNet = () => {
    const claim = parseFloat(formData.claim_amount) || 0;
    const deds = parseFloat(formData.deductions) || 0;
    const gst = parseFloat(formData.gst_amount) || 0;
    return claim - deds + gst;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return alert('Company profile required');
    if (!formData.project_id) return alert('Project required');
    
    setSubmitting(true);
    try {
      const net = getNet();
      await createClientInvoice({
        company_id: profile.company_id,
        project_id: formData.project_id,
        ra_bill_no: formData.ra_bill_no,
        claim_amount: parseFloat(formData.claim_amount),
        deductions: parseFloat(formData.deductions),
        gst_amount: parseFloat(formData.gst_amount),
        net_amount: net,
        invoice_date: formData.invoice_date,
        notes: formData.notes,
        status: 'draft'
      });

      setIsModalOpen(false);
      setFormData({
        project_id: '',
        ra_bill_no: '',
        claim_amount: '',
        deductions: '0',
        gst_amount: '0',
        invoice_date: new Date().toISOString().split('T')[0],
        notes: 'Payment is due within 15 days.'
      });
      loadData();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. ' + error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('client_invoices').update({ status: newStatus }).eq('id', id);
      loadData();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Sales Invoices</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Generate PDF Tax Invoices for Client RA Bills.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#1C1C1C]/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/40" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70 font-medium">
              <tr>
                <th className="px-6 py-4">Invoice No & Date</th>
                <th className="px-6 py-4">Project / Client</th>
                <th className="px-6 py-4 text-right">Net Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#1C1C1C]/60">Loading invoices...</td>
                </tr>
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
                      <p className="font-semibold text-[#1C1C1C]">{inv.ra_bill_no || 'DRAFT'}</p>
                      <p className="text-xs text-[#1C1C1C]/60 mt-0.5">{new Date(inv.invoice_date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#1C1C1C]">
                      {inv.project_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-[#1C1C1C]">₹{inv.net_amount.toLocaleString()}</p>
                      <p className="text-xs text-[#1C1C1C]/50 mt-0.5">Includes ₹{inv.gst_amount.toLocaleString()} GST</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'certified' ? 'bg-blue-50 text-blue-700' : 
                        inv.status === 'submitted' ? 'bg-indigo-50 text-indigo-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === 'draft' && profile?.role === 'admin' && (
                          <button onClick={() => updateStatus(inv.id, 'submitted')} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded" title="Submit Invoice">
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status === 'submitted' && profile?.role === 'admin' && (
                          <button onClick={() => updateStatus(inv.id, 'certified')} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Mark Certified">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status === 'certified' && profile?.role === 'admin' && (
                          <button onClick={() => updateStatus(inv.id, 'paid')} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded" title="Mark Paid">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* PDF Download Link */}
                        <PDFDownloadLink 
                          document={<ClientInvoicePDF invoice={inv} companyName={profile?.company_name || 'SolidStonne'} />} 
                          fileName={`Invoice_${inv.ra_bill_no || 'Draft'}.pdf`}
                          className="p-1.5 text-[#1C1C1C] bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl flex flex-col">
            <div className="p-6 border-b border-[#1C1C1C]/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1C1C1C]">Create Tax Invoice</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1C1C1C]/60"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Project *</label>
                  <select 
                    required
                    value={formData.project_id}
                    onChange={e => setFormData({...formData, project_id: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Invoice Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.invoice_date}
                    onChange={e => setFormData({...formData, invoice_date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Invoice/RA Bill No.</label>
                <input 
                  type="text" 
                  value={formData.ra_bill_no}
                  onChange={e => setFormData({...formData, ra_bill_no: e.target.value})}
                  placeholder="e.g. RA-001"
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                />
              </div>

              <div className="bg-[#1C1C1C]/5 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C1C1C]">Gross Work Claim (₹) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      value={formData.claim_amount}
                      onChange={e => setFormData({...formData, claim_amount: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C1C1C]">Less: Deductions/Advances (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={formData.deductions}
                      onChange={e => setFormData({...formData, deductions: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C1C1C]">Add: Total GST (₹) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      value={formData.gst_amount}
                      onChange={e => setFormData({...formData, gst_amount: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C1C1C]">Net Invoice Value (₹)</label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-[#1C1C1C]/10 rounded-lg text-sm font-bold text-[#1C1C1C]">
                      ₹{getNet().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-[#1C1C1C]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
