'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Receipt, Link as LinkIcon, Download, CheckCircle, XCircle } from 'lucide-react';
import { useFinance, SiteExpense } from '@/hooks/useFinance';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';

export default function ExpensesPage() {
  const { profile } = useProfile();
  const { getExpenses, createExpense, loading } = useFinance();
  const supabase = createClient();
  
  const [expenses, setExpenses] = useState<SiteExpense[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    category: 'local_purchase',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadData = async () => {
    const data = await getExpenses();
    setExpenses(data);
    
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
    if (!profile?.company_id) return alert('Company profile required');
    if (!formData.project_id) return alert('Project required');
    
    setSubmitting(true);
    let receipt_url = '';

    try {
      // 1. Upload receipt if any
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile.company_id}/${fileName}`;
        
        // Try to upload to "receipts" bucket, skip if it fails (bucket might not exist)
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file);
          
        if (!uploadError) {
          const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
          receipt_url = data.publicUrl;
        }
      }

      // 2. Create DB record
      await createExpense({
        company_id: profile.company_id,
        project_id: formData.project_id,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        receipt_url: receipt_url,
        status: 'pending'
      });

      setIsModalOpen(false);
      setFormData({
        project_id: '',
        category: 'local_purchase',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setFile(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. ' + error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('site_expenses').update({ status: newStatus }).eq('id', id);
      loadData();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Site Expenses</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Log day-to-day project costs and upload receipts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#1C1C1C]/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/40" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[#1C1C1C]/60 font-medium">
              <tr>
                <th className="px-6 py-4">Date & Category</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status & Receipt</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#1C1C1C]/60">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#1C1C1C]/40">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No site expenses recorded yet</p>
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1C1C1C]">{new Date(e.date).toLocaleDateString()}</p>
                      <p className="text-xs text-[#1C1C1C]/60 capitalize">{e.category.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#1C1C1C]">
                      {e.project_name || '—'}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-[#1C1C1C]/80" title={e.description}>
                      {e.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#1C1C1C]">
                      ₹{e.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          e.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          e.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {e.status}
                        </span>
                        {e.receipt_url && (
                          <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="View Receipt">
                            <LinkIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {e.status === 'pending' && profile?.role === 'admin' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateStatus(e.id, 'approved')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateStatus(e.id, 'rejected')} className="p-1 text-rose-600 hover:bg-rose-50 rounded" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
              <h2 className="text-lg font-bold text-[#1C1C1C]">Log Site Expense</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1C1C1C]/60"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Category *</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  >
                    <option value="fuel">Fuel & Logistics</option>
                    <option value="tools">Tools & Consumables</option>
                    <option value="local_purchase">Local Material Purchase</option>
                    <option value="freight">Freight / Carriage</option>
                    <option value="other">Other Misc</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1C1C]">Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Amount (₹) *</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief details about the expense..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Receipt Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#1C1C1C]/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-[#1C1C1C] hover:file:bg-gray-200 focus:outline-none"
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
                  {submitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
