/**
 * GET /api/payslips/bulk/pdf?id=<uuid>&id=<uuid>&...
 *
 * Renders a branded, printable HTML document containing multiple payslips
 * (one per page via CSS @media print + page-break-after).
 * Open in a new tab and use browser Print → Save as PDF.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { loadCompanyBrand, AKWAABA_BRAND_FOOTER } from "@/lib/exports/company-branding"
import type { PayslipRow } from "@/lib/services/payslip-service"
import {
  buildPayslipDeductionLines,
  buildPayslipEarningsLines,
  buildPayslipLoanSummaryRows,
} from "@/lib/payroll/payslip-lines"

function money(n: number | null | undefined) {
  return Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function fmtPeriod(p: string) {
  if (!p) return ""
  const [y, m] = p.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GH", { month: "long", year: "numeric" })
}

function renderOneSlip(slip: PayslipRow & { loan?: any }, company: any): string {
  const logo = company?.logo_url || ""
  const companyName = company?.name || slip.snapshot_company_name || "Company"

  const earnings = buildPayslipEarningsLines(slip as any).map((e) => [e.label, e.amount] as [string, number])
  const deductions = buildPayslipDeductionLines(slip as any).map((d) => [d.label, d.amount] as [string, number])

  const loans: any[] = Array.isArray(slip.loans)
    ? slip.loans
    : slip.loan
      ? [slip.loan]
      : []
  const loanSummary = buildPayslipLoanSummaryRows(loans)
  const hasLoan = loanSummary.length > 0 || Number(slip.loan_deduction) > 0
  const loanTotals = loanSummary.reduce(
    (acc, r) => ({
      opening: acc.opening + r.opening_balance,
      thisMonth: acc.thisMonth + r.this_month,
      closing: acc.closing + r.closing_balance,
    }),
    { opening: 0, thisMonth: 0, closing: 0 },
  )
  const loanRowsHtml = loanSummary.length
    ? `<table class="loan-table">
        <thead><tr><th>Loan Type</th><th class="right">Opening Balance</th><th class="right">This month</th><th class="right">Closing balance</th></tr></thead>
        <tbody>
          ${loanSummary
            .map(
              (r) => `<tr>
            <td>${esc(r.loan_type)}</td>
            <td class="right">GHS ${money(r.opening_balance)}</td>
            <td class="right">GHS ${money(r.this_month)}</td>
            <td class="right">GHS ${money(r.closing_balance)}</td>
          </tr>`,
            )
            .join("")}
          <tr class="total-row">
            <td>Total</td>
            <td class="right">GHS ${money(loanTotals.opening)}</td>
            <td class="right">GHS ${money(loanTotals.thisMonth)}</td>
            <td class="right">GHS ${money(loanTotals.closing)}</td>
          </tr>
        </tbody>
      </table>`
    : `<table class="loan-table">
        <thead><tr><th>Loan Type</th><th class="right">Opening Balance</th><th class="right">This month</th><th class="right">Closing balance</th></tr></thead>
        <tbody>
          <tr>
            <td>Loan Repayment</td>
            <td class="right">GHS ${money(Number(slip.loan_balance || 0) + Number(slip.loan_deduction || 0))}</td>
            <td class="right">GHS ${money(slip.loan_deduction)}</td>
            <td class="right">GHS ${money(slip.loan_balance)}</td>
          </tr>
        </tbody>
      </table>`

  return `
<div class="payslip-page">
  <!-- Company header -->
  <div class="header">
    ${logo
      ? `<img class="logo" src="${esc(logo)}" alt="${esc(companyName)}" />`
      : `<div class="logo-initial">${esc(companyName.slice(0, 2).toUpperCase())}</div>`
    }
    <div class="header-info">
      <div class="company-name">${esc(companyName)}</div>
      <div class="slip-title">EMPLOYEE PAYSLIP</div>
      <div class="period">${esc(fmtPeriod(slip.pay_period))} · Pay Date: ${esc(slip.pay_date || "")}</div>
    </div>
  </div>

  <!-- Employee info grid -->
  <div class="info-grid">
    <div class="info-cell"><span class="info-label">Employee</span><span class="info-val">${esc(slip.snapshot_employee_name || "")}</span></div>
    <div class="info-cell"><span class="info-label">Employee ID</span><span class="info-val">${esc(slip.snapshot_employee_id_no || "")}</span></div>
    <div class="info-cell"><span class="info-label">Department</span><span class="info-val">${esc(slip.snapshot_department || "")}</span></div>
    <div class="info-cell"><span class="info-label">Position</span><span class="info-val">${esc(slip.snapshot_position || "")}</span></div>
    <div class="info-cell"><span class="info-label">SSNIT Number</span><span class="info-val">${esc(slip.snapshot_ssnit_number || "")}</span></div>
    <div class="info-cell"><span class="info-label">Bank / Account</span><span class="info-val">${esc(`${slip.snapshot_bank_name || ""} ${slip.snapshot_account_number || ""}`.trim())}</span></div>
  </div>

  <!-- Earnings + Deductions tables -->
  <div class="tables-row">
    <div class="table-col">
      <div class="table-heading earnings-heading">Earnings</div>
      <table>
        <tbody>
          ${earnings.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="right">GHS ${money(v)}</td></tr>`).join("")}
          <tr class="total-row"><td>Gross Pay</td><td class="right">GHS ${money(slip.gross_pay)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="table-col">
      <div class="table-heading deductions-heading">Deductions</div>
      <table>
        <tbody>
          ${deductions.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="right">GHS ${money(v)}</td></tr>`).join("")}
          <tr class="total-row"><td>Total Deductions</td><td class="right">GHS ${money(slip.total_deductions)}</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Net pay banner -->
  <div class="net-pay-bar">
    <div><span class="net-label">NET PAY</span><br/><span class="net-amount">GHS ${money(slip.net_pay)}</span></div>
    <div class="net-detail">
      <div><span class="net-label">Taxable Income</span><br/><span>GHS ${money(slip.paye_taxable_income)}</span></div>
    </div>
  </div>

  ${hasLoan ? `
  <div class="loan-box">
    <div class="loan-title">Loan Summary</div>
    ${loanRowsHtml}
  </div>` : ""}

  ${(Number(slip.ytd_gross) > 0) ? `
  <!-- YTD -->
  <div class="ytd-row">
    <div class="ytd-cell"><span class="ytd-label">YTD Gross</span><span>GHS ${money(slip.ytd_gross)}</span></div>
    <div class="ytd-cell"><span class="ytd-label">YTD Net</span><span class="green">GHS ${money(slip.ytd_net)}</span></div>
    <div class="ytd-cell"><span class="ytd-label">YTD PAYE</span><span class="ded">GHS ${money(slip.ytd_paye)}</span></div>
    <div class="ytd-cell"><span class="ytd-label">YTD SSNIT</span><span class="blue">GHS ${money(slip.ytd_ssnit)}</span></div>
  </div>` : ""}

  <!-- Footer -->
  <div class="slip-footer">
    <span>${esc(AKWAABA_BRAND_FOOTER)}</span>
    <span>Confidential · Generated ${new Date().toLocaleString("en-GH")}</span>
  </div>
</div>`
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const ids = searchParams.getAll("id").filter(Boolean)
    if (!ids.length) return NextResponse.json({ error: "No payslip IDs provided" }, { status: 400 })
    if (ids.length > 200) return NextResponse.json({ error: "Maximum 200 payslips per bulk download" }, { status: 400 })

    const client = await createClient()

    // Fetch all payslips
    const { data: slips, error } = await client
      .from("payslips")
      .select("*")
      .in("id", ids)
      .order("snapshot_employee_name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!slips?.length) return NextResponse.json({ error: "No payslips found" }, { status: 404 })

    // Load all active loans for employees on these slips
    const empIds = [...new Set(slips.map((s) => s.employee_id))]
    const periods = [...new Set(slips.map((s) => s.pay_period).filter(Boolean))]
    const [{ data: loans }, { data: payments }] = await Promise.all([
      client
        .from("employee_loans")
        .select("*")
        .in("employee_id", empIds)
        .in("status", ["active", "approved", "completed"]),
      client
        .from("payroll_loan_payments")
        .select("loan_id, employee_id, amount, pay_period")
        .in("employee_id", empIds)
        .in("pay_period", periods.length ? periods : ["__none__"]),
    ])

    const monthPaid = new Map<string, number>()
    for (const p of payments ?? []) {
      const key = `${p.employee_id}:${p.pay_period}:${p.loan_id}`
      monthPaid.set(key, Number(monthPaid.get(key) || 0) + Number(p.amount || 0))
    }

    const loansByEmp = new Map<string, any[]>()
    for (const loan of loans ?? []) {
      if (!["active", "approved"].includes(String(loan.status))) continue
      const list = loansByEmp.get(loan.employee_id) || []
      list.push(loan)
      loansByEmp.set(loan.employee_id, list)
    }

    // Load company brand (use first slip's company_id)
    const company = await loadCompanyBrand(client, slips[0]?.company_id)

    // Render all slips
    const slipHtml = slips
      .map((s) => {
        const empLoans = (loansByEmp.get(s.employee_id) || []).map((l) => ({
          ...l,
          this_month_paid: monthPaid.get(`${s.employee_id}:${s.pay_period}:${l.id}`) || 0,
        }))
        return renderOneSlip({ ...s, loans: empLoans, loan: empLoans[0] || null }, company)
      })
      .join("\n")
    const period = fmtPeriod(slips[0]?.pay_period)
    const companyName = company?.name || "Company"

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslips — ${esc(companyName)} — ${esc(period)}</title>
  <style>
    :root { --brand: #0f6b4c; --ink: #111; --muted: #5b6b62; --line: #d7ddd8; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Iowan Old Style", Georgia, serif; color: var(--ink); font-size: 12px; background: #fff; }

    .toolbar { padding: 12px 20px; background: var(--brand); display: flex; align-items: center; gap: 12px; }
    .toolbar button { background: #fff; color: var(--brand); border: 0; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .toolbar .info { color: rgba(255,255,255,0.9); font-size: 13px; }

    .payslip-page { padding: 28px; max-width: 780px; margin: 0 auto; }

    /* Header */
    .header { display: flex; gap: 14px; align-items: flex-start; border-bottom: 2.5px solid var(--brand); padding-bottom: 12px; margin-bottom: 12px; }
    .logo { width: 56px; height: 56px; object-fit: contain; border: 1px solid var(--line); border-radius: 6px; }
    .logo-initial { width: 56px; height: 56px; border-radius: 6px; background: linear-gradient(145deg, #0f6b4c, #1f8f67); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0; }
    .header-info { flex: 1; }
    .company-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
    .slip-title { font-size: 11px; font-weight: 600; color: var(--brand); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }
    .period { font-size: 11px; color: var(--muted); margin-top: 2px; }

    /* Employee info */
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
    .info-cell { padding: 7px 10px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #fff; }
    .info-cell:nth-child(3n) { border-right: none; }
    .info-cell:nth-last-child(-n+3) { border-bottom: none; }
    .info-label { display: block; font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { display: block; font-size: 11px; font-weight: 600; color: var(--ink); margin-top: 1px; }

    /* Tables */
    .tables-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .table-col { }
    .table-heading { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 5px 8px; border-radius: 4px 4px 0 0; }
    .earnings-heading   { background: #ecfdf5; color: #065f46; }
    .deductions-heading { background: #f3f4f6; color: #111827; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4.5px 8px; font-size: 11px; border-bottom: 1px solid #f3f4f6; }
    td.right { text-align: right; white-space: nowrap; }
    td.ded { color: #111827; }
    .total-row td { font-weight: 700; background: #f9fafb; border-top: 1.5px solid var(--line); }

    /* Net pay — light background */
    .net-pay-bar { background: #f9fafb; color: #111827; border: 1px solid var(--line); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .net-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
    .net-amount { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
    .net-detail { text-align: right; font-size: 11px; color: #374151; }

    /* Loan summary table */
    .loan-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; }
    .loan-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #92400e; margin-bottom: 6px; }
    .loan-table { width: 100%; border-collapse: collapse; background: #fff; }
    .loan-table th, .loan-table td { border: 1px solid #fde68a; padding: 5px 7px; font-size: 10px; }
    .loan-table th { background: #fffbeb; color: #92400e; }

    /* YTD */
    .ytd-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
    .ytd-cell { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 5px 8px; }
    .ytd-label { display: block; font-size: 9px; color: var(--muted); text-transform: uppercase; margin-bottom: 2px; }
    .green { color: #065f46; }
    .blue  { color: #1d4ed8; }

    /* Footer */
    .slip-footer { border-top: 1px solid var(--line); padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: var(--muted); }

    /* Print: one slip per page */
    @media print {
      .toolbar { display: none; }
      body { margin: 0; }
      .payslip-page { padding: 16px; page-break-after: always; max-width: 100%; }
      .payslip-page:last-child { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <span class="info">${esc(companyName)} · ${esc(period)} · ${slips.length} payslip${slips.length !== 1 ? "s" : ""}</span>
  </div>
  ${slipHtml}
  <script>
    // Auto-print after assets load
    window.addEventListener('load', function() { setTimeout(function() { window.print() }, 400) })
  </script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payslips-${slips[0]?.pay_period || "bulk"}.html"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render bulk payslips" },
      { status: 500 },
    )
  }
}
