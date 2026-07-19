"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Calendar,
  CreditCard,
  DollarSign,
  User,
  GraduationCap,
  Target,
  Bell,
  Loader2,
} from "lucide-react"

type MePayload = {
  employee: {
    first_name?: string
    last_name?: string
    full_name?: string
    position?: string
    department?: string
    employee_id?: string
  }
  stats: {
    leave_days_remaining: number | null
    last_net_pay: number | null
    last_pay_period: string | null
    goals_count: number
    avg_goal_progress: number | null
  }
  company_name?: string | null
}

export default function SelfServiceDashboard() {
  const [me, setMe] = useState<MePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/self-service/me", { credentials: "include", cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load profile")
        setMe(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const name =
    me?.employee?.full_name ||
    `${me?.employee?.first_name || ""} ${me?.employee?.last_name || ""}`.trim() ||
    "there"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your portal…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name.split(" ")[0]}!</h1>
          <p className="text-gray-600">
            {me?.employee?.position || "Employee"}
            {me?.employee?.department ? ` · ${me.employee.department}` : ""}
            {me?.company_name ? ` · ${me.company_name}` : ""}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            {me?.employee?.employee_id || "Employee"}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/self-service/notifications">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}. Ask HR to link your Auth account to an employee record for this company.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {me?.stats?.last_net_pay != null
                    ? `GHS ${Number(me.stats.last_net_pay).toLocaleString()}`
                    : "—"}
                </div>
                <p className="text-sm text-gray-600">
                  Last Net Pay{me?.stats?.last_pay_period ? ` (${me.stats.last_pay_period})` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {me?.stats?.leave_days_remaining ?? "—"}
                </div>
                <p className="text-sm text-gray-600">Leave Days Left</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {me?.stats?.avg_goal_progress != null ? `${me.stats.avg_goal_progress}%` : "—"}
                </div>
                <p className="text-sm text-gray-600">Goal Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{me?.stats?.goals_count ?? 0}</div>
                <p className="text-sm text-gray-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/self-service/profile", label: "My Profile", icon: User, desc: "View and update your details" },
          { href: "/self-service/leave", label: "Leave", icon: Calendar, desc: "Request and track leave" },
          { href: "/self-service/payslips", label: "Payslips", icon: FileText, desc: "Download payslips" },
          { href: "/self-service/loans", label: "Loans", icon: CreditCard, desc: "Loan balances and requests" },
          { href: "/self-service/goals", label: "Goals", icon: Target, desc: "Your performance goals" },
          { href: "/self-service/courses", label: "Learning", icon: GraduationCap, desc: "Courses and training" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-emerald-300 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-4 h-4 text-emerald-600" /> {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
