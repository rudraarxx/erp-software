"use client";

import Link from "next/link";
import { Package, ClipboardList, Truck, ArrowLeftRight, RotateCcw, BarChart3, ChevronRight } from "lucide-react";

const MODULES = [
  {
    title: "Material Master",
    desc: "Register and manage your material catalogue with units and categories.",
    href: "/dashboard/materials/master",
    icon: Package,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    title: "Material Indents",
    desc: "Raise material requests from site and track approval status.",
    href: "/dashboard/materials/indents",
    icon: ClipboardList,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    title: "Goods Receipt (GRN)",
    desc: "Record materials received at site or godown from vendors.",
    href: "/dashboard/materials/grn",
    icon: Truck,
    color: "bg-green-50 text-green-600 border-green-100",
  },
  {
    title: "Material Transfers",
    desc: "Move materials between sites or from site back to godown.",
    href: "/dashboard/materials/transfers",
    icon: ArrowLeftRight,
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    title: "Material Returns",
    desc: "Log materials returned to vendor — damaged or excess stock.",
    href: "/dashboard/materials/returns",
    icon: RotateCcw,
    color: "bg-red-50 text-red-600 border-red-100",
  },
  {
    title: "Site Inventory",
    desc: "Real-time stock view per project with low-stock alerts.",
    href: "/dashboard/materials/inventory",
    icon: BarChart3,
    color: "bg-teal-50 text-teal-600 border-teal-100",
  },
];

export default function MaterialsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Material Management</h1>
        <p className="text-[#1C1C1C]/60 mt-1">Track every material from receipt to consumption.</p>
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
              Open Module <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
