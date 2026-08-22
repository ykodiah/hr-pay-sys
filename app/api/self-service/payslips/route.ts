import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Keep the latest non-superseded slip per pay_period for portal download. */
function latestPerPeriod(rows: any[]): any[] {
  const byPeriod = new Map<string, any>()
  for (const row of rows || []) {
    const status = String(row.status || "").toLowerCase()
    if (status === "superseded" || status === "void" || status === "archived") continue
    const key = String(row.pay_period || row.pay_period_start || "").slice(0, 7)
    if (!key) continue
    const prev = byPeriod.get(key)
    if (!prev) {
      byPeriod.set(key, row)
      continue
    }
    const prevTs = new Date(prev.created_at || prev.updated_at || prev.pay_date || 0).getTime()
    const nextTs = new Date(row.created_at || row.updated_at || row.pay_date || 0).getTime()
    if (nextTs >= prevTs) byPeriod.set(key, row)
  }
  return Array.from(byPeriod.values()).sort((a, b) => {
    const da = String(b.pay_period || b.pay_date || "")
    const db = String(a.pay_period || a.pay_date || "")
    return da.localeCompare(db)
  })
}

/** GET — the signed-in employee's latest payslips (one per period). */
export async function GET(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const year = searchParams.get("year")

    if (id) {
      const { data, error } = await session.db
        .from("payslips")
        .select("*")
        .eq("id", id)
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return NextResponse.json({ error: "Payslip not found" }, { status: 404 })
      if (String(data.status || "").toLowerCase() === "superseded") {
        return NextResponse.json(
          { error: "This payslip was replaced by a newer payroll run for the same period." },
          { status: 410 },
        )
      }

      if (!data.viewed_at) {
        await session.db
          .from("payslips")
          .update({ viewed_at: new Date().toISOString(), status: data.status === "issued" ? "viewed" : data.status })
          .eq("id", id)
          .eq("employee_id", session.employeeId)
      }
      await logPortalActivity(session, "payslip_view", data.pay_period, { payslip_id: id })

      return NextResponse.json({ payslip: data, company_name: session.companyName })
    }

    let query = session.db
      .from("payslips")
      .select(
        "id, pay_period, pay_period_start, pay_period_end, pay_date, basic_salary, gross_pay, total_deductions, paye_tax, ssnit_employee, loan_deduction, net_pay, status, viewed_at, ytd_gross, ytd_net, created_at, updated_at, payroll_run_id",
      )
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .not("status", "eq", "superseded")
      .not("status", "eq", "void")
      .order("pay_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(240)

    if (year) {
      query = query.gte("pay_period_start", `${year}-01-01`).lte("pay_period_end", `${year}-12-31`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const payslips = latestPerPeriod(data || [])
    const ytd = payslips.reduce(
      (acc: { gross: number; net: number; tax: number; ssnit: number }, p: any) => {
        acc.gross += Number(p.gross_pay || 0)
        acc.net += Number(p.net_pay || 0)
        acc.tax += Number(p.paye_tax || 0)
        acc.ssnit += Number(p.ssnit_employee || 0)
        return acc
      },
      { gross: 0, net: 0, tax: 0, ssnit: 0 },
    )

    const years = Array.from(
      new Set(
        payslips
          .map((p: any) => (p.pay_period_start || p.pay_date || "").slice(0, 4))
          .filter(Boolean),
      ),
    ).sort((a, b) => Number(b) - Number(a))

    return NextResponse.json({
      payslips,
      totals: ytd,
      years,
      company_name: session.companyName,
      employee_name:
        session.employee.display_name ||
        session.employee.full_name ||
        `${session.employee.first_name || ""} ${session.employee.last_name || ""}`.trim(),
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load payslips")
  }
}
