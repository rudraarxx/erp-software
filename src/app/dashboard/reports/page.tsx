"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  BarChart3,
  Users,
  AlertTriangle,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type Project = { id: string; name: string };

export default function ReportsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Report Data
  const [financials, setFinancials] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchProjects();
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchReportData(selectedProjectId);
    }
  }, [selectedProjectId, profile]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .order("name");
    if (data) setProjects(data);
  };

  const fetchReportData = async (projectId: string) => {
    setLoading(true);
    try {
      // 1. FINANCIALS (Budgets vs Expenses vs Purchases)
      let expenseQuery = supabase.from("site_expenses").select("amount");
      let purchaseQuery = supabase.from("material_purchases").select("amount");
      let budgetQuery = supabase.from("project_budgets").select("budgeted_amount");

      if (projectId !== "all") {
        expenseQuery = expenseQuery.eq("project_id", projectId);
        purchaseQuery = purchaseQuery.eq("project_id", projectId);
        budgetQuery = budgetQuery.eq("project_id", projectId);
      }

      const [expRes, purRes, budRes] = await Promise.all([
        expenseQuery,
        purchaseQuery,
        budgetQuery,
      ]);

      const totalExpenses = expRes.data?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      const totalPurchases = purRes.data?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      const totalBudget = budRes.data?.reduce((sum, item) => sum + Number(item.budgeted_amount || 0), 0) || 0;
      const actualSpend = totalExpenses + totalPurchases;

      setFinancials({
        budget: totalBudget,
        spend: actualSpend,
        expenses: totalExpenses,
        purchases: totalPurchases,
      });

      // 2. ATTENDANCE (Last 30 days summary)
      let laborQuery = supabase.from("labor_attendance").select("hours_worked, present, date");
      let staffQuery = supabase.from("staff_attendance").select("status, date");

      if (projectId !== "all") {
        laborQuery = laborQuery.eq("project_id", projectId);
        staffQuery = staffQuery.eq("project_id", projectId);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoDate = thirtyDaysAgo.toISOString().split("T")[0];

      laborQuery = laborQuery.gte("date", isoDate);
      staffQuery = staffQuery.gte("date", isoDate);

      const [labRes, stafRes] = await Promise.all([laborQuery, staffQuery]);

      const laborPresent = labRes.data?.filter(l => l.present).length || 0;
      const staffPresent = stafRes.data?.filter(s => s.status === 'present').length || 0;

      setAttendance({
        labor: laborPresent,
        staff: staffPresent,
        total: laborPresent + staffPresent,
      });

      // 3. MATERIALS (Inventory overview)
      // Only fetch site inventory for the specific project or all projects.
      let invQuery = supabase
        .from("site_inventory")
        .select("stock_qty, material_id, materials(name, unit, category), projects(name)");

      if (projectId !== "all") {
        invQuery = invQuery.eq("project_id", projectId);
      }

      invQuery = invQuery.order("stock_qty", { ascending: true }).limit(20);

      const invRes = await invQuery;
      if (invRes.data) {
        setMaterials(invRes.data);
      }

    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1C]">Reports & Analytics</h1>
          <p className="text-[#1C1C1C]/60 text-sm mt-1">
            Overview of project financials, attendance, and inventory.
          </p>
        </div>
        <div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full md:w-64 appearance-none bg-white border border-[#1C1C1C]/10 rounded-lg px-4 py-2 text-sm text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* 1. FINANCIAL SUMMARY */}
          <div className="bg-white rounded-xl border border-[#1C1C1C]/10 overflow-hidden">
            <div className="p-5 border-b border-[#1C1C1C]/10 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1C1C1C]">Financial Summary</h2>
                <p className="text-xs text-[#1C1C1C]/50">Budget vs Actual Spend</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#1C1C1C]/60">Total Budget</p>
                <p className="text-3xl font-bold text-[#1C1C1C]">
                  ₹{financials?.budget.toLocaleString('en-IN') || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#1C1C1C]/60">Actual Spend</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-[#1C1C1C]">
                    ₹{financials?.spend.toLocaleString('en-IN') || 0}
                  </p>
                  {financials && financials.spend > financials.budget && financials.budget > 0 && (
                    <span className="flex items-center text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3 mr-1" /> Over Budget
                    </span>
                  )}
                  {financials && financials.spend <= financials.budget && financials.budget > 0 && (
                    <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      <TrendingDown className="w-3 h-3 mr-1" /> Under Budget
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 md:border-l md:border-[#1C1C1C]/10 md:pl-6 text-sm">
                <div className="flex justify-between items-center text-[#1C1C1C]/70">
                  <span>Site Expenses:</span>
                  <span className="font-semibold text-[#1C1C1C]">₹{financials?.expenses.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex justify-between items-center text-[#1C1C1C]/70">
                  <span>Material Purchases:</span>
                  <span className="font-semibold text-[#1C1C1C]">₹{financials?.purchases.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ATTENDANCE OVERVIEW */}
          <div className="bg-white rounded-xl border border-[#1C1C1C]/10 overflow-hidden">
            <div className="p-5 border-b border-[#1C1C1C]/10 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1C1C1C]">Attendance (Last 30 Days)</h2>
                <p className="text-xs text-[#1C1C1C]/50">Total present man-days</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-[#1C1C1C]/60 mb-1">Total Man-Days</p>
                <p className="text-3xl font-bold text-[#1C1C1C]">{attendance?.total || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-[#1C1C1C]/60 mb-1">Labor</p>
                <p className="text-3xl font-bold text-[#1C1C1C]">{attendance?.labor || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-[#1C1C1C]/60 mb-1">Staff (Eng/Sup)</p>
                <p className="text-3xl font-bold text-[#1C1C1C]">{attendance?.staff || 0}</p>
              </div>
            </div>
          </div>

          {/* 3. MATERIAL ALERTS */}
          <div className="bg-white rounded-xl border border-[#1C1C1C]/10 overflow-hidden">
            <div className="p-5 border-b border-[#1C1C1C]/10 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1C1C1C]">Material Stock</h2>
                <p className="text-xs text-[#1C1C1C]/50">Current site inventory levels</p>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#1C1C1C]/5 text-[#1C1C1C]/60 font-medium border-b border-[#1C1C1C]/10">
                  <tr>
                    <th className="px-6 py-4">Material</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4 text-right">Stock Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]/5">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#1C1C1C]/50">
                        No inventory data found.
                      </td>
                    </tr>
                  ) : (
                    materials.map((item, i) => {
                      // Note: Because of how Supabase joins work, materials will be an object or array.
                      // Depending on the relation, materials is usually a single object here.
                      const mat = Array.isArray(item.materials) ? item.materials[0] : item.materials;
                      const proj = Array.isArray(item.projects) ? item.projects[0] : item.projects;
                      
                      const isLow = Number(item.stock_qty) < 50; // Arbitrary low stock threshold
                      
                      return (
                        <tr key={i} className="hover:bg-[#1C1C1C]/[0.02] transition-colors">
                          <td className="px-6 py-4 font-medium text-[#1C1C1C]">
                            {mat?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-[#1C1C1C]/70">
                            {mat?.category || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-[#1C1C1C]/70">
                            {proj?.name || "Multiple"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {Number(item.stock_qty).toLocaleString()} {mat?.unit || ""}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
