/**
 * GET /api/payroll/runs/[id]/pdf
 * Branded printable payroll register.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { getPayrollRunPayslips } from "@/lib/services/payslip-service"
import { loadCompanyBrand, renderBrandedHtmlDocument } from "@/lib/exports/company-branding"

function money(n: number) {
  return Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

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

    const company = await loadCompanyBrand(client, run.company_id)
    let { data: slips } = await getPayrollRunPayslips(id)
    if (!slips.length) {
      const { data: items } = await client
        .from("payroll_items")
        .select("*, employees:employee_id(first_name,last_name,employee_id,department)")
        .eq("payroll_run_id", id)
      slips = (items ?? []).map((it: any) => {
        const allow = it.allowances && typeof it.allowances === "object" ? it.allowances : {}
        const allowTotal = Object.values(allow).reduce((s: number, v) => s + Number(v || 0), 0)
        return {
          snapshot_employee_name: `${it.employees?.first_name || ""} ${it.employees?.last_name || ""}`.trim(),
          snapshot_employee_id_no: it.employees?.employee_id,
          snapshot_department: it.employees?.department,
          basic_salary: it.basic_salary,
          transport_allowance: Number(allow.transport || 0),
          housing_allowance: Number(allow.housing || 0),
          medical_allowance: Number(allow.medical || 0),
          meal_allowance: Number(allow.meal || 0),
          communication_allowance: Number(allow.communication || 0),
          other_allowances: Number(allow.other || allowTotal || 0),
          overtime_pay: it.overtime_pay,
          gross_pay: it.gross_pay,
          tier3_employee: it.tier3_employee,
          ssnit_employee: it.ssnit_employee,
          paye_taxable_income: it.paye_taxable_income,
          paye_tax: it.tax_deduction,
          loan_deduction: it.loan_deduction,
          total_deductions: it.total_deductions,
          net_pay: it.net_pay,
        } as any
      })
    }

    const period = String(run.pay_period_start || "").slice(0, 7)
    const rowsHtml = slips
      .map((s: any) => {
        const allowances =
          Number(s.transport_allowance || 0) +
          Number(s.housing_allowance || 0) +
          Number(s.medical_allowance || 0) +
          Number(s.meal_allowance || 0) +
          Number(s.communication_allowance || 0) +
          Number(s.other_allowances || 0)
        return `<tr>
          <td>${s.snapshot_employee_id_no || ""}</td>
          <td>${s.snapshot_employee_name || ""}</td>
          <td>${s.snapshot_department || ""}</td>
          <td class="right">${money(Number(s.basic_salary || 0))}</td>
          <td class="right">${money(allowances)}</td>
          <td class="right">${money(Number(s.overtime_pay || 0))}</td>
          <td class="right">${money(Number(s.gross_pay || 0))}</td>
          <td class="right">${money(Number(s.tier3_employee || 0))}</td>
          <td class="right">${money(Number(s.ssnit_employee || 0))}</td>
          <td class="right">${money(Number(s.paye_taxable_income || 0))}</td>
          <td class="right">${money(Number(s.paye_tax || 0))}</td>
          <td class="right">${money(Number(s.loan_deduction || 0))}</td>
          <td class="right">${money(Number(s.total_deductions || 0))}</td>
          <td class="right">${money(Number(s.net_pay || 0))}</td>
        </tr>`
      })
      .join("")

    const html = renderBrandedHtmlDocument({
      title: "Payroll Register",
      company,
      period,
      subtitle: `Status: ${run.status} · ${slips.length} employees`,
      bodyHtml: `<table>
        <thead><tr>
          <th>Employee ID</th><th>Employee Name</th><th>Department</th>
          <th class="right">Basic Salary</th><th class="right">Allowances</th><th class="right">Overtime</th>
          <th class="right">Gross Pay</th><th class="right">Provident Fund</th><th class="right">SSNIT Employee</th>
          <th class="right">Taxable Income</th><th class="right">PAYE</th><th class="right">Loans</th>
          <th class="right">Total Deductions</th><th class="right">Net Pay</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>`,
      autoPrint: true,
    })

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
