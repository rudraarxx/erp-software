import { Wallet, ArrowUpRight, ArrowDownLeft, Receipt, FileText, PieChart, Users, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const financeLinks = [
    { 
      title: "Payments",          
      desc: "Record incoming, outgoing, and party-to-party payments.",
      href: "/dashboard/finance/payments",
      icon: Wallet
    },
    { 
      title: "Material Purchases",         
      desc: "Record purchases linked to GRN and vendors.",
      href: "/dashboard/finance/purchases",
      icon: ShoppingCart
    },
    { 
      title: "Site Expenses",             
      desc: "Log day-to-day site costs per project.",
      href: "/dashboard/finance/expenses",
      icon: Receipt
    },
    { 
      title: "Project Budgets",   
      desc: "Budget vs. actual spend across cost heads.",
      href: "/dashboard/finance/budgets",
      icon: PieChart
    },
    { 
      title: "Sales Invoices",  
      desc: "GST-compliant client invoices with PDF.",
      href: "/dashboard/finance/sales-invoices",
      icon: FileText
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Finance & Accounts</h1>
        <p className="text-[#1C1C1C]/60 mt-1">Manage payments, purchases, budgets, and invoices.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {financeLinks.map(({ title, desc, href, icon: Icon }) => (
          <Link href={href} key={title} className="bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-3 group">
            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
              <Icon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-[#1C1C1C] text-md">{title}</h2>
              <p className="text-xs text-[#1C1C1C]/60 mt-1">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
