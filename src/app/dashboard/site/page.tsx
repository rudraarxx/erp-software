"use client";

import Link from "next/link";
import { Activity, AlertTriangle, Image as ImageIcon, ChevronRight } from "lucide-react";

const SITE_MODULES = [
  {
    title: "Daily Progress Report (DPR)",
    desc: "Log daily activities, weather, manpower, and delays per project.",
    href: "/dashboard/site/dpr",
    icon: Activity,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    title: "Snag List (Punch List)",
    desc: "Record site defects, assign them, and track resolution.",
    href: "/dashboard/site/snags",
    icon: AlertTriangle,
    color: "bg-red-50 text-red-600 border-red-100",
  },
  {
    title: "Photo Diary",
    desc: "Upload and view timestamped site progress photos.",
    href: "/dashboard/site/photos",
    icon: ImageIcon,
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
];

export default function SiteActivityOverviewPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Site Activity</h1>
          <p className="text-[#1C1C1C]/60 mt-1 flex items-center gap-1.5">
            Log and trace your daily site operations.
          </p>
        </div>
        <div className="text-sm font-semibold text-[#1C1C1C]/60 bg-white px-4 py-2 rounded-lg border border-[#1C1C1C]/10 shadow-sm">
          {today}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {SITE_MODULES.map(({ title, desc, href, icon: Icon, color }) => (
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
              Launch Module <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
