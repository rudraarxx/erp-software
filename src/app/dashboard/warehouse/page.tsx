"use client";

import Link from "next/link";
import { Warehouse, Truck, ArrowLeftRight, FileSpreadsheet, ChevronRight } from "lucide-react";

const MODULES = [
  {
    title: "Central Stock & Valuation",
    desc: "View the godown's current holdings and total stock valuation.",
    href: "/dashboard/warehouse/stock",
    icon: Warehouse,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    title: "Dispatch to Site",
    desc: "Send materials to active projects and generate Delivery Challans.",
    href: "/dashboard/warehouse/dispatch",
    icon: Truck,
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    title: "Receive from Site",
    desc: "Record surplus materials returned from sites to the godown.",
    href: "/dashboard/warehouse/receive",
    icon: ArrowLeftRight,
    color: "bg-green-50 text-green-600 border-green-100",
  },
];

export default function WarehousePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Warehouse Module</h1>
        <p className="text-[#1C1C1C]/60 mt-1">Manage central stock holding and dispatches across all sites.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map(({ title, desc, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm hover:shadow-md transition-all hover:border-[#1C1C1C]/20 flex flex-col gap-4"
          >
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-[#1C1C1C]">{title}</h2>
              <p className="text-sm text-[#1C1C1C]/50 mt-1">{desc}</p>
            </div>
            <div className="flex items-center text-xs font-medium text-primary gap-1 group-hover:gap-2 transition-all">
              Open <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
