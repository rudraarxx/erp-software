import { Activity, FolderKanban, TrendingUp, Users } from "lucide-react";

export default function DashboardOverview() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#1C1C1C]">Dashboard Overview</h1>
        <p className="text-[#1C1C1C]/60 mt-1">Welcome back. Here is what is happening across your sites today.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards - Minimal inline style before adding shadcn full ui if needed */}
        {[
          { title: "Active Projects", value: "12", icon: FolderKanban, trend: "+2 this month" },
          { title: "On-Site Labor", value: "348", icon: Users, trend: "4 sites reported" },
          { title: "Pending Invoices", value: "₹45.2L", icon: TrendingUp, trend: "3 action required" },
          { title: "Material Indents", value: "15", icon: Activity, trend: "8 pending approval" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-[#1C1C1C]/60">{stat.title}</h3>
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold font-heading text-[#1C1C1C]">{stat.value}</div>
              <p className="text-xs text-[#1C1C1C]/50 mt-1 flex items-center gap-1">
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#1C1C1C]/10 p-6 shadow-sm min-h-[400px] flex items-center justify-center text-center">
        <div>
           <Activity className="w-12 h-12 text-[#1C1C1C]/20 mx-auto mb-4" />
           <h3 className="text-lg font-semibold text-[#1C1C1C]">Activity Stream Loading</h3>
           <p className="text-sm text-[#1C1C1C]/50 mt-1 max-w-sm">
             Connect Supabase to see real-time project updates, attendance logs, and equipment transfers here.
           </p>
        </div>
      </div>
    </div>
  );
}
