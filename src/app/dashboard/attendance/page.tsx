"use client";

import Link from "next/link";
import { UserCheck, HardHat, Users, ChevronRight, CalendarDays } from "lucide-react";

const ATTENDANCE_MODULES = [
  {
    title: "Engineers Attendance",
    desc: "Mark and view daily attendance for site engineers.",
    href: "/dashboard/attendance/engineers",
    icon: HardHat,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    sprint: null,
  },
  {
    title: "Supervisors Attendance",
    desc: "Mark and view daily attendance for site supervisors.",
    href: "/dashboard/attendance/supervisors",
    icon: UserCheck,
    color: "bg-green-50 text-green-600 border-green-100",
    sprint: null,
  },
  {
    title: "Labour Attendance",
    desc: "Daily muster roll — trade-wise headcount and wage calculation.",
    href: "/dashboard/attendance/labour",
    icon: Users,
    color: "bg-orange-50 text-orange-600 border-orange-100",
    sprint: null,
  },
];

export default function AttendanceOverviewPage() {
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
          <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Attendance</h1>
          <p className="text-[#1C1C1C]/60 mt-1 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {today}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {ATTENDANCE_MODULES.map(({ title, desc, href, icon: Icon, color }) => (
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
