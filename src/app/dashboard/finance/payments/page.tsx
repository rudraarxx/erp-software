'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import { useFinance, Payment } from '@/hooks/useFinance';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';

export default function PaymentsPage() {
  const { profile } = useProfile();
  const { getPayments, createPayment, loading } = useFinance();
  const supabase = createClient();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    party_name: '',
    party_type: 'vendor',
    direction: 'out',
    amount: '',
    mode: 'bank_transfer',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadData = async () => {
    const data = await getPayments();
    setPayments(data);
    
    // Load projects for the dropdown
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
      await createPayment({
        company_id: profile.company_id,
        project_id: formData.project_id || null,
        party_name: formData.party_name,
        party_type: formData.party_type,
        direction: formData.direction as any,
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        reference: formData.reference,
        date: formData.date,
        notes: formData.notes
      });
      setIsModalOpen(false);
      setFormData({
        project_id: '',
        party_name: '',
        party_type: 'vendor',
        direction: 'out',
        amount: '',
        mode: 'bank_transfer',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to save payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Payments</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Record incoming, outgoing, and party-to-party transfers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-5 rounded-xl border border-[#1C1C1C]/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-[#1C1C1C]/60 font-medium">Total Incoming</p>
            <p className="text-2xl font-bold text-[#1C1C1C] mt-1">
              ₹{payments.filter(p => p.direction === 'in').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#1C1C1C]/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-[#1C1C1C]/60 font-medium">Total Outgoing</p>
            <p className="text-2xl font-bold text-[#1C1C1C] mt-1">
              ₹{payments.filter(p => p.direction === 'out').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#1C1C1C]/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-[#1C1C1C]/60 font-medium">Party to Party</p>
            <p className="text-2xl font-bold text-[#1C1C1C] mt-1">
              ₹{payments.filter(p => p.direction === 'party_to_party').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <RefreshCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#1C1C1C]/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/40" />
            <input 
              type="text" 
              placeholder="Search payments..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[#1C1C1C]/60 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">Party Details</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Mode / Ref</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#1C1C1C]/60">Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#1C1C1C]/40">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No payments recorded yet</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                        p.direction === 'in' ? 'bg-emerald-50 text-emerald-700' : 
                        p.direction === 'out' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {p.direction.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1C1C1C]">{p.party_name}</p>
                      <p className="text-xs text-[#1C1C1C]/60 capitalize">{p.party_type}</p>
                    </td>
                    <td className="px-6 py-4 text-[#1C1C1C]/80">
                      {p.project_name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#1C1C1C] capitalize">{p.mode.replace('_', ' ')}</p>
                      {p.reference && <p className="text-xs text-[#1C1C1C]/60">Ref: {p.reference}</p>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#1C1C1C]">
                      ₹{p.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-[#1C1C1C]/10 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#1C1C1C]">Record Payment</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1C1C1C]/60"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Direction</label>
                  <select 
                    required
                    value={formData.direction}
                    onChange={e => setFormData({...formData, direction: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  >
                    <option value="in">Payment In (Incoming)</option>
                    <option value="out">Payment Out (Outgoing)</option>
                    <option value="party_to_party">Party to Party</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Party Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.party_name}
                    onChange={e => setFormData({...formData, party_name: e.target.value})}
                    placeholder="E.g., ABC Cement"
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Party Type</label>
                  <select 
                    required
                    value={formData.party_type}
                    onChange={e => setFormData({...formData, party_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  >
                    <option value="vendor">Vendor</option>
                    <option value="subcontractor">Subcontractor</option>
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Mode of Payment</label>
                  <select 
                    required
                    value={formData.mode}
                    onChange={e => setFormData({...formData, mode: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="upi">UPI</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Payment Reference / Cheque No.</label>
                  <input 
                    type="text" 
                    value={formData.reference}
                    onChange={e => setFormData({...formData, reference: e.target.value})}
                    placeholder="Optional details"
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Linked Project (Optional)</label>
                  <select 
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Notes / Remarks</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                />
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
                  {submitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
