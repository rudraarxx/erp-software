'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Settings, MapPin, Loader2, Wrench } from 'lucide-react';
import { useEquipment, Equipment, EquipmentDeployment } from '@/hooks/useEquipment';
import { useProfile } from '@/hooks/useProfile';
import Link from 'next/link';

export default function EquipmentRegisterPage() {
  const { profile } = useProfile();
  const { loading, getEquipment, getDeployments, createEquipment } = useEquipment();
  
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [activeDeployments, setActiveDeployments] = useState<EquipmentDeployment[]>([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Earthmoving', make: '', model: '', serial_no: '', purchase_date: '', value: ''
  });

  const fetchData = async () => {
    const [eqs, deps] = await Promise.all([getEquipment(), getDeployments()]);
    setEquipmentList(eqs);
    setActiveDeployments(deps.filter(d => d.status === 'active' || d.status === 'deployed' || !d.to_date));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return alert('Company profile missing');
    
    setIsCreating(true);
    try {
      await createEquipment({
        company_id: profile.company_id,
        name: formData.name,
        type: formData.type,
        make: formData.make || null,
        model: formData.model || null,
        serial_no: formData.serial_no || null,
        purchase_date: formData.purchase_date || null,
        value: formData.value ? parseFloat(formData.value) : null
      });
      
      setIsModalOpen(false);
      setFormData({ name: '', type: 'Earthmoving', make: '', model: '', serial_no: '', purchase_date: '', value: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = equipmentList.filter(eq => eq.name.toLowerCase().includes(search.toLowerCase()) || eq.type.toLowerCase().includes(search.toLowerCase()));

  // Determine current location of equipment based on active deployments
  const getLocation = (equipmentId: string) => {
    const deployment = activeDeployments.find(d => d.equipment_id === equipmentId);
    return deployment ? deployment.project_name : 'In Godown / Available';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
            <Wrench className="w-8 h-8 text-yellow-500" /> Equipment & Tools
          </h1>
          <p className="text-[#1C1C1C]/60 mt-1">Master register of all company-owned machinery.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/dashboard/equipment/hire" className="bg-white border border-[#1C1C1C]/10 text-[#1C1C1C] px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md">
            Hired Equipment
          </Link>
          {(profile?.role === 'admin' || profile?.role === 'project_manager') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Equipment
            </button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
        <input 
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools by name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm" 
        />
      </div>

      {loading && equipmentList.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <Settings className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold">No equipment found</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Start building your company asset register.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(eq => (
            <Link href={`/dashboard/equipment/${eq.id}`} key={eq.id} className="bg-white p-5 rounded-xl border border-[#1C1C1C]/10 shadow-sm flex flex-col hover:shadow-md transition-all group cursor-pointer block">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                  {eq.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-[#1C1C1C] mb-1 group-hover:text-primary transition-colors">{eq.name}</h3>
              <p className="text-sm text-[#1C1C1C]/60 mb-4">{eq.make} {eq.model} {eq.serial_no ? `(SN: ${eq.serial_no})` : ''}</p>
              
              <div className="mt-auto pt-4 border-t border-[#1C1C1C]/5 flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1 text-[#1C1C1C]/60 truncate">
                  <MapPin className="w-3.5 h-3.5" /> {getLocation(eq.id)}
                </span>
                <span className="text-primary group-hover:underline">View Logs →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Register Equipment</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Equipment Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. JCB Backhoe Loader 3DX"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Type *</label>
                  <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="Earthmoving">Earthmoving</option>
                    <option value="Lifting">Lifting</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Compaction">Compaction</option>
                    <option value="Hand Tools">Hand Tools</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Asset Value (₹)</label>
                  <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})}
                    placeholder="e.g. 2500000"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Make</label>
                  <input value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})}
                    placeholder="e.g. JCB, L&T"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Model</label>
                  <input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="e.g. 3DX"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Serial No / Chassis</label>
                  <input value={formData.serial_no} onChange={(e) => setFormData({...formData, serial_no: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Purchase Date</label>
                  <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl transition-all text-sm">Cancel</button>
                <button type="submit" disabled={isCreating}
                  className="bg-[#1C1C1C] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
