/**
 * GET /api/loans/[id]/pdf
 * Printable loan details + amortization (browser → Save as PDF).
 */

import { NextRequest, NextResponse } from "next/server"
import {
  resolveTenantContext,
  jsonError,
  isUnresolvedTenant,
} from "@/lib/settings/resolve-tenant"
import { getLoanWithSchedule } from "@/lib/services/loan-service"
import { interestTypeLabel } from "@/lib/services/loan-calculations"
import { loadCompanyBrand, AKWAABA_BRAND_FOOTER } from "@/lib/exports/company-branding"

function money(n: number | null | undefined) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const { companyId, service } = ctx
    const { id } = await params
    const result = await getLoanWithSchedule(id)
    if (result.loan.company_id !== companyId) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    const company = await loadCompanyBrand(service, companyId)
    const companyName = company?.name || "Company"
    const logoUrl = company?.logo_url || ""
    const loan = result.loan
    const schedule = result.schedule
    const paidInstallments = schedule.filter(
      (r) => r.status === "paid" || Number(r.paid_amount || 0) > 0.009,
    ).length
    const totals = schedule.reduce(
      (acc, r) => ({
        payment: acc.payment + Number(r.payment_amount || 0),
        principal: acc.principal + Number(r.principal_portion || 0),
        interest: acc.interest + Number(r.interest_portion || 0),
        paid: acc.paid + Number(r.paid_amount || 0),
      }),
      { payment: 0, principal: 0, interest: 0, paid: 0 },
    )

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Loan details — ${esc(loan.employee_name)} — ${esc(loan.loan_type)}</title>
  <style>
    :root { --brand:#0f6b4c; --ink:#111; --muted:#5b6b62; --line:#d7ddd8; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:"Iowan Old Style",Georgia,serif; color:var(--ink); font-size:13px; background:#fff; padding:28px; max-width:960px; margin:0 auto; }
    .toolbar { margin-bottom:18px; }
    .toolbar button { background:var(--brand); color:#fff; border:0; padding:8px 14px; border-radius:6px; cursor:pointer; font:600 13px/1 inherit; }
    .header { display:flex; gap:14px; align-items:flex-start; border-bottom:2.5px solid var(--brand); padding-bottom:12px; margin-bottom:14px; }
    .logo { width:56px; height:56px; object-fit:contain; border:1px solid var(--line); border-radius:6px; }
    .logo-init { width:56px; height:56px; border-radius:6px; background:linear-gradient(145deg,#0f6b4c,#1f8f67); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; }
    .co-name { font-size:20px; font-weight:700; }
    .title { font-size:12px; font-weight:700; color:var(--brand); letter-spacing:.08em; text-transform:uppercase; margin-top:4px; }
    .meta { color:var(--muted); font-size:12px; margin-top:2px; }
    .cards { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:14px; }
    .card { border:1px solid var(--line); border-radius:6px; padding:8px 10px; }
    .card .lbl { font-size:10px; color:var(--muted); text-transform:uppercase; }
    .card .val { font-size:14px; font-weight:700; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th, td { border:1px solid var(--line); padding:6px 7px; font-size:11px; text-align:left; }
    th { background:#eef6f1; font-weight:600; }
    .r { text-align:right; white-space:nowrap; }
    .total td { font-weight:700; background:#f7faf8; }
    .footer { margin-top:20px; padding-top:10px; border-top:1px solid var(--line); color:var(--muted); font-size:11px; display:flex; justify-content:space-between; }
    @media print { .toolbar { display:none; } body { padding:12px; } }
    @page { size: A4; margin: 10mm; }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="header">
    ${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" alt="${esc(companyName)}"/>` : `<div class="logo-init">${esc(companyName.slice(0, 2).toUpperCase())}</div>`}
    <div>
      <div class="co-name">${esc(companyName)}</div>
      <div class="title">Employee Loan Details</div>
      <div class="meta">${esc(loan.employee_name || "")} · ${esc(loan.loan_type)} · ${esc(interestTypeLabel(loan.interest_type))}</div>
    </div>
  </div>

  <div class="cards">
    <div class="card"><div class="lbl">Principal</div><div class="val">${money(loan.principal)}</div></div>
    <div class="card"><div class="lbl">Monthly Charge</div><div class="val">${money(loan.monthly_payment)}</div></div>
    <div class="card"><div class="lbl">Interest</div><div class="val">${money(loan.total_interest || totals.interest)}</div></div>
    <div class="card"><div class="lbl">Remaining</div><div class="val">${money(loan.remaining_balance)}</div></div>
    <div class="card"><div class="lbl">Status</div><div class="val" style="text-transform:capitalize">${esc(loan.status)}</div></div>
  </div>

  <div class="meta" style="margin-bottom:10px">
    Tenure: ${esc(loan.repayment_months)} months · Start: ${esc(loan.start_date || "—")} ·
    Paid so far: ${money(loan.amount_paid)} ·
    Installments paid: ${paidInstallments}/${schedule.length || loan.repayment_months}
    ${loan.purpose ? ` · Purpose: ${esc(loan.purpose)}` : ""}
  </div>

  <h3 style="font-size:14px;margin-bottom:4px">Amortization schedule</h3>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Due</th><th class="r">monthly Due</th><th class="r">Principal</th>
        <th class="r">Interest</th><th class="r">Loan Paid</th><th class="r">Balance</th><th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${schedule
        .map(
          (row) => `<tr>
        <td>${esc(row.month_number)}</td>
        <td>${esc(row.due_date)}</td>
        <td class="r">${money(row.payment_amount)}</td>
        <td class="r">${money(row.principal_portion)}</td>
        <td class="r">${money(row.interest_portion)}</td>
        <td class="r">${money(row.paid_amount || 0)}</td>
        <td class="r">${money(row.balance_remaining)}</td>
        <td style="text-transform:capitalize">${esc(row.status)}</td>
      </tr>`,
        )
        .join("")}
      <tr class="total">
        <td colspan="2">Totals</td>
        <td class="r">${money(totals.payment)}</td>
        <td class="r">${money(totals.principal)}</td>
        <td class="r">${money(totals.interest)}</td>
        <td class="r">${money(totals.paid)}</td>
        <td class="r">${money(loan.remaining_balance)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

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
        "Content-Disposition": `inline; filename="loan-${loan.employee_id_no || loan.employee_id}-${loan.id.slice(0, 8)}.html"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return jsonError(err, "Failed to render loan PDF")
  }
}
