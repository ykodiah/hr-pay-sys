/**
 * POST /api/payroll/export
 * Body: { company_id, pay_period, format: "csv"|"pdf", rows?: WorksheetRow[] }
 *
 * Exports the current payroll worksheet (or DB run) with company letterhead + brand footer.
 * Works even before Process & Submit creates a payroll_run.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import {
  csvBrandFooter,
  csvBrandHeader,
  loadCompanyBrand,
  renderBrandedHtmlDocument,
} from "@/lib/exports/company-branding"

type ExportRow = {
  employeeCode?: string
  employeeId?: string
  name?: string
  department?: string
  basicSalary?: number
  allowances?: number
  overtime?: number
  grossPay?: number
  providentFund?: number
  ssnitEmployee?: number
  taxableIncome?: number
  paye?: number
  loan?: number
  totalDeductions?: number
  netPay?: number
}

function money(n: number) {
  return Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPeriod(p: string) {
  const [y, m] = String(p || "").split("-")
  if (!y || !m) return p
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-GH", { month: "long", year: "numeric" })
}

const COLUMNS = [
  "Employee ID",
  "Employee Name",
  "Department",
  "Basic Salary",
  "Allowances",
  "Overtime",
  "Gross Pay",
  "Provident Fund",
  "SSNIT Employee",
  "Taxable Income",
  "PAYE",
  "Loans",
  "Total Deductions",
  "Net Pay",
] as const

function normalizeRows(rows: ExportRow[]) {
  return rows.map((r) => ({
    employeeCode: r.employeeCode || r.employeeId || "",
    name: r.name || "",
    department: r.department || "",
    basicSalary: Number(r.basicSalary || 0),
    allowances: Number(r.allowances || 0),
    overtime: Number(r.overtime || 0),
    grossPay: Number(r.grossPay || 0),
    providentFund: Number(r.providentFund || 0),
    ssnitEmployee: Number(r.ssnitEmployee || 0),
    taxableIncome: Number(r.taxableIncome || 0),
    paye: Number(r.paye || 0),
    loan: Number(r.loan || 0),
    totalDeductions: Number(r.totalDeductions || 0),
    netPay: Number(r.netPay || 0),
  }))
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const companyId = body.company_id as string
    const payPeriod = String(body.pay_period || "")
    const format = String(body.format || "csv").toLowerCase()
    let rows = normalizeRows(Array.isArray(body.rows) ? body.rows : [])

    const client = await createClient()
    const company = await loadCompanyBrand(client, companyId)

    // If no rows posted, try loading from active run / payslips / payroll_items
    if (!rows.length && companyId && payPeriod) {
      const start = `${payPeriod}-01`
      const { data: run } = await client
        .from("payroll_runs")
        .select("id")
        .eq("company_id", companyId)
        .eq("pay_period_start", start)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (run?.id) {
        const { data: slips } = await client.from("payslips").select("*").eq("payroll_run_id", run.id)
        if (slips?.length) {
          rows = slips.map((s: any) => ({
            employeeCode: s.snapshot_employee_id_no || "",
            name: s.snapshot_employee_name || "",
            department: s.snapshot_department || "",
            basicSalary: Number(s.basic_salary || 0),
            allowances:
              Number(s.transport_allowance || 0) +
              Number(s.housing_allowance || 0) +
              Number(s.medical_allowance || 0) +
              Number(s.meal_allowance || 0) +
              Number(s.communication_allowance || 0) +
              Number(s.other_allowances || 0),
            overtime: Number(s.overtime_pay || 0),
            grossPay: Number(s.gross_pay || 0),
            providentFund: Number(s.tier3_employee || 0),
            ssnitEmployee: Number(s.ssnit_employee || 0),
            taxableIncome: Number(s.paye_taxable_income || 0),
            paye: Number(s.paye_tax || 0),
            loan: Number(s.loan_deduction || 0),
            totalDeductions: Number(s.total_deductions || 0),
            netPay: Number(s.net_pay || 0),
          }))
        }
      }
    }

    if (!rows.length) {
      return NextResponse.json({ error: "No payroll rows to export" }, { status: 400 })
    }

    const periodLabel = fmtPeriod(payPeriod)
    const generatedAt = new Date().toISOString()

    if (format === "pdf" || format === "html") {
      const bodyRows = rows
        .map(
          (r) => `<tr>
          <td>${r.employeeCode}</td><td>${r.name}</td><td>${r.department || "—"}</td>
          <td class="right">${money(r.basicSalary)}</td>
          <td class="right">${money(r.allowances)}</td>
          <td class="right">${money(r.overtime)}</td>
          <td class="right">${money(r.grossPay)}</td>
          <td class="right">${money(r.providentFund)}</td>
          <td class="right">${money(r.ssnitEmployee)}</td>
          <td class="right">${money(r.taxableIncome)}</td>
          <td class="right">${money(r.paye)}</td>
          <td class="right">${money(r.loan)}</td>
          <td class="right">${money(r.totalDeductions)}</td>
          <td class="right">${money(r.netPay)}</td>
        </tr>`,
        )
        .join("")

      const totals = rows.reduce(
        (a, r) => ({
          gross: a.gross + r.grossPay,
          ded: a.ded + r.totalDeductions,
          net: a.net + r.netPay,
        }),
        { gross: 0, ded: 0, net: 0 },
      )

      const table = `<table>
        <thead><tr>${COLUMNS.map((c) => `<th${c.includes("ID") || c.includes("Name") || c === "Department" ? "" : ' class="right"'}>${c}</th>`).join("")}</tr></thead>
        <tbody>
          ${bodyRows}
          <tr class="total">
            <td colspan="6">Totals (${rows.length} employees)</td>
            <td class="right">${money(totals.gross)}</td>
            <td colspan="5"></td>
            <td class="right">${money(totals.ded)}</td>
            <td class="right">${money(totals.net)}</td>
          </tr>
        </tbody>
      </table>`

      const html = renderBrandedHtmlDocument({
        title: "Payroll Processing Register",
        company,
        period: periodLabel,
        subtitle: "Employee worksheet ready for approval",
        bodyHtml: table,
        autoPrint: true,
      })

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="payroll-${payPeriod}.html"`,
          "Cache-Control": "no-store",
        },
      })
    }

    // CSV
    const bom = "\uFEFF"
    const lines = [
      ...csvBrandHeader({
        title: "Payroll Processing Export",
        company,
        period: periodLabel,
        generatedAt,
      }),
      COLUMNS.map((c) => `"${c}"`).join(","),
      ...rows.map((r) =>
        [
          r.employeeCode,
          r.name,
          r.department,
          r.basicSalary,
          r.allowances,
          r.overtime,
          r.grossPay,
          r.providentFund,
          r.ssnitEmployee,
          r.taxableIncome,
          r.paye,
          r.loan,
          r.totalDeductions,
          r.netPay,
        ]
          .map((v) =>
            typeof v === "number"
              ? String(Math.round((v + Number.EPSILON) * 100) / 100)
              : `"${String(v ?? "").replace(/"/g, '""')}"`,
          )
          .join(","),
      ),
      ...csvBrandFooter(),
    ]

    return new NextResponse(bom + lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payroll-${payPeriod}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 },
    )
  }
}
