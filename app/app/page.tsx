"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calculator,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  UserCheck,
  GraduationCap,
  Target,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  Briefcase,
  Loader2,
  RefreshCw,
} from "lucide-react"

type DashboardData = {
  totalEmployees: number
  newEmployeesThisMonth: number
  monthlyPayroll: number
  payrollChange: number
  openPositions: number
  pendingApprovals: number
  onProbation: number
  departments: number
  activeGoals: number
  reviewsDue: number
  activeCourses: number
  enrollments: number
  latestPayPeriod: string
  latestPayRun: { status: string; period: string } | null
  recentActivity: { text: string; time: string; type: "payroll" | "hr" | "alert" | "training"; badge: string }[]
  compliancePayeUpToDate: boolean
  complianceSsnitUpToDate: boolean
}

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtPeriod(p: string) {
  if (!p) return ""
  const [y, m] = p.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-GH", {
    month: "long",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevPeriod = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

      const [
        empRes,
        newEmpRes,
        payRunRes,
        prevPayRunRes,
        leaveRes,
        overtimeRes,
        payslipApprovalRes,
        activeCourseRes,
        recentRunRes,
      ] = await Promise.all([
        // Total active employees
        supabase.from("employees").select("id, department", { count: "exact" }).in("status", ["active", "Active"]),
        // New employees this month
        supabase.from("employees").select("id", { count: "exact", head: true }).gte("date_of_joining", monthStart),
        // Current period payroll run
        supabase
          .from("payroll_runs")
          .select("id, status, total_net_pay, pay_period_start, total_gross_pay")
          .gte("pay_period_start", `${currentPeriod}-01`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Previous period payroll run for comparison
        supabase
          .from("payroll_runs")
          .select("total_net_pay")
          .gte("pay_period_start", `${prevPeriod}-01`)
          .lt("pay_period_start", `${currentPeriod}-01`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Pending leave approvals
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        // Pending overtime approvals
        supabase.from("overtime_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        // Pending payroll approvals
        supabase.from("payroll_runs").select("id", { count: "exact", head: true }).eq("status", "pending"),
        // Active learning courses
        supabase.from("learning_courses").select("id", { count: "exact", head: true }).eq("status", "active"),
        // Recent payroll runs for activity
        supabase
          .from("payroll_runs")
          .select("id, status, pay_period_start, total_net_pay, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(4),
      ])

      const employees = empRes.data ?? []
      const totalEmployees = empRes.count ?? employees.length

      // Count departments
      const deptSet = new Set<string>()
      employees.forEach((e: any) => { if (e.department) deptSet.add(e.department) })

      const currentRun = payRunRes.data
      const prevRun = prevPayRunRes.data
      const monthlyPayroll = currentRun?.total_net_pay ?? 0
      const prevPayroll = prevRun?.total_net_pay ?? 0
      const payrollChange = prevPayroll > 0 ? ((monthlyPayroll - prevPayroll) / prevPayroll) * 100 : 0

      const pendingLeave = leaveRes.count ?? 0
      const pendingOvertime = overtimeRes.count ?? 0
      const pendingPayroll = payslipApprovalRes.count ?? 0
      const pendingApprovals = pendingLeave + pendingOvertime + pendingPayroll

      const recentRuns = (recentRunRes.data ?? []) as any[]
      const recentActivity = recentRuns
        .map((run: any) => {
          const period = fmtPeriod(run.pay_period_start?.slice(0, 7) ?? "")
          const net = run.total_net_pay ? ` · ${money(run.total_net_pay)}` : ""
          const statusLabel =
            run.status === "paid"     ? "Paid"     :
            run.status === "approved" ? "Approved" :
            run.status === "pending"  ? "Pending"  :
            run.status === "completed"? "Completed":
            run.status === "partial"  ? "Partial"  :
            "Draft"
          const type: "payroll" | "hr" | "alert" | "training" =
            ["approved", "paid", "completed"].includes(run.status) ? "payroll" :
            run.status === "pending" ? "alert" : "hr"
          return {
            text: `Payroll ${statusLabel.toLowerCase()} for ${period}${net}`,
            time: new Date(run.updated_at).toLocaleDateString("en-GH", { day: "numeric", month: "short" }),
            type,
            badge: statusLabel,
          }
        })
        .slice(0, 5)

      const latestRun = recentRuns[0]

      setData({
        totalEmployees,
        newEmployeesThisMonth: newEmpRes.count ?? 0,
        monthlyPayroll,
        payrollChange,
        openPositions: 0, // recruitment module placeholder
        pendingApprovals,
        onProbation: 0,
        departments: deptSet.size,
        activeGoals: 0,
        reviewsDue: 0,
        activeCourses: activeCourseRes.count ?? 0,
        enrollments: 0,
        latestPayPeriod: currentPeriod,
        latestPayRun: latestRun
          ? { status: latestRun.status, period: fmtPeriod(latestRun.pay_period_start?.slice(0, 7) ?? "") }
          : null,
        recentActivity,
        compliancePayeUpToDate: true,
        complianceSsnitUpToDate: true,
      })
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const periodLabel = data?.latestPayRun?.period || fmtPeriod(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll Dashboard</h1>
          <p className="text-gray-600">
            {loading ? "Loading your organizational overview…" : "Here's your complete organizational overview."}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            {periodLabel}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="text-gray-500"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/app/payroll">Process Payroll</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
            {loading ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> : <Users className="w-4 h-4 text-gray-400" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "—" : data?.totalEmployees ?? 0}
            </div>
            {!loading && (data?.newEmployeesThisMonth ?? 0) > 0 && (
              <div className="flex items-center text-xs text-emerald-600 mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +{data?.newEmployeesThisMonth} this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Payroll</CardTitle>
            {loading ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> : <Calculator className="w-4 h-4 text-gray-400" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "—" : data?.monthlyPayroll ? money(data.monthlyPayroll) : "No run yet"}
            </div>
            {!loading && data?.latestPayRun && (
              <div className="flex items-center text-xs mt-1">
                <Badge className={`text-[10px] px-1.5 py-0 ${
                  data.latestPayRun.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                  data.latestPayRun.status === "approved" ? "bg-blue-100 text-blue-700" :
                  data.latestPayRun.status === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{data.latestPayRun.status}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Departments</CardTitle>
            {loading ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> : <Briefcase className="w-4 h-4 text-gray-400" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "—" : data?.departments ?? 0}
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active departments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            {loading ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> : <Clock className="w-4 h-4 text-gray-400" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "—" : data?.pendingApprovals ?? 0}
            </div>
            {!loading && (data?.pendingApprovals ?? 0) > 0 && (
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                Requires attention
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module summary cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-600" />
              Employee Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Employees</span>
              <span className="font-medium">{loading ? "—" : data?.totalEmployees ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">New This Month</span>
              <span className="font-medium">{loading ? "—" : data?.newEmployeesThisMonth ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Departments</span>
              <span className="font-medium">{loading ? "—" : data?.departments ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
              Payroll Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Period</span>
              <span className="font-medium">{loading ? "—" : periodLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Run Status</span>
              <span className="font-medium capitalize">{loading ? "—" : data?.latestPayRun?.status ?? "Not run"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net Pay</span>
              <span className="font-medium">{loading ? "—" : data?.monthlyPayroll ? money(data.monthlyPayroll) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Pending</span>
              <span className="font-medium">{loading ? "—" : data?.pendingApprovals ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payroll</span>
              <span className="font-medium">{loading ? "—" : "View"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Leave & Overtime</span>
              <span className="font-medium">{loading ? "—" : "View"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
              Learning & Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Courses</span>
              <span className="font-medium">{loading ? "—" : data?.activeCourses ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Enrollments</span>
              <span className="font-medium">—</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-medium">—</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
              <Link href="/app/payroll">
                <Calculator className="w-4 h-4 mr-2" />
                Process Payroll
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/app/employees/new">
                <Users className="w-4 h-4 mr-2" />
                Add Employee
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/app/approvals">
                <Calendar className="w-4 h-4 mr-2" />
                Approve Requests
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/app/payroll/payslips">
                <FileText className="w-4 h-4 mr-2" />
                View Payslips
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/app/analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Payroll Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
                <span className="text-sm text-gray-500">Loading activity…</span>
              </div>
            ) : data?.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No payroll runs yet.</p>
                <Button asChild size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/app/payroll">Run First Payroll</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.recentActivity.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      a.type === "payroll" ? "bg-blue-50" :
                      a.type === "alert"   ? "bg-orange-50" :
                      a.type === "training"? "bg-purple-50" :
                      "bg-green-50"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      a.type === "payroll" ? "bg-blue-500" :
                      a.type === "alert"   ? "bg-orange-500" :
                      a.type === "training"? "bg-purple-500" :
                      "bg-green-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.text}</p>
                      <p className="text-xs text-gray-500">{a.time}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {a.badge}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-emerald-600" />
            Compliance & System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">PAYE Calculations</p>
                <p className="text-sm text-gray-600">Up to date with 2025 rates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">SSNIT Contributions</p>
                <p className="text-sm text-gray-600">All submissions current</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Data Security</p>
                <p className="text-sm text-gray-600">All systems secure</p>
              </div>
            </div>
            <div className={`flex items-center space-x-3 p-4 rounded-lg ${(data?.pendingApprovals ?? 0) > 0 ? "bg-yellow-50" : "bg-green-50"}`}>
              {(data?.pendingApprovals ?? 0) > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-gray-900">Pending Approvals</p>
                <p className="text-sm text-gray-600">
                  {loading ? "Loading…" : (data?.pendingApprovals ?? 0) > 0 ? `${data?.pendingApprovals} items need review` : "All up to date"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
