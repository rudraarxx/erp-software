'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, PieChart, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinance, ProjectBudget, SiteExpense, MaterialPurchase } from '@/hooks/useFinance';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';

type BudgetWithActuals = ProjectBudget & {
  actual_spent: number;
  progress_percent: number;
};

export default function BudgetsPage() {
  const { profile } = useProfile();
  const { getBudgets, createBudget, getExpenses, getPurchases, loading } = useFinance();
  const supabase = createClient();
  
  const [budgets, setBudgets] = useState<BudgetWithActuals[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    cost_head: 'material',
    budgeted_amount: ''
  });

  const loadData = async () => {
    setIsRecalculating(true);
    const [budgetData, expenseData, purchaseData] = await Promise.all([
      getBudgets(),
      getExpenses(),
      getPurchases()
    ]);
    
    // Group actual spending by project & roughly by cost head.
    // For MVP, if cost_head is "materials", we sum purchases. For everything else, we sum expenses.
    // Real implementation would have exact mappings. This is a robust approx approach.
    
    const enrichedBudgets = budgetData.map((b: ProjectBudget) => {
      let actualSpent = 0;
      
      if (b.cost_head.toLowerCase().includes('material')) {
        actualSpent = purchaseData
          .filter((p: MaterialPurchase) => p.project_id === b.project_id && p.status !== 'pending')
          .reduce((sum: number, p: MaterialPurchase) => sum + Number(p.amount) + Number(p.gst_amount), 0);
      } else {
        actualSpent = expenseData
          .filter((e: SiteExpense) => e.project_id === b.project_id && e.status !== 'rejected')
          .reduce((sum: number, e: SiteExpense) => sum + Number(e.amount), 0);
      }

      return {
        ...b,
        actual_spent: actualSpent,
        progress_percent: b.budgeted_amount > 0 ? (actualSpent / b.budgeted_amount) * 100 : 0
      };
    });

    setBudgets(enrichedBudgets);
    
    if (profile?.company_id) {
      const { data: projData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', profile.company_id);
      if (projData) setProjects(projData);
    }
    setIsRecalculating(false);
  };

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return alert('Company profile required');
    if (!formData.project_id) return alert('Select Project');
    
    setSubmitting(true);
    try {
      await createBudget({
        company_id: profile.company_id,
        project_id: formData.project_id,
        cost_head: formData.cost_head,
        budgeted_amount: parseFloat(formData.budgeted_amount)
      });
      setIsModalOpen(false);
      setFormData({
        project_id: '',
        cost_head: 'materials',
        budgeted_amount: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. ' + error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Project Budgets</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Track budgeted allowances against true actual expenditures.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Assign Budget
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#1C1C1C]/10 flex items-center bg-gray-50/30">
          <div className="flex items-center gap-2 text-sm text-[#1C1C1C]/70">
            <Info className="w-4 h-4" /> 
            <span>Actual limits are automatically calculated from live Site Expenses and Material Purchases.</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70 font-medium">
              <tr>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Cost Head</th>
                <th className="px-6 py-4 text-right">Budgeted Limit</th>
                <th className="px-6 py-4 text-right">Actual Spent</th>
                <th className="px-6 py-4">Consumption Gauge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {loading || isRecalculating ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#1C1C1C]/60">Calculating actuals vs budgets...</td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#1C1C1C]/40">
                    <PieChart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No budgets assigned yet</p>
                  </td>
                </tr>
              ) : (
                budgets.map((b) => {
                  const isOver = b.progress_percent > 100;
                  const percentDisplay = Math.min(b.progress_percent, 100);
                  
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#1C1C1C]">
                        {b.project_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-[#1C1C1C]/80 capitalize">
                        {b.cost_head.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        ₹{b.budgeted_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium flex justify-end items-center gap-1">
                        {isOver && <span title="Over budget!"><TrendingUp className="w-4 h-4 text-rose-500" /></span>}
                        <span className={isOver ? 'text-rose-600' : 'text-[#1C1C1C]'}>
                          ₹{b.actual_spent.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-48 h-2.5 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isOver ? 'bg-rose-500' : 
                              b.progress_percent > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentDisplay}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#1C1C1C]/50 mt-1.5 font-medium">
                          {b.progress_percent.toFixed(1)}% consumed
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm flex flex-col">
            <div className="p-6 border-b border-[#1C1C1C]/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1C1C1C]">Assign Budget Head</h2>
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
                  <option value="">Select Target Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Cost Head *</label>
                <select 
                  required
                  value={formData.cost_head}
                  onChange={e => setFormData({...formData, cost_head: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all"
                >
                  <option value="materials">Raw Materials</option>
                  <option value="equipment_hire">Equipment Hire</option>
                  <option value="site_overheads">Site Overheads / Expenses</option>
                  <option value="labour_wages">Labour Wages</option>
                  <option value="subcontractor">Subcontractor Payouts</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C1C1C]">Max Budget Limit (₹) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="1000"
                  value={formData.budgeted_amount}
                  onChange={e => setFormData({...formData, budgeted_amount: e.target.value})}
                  placeholder="E.g., 500000"
                  className="w-full px-3 py-2 bg-gray-50 border border-[#1C1C1C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] focus:bg-white transition-all text-lg font-medium tracking-tight"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-[#1C1C1C]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex-1 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#1C1C1C]/90 transition-colors text-sm font-medium disabled:opacity-50 flex-1 text-center"
                >
                  {submitting ? 'Saving...' : 'Set Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
