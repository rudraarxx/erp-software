import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Equipment {
  id: string;
  company_id: string;
  name: string;
  type: string;
  make: string | null;
  model: string | null;
  serial_no: string | null;
  purchase_date: string | null;
  value: number | null;
  status: 'available' | 'deployed' | 'maintenance' | 'retired';
}

export interface EquipmentDeployment {
  id: string;
  equipment_id: string;
  project_id: string;
  project_name?: string;
  from_date: string;
  to_date: string | null;
  status: string;
}

export interface EquipmentUsageLog {
  id: string;
  equipment_id: string;
  project_id: string;
  project_name?: string;
  date: string;
  hours: number;
  operator_name: string | null;
  notes: string | null;
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  type: string;
  date: string;
  cost: number;
  notes: string | null;
}

export interface EquipmentHire {
  id: string;
  company_id: string;
  vendor_name: string;
  equipment_name: string;
  daily_rate: number;
  from_date: string;
  to_date: string | null;
  total_cost: number | null;
}

export function useEquipment() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Equipment Register
  const getEquipment = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    // Calculate derived status based on active deployments (optional optimization, normally tracked via DB triggers or joined views)
    return data as Equipment[];
  }, [supabase]);

  const createEquipment = async (payload: Partial<Equipment>) => {
    setLoading(true);
    const { data, error } = await supabase.from('equipment').insert([payload]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // Deployments
  const getDeployments = useCallback(async (equipmentId?: string) => {
    setLoading(true);
    let query = supabase.from('equipment_deployments').select('*, projects(name)').order('from_date', { ascending: false });
    if (equipmentId) query = query.eq('equipment_id', equipmentId);
    
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name })) as EquipmentDeployment[];
  }, [supabase]);

  const deployEquipment = async (payload: Partial<EquipmentDeployment>) => {
    setLoading(true);
    const { data, error } = await supabase.from('equipment_deployments').insert([payload]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const completeDeployment = async (id: string, toDate: string) => {
    setLoading(true);
    const { error } = await supabase.from('equipment_deployments').update({ status: 'completed', to_date: toDate }).eq('id', id);
    setLoading(false);
    if (error) throw error;
  };

  // Usage Logs
  const getUsageLogs = useCallback(async (equipmentId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment_usage_logs')
      .select('*, projects(name)')
      .eq('equipment_id', equipmentId)
      .order('date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data.map((d: any) => ({ ...d, project_name: d.projects?.name })) as EquipmentUsageLog[];
  }, [supabase]);

  const createUsageLog = async (payload: Partial<EquipmentUsageLog>) => {
    setLoading(true);
    const { data, error } = await supabase.from('equipment_usage_logs').insert([payload]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // Maintenance
  const getMaintenanceLogs = useCallback(async (equipmentId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment_maintenance')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data as EquipmentMaintenance[];
  }, [supabase]);

  const createMaintenanceLog = async (payload: Partial<EquipmentMaintenance>) => {
    setLoading(true);
    const { data, error } = await supabase.from('equipment_maintenance').insert([payload]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  // Hired Equipment
  const getHires = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment_hire')
      .select('*')
      .order('from_date', { ascending: false });
    
    setLoading(false);
    if (error) {
      setError(error.message);
      return [];
    }
    return data as EquipmentHire[];
  }, [supabase]);

  const createHire = async (payload: Partial<EquipmentHire>) => {
    setLoading(true);
    const { data, error } = await supabase.from('equipment_hire').insert([payload]).select().single();
    setLoading(false);
    if (error) throw error;
    return data;
  };

  return {
    loading,
    error,
    getEquipment,
    createEquipment,
    getDeployments,
    deployEquipment,
    completeDeployment,
    getUsageLogs,
    createUsageLog,
    getMaintenanceLogs,
    createMaintenanceLog,
    getHires,
    createHire
  };
}
