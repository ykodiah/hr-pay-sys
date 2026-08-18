"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  CreditCard,
  FileText,
  Wallet,
  Clock,
  Target,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import {
  usePortalMe,
  usePortalResource,
  formatMoney,
  formatDate,
} from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
} from "@/components/self-service/portal-ui"

const QUICK_ACTIONS = [
  { label: "Request leave", href: "/self-service/leave", icon: Calendar },
  { label: "View payslips", href: "/self-service/payslips", icon: FileText },
  { label: "Apply for a loan", href: "/self-service/loans", icon: CreditCard },
  { label: "Log overtime", href: "/self-service/overtime", icon: Clock },
]

export default function EmployeeDashboard() {
  const { data: me, error, isLoading } = usePortalMe()
  const { data: goals } = usePortalResource<any>(me ? "/api/self-service/goals" : null)

  if (error) return <ErrorBlock error={error} />
  if (isLoading || !me) return <LoadingBlock rows={4} />

  const stats = me.stats || {}
  const employee = me.employee || {}
  const firstName = employee.first_name || employee.full_name || "there"
  const allGoals = [...(goals?.assigned_goals || []), ...(goals?.goals || [])]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`${employee.position || "Employee"}${
          employee.department ? ` · ${employee.department}` : ""
        }${me.company_name ? ` · ${me.company_name}` : ""}`}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Last net pay"
          value={stats.last_net_pay != null ? formatMoney(stats.last_net_pay) : "—"}
          hint={stats.last_pay_period || "No payslip issued yet"}
          icon={Wallet}
          tone="positive"
        />
        <StatCard
          label="Leave balance"
          value={`${Number(stats.leave_days_remaining || 0).toFixed(1)} days`}
          hint={
            stats.leave_days_entitled
              ? `of ${Number(stats.leave_days_entitled).toFixed(0)} entitled this year`
              : "No balance recorded"
          }
          icon={Calendar}
        />
        <StatCard
          label="Loan outstanding"
          value={formatMoney(stats.loan_outstanding)}
          hint={`${stats.active_loans || 0} active loan(s)`}
          icon={CreditCard}
          tone={Number(stats.loan_outstanding) > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Pending leave"
          value={stats.pending_leave || 0}
          hint="Requests awaiting approval"
          icon={Clock}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.href}
            asChild
            variant="outline"
            className="h-auto justify-start gap-3 bg-white py-4"
          >
            <Link href={action.href}>
              <action.icon className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          </Button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent leave</CardTitle>
              <CardDescription>Your five most recent requests</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/self-service/leave">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(me.recent_leave || []).length === 0 ? (
              <EmptyState
                title="No leave requests yet"
                description="Submit your first request from the leave page."
              />
            ) : (
              <ul className="flex flex-col divide-y">
                {me.recent_leave.map((request: any) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {request.leave_type_name || "Leave"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(request.start_date)} – {formatDate(request.end_date)} ·{" "}
                        {Number(request.days_requested || 0)} day(s)
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Goal progress</CardTitle>
              <CardDescription>
                {goals?.summary?.total
                  ? `${goals.summary.completed} of ${goals.summary.total} complete`
                  : "Track what you are working on"}
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/self-service/goals">
                Manage <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {allGoals.length === 0 ? (
              <EmptyState title="No goals yet" description="Add a goal to start tracking progress." />
            ) : (
              <div className="flex flex-col gap-4">
                {allGoals.slice(0, 5).map((goal: any) => (
                  <div key={goal.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-900">
                        <Target className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="truncate">{goal.title}</span>
                      </span>
                      <span className="text-xs text-slate-500">{Number(goal.progress || 0)}%</span>
                    </div>
                    <Progress value={Number(goal.progress || 0)} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(me.change_requests || []).some((r: any) => r.status === "pending") && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                You have a profile change request awaiting HR review
              </p>
              <Link
                href="/self-service/profile"
                className="text-sm text-amber-800 underline underline-offset-2"
              >
                View request
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
