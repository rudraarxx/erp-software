"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, Search, Loader2, X, Phone, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

type Subcontractor = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  gst: string | null;
  pan: string | null;
  skill_category: string | null;
  is_active: boolean;
};

export default function SubcontractorsPage() {
  const supabase = createClient();
  const { profile } = useProfile();

  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", contact_person: "", phone: "",
    pan: "", gst: "", bank_name: "", bank_account: "",
    bank_ifsc: "", skill_category: "",
  });

  useEffect(() => { fetchSubs(); }, []);

  async function fetchSubs() {
    setLoading(true);
    const { data } = await supabase
      .from("subcontractors")
      .select("*")
      .order("name");
    setSubs(data || []);
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setIsCreating(true);
    const { error } = await supabase.from("subcontractors").insert({
      company_id: profile.company_id,
      name: form.name,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      pan: form.pan || null,
      gst: form.gst || null,
      bank_name: form.bank_name || null,
      bank_account: form.bank_account || null,
      bank_ifsc: form.bank_ifsc || null,
      skill_category: form.skill_category || null,
    });
    setIsCreating(false);
    if (!error) {
      setIsModalOpen(false);
      setForm({ name: "", contact_person: "", phone: "", pan: "", gst: "", bank_name: "", bank_account: "", bank_ifsc: "", skill_category: "" });
      fetchSubs();
    } else {
      alert("Error: " + error.message);
    }
  };

  const canManage = profile?.role === "admin" || profile?.role === "project_manager";
  const filtered = subs.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.skill_category && s.skill_category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Subcontractors</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Manage contractors and their work orders.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/subcontractors/work-orders"
            className="flex items-center gap-2 bg-white border border-[#1C1C1C]/15 hover:border-primary text-[#1C1C1C] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" /> All Work Orders
          </Link>
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Subcontractor
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1C1C]/30" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or skill..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1C1C1C]/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm transition-all"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-16 flex flex-col items-center text-center shadow-sm">
          <Users className="w-16 h-16 text-[#1C1C1C]/10 mb-4" />
          <h2 className="text-xl font-semibold text-[#1C1C1C]">No subcontractors yet</h2>
          <p className="text-[#1C1C1C]/50 mt-2">Add your first subcontractor to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1C1C1C]/10 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C1C1C]/5 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide hidden md:table-cell">Skill Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide hidden lg:table-cell">GST</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#1C1C1C]/40 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]/5">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1C1C1C]">{sub.name}</p>
                    {sub.contact_person && <p className="text-xs text-[#1C1C1C]/50 mt-0.5">{sub.contact_person}</p>}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#1C1C1C]/70 bg-[#1C1C1C]/5 px-2.5 py-1 rounded-full">
                      {sub.skill_category || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {sub.phone ? (
                      <span className="flex items-center gap-1.5 text-sm text-[#1C1C1C]/70">
                        <Phone className="w-3.5 h-3.5" /> {sub.phone}
                      </span>
                    ) : <span className="text-[#1C1C1C]/30 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-sm font-mono text-[#1C1C1C]/60">{sub.gst || "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${sub.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                      {sub.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/subcontractors/work-orders?sub=${sub.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md"
                    >
                      Work Orders <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#1C1C1C]/10 bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="font-heading font-bold text-xl text-[#1C1C1C]">Add Subcontractor</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#1C1C1C]/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#1C1C1C]/40" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Company / Contractor Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Kumar Construction Co."
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Contact Person</label>
                  <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Skill Category</label>
                  <input value={form.skill_category} onChange={(e) => setForm({ ...form, skill_category: e.target.value })}
                    placeholder="e.g. Civil, Electrical, Plumbing"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">PAN</label>
                  <input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">GST Number</label>
                  <input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary font-mono" />
                </div>
              </div>

              <div className="border-t border-[#1C1C1C]/10 pt-5">
                <h3 className="text-sm font-bold text-[#1C1C1C]/60 uppercase tracking-wide mb-4">Bank Details (optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Bank Name</label>
                    <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="e.g. SBI"
                      className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">Account No.</label>
                    <input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                      placeholder="Account number"
                      className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C]/70 mb-1.5">IFSC Code</label>
                    <input value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3 py-2.5 border border-[#1C1C1C]/15 rounded-lg text-sm outline-none focus:border-primary font-mono" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#1C1C1C]/10 text-sm font-bold text-[#1C1C1C]/60 hover:bg-[#1C1C1C]/5">Cancel</button>
                <button type="submit" disabled={isCreating}
                  className="flex-[2] bg-[#1C1C1C] hover:bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {isCreating ? "Saving..." : "Save Subcontractor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
