// @ts-nocheck
/**
 * GET /api/dashboard/summary
 * Tenant-scoped dashboard KPIs from the authenticated company's database.
 */

import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function fmtPeriod(p: string) {
  if (!p) return ""
  const [y, m] = String(p).split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-GH", {
    month: "long",
    year: "numeric",
  })
}

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

async function safeCount(
  promise: PromiseLike<{ count: number | null; error: any }>,
): Promise<number> {
  try {
    const { count, error } = await promise
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevPeriod = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

    const [
      empRes,
      newEmpCount,
      payRunRes,
      prevPayRunRes,
      leaveCount,
      overtimeCount,
      payrollPendingCount,
      activeCourseCount,
      recentRunRes,
      probationCount,
    ] = await Promise.all([
      service
        .from("employees")
        .select("id, department, status", { count: "exact" })
        .eq("company_id", companyId)
        .in("status", ["active", "Active"]),
      safeCount(
        service
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .gte("date_of_joining", monthStart),
      ),
      service
        .from("payroll_runs")
        .select("id, status, total_net_pay, pay_period_start, total_gross_pay")
        .eq("company_id", companyId)
        .gte("pay_period_start", `${currentPeriod}-01`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      service
        .from("payroll_runs")
        .select("total_net_pay")
        .eq("company_id", companyId)
        .gte("pay_period_start", `${prevPeriod}-01`)
        .lt("pay_period_start", `${currentPeriod}-01`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      safeCount(
        service
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "pending"),
      ),
      safeCount(
        service
          .from("overtime_requests")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "pending"),
      ),
      safeCount(
        service
          .from("payroll_runs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "pending"),
      ),
      safeCount(
        service
          .from("learning_courses")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "active"),
      ),
      service
        .from("payroll_runs")
        .select("id, status, pay_period_start, total_net_pay, created_at, updated_at")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(4),
      safeCount(
        service
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .ilike("status", "%probation%"),
      ),
    ])

    const employees = empRes.data ?? []
    const totalEmployees = empRes.count ?? employees.length
    const deptSet = new Set<string>()
    employees.forEach((e: any) => {
      if (e.department) deptSet.add(e.department)
    })

    const currentRun = payRunRes.data
    const prevRun = prevPayRunRes.data
    const monthlyPayroll = Number(currentRun?.total_net_pay ?? 0)
    const prevPayroll = Number(prevRun?.total_net_pay ?? 0)
    const payrollChange = prevPayroll > 0 ? ((monthlyPayroll - prevPayroll) / prevPayroll) * 100 : 0
    const pendingApprovals = leaveCount + overtimeCount + payrollPendingCount

    const recentRuns = (recentRunRes.data ?? []) as any[]
    const recentActivity = recentRuns
      .map((run: any) => {
        const period = fmtPeriod(run.pay_period_start?.slice(0, 7) ?? "")
        const net = run.total_net_pay ? ` · ${money(run.total_net_pay)}` : ""
        const statusLabel =
          run.status === "paid"
            ? "Paid"
            : run.status === "approved"
              ? "Approved"
              : run.status === "pending"
                ? "Pending"
                : run.status === "completed"
                  ? "Completed"
                  : run.status === "partial"
                    ? "Partial"
                    : "Draft"
        const type: "payroll" | "hr" | "alert" | "training" = ["approved", "paid", "completed"].includes(
          run.status,
        )
          ? "payroll"
          : run.status === "pending"
            ? "alert"
            : "hr"
        return {
          text: `Payroll ${statusLabel.toLowerCase()} for ${period}${net}`,
          time: new Date(run.updated_at || run.created_at).toLocaleDateString("en-GH", {
            day: "numeric",
            month: "short",
          }),
          type,
          badge: statusLabel,
        }
      })
      .slice(0, 5)

    const latestRun = recentRuns[0]

    return NextResponse.json({
      company_id: companyId,
      totalEmployees,
      newEmployeesThisMonth: newEmpCount,
      monthlyPayroll,
      payrollChange,
      openPositions: 0,
      pendingApprovals,
      onProbation: probationCount,
      departments: deptSet.size,
      activeGoals: 0,
      reviewsDue: 0,
      activeCourses: activeCourseCount,
      enrollments: 0,
      latestPayPeriod: currentPeriod,
      latestPayRun: latestRun
        ? {
            status: latestRun.status,
            period: fmtPeriod(latestRun.pay_period_start?.slice(0, 7) ?? ""),
          }
        : null,
      recentActivity,
      compliancePayeUpToDate: true,
      complianceSsnitUpToDate: true,
    })
  } catch (err) {
    return jsonError(err, "Failed to load dashboard")
  }
}
