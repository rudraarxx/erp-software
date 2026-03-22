import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ClientInvoiceItem {
  id?: string;
  invoice_id?: string;
  boq_item: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface ClientInvoiceWithItems {
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
  notes: string;
  items?: ClientInvoiceItem[];
}

export interface VendorInvoice {
  id: string;
  company_id: string;
  project_id: string;
  project_name?: string;
  vendor_name: string;
  invoice_no: string;
  amount: number;
  grn_id: string | null;
  status: 'draft' | 'approved' | 'paid';
  due_date: string | null;
  created_at?: string;
}

export function useInvoices() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // CLIENT INVOICES (RA Bills)
  // -------------------------
  const getClientInvoices = useCallback(async () => {
    setLoading(true);
    // Fetch invoices + their items natively
    const { data, error } = await supabase
      .from('client_invoices')
      .select('*, projects(name), client_invoice_items(*)')
      .order('invoice_date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ 
      ...d, 
      project_name: d.projects?.name,
      items: d.client_invoice_items 
    })) as ClientInvoiceWithItems[];
  }, [supabase]);

  const createClientInvoice = async (invoice: Partial<ClientInvoiceWithItems>, items: ClientInvoiceItem[]) => {
    setLoading(true);
    // 1. Create the parent invoice
    const { data: invData, error: invError } = await supabase
      .from('client_invoices')
      .insert([invoice])
      .select()
      .single();
    
    if (invError) {
      setLoading(false);
      throw invError;
    }

    // 2. Insert the line items linked to the parent invoice
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        invoice_id: invData.id
      }));
      const { error: itemsError } = await supabase
        .from('client_invoice_items')
        .insert(itemsToInsert);
      
      if (itemsError) {
         setLoading(false);
         throw itemsError;
      }
    }

    setLoading(false);
    return invData;
  };

  const updateClientInvoiceStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase.from('client_invoices').update({ status: newStatus }).eq('id', id);
    setLoading(false);
    if (error) throw error;
  };

  // -------------------------
  // VENDOR INVOICES
  // -------------------------
  const getVendorInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendor_invoices')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name })) as VendorInvoice[];
  }, [supabase]);

  const createVendorInvoice = async (payload: Partial<VendorInvoice>) => {
    setLoading(true);
    const { data, error } = await supabase.from('vendor_invoices').insert([payload]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const updateVendorInvoiceStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase.from('vendor_invoices').update({ status: newStatus }).eq('id', id);
    setLoading(false);
    if (error) throw error;
  };

  return {
    loading,
    error,
    getClientInvoices,
    createClientInvoice,
    updateClientInvoiceStatus,
    getVendorInvoices,
    createVendorInvoice,
    updateVendorInvoiceStatus
  };
}
