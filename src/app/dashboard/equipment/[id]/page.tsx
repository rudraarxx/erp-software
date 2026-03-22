'use client';

import { useState, useEffect } from 'react';
import { useEquipment, Equipment, EquipmentDeployment, EquipmentUsageLog, EquipmentMaintenance } from '@/hooks/useEquipment';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Calendar, User, Wrench, Settings2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useProfile();
  const { 
    loading, getEquipment, getDeployments, deployEquipment, completeDeployment,
    getUsageLogs, createUsageLog, getMaintenanceLogs, createMaintenanceLog 
  } = useEquipment();
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [deployments, setDeployments] = useState<EquipmentDeployment[]>([]);
  const [usageLogs, setUsageLogs] = useState<EquipmentUsageLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<EquipmentMaintenance[]>([]);
  
  const [activeTab, setActiveTab] = useState<'deployments' | 'usage' | 'maintenance'>('deployments');
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);

  // Modals
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [deployForm, setDeployForm] = useState({ project_id: '', from_date: '' });
  const [usageForm, setUsageForm] = useState({ project_id: '', date: '', hours: '', operator_name: '', notes: '' });
  const [maintForm, setMaintForm] = useState({ type: 'Repair', date: '', cost: '', notes: '' });

  const fetchData = async () => {
    // We could optimize but this works for MVP
    const eqs = await getEquipment();
    const target = eqs.find(e => e.id === params.id);
    if (!target) return router.push('/dashboard/equipment');
    setEquipment(target);

    const deps = await getDeployments(params.id);
    setDeployments(deps);
    
    const usgs = await getUsageLogs(params.id);
    setUsageLogs(usgs);
    
    const mnts = await getMaintenanceLogs(params.id);
    setMaintenanceLogs(mnts);
    
    // Fetch projects for dropdowns
    const supabase = createClient();
    const { data: projData } = await supabase.from('projects').select('id, name').order('name');
    if (projData) setProjects(projData);
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const activeDeployment = deployments.find(d => d.status === 'active' || !d.to_date);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeDeployment) {
        // Complete the old deployment
        await completeDeployment(activeDeployment.id, deployForm.from_date);
      }
      // Create new
      await deployEquipment({
        equipment_id: params.id,
        project_id: deployForm.project_id,
        from_date: deployForm.from_date,
        status: 'active'
      });
      setIsDeployOpen(false);
      setDeployForm({ project_id: '', from_date: '' });
      fetchData();
    } catch(err: any){
      alert(err.message);
    } setIsSubmitting(false);
  };

  const handleUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createUsageLog({
        equipment_id: params.id,
        project_id: usageForm.project_id,
        date: usageForm.date,
        hours: parseFloat(usageForm.hours),
        operator_name: usageForm.operator_name,
        notes: usageForm.notes
      });
      setIsUsageOpen(false);
      setUsageForm({ project_id: '', date: '', hours: '', operator_name: '', notes: '' });
      fetchData();
    } catch(err: any){ alert(err.message); } setIsSubmitting(false);
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createMaintenanceLog({
        equipment_id: params.id,
        type: maintForm.type,
        date: maintForm.date,
        cost: parseFloat(maintForm.cost),
        notes: maintForm.notes
      });
      setIsMaintenanceOpen(false);
      setMaintForm({ type: 'Repair', date: '', cost: '', notes: '' });
      fetchData();
    } catch(err: any){ alert(err.message); } setIsSubmitting(false);
  };


  if (!equipment) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <Link href="/dashboard/equipment" className="flex items-center gap-2 text-sm font-semibold text-[#1C1C1C]/60 hover:text-primary transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Equipment Register
      </Link>

      {/* Header Profile */}
      <div className="bg-white rounded-2xl p-6 border border-[#1C1C1C]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-heading text-[#1C1C1C]">{equipment.name}</h1>
            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
              {equipment.type}
            </span>
          </div>
          <p className="text-[#1C1C1C]/60 text-sm">
            {equipment.make} {equipment.model} {equipment.serial_no ? `| S/N: ${equipment.serial_no}` : ''}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-semibold text-[#1C1C1C]/50 mb-1">Current Status</p>
          {activeDeployment ? (
            <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              <Settings2 className="w-4 h-4" /> Deployed: {activeDeployment.project_name}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> In Godown / Available
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1C1C1C]/10 mb-6">
        {[
          { id: 'deployments', label: 'Deployments & Transfers', icon: Settings2 },
          { id: 'usage', label: 'Daily Usage Logs', icon: User },
          { id: 'maintenance', label: 'Maintenance & Repairs', icon: Wrench },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#1C1C1C]/50 hover:text-[#1C1C1C]/80 hover:border-[#1C1C1C]/20'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      
      {/* 1. DEPLOYMENTS */}
      {activeTab === 'deployments' && (
        <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-[#1C1C1C]/10 bg-gray-50/50">
            <h2 className="text-lg font-bold font-heading">Asset Movement History</h2>
            <button onClick={() => setIsDeployOpen(true)} className="bg-[#1C1C1C] hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Transfer to Site
            </button>
          </div>
          <div className="p-0">
            {deployments.length === 0 ? (
              <p className="p-8 text-center text-[#1C1C1C]/50 font-medium">No movement history found. Equipment is likely in the godown.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70">
                    <tr>
                      <th className="p-4 font-semibold">Location / Project</th>
                      <th className="p-4 font-semibold">From Date</th>
                      <th className="p-4 font-semibold">To Date</th>
                      <th className="p-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C1C]/5">
                    {deployments.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-[#1C1C1C]">{d.project_name}</td>
                        <td className="p-4 text-[#1C1C1C]/70">{new Date(d.from_date).toLocaleDateString()}</td>
                        <td className="p-4 text-[#1C1C1C]/70">{d.to_date ? new Date(d.to_date).toLocaleDateString() : '—'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            d.status === 'completed' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-600 border-green-200'
                          }`}>
                            {d.status === 'completed' ? 'Returned / Transferred' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. USAGE LOGS */}
      {activeTab === 'usage' && (
        <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-[#1C1C1C]/10 bg-gray-50/50">
            <h2 className="text-lg font-bold font-heading flex flex-col">
              Operator Logbook 
              <span className="text-xs font-normal text-[#1C1C1C]/50 mt-0.5">Track engine hours & operators</span>
            </h2>
            <button onClick={() => setIsUsageOpen(true)} className="bg-[#1C1C1C] hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Log Usage
            </button>
          </div>
          <div className="p-0">
            {usageLogs.length === 0 ? (
              <p className="p-8 text-center text-[#1C1C1C]/50 font-medium">No usage records found. Start logging operator hours.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70">
                    <tr>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Project</th>
                      <th className="p-4 font-semibold">Operator</th>
                      <th className="p-4 font-semibold text-right">Hours</th>
                      <th className="p-4 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C1C]/5">
                    {usageLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-[#1C1C1C]">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-4 text-[#1C1C1C]/70">{log.project_name}</td>
                        <td className="p-4 text-[#1C1C1C]/70">{log.operator_name || '—'}</td>
                        <td className="p-4 font-bold text-right tabular-nums">{log.hours}</td>
                        <td className="p-4 text-[#1C1C1C]/60 italic">{log.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-[#1C1C1C]/10 bg-red-50/30">
            <h2 className="text-lg font-bold font-heading flex flex-col text-red-900">
              Maintenance Register 
              <span className="text-xs font-normal text-red-700/60 mt-0.5">Log part changes, breakdowns & services</span>
            </h2>
            <button onClick={() => setIsMaintenanceOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Log Repair
            </button>
          </div>
          <div className="p-0">
            {maintenanceLogs.length === 0 ? (
              <p className="p-8 text-center text-[#1C1C1C]/50 font-medium">No maintenance records found. Asset is running perfectly!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70">
                    <tr>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Notes</th>
                      <th className="p-4 font-semibold text-right">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C1C]/5">
                    {maintenanceLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-[#1C1C1C] flex items-center gap-2">
                           {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                           <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200">
                            {log.type}
                           </span>
                        </td>
                        <td className="p-4 text-[#1C1C1C]/70 max-w-xs truncate">{log.notes || '—'}</td>
                        <td className="p-4 font-bold text-right text-red-600 tabular-nums">
                          {log.cost ? log.cost.toLocaleString() : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {isDeployOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsDeployOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Transfer Equipment</h2>
            <form onSubmit={handleDeploy} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Destination Project *</label>
                <select required value={deployForm.project_id} onChange={(e) => setDeployForm({...deployForm, project_id: e.target.value})}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="" disabled>Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Transfer Date *</label>
                <input required type="date" value={deployForm.from_date} onChange={(e) => setDeployForm({...deployForm, from_date: e.target.value})}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeployOpen(false)} className="px-4 py-2 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#1C1C1C] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUsageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsUsageOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Log Operating Hours</h2>
            <form onSubmit={handleUsage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Project *</label>
                  <select required value={usageForm.project_id} onChange={(e) => setUsageForm({...usageForm, project_id: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="" disabled>Select project...</option>
                    {activeDeployment && <option value={activeDeployment.project_id}>{activeDeployment.project_name} (Current)</option>}
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Date *</label>
                  <input required type="date" value={usageForm.date} onChange={(e) => setUsageForm({...usageForm, date: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Hours Run *</label>
                  <input required type="number" step="0.5" value={usageForm.hours} onChange={(e) => setUsageForm({...usageForm, hours: e.target.value})}
                    placeholder="e.g. 8.5" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Operator Name</label>
                  <input value={usageForm.operator_name} onChange={(e) => setUsageForm({...usageForm, operator_name: e.target.value})}
                    placeholder="e.g. Ramesh Singh" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Optional Notes</label>
                  <textarea value={usageForm.notes} onChange={(e) => setUsageForm({...usageForm, notes: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" rows={2} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsUsageOpen(false)} className="px-4 py-2 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#1C1C1C] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMaintenanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsMaintenanceOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Log Maintenance</h2>
            <form onSubmit={handleMaintenance} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Type *</label>
                <select required value={maintForm.type} onChange={(e) => setMaintForm({...maintForm, type: e.target.value})}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="Servicing">Routine Servicing</option>
                  <option value="Repair">Breakdown / Repair</option>
                  <option value="Parts">Parts Replacement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Date *</label>
                <input required type="date" value={maintForm.date} onChange={(e) => setMaintForm({...maintForm, date: e.target.value})}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Cost (₹) *</label>
                <input required type="number" value={maintForm.cost} onChange={(e) => setMaintForm({...maintForm, cost: e.target.value})}
                  className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Details</label>
                <textarea required value={maintForm.notes} onChange={(e) => setMaintForm({...maintForm, notes: e.target.value})}
                  placeholder="What was replaced or fixed?" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" rows={2} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsMaintenanceOpen(false)} className="px-4 py-2 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Repair"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
