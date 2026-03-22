'use client';

import { useState, useEffect } from 'react';
import { useInvoices, ClientInvoiceWithItems, VendorInvoice } from '@/hooks/useInvoices';
import { useProfile } from '@/hooks/useProfile';
import { FileText, Users, Building2, ExternalLink, ArrowRight, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDashboardPage() {
  const { profile } = useProfile();
  const { loading, getClientInvoices, getVendorInvoices } = useInvoices();
  
  const [clientInvoices, setClientInvoices] = useState<ClientInvoiceWithItems[]>([]);
  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoice[]>([]);

  useEffect(() => {
    if(profile) {
      getClientInvoices().then(setClientInvoices);
      getVendorInvoices().then(setVendorInvoices);
    }
  }, [profile, getClientInvoices, getVendorInvoices]);

  // Calculations for Client Invoices (Accounts Receivable)
  const openClient = clientInvoices.filter(i => i.status !== 'paid' && i.status !== 'draft');
  const paidClient = clientInvoices.filter(i => i.status === 'paid');
  const receivableTotal = openClient.reduce((sum, i) => sum + i.net_amount, 0);

  // Calculations for Vendor Invoices (Accounts Payable)
  const openVendor = vendorInvoices.filter(i => i.status !== 'paid' && i.status !== 'draft');
  const draftsVendor = vendorInvoices.filter(i => i.status === 'draft'); // Pending approval
  const payableTotal = openVendor.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Invoice Management</h1>
          <p className="text-[#1C1C1C]/60 mt-1">Unified dashboard for Accounts Receivable (Client) and Payable (Vendor).</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* CLIENT INVOICES CARD */}
          <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1C1C1C]">Client Bills (A/R)</h2>
                <p className="text-sm text-[#1C1C1C]/60">Running Account / Sales Invoices</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-1">Open A/R Balance</p>
                <p className="text-2xl font-bold font-heading text-blue-900 tabular-nums">₹{receivableTotal.toLocaleString()}</p>
                <p className="text-xs text-blue-700/70 mt-1">{openClient.length} Invoices pending payment</p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                <p className="text-sm font-semibold text-emerald-800 mb-1">Cleared YTD</p>
                <p className="text-2xl font-bold font-heading text-emerald-900 tabular-nums">₹{paidClient.reduce((s, i) => s + i.net_amount, 0).toLocaleString()}</p>
                <p className="text-xs text-emerald-700/70 mt-1">{paidClient.length} Invoices Paid</p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#1C1C1C]/10">
              <Link href="/dashboard/invoices/client" className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1C1C1C] text-white rounded-lg font-semibold text-sm hover:bg-primary transition-colors">
                Manage Client Bills <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* VENDOR INVOICES CARD */}
          <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1C1C1C]">Vendor Bills (A/P)</h2>
                <p className="text-sm text-[#1C1C1C]/60">Supplier AP and 3-Way Matches</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                <p className="text-sm font-semibold text-red-800 mb-1">Approved A/P Balance</p>
                <p className="text-2xl font-bold font-heading text-red-900 tabular-nums">₹{payableTotal.toLocaleString()}</p>
                <p className="text-xs text-red-700/70 mt-1">{openVendor.length} Invoices awaiting payment</p>
              </div>
              <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
                <p className="text-sm font-semibold text-orange-800 mb-1">Pending 3-Way Match</p>
                <p className="text-2xl font-bold font-heading text-orange-900 tabular-nums">{draftsVendor.length}</p>
                <p className="text-xs text-orange-700/70 mt-1">Invoices awaiting GRN match</p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#1C1C1C]/10">
              <Link href="/dashboard/invoices/vendor" className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors">
                Process Vendor Bills <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
        </div>
      )}
      
      {!loading && (clientInvoices.length > 0 || vendorInvoices.length > 0) && (
        <div className="bg-white rounded-2xl border border-[#1C1C1C]/10 shadow-sm p-6 mt-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Recent Activity
          </h3>
          <div className="space-y-3">
             {clientInvoices.slice(0, 3).map(inv => (
               <div key={`client-${inv.id}`} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                 <div>
                   <p className="font-semibold text-[#1C1C1C] text-sm">Client RA Bill: {inv.ra_bill_no || 'Draft'}</p>
                   <p className="text-xs text-[#1C1C1C]/60">{inv.project_name} • {new Date(inv.invoice_date).toLocaleDateString()}</p>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-[#1C1C1C] text-sm tabular-nums">₹{inv.net_amount.toLocaleString()}</p>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{inv.status}</span>
                 </div>
               </div>
             ))}
             {vendorInvoices.slice(0, 3).map(inv => (
               <div key={`vendor-${inv.id}`} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                 <div>
                   <p className="font-semibold text-[#1C1C1C] text-sm">Vendor AP: {inv.invoice_no}</p>
                   <p className="text-xs text-[#1C1C1C]/60">{inv.vendor_name} • {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'No Deadline'}</p>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-[#1C1C1C] text-sm tabular-nums">₹{inv.amount.toLocaleString()}</p>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">{inv.status}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
