/**
 * GET /api/payroll/runs/[id]/pdf
 * Printable payroll register for a run (Save as PDF from browser).
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { getPayrollRunPayslips } from "@/lib/services/payslip-service"
import { renderPayrollRegisterHtml } from "@/lib/payroll/payslip-html"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = await createClient()
    const { data: run, error } = await client.from("payroll_runs").select("*").eq("id", id).single()
    if (error || !run) {
      return NextResponse.json({ error: error?.message || "Run not found" }, { status: 404 })
    }

    let { data: slips } = await getPayrollRunPayslips(id)
    if (!slips.length) {
      // Fall back to payroll_items if payslips missing
      const { data: items } = await client
        .from("payroll_items")
        .select("*, employees:employee_id(first_name,last_name,employee_id,department)")
        .eq("payroll_run_id", id)
      slips = (items ?? []).map((it: any) => ({
        snapshot_employee_name:
          `${it.employees?.first_name || ""} ${it.employees?.last_name || ""}`.trim(),
        snapshot_employee_id_no: it.employees?.employee_id,
        snapshot_department: it.employees?.department,
        basic_salary: it.basic_salary,
        gross_pay: it.gross_pay,
        paye_tax: it.tax_deduction,
        ssnit_employee: it.ssnit_employee,
        total_deductions: it.total_deductions,
        net_pay: it.net_pay,
        employee_id: it.employee_id,
        pay_period: String(run.pay_period_start || "").slice(0, 7),
      })) as any
    }

    const html = renderPayrollRegisterHtml(run, slips, { autoPrint: true })
    const period = String(run.pay_period_start || "").slice(0, 7)
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payroll-register-${period}.html"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render payroll PDF" },
      { status: 500 },
    )
  }
}
