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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { canAccess, ROLE_LABELS } from "@/lib/rbac";

const ALL_NAV_LINKS = [
  { name: "Overview",       href: "/dashboard",              icon: LayoutDashboard, section: "overview" },
  { name: "Projects",       href: "/dashboard/projects",     icon: FolderKanban,    section: "projects" },
  { name: "Attendance",     href: "/dashboard/attendance",   icon: UserCheck,       section: "attendance" },
  { name: "Subcontractors", href: "/dashboard/subcontractors", icon: Users,         section: "subcontractors" },
  { name: "Labour Directory",href: "/dashboard/labour",      icon: Users,           section: "labour" },
  { name: "Materials",      href: "/dashboard/materials",    icon: Package,         section: "materials" },
  { name: "Warehouse",      href: "/dashboard/warehouse",    icon: Warehouse,       section: "warehouse" },
  { name: "Equipment",      href: "/dashboard/equipment",    icon: Wrench,          section: "equipment" },
  { name: "Site Activity",  href: "/dashboard/site",         icon: Activity,        section: "site" },
  { name: "Finance",        href: "/dashboard/finance",      icon: Wallet,          section: "finance" },
  { name: "Invoices",       href: "/dashboard/invoices",     icon: FileText,        section: "invoices" },
  { name: "Staff",          href: "/dashboard/staff",        icon: Shield,          section: "staff" },
  { name: "Reports",        href: "/dashboard/reports",      icon: BarChart,        section: "reports" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useProfile();

  // Filter nav links by role
  const navLinks = ALL_NAV_LINKS.filter((link) =>
    canAccess(profile?.role ?? null, link.section)
  );

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
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-[#1C1C1C]/10 w-64 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-20 items-center px-6 border-b border-[#1C1C1C]/10 hidden md:flex">
          <Link href="/dashboard">
            <Image src="/ssLogo.png" alt="SolidStonne" width={180} height={50} className="h-10 w-auto mix-blend-multiply object-contain" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1.5">
            {(loading ? ALL_NAV_LINKS : navLinks).map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-[#1C1C1C]/5 text-[#1C1C1C] border border-[#1C1C1C]/10 shadow-sm font-semibold"
                      : "text-[#1C1C1C]/60 hover:text-[#1C1C1C] hover:bg-[#1C1C1C]/5"
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-[#1C1C1C]/50"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info in Sidebar */}
        <div className="p-4 border-t border-[#1C1C1C]/10 space-y-3">
          {profile && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1C1C] truncate">{profile.name}</p>
                <p className="text-xs text-[#1C1C1C]/50 truncate">
                  {ROLE_LABELS[profile.role]} · {profile.company_name}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
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
            <div className="flex items-center gap-3 pl-5 border-l border-[#1C1C1C]/10">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-[#1C1C1C]">
                  {loading ? "Loading..." : profile?.name ?? "User"}
                </p>
                <p className="text-xs text-[#1C1C1C]/50 truncate max-w-[160px]">
                  {profile ? `${ROLE_LABELS[profile.role]} · ${profile.company_name}` : ""}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-primary transition-colors">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
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
