"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Package,
  Wrench,
  Activity,
  UserCheck,
  Wallet,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Warehouse,
  BarChart,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { canAccess, ROLE_LABELS } from "@/lib/rbac";

const NAV_GROUPS = [
  {
    name: "Main",
    links: [
      { name: "Overview",       href: "/dashboard",              icon: LayoutDashboard, section: "overview" },
      { name: "Reports",        href: "/dashboard/reports",      icon: BarChart,        section: "reports" },
    ],
  },
  {
    name: "Project Execution",
    links: [
      { name: "Projects",       href: "/dashboard/projects",     icon: FolderKanban,    section: "projects" },
      { name: "Site Activity",  href: "/dashboard/site",         icon: Activity,        section: "site" },
      { name: "Attendance",     href: "/dashboard/attendance",   icon: UserCheck,       section: "attendance" },
    ],
  },
  {
    name: "Workforce & Assets",
    links: [
      { name: "Staff",          href: "/dashboard/staff",        icon: Shield,          section: "staff" },
      { name: "Subcontractors", href: "/dashboard/subcontractors", icon: Users,         section: "subcontractors" },
      { name: "Labour Directory",href: "/dashboard/labour",      icon: Users,           section: "labour" },
      { name: "Equipment",      href: "/dashboard/equipment",    icon: Wrench,          section: "equipment" },
    ],
  },
  {
    name: "Logistics",
    links: [
      { name: "Materials",      href: "/dashboard/materials",    icon: Package,         section: "materials" },
      { name: "Warehouse",      href: "/dashboard/warehouse",    icon: Warehouse,       section: "warehouse" },
    ],
  },
  {
    name: "Finance",
    links: [
      { name: "Finance",        href: "/dashboard/finance",      icon: Wallet,          section: "finance" },
      { name: "Invoices",       href: "/dashboard/invoices",     icon: FileText,        section: "invoices" },
    ],
  },
  {
    name: "Management",
    links: [
      { name: "User Management", href: "/dashboard/management/users", icon: ShieldCheck, section: "management" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useProfile();

  // Filter nav groups by role
  const navGroups = NAV_GROUPS.map(group => ({
    ...group,
    links: (loading ? group.links : group.links.filter(link => 
      canAccess(profile?.role ?? null, link.section)
    ))
  })).filter(group => group.links.length > 0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[#1C1C1C]/10 px-4 py-3 flex items-center justify-between z-20 sticky top-0">
        <Image src="/ssLogo.png" alt="SolidStonne" width={150} height={45} className="h-8 w-auto mix-blend-multiply" />
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#1C1C1C]">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-[#1C1C1C]/10 w-64 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex md:flex-col md:shrink-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-20 shrink-0 items-center px-6 border-b border-[#1C1C1C]/10 hidden md:flex">
          <Link href="/dashboard">
            <Image src="/ssLogo.png" alt="SolidStonne" width={180} height={50} className="h-10 w-auto mix-blend-multiply object-contain" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 pb-8 px-4 scrollbar-hide" data-lenis-prevent>
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.name} className="space-y-1.5">
                <h3 className="px-3 mb-2 text-[10px] font-bold text-[#1C1C1C]/30 uppercase tracking-[0.05em]">
                  {group.name}
                </h3>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                          isActive
                            ? "bg-[#1C1C1C]/5 text-[#1C1C1C] border border-[#1C1C1C]/10 shadow-sm font-semibold"
                            : "text-[#1C1C1C]/60 hover:text-[#1C1C1C] hover:bg-[#1C1C1C]/5"
                        }`}
                      >
                        <link.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-[#1C1C1C]/50"}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile-only Logout (keeping it accessible on mobile) */}
        <div className="md:hidden p-4 border-t border-[#1C1C1C]/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        {/* Topbar */}
        <header className="h-16 bg-white/70 backdrop-blur-md border-b border-[#1C1C1C]/10 sticky top-0 z-10 hidden md:flex items-center justify-between px-8">
          <div className="flex items-center bg-white border border-[#1C1C1C]/10 rounded-full px-4 py-2 w-80 shadow-sm">
            <Search className="w-4 h-4 text-[#1C1C1C]/40 shrink-0" />
            <input
              type="text"
              placeholder="Search projects, materials..."
              className="ml-2 bg-transparent w-full text-sm outline-none placeholder:text-[#1C1C1C]/40 text-[#1C1C1C]"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-[#1C1C1C]/60 hover:text-[#1C1C1C] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-4 pl-5 border-l border-[#1C1C1C]/10">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-[#1C1C1C]">
                  {loading ? "Loading..." : profile?.name ?? "User"}
                </p>
                <p className="text-[10px] text-[#1C1C1C]/40 font-bold uppercase tracking-wider">
                  {profile ? `${ROLE_LABELS[profile.role]} · ${profile.company_name}` : ""}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[#1C1C1C]/90 transition-colors shadow-sm">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 ml-1 text-[#1C1C1C]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
