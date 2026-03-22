import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Payment {
  id: string;
  company_id: string;
  project_id: string | null;
  project_name?: string;
  party_name: string;
  party_type: string;
  direction: 'in' | 'out' | 'party_to_party';
  amount: number;
  mode: string;
  reference: string;
  date: string;
  notes: string;
}

export interface SiteExpense {
  id: string;
  company_id: string;
  project_id: string;
  project_name?: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt_url: string;
  status: string;
}

export interface MaterialPurchase {
  id: string;
  company_id: string;
  project_id: string | null;
  project_name?: string;
  vendor_name: string;
  po_reference: string;
  grn_id: string | null;
  amount: number;
  gst_amount: number;
  date: string;
  status: string;
}

export interface ProjectBudget {
  id: string;
  company_id: string;
  project_id: string;
  project_name?: string;
  cost_head: string;
  budgeted_amount: number;
}

export interface ClientInvoice {
  id: string;
  company_id: string;
  project_id: string;
  project_name?: string;
  ra_bill_no: string;
  claim_amount: number;
  deductions: number;
  gst_amount: number;
  net_amount: number;
  status: string;
  invoice_date: string;
  pdf_url: string;
  notes: string;
}

export function useFinance() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PAYMENTS
  const getPayments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, projects(name)')
      .order('date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name }));
  }, [supabase]);

  const createPayment = async (payment: Partial<Payment>) => {
    setLoading(true);
    const { data, error } = await supabase.from('payments').insert([payment]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // EXPENSES
  const getExpenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_expenses')
      .select('*, projects(name)')
      .order('date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name }));
  }, [supabase]);

  const createExpense = async (expense: Partial<SiteExpense>) => {
    setLoading(true);
    const { data, error } = await supabase.from('site_expenses').insert([expense]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // PURCHASES
  const getPurchases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('material_purchases')
      .select('*, projects(name)')
      .order('date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name }));
  }, [supabase]);

  const createPurchase = async (purchase: Partial<MaterialPurchase>) => {
    setLoading(true);
    const { data, error } = await supabase.from('material_purchases').insert([purchase]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // BUDGETS
  const getBudgets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_budgets')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name }));
  }, [supabase]);

  const createBudget = async (budget: Partial<ProjectBudget>) => {
    setLoading(true);
    const { data, error } = await supabase.from('project_budgets').insert([budget]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // CLIENT INVOICES
  const getClientInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('client_invoices')
      .select('*, projects(name)')
      .order('invoice_date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name }));
  }, [supabase]);

  const createClientInvoice = async (invoice: Partial<ClientInvoice>) => {
    setLoading(true);
    const { data, error } = await supabase.from('client_invoices').insert([invoice]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  return {
    loading,
    error,
    getPayments,
    createPayment,
    getExpenses,
    createExpense,
    getPurchases,
    createPurchase,
    getBudgets,
    createBudget,
    getClientInvoices,
    createClientInvoice
  };
}
