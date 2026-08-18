/**
 * GET /api/payslips/[id]/pdf
 * Branded printable payslip (browser → Save as PDF).
 */

import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveAdminAccess } from "@/lib/self-service/portal-session"
import { getPayslipById } from "@/lib/services/payslip-service"
import { loadCompanyBrand, AKWAABA_BRAND_FOOTER } from "@/lib/exports/company-branding"
import {
  buildPayslipDeductionLines,
  buildPayslipEarningsLines,
} from "@/lib/payroll/payslip-lines"
import {
  buildPayslipLoanSummaryRows,
  isLoanInPayPeriod,
  toPayPeriod,
} from "@/lib/payroll/loan-summary"
import { ensurePayslipLoanPayments } from "@/lib/services/loan-service"

function money(n: number | null | undefined) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function esc(s: unknown) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
function fmtPeriod(p: string) {
  if (!p) return ""
  const [y, m] = p.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GH", { month: "long", year: "numeric" })
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
    const service = createServiceClient()
    const { data: portalAccount } = await service
      .from("employee_portal_accounts")
      .select("employee_id, company_id")
      .eq("user_id", user.id)
      .in("status", ["active", "invited"])
      .maybeSingle()
    const isOwner = portalAccount?.employee_id === data.employee_id && portalAccount?.company_id === data.company_id
    if (!isOwner) {
      const canAdminister = await resolveAdminAccess(service, user, data.company_id)
      if (!canAdminister) {
        return NextResponse.json({ error: "Payslip not found" }, { status: 404 })
      }
    }
    const period = toPayPeriod(data.pay_period)

    if (Number(data.loan_deduction || 0) > 0) {
      try {
        await ensurePayslipLoanPayments({
          companyId: data.company_id,
          employeeId: data.employee_id,
          totalDeduction: Number(data.loan_deduction || 0),
          payrollRunId: data.payroll_run_id ?? null,
          payslipId: data.id,
          payPeriod: period,
          paymentDate: data.pay_date || new Date().toISOString().slice(0, 10),
        })
      } catch (e) {
        console.warn("[payslip-pdf] loan sync failed:", e)
      }
    }

    // Load company branding and loans active in this pay period (+ this-slip payments)
    const [company, loanRes, paymentRes] = await Promise.all([
      loadCompanyBrand(client, data.company_id),
      client
        .from("employee_loans")
        .select("*")
        .eq("employee_id", data.employee_id)
        .eq("company_id", data.company_id)
        .in("status", ["active", "approved", "completed"])
        .order("created_at", { ascending: true }),
      client
        .from("payroll_loan_payments")
        .select("loan_id, amount, balance_before, balance_after, payslip_id, pay_period")
        .eq("employee_id", data.employee_id)
        .eq("company_id", data.company_id)
        .or(`payslip_id.eq.${data.id},pay_period.eq.${period}`),
    ])

    const companyName = company?.name || data.snapshot_company_name || "Company"
    const logoUrl = company?.logo_url || ""
    const payments = paymentRes.data ?? []
    const paidLoanIds = new Set(payments.map((p) => p.loan_id))
    const loans = ((loanRes.data ?? []) as any[]).filter(
      (l) => paidLoanIds.has(l.id) || (["active", "approved"].includes(String(l.status)) && isLoanInPayPeriod(l, period)),
    )

    const earnings = buildPayslipEarningsLines(data as any).map((e) => [e.label, e.amount] as [string, number])
    const deductions = buildPayslipDeductionLines(data as any).map((d) => [d.label, d.amount] as [string, number])

    const loanSummary =
      Array.isArray((data as any).loan_summary_lines) && (data as any).loan_summary_lines.length
        ? (data as any).loan_summary_lines
        : buildPayslipLoanSummaryRows(loans, payments)
    const hasLoan = loanSummary.length > 0 || Number(data.loan_deduction) > 0
    const loanTotals = loanSummary.reduce(
      (acc, r) => ({
        opening: acc.opening + r.opening_balance,
        thisMonth: acc.thisMonth + r.this_month,
        closing: acc.closing + r.closing_balance,
      }),
      { opening: 0, thisMonth: 0, closing: 0 },
    )
    const ytd = Number((data as any).ytd_gross ?? 0)
    const loanRowsHtml = loanSummary.length
      ? `<table class="loan-table">
          <thead><tr><th>Loan Type</th><th class="r">Opening Balance</th><th class="r">This month</th><th class="r">Closing balance</th></tr></thead>
          <tbody>
            ${loanSummary
              .map(
                (r) => `<tr>
              <td>${esc(r.loan_type)}</td>
              <td class="r">${money(r.opening_balance)}</td>
              <td class="r">${money(r.this_month)}</td>
              <td class="r">${money(r.closing_balance)}</td>
            </tr>`,
              )
              .join("")}
            <tr class="tr">
              <td>Total</td>
              <td class="r">${money(loanTotals.opening)}</td>
              <td class="r">${money(loanTotals.thisMonth)}</td>
              <td class="r">${money(loanTotals.closing)}</td>
            </tr>
          </tbody>
        </table>`
      : `<table class="loan-table">
          <thead><tr><th>Loan Type</th><th class="r">Opening Balance</th><th class="r">This month</th><th class="r">Closing balance</th></tr></thead>
          <tbody>
            <tr>
              <td>Loan Repayment</td>
              <td class="r">${money(Number(data.loan_balance || 0) + Number(data.loan_deduction || 0))}</td>
              <td class="r">${money(data.loan_deduction)}</td>
              <td class="r">${money(data.loan_balance)}</td>
            </tr>
            <tr class="tr">
              <td>Total</td>
              <td class="r">${money(Number(data.loan_balance || 0) + Number(data.loan_deduction || 0))}</td>
              <td class="r">${money(data.loan_deduction)}</td>
              <td class="r">${money(data.loan_balance)}</td>
            </tr>
          </tbody>
        </table>`

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Payslip — ${esc(data.snapshot_employee_name)} — ${esc(fmtPeriod(data.pay_period))}</title>
  <style>
    :root { --brand:#0f6b4c; --ink:#111; --muted:#5b6b62; --line:#d7ddd8; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:"Iowan Old Style",Georgia,serif; color:var(--ink); font-size:12px; background:#fff; padding:28px; max-width:780px; margin:0 auto; }
    .toolbar { margin-bottom:18px; }
    .toolbar button { background:var(--brand); color:#fff; border:0; padding:8px 14px; border-radius:6px; cursor:pointer; font:600 13px/1 inherit; }
    /* Header */
    .header { display:flex; gap:14px; align-items:flex-start; border-bottom:2.5px solid var(--brand); padding-bottom:12px; margin-bottom:12px; }
    .logo { width:56px; height:56px; object-fit:contain; border:1px solid var(--line); border-radius:6px; }
    .logo-init { width:56px; height:56px; border-radius:6px; background:linear-gradient(145deg,#0f6b4c,#1f8f67); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; flex-shrink:0; }
    .co-name { font-size:18px; font-weight:700; letter-spacing:-.02em; }
    .slip-title { font-size:10px; font-weight:700; color:var(--brand); letter-spacing:.08em; text-transform:uppercase; margin-top:3px; }
    .period-line { font-size:11px; color:var(--muted); margin-top:2px; }
    /* Employee info */
    .info-grid { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid var(--line); border-radius:6px; overflow:hidden; margin-bottom:12px; }
    .ic { padding:7px 10px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); }
    .ic:nth-child(3n) { border-right:none; }
    .ic:nth-last-child(-n+3) { border-bottom:none; }
    .il { display:block; font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
    .iv { display:block; font-size:11px; font-weight:600; margin-top:1px; }
    /* Tables */
    .t-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
    .th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:5px 8px; border-radius:4px 4px 0 0; }
    .th-e { background:#ecfdf5; color:#065f46; }
    .th-d { background:#f3f4f6; color:#111827; }
    table { width:100%; border-collapse:collapse; }
    td { padding:4.5px 8px; font-size:11px; border-bottom:1px solid #f3f4f6; }
    .r { text-align:right; white-space:nowrap; }
    .red { color:#111827; }
    .tr td { font-weight:700; background:#f9fafb; border-top:1.5px solid var(--line); }
    /* Net pay — light background for readability */
    .net { background:#f9fafb; color:#111827; border:1px solid var(--line); border-radius:8px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .nl { font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:#6b7280; }
    .na { font-size:22px; font-weight:700; letter-spacing:-.02em; color:#111827; }
    .nd { text-align:right; font-size:11px; color:#374151; }
    /* Loan summary table */
    .loan-box { background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:8px 10px; margin-bottom:10px; }
    .ln-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#92400e; margin-bottom:6px; }
    .loan-table { width:100%; border-collapse:collapse; background:#fff; }
    .loan-table th, .loan-table td { border:1px solid #fde68a; padding:5px 7px; font-size:10px; }
    .loan-table th { background:#fffbeb; color:#92400e; }
    .amber { color:#b45309; }
    .green { color:#065f46; }
    /* YTD */
    .ytd-row { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:10px; }
    .ytd-c { background:#f9fafb; border:1px solid #e5e7eb; border-radius:5px; padding:5px 8px; }
    .yl { display:block; font-size:9px; color:var(--muted); text-transform:uppercase; margin-bottom:2px; }
    .blue { color:#1d4ed8; }
    /* Footer */
    .footer { border-top:1px solid var(--line); padding-top:8px; display:flex; justify-content:space-between; font-size:9px; color:var(--muted); margin-top:12px; }
    @media print { .toolbar { display:none; } body { padding:14px; } }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>

  <div class="header">
    ${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" alt="${esc(companyName)}"/>` : `<div class="logo-init">${esc(companyName.slice(0,2).toUpperCase())}</div>`}
    <div>
      <div class="co-name">${esc(companyName)}</div>
      <div class="slip-title">Employee Payslip</div>
      <div class="period-line">${esc(fmtPeriod(data.pay_period))} · Pay Date: ${esc(data.pay_date || "")} · Status: ${esc(data.status)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="ic"><span class="il">Employee</span><span class="iv">${esc(data.snapshot_employee_name)}</span></div>
    <div class="ic"><span class="il">Employee ID</span><span class="iv">${esc(data.snapshot_employee_id_no)}</span></div>
    <div class="ic"><span class="il">Department</span><span class="iv">${esc(data.snapshot_department)}</span></div>
    <div class="ic"><span class="il">Position</span><span class="iv">${esc(data.snapshot_position)}</span></div>
    <div class="ic"><span class="il">SSNIT Number</span><span class="iv">${esc(data.snapshot_ssnit_number)}</span></div>
    <div class="ic"><span class="il">Bank / Account</span><span class="iv">${esc(`${data.snapshot_bank_name || ""} ${data.snapshot_account_number || ""}`.trim())}</span></div>
  </div>

  <div class="t-row">
    <div>
      <div class="th th-e">Earnings</div>
      <table><tbody>
        ${earnings.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="r">${money(v)}</td></tr>`).join("")}
        <tr class="tr"><td>Gross Pay</td><td class="r">${money(data.gross_pay)}</td></tr>
      </tbody></table>
    </div>
    <div>
      <div class="th th-d">Deductions</div>
      <table><tbody>
        ${deductions.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="r">${money(v)}</td></tr>`).join("")}
        <tr class="tr"><td>Total Deductions</td><td class="r">${money(data.total_deductions)}</td></tr>
      </tbody></table>
    </div>
  </div>

  <div class="net">
    <div><div class="nl">Net Pay</div><div class="na">${money(data.net_pay)}</div></div>
    <div class="nd"><div class="nl">Taxable Income</div><div>${money(data.paye_taxable_income)}</div></div>
  </div>

  ${hasLoan ? `
  <div class="loan-box">
    <div class="ln-title">Loan Summary</div>
    ${loanRowsHtml}
  </div>` : ""}

  ${ytd > 0 ? `
  <div class="ytd-row">
    <div class="ytd-c"><span class="yl">YTD Gross</span>${money((data as any).ytd_gross)}</div>
    <div class="ytd-c"><span class="yl">YTD Net</span><span class="green">${money((data as any).ytd_net)}</span></div>
    <div class="ytd-c"><span class="yl">YTD PAYE</span><span class="red">${money((data as any).ytd_paye)}</span></div>
    <div class="ytd-c"><span class="yl">YTD SSNIT</span><span class="blue">${money((data as any).ytd_ssnit)}</span></div>
  </div>` : ""}

  <div class="footer">
    <span>${esc(AKWAABA_BRAND_FOOTER)}</span>
    <span>Confidential · Generated ${new Date().toLocaleString("en-GH")}</span>
  </div>

  <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})</script>
</body>
</html>`

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
