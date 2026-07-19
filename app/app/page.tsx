"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
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
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dashboard/summary", { credentials: "include", cache: "no-store" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load dashboard")
      }
      setData({
        totalEmployees: Number(payload.totalEmployees || 0),
        newEmployeesThisMonth: Number(payload.newEmployeesThisMonth || 0),
        monthlyPayroll: Number(payload.monthlyPayroll || 0),
        payrollChange: Number(payload.payrollChange || 0),
        openPositions: Number(payload.openPositions || 0),
        pendingApprovals: Number(payload.pendingApprovals || 0),
        onProbation: Number(payload.onProbation || 0),
        departments: Number(payload.departments || 0),
        activeGoals: Number(payload.activeGoals || 0),
        reviewsDue: Number(payload.reviewsDue || 0),
        activeCourses: Number(payload.activeCourses || 0),
        enrollments: Number(payload.enrollments || 0),
        latestPayPeriod: payload.latestPayPeriod || "",
        latestPayRun: payload.latestPayRun || null,
        recentActivity: Array.isArray(payload.recentActivity) ? payload.recentActivity : [],
        compliancePayeUpToDate: payload.compliancePayeUpToDate !== false,
        complianceSsnitUpToDate: payload.complianceSsnitUpToDate !== false,
      })
    } catch (err) {
      console.error("Dashboard load error:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const periodLabel =
    data?.latestPayRun?.period ||
    fmtPeriod(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll Dashboard</h1>
          <p className="text-gray-600">
            {loading
              ? "Loading your organizational overview…"
              : error
                ? error
                : "Here's your complete organizational overview."}
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
              {loading ? "—" : money(data?.monthlyPayroll ?? 0)}
            </div>
            {!loading && data && data.payrollChange !== 0 && (
              <div className={`flex items-center text-xs mt-1 ${data.payrollChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {data.payrollChange >= 0 ? "+" : ""}
                {data.payrollChange.toFixed(1)}% vs last period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            {loading ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "—" : data?.pendingApprovals ?? 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave, overtime & payroll</p>
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
            <p className="text-xs text-gray-500 mt-1">Active org units</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (data?.recentActivity?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No recent payroll activity for this company yet.</p>
            ) : (
              <ul className="space-y-3">
                {data!.recentActivity.map((item, idx) => (
                  <li key={`${item.text}-${idx}`} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-900">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                    <Badge variant="outline">{item.badge}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">PAYE filings</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                {data?.compliancePayeUpToDate ? "On track" : "Review"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">SSNIT remittance</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                {data?.complianceSsnitUpToDate ? "On track" : "Review"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">On probation</span>
              <span className="font-medium">{loading ? "—" : data?.onProbation ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active courses</span>
              <span className="font-medium">{loading ? "—" : data?.activeCourses ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/app/employees", label: "Employees", icon: Users },
          { href: "/app/payroll", label: "Payroll", icon: Calculator },
          { href: "/app/leave", label: "Leave", icon: Calendar },
          { href: "/app/learning", label: "Learning", icon: GraduationCap },
          { href: "/app/performance", label: "Performance", icon: Target },
          { href: "/app/documents", label: "Documents", icon: FileText },
          { href: "/app/recruitment", label: "Recruitment", icon: UserCheck },
          { href: "/app/settings", label: "Settings", icon: Shield },
        ].map(({ href, label, icon: Icon }) => (
          <Button key={href} asChild variant="outline" className="h-auto py-4 justify-start">
            <Link href={href} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
