/**
 * GET /api/payslips/[id]/pdf
 * Branded printable payslip (browser → Save as PDF).
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { getPayslipById } from "@/lib/services/payslip-service"
import { loadCompanyBrand, renderBrandedHtmlDocument } from "@/lib/exports/company-branding"

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { data, error } = await getPayslipById(id)
    if (error || !data) {
      return NextResponse.json({ error: error ?? "Payslip not found" }, { status: 404 })
    }

    const client = await createClient()
    const company = await loadCompanyBrand(client, data.company_id)
    if (!company?.name && data.snapshot_company_name) {
      ;(company as any).name = data.snapshot_company_name
    }

    const bodyHtml = `
      <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:12px">
        <div><strong>Employee:</strong> ${data.snapshot_employee_name || ""}</div>
        <div><strong>Employee ID:</strong> ${data.snapshot_employee_id_no || ""}</div>
        <div><strong>Department:</strong> ${data.snapshot_department || ""}</div>
        <div><strong>Position:</strong> ${data.snapshot_position || ""}</div>
        <div><strong>SSNIT:</strong> ${data.snapshot_ssnit_number || ""}</div>
        <div><strong>Bank:</strong> ${data.snapshot_bank_name || ""} ${data.snapshot_account_number || ""}</div>
      </div>
      <table>
        <thead><tr><th>Earnings</th><th class="right">Amount</th></tr></thead>
        <tbody>
          <tr><td>Basic Salary</td><td class="right">${money(data.basic_salary)}</td></tr>
          <tr><td>Transport Allowance</td><td class="right">${money(data.transport_allowance)}</td></tr>
          <tr><td>Housing Allowance</td><td class="right">${money(data.housing_allowance)}</td></tr>
          <tr><td>Medical Allowance</td><td class="right">${money(data.medical_allowance)}</td></tr>
          <tr><td>Meal Allowance</td><td class="right">${money(data.meal_allowance)}</td></tr>
          <tr><td>Communication Allowance</td><td class="right">${money(data.communication_allowance)}</td></tr>
          <tr><td>Other Allowances</td><td class="right">${money(data.other_allowances)}</td></tr>
          <tr><td>Overtime</td><td class="right">${money(data.overtime_pay)}</td></tr>
          <tr><td>Bonus</td><td class="right">${money(data.bonus_pay)}</td></tr>
          <tr class="total"><td>Gross Pay</td><td class="right">${money(data.gross_pay)}</td></tr>
        </tbody>
      </table>
      <table>
        <thead><tr><th>Deductions</th><th class="right">Amount</th></tr></thead>
        <tbody>
          <tr><td>SSNIT (Employee)</td><td class="right">${money(data.ssnit_employee)}</td></tr>
          <tr><td>Tier 2 (Employee)</td><td class="right">${money(data.tier2_employee)}</td></tr>
          <tr><td>Provident Fund / Tier 3</td><td class="right">${money(data.tier3_employee)}</td></tr>
          <tr><td>PAYE Tax</td><td class="right">${money(data.paye_tax)}</td></tr>
          <tr><td>Loans</td><td class="right">${money(data.loan_deduction)}</td></tr>
          <tr><td>Advance</td><td class="right">${money(data.advance_deduction)}</td></tr>
          <tr><td>Other Deductions</td><td class="right">${money(data.other_deductions)}</td></tr>
          <tr class="total"><td>Total Deductions</td><td class="right">${money(data.total_deductions)}</td></tr>
          <tr class="total"><td>Net Pay</td><td class="right">${money(data.net_pay)}</td></tr>
        </tbody>
      </table>
    `

    const html = renderBrandedHtmlDocument({
      title: "Employee Payslip",
      company: company || { name: data.snapshot_company_name || "Company" },
      period: data.pay_period,
      subtitle: `Pay date ${data.pay_date || ""} · Status ${data.status}`,
      bodyHtml,
      autoPrint: true,
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payslip-${data.pay_period}-${data.snapshot_employee_id_no || data.employee_id}.html"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render payslip" },
      { status: 500 },
    )
  }
}
