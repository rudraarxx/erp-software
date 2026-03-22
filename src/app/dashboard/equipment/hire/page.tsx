'use client';

import { useState, useEffect } from 'react';
import { useEquipment, EquipmentHire } from '@/hooks/useEquipment';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, Plus, Calendar, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HiredEquipmentPage() {
  const { profile } = useProfile();
  const { loading, getHires, createHire } = useEquipment();
  
  const [hires, setHires] = useState<EquipmentHire[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vendor_name: '', equipment_name: '', daily_rate: '', from_date: '', to_date: ''
  });

  const fetchData = async () => {
    const data = await getHires();
    setHires(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return alert('No company associated');
    
    setIsSubmitting(true);
    try {
      // Calculate total cost if To Date is provided
      let total_cost = null;
      if (formData.to_date && formData.from_date) {
        const _from = new Date(formData.from_date);
        const _to = new Date(formData.to_date);
        const diffTime = Math.abs(_to.getTime() - _from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        total_cost = diffDays * parseFloat(formData.daily_rate);
      }

      await createHire({
        company_id: profile.company_id,
        vendor_name: formData.vendor_name,
        equipment_name: formData.equipment_name,
        daily_rate: parseFloat(formData.daily_rate),
        from_date: formData.from_date,
        to_date: formData.to_date || null,
        total_cost
      });
      
      setIsModalOpen(false);
      setFormData({ vendor_name: '', equipment_name: '', daily_rate: '', from_date: '', to_date: '' });
      fetchData();
    } catch(err: any){ alert(err.message); } setIsSubmitting(false);
  };

  const calculateActiveCost = (hire: EquipmentHire) => {
    if (hire.total_cost) return hire.total_cost;
    // Ongoing hire calculation
    const _from = new Date(hire.from_date);
    const _now = new Date();
    const diffTime = Math.abs(_now.getTime() - _from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * hire.daily_rate;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard/equipment" className="flex items-center gap-2 text-sm font-semibold text-[#1C1C1C]/60 hover:text-primary transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Owned Assets
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C] flex items-center gap-2">
            Hired Equipment
          </h1>
          <p className="text-[#1C1C1C]/60 mt-1">Track third-party rentals and accumulating daily costs.</p>
        </div>
        
        {(profile?.role === 'admin' || profile?.role === 'project_manager' || profile?.role === 'accountant') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Record New Hire
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
        {loading && hires.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : hires.length === 0 ? (
           <p className="p-8 text-center text-[#1C1C1C]/50 font-medium">No active or historical rented equipment found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/70">
                <tr>
                  <th className="p-4 font-semibold">Equipment / Asset</th>
                  <th className="p-4 font-semibold">Vendor Name</th>
                  <th className="p-4 font-semibold">Rental Period</th>
                  <th className="p-4 font-semibold text-right">Daily Rate</th>
                  <th className="p-4 font-semibold text-right">Running Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C1C]/5">
                {hires.map(hire => {
                  const isActive = !hire.to_date;
                  return (
                    <tr key={hire.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-bold text-[#1C1C1C] flex items-center gap-2">
                          {hire.equipment_name}
                          {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Ongoing hire"></span>}
                        </div>
                      </td>
                      <td className="p-4 text-[#1C1C1C]/70">{hire.vendor_name}</td>
                      <td className="p-4 text-[#1C1C1C]/70 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1C1C1C]/30" />
                        {new Date(hire.from_date).toLocaleDateString()} — {hire.to_date ? new Date(hire.to_date).toLocaleDateString() : 'Present'}
                      </td>
                      <td className="p-4 text-right tabular-nums text-[#1C1C1C]/80 font-medium">₹{hire.daily_rate.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold tabular-nums px-3 py-1.5 rounded-lg ${isActive ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-700'}`}>
                          ₹{calculateActiveCost(hire).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl z-10 p-6">
            <h2 className="font-heading font-bold text-xl text-[#1C1C1C] mb-6">Log Hired Equipment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Asset / Equipment Name *</label>
                  <input required value={formData.equipment_name} onChange={(e) => setFormData({...formData, equipment_name: e.target.value})}
                    placeholder="e.g. 50-Ton Crane" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Vendor Agency *</label>
                  <input required value={formData.vendor_name} onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                     placeholder="e.g. ABC Logistical Solutions" className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Daily Rental Rate (₹) *</label>
                  <input required type="number" value={formData.daily_rate} onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
                     className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">From Date *</label>
                    <input required type="date" value={formData.from_date} onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                       className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">To Date (Optional)</label>
                    <input type="date" value={formData.to_date} onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                       className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#1C1C1C]/50 py-2 italic font-medium">Leave 'To Date' blank if the hire is currently ongoing to track live accumulating costs.</p>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#1C1C1C] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Rental Tracking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
