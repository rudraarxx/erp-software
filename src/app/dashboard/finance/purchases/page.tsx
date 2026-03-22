'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, Info, CheckCircle, CreditCard } from 'lucide-react';
import { useFinance, MaterialPurchase } from '@/hooks/useFinance';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';

export default function PurchasesPage() {
  const { profile } = useProfile();
  const { getPurchases, createPurchase, loading } = useFinance();
  const supabase = createClient();
  
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    vendor_name: '',
    po_reference: '',
    amount: '',
    gst_amount: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const data = await getPurchases();
    setPurchases(data);
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    
    setSubmitting(true);
    try {
      await createPurchase({
        company_id: profile.company_id,
        project_id: formData.project_id || null,
        vendor_name: formData.vendor_name,
        po_reference: formData.po_reference || '',
        grn_id: null,
        amount: parseFloat(formData.amount),
        gst_amount: parseFloat(formData.gst_amount),
        date: formData.date,
        status: 'pending'
      });

      setIsModalOpen(false);
      setFormData({
        project_id: '',
        vendor_name: '',
        po_reference: '',
        amount: '',
        gst_amount: '0',
        date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      alert('Failed to save purchase. ' + error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('material_purchases').update({ status: newStatus }).eq('id', id);
      loadData();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Material Purchases</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Record supplier purchases and track payment status.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#1C1C1C]/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/40" />
            <input 
              type="text" 
              placeholder="Search purchases..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[#1C1C1C]/60 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vendor & PO Info</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4 text-right">Tax & Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#1C1C1C]/60">Loading purchases...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#1C1C1C]/40">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No purchases recorded yet</p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#1C1C1C]">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#1C1C1C]">{p.vendor_name}</p>
                      {p.po_reference && <p className="text-xs text-[#1C1C1C]/60 mt-0.5">PO: {p.po_reference}</p>}
                    </td>
                    <td className="px-6 py-4 text-[#1C1C1C]/80">
                      {p.project_name || 'General Inventory'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-[#1C1C1C]">₹{p.amount.toLocaleString()}</p>
                      <p className="text-xs text-[#1C1C1C]/60 mt-0.5">+₹{p.gst_amount.toLocaleString()} GST</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'approved' ? 'bg-blue-50 text-blue-700' : 
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {p.status === 'pending' && profile?.role === 'admin' && (
                          <button onClick={() => updateStatus(p.id, 'approved')} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Approve Purchase">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.status === 'approved' && profile?.role === 'admin' && (
                          <button onClick={() => updateStatus(p.id, 'paid')} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded" title="Mark as Paid">
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col">
            <div className="p-6 border-b border-[#1C1C1C]/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1C1C1C]">Record Purchase</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1C1C1C]/60"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Vendor Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.vendor_name}
                  onChange={e => setFormData({...formData, vendor_name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  placeholder="e.g. Reliance Steel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Project Allocation (Optional)</label>
                <select 
                  value={formData.project_id}
                  onChange={e => setFormData({...formData, project_id: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                >
                  <option value="">General Godown Inventory</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">PO Reference</label>
                  <input 
                    type="text" 
                    value={formData.po_reference}
                    onChange={e => setFormData({...formData, po_reference: e.target.value})}
                    placeholder="e.g. PO-1024"
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Invoice Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="bg-[#1C1C1C]/5 p-4 rounded-lg flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-[#1C1C1C]">Base Amount (₹) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] transition-all"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-[#1C1C1C]">Total GST (₹) *</label>
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
                  {submitting ? 'Saving...' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
