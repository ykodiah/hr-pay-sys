/** Printable HTML for payslips and payroll registers (browser Save as PDF). */

import {
  buildPayslipDeductionLines,
  buildPayslipEarningsLines,
} from "@/lib/payroll/payslip-lines"

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

export function renderPayslipHtml(slip: any, opts?: { autoPrint?: boolean }) {
  const autoPrint = opts?.autoPrint !== false
  const name = slip.snapshot_employee_name || "Employee"
  const company = slip.snapshot_company_name || "Company"
  const period = slip.pay_period || ""
  const earningsRows = buildPayslipEarningsLines(slip)
    .map((e) => `<tr><td>${esc(e.label)}</td><td class="right">${money(e.amount)}</td></tr>`)
    .join("")
  const deductionRows = buildPayslipDeductionLines(slip)
    .map((d) => `<tr><td>${esc(d.label)}</td><td class="right">${money(d.amount)}</td></tr>`)
    .join("")
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Payslip - ${esc(name)} - ${esc(period)}</title>
<style>
  body{font-family:Georgia,serif;color:#111;margin:24px;font-size:13px}
  h1{font-size:20px;margin:0 0 4px}
  .muted{color:#555;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
  th{background:#f4f4f4}
  .right{text-align:right}
  .total{font-weight:700}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:12px 0}
  @media print{button{display:none} body{margin:12px}}
</style></head><body>
  <button onclick="window.print()">Print / Save as PDF</button>
  <h1>${esc(company)}</h1>
  <div class="muted">Employee Payslip · ${esc(period)} · Pay date ${esc(slip.pay_date || "")}</div>
  <div class="grid">
    <div><strong>Employee:</strong> ${esc(name)}</div>
    <div><strong>Employee ID:</strong> ${esc(slip.snapshot_employee_id_no || "")}</div>
    <div><strong>Department:</strong> ${esc(slip.snapshot_department || "")}</div>
    <div><strong>Position:</strong> ${esc(slip.snapshot_position || "")}</div>
    <div><strong>SSNIT:</strong> ${esc(slip.snapshot_ssnit_number || "")}</div>
    <div><strong>Bank:</strong> ${esc(slip.snapshot_bank_name || "")} ${esc(slip.snapshot_account_number || "")}</div>
  </div>
  <table>
    <thead><tr><th>Earnings</th><th class="right">Amount</th></tr></thead>
    <tbody>
      ${earningsRows}
      <tr class="total"><td>Gross Pay</td><td class="right">${money(slip.gross_pay)}</td></tr>
    </tbody>
  </table>
  <table>
    <thead><tr><th>Deductions</th><th class="right">Amount</th></tr></thead>
    <tbody>
      ${deductionRows}
      <tr class="total"><td>Total Deductions</td><td class="right">${money(slip.total_deductions)}</td></tr>
      <tr class="total"><td>Net Pay</td><td class="right">${money(slip.net_pay)}</td></tr>
    </tbody>
  </table>
  ${
    Number(slip.loan_deduction) > 0 || (Array.isArray(slip.loans) && slip.loans.length)
      ? `<div style="margin-top:14px;border:1px solid #fcd34d;background:#fffbeb;border-radius:6px;padding:8px 10px;font-size:10px">
    <div style="font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#92400e;margin-bottom:6px">Loan Summary</div>
    ${(Array.isArray(slip.loans) ? slip.loans : [])
      .map(
        (l: any) => `<div style="border:1px solid #fde68a;background:#fff;border-radius:4px;padding:5px 7px;margin-bottom:4px">
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:3px"><span>${esc(l.loan_type || "Loan")}</span><span>${esc(l.status || "active")}</span></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
        <div><div class="muted">Expected</div><div>${money(l.monthly_payment)}</div></div>
        <div><div class="muted">This month</div><div>${money(l.this_month_paid ?? l.last_payment_amount)}</div></div>
        <div><div class="muted">Paid so far</div><div>${money(l.amount_paid)}</div></div>
        <div><div class="muted">Remaining</div><div>${money(l.remaining_balance)}</div></div>
      </div>
    </div>`,
      )
      .join("")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px">
      <div><div class="muted">This Month Deducted</div><div style="font-weight:700">${money(slip.loan_deduction)}</div></div>
      <div><div class="muted">Loan Balance</div><div style="font-weight:700">${money(slip.loan_balance)}</div></div>
    </div>
  </div>`
      : ""
  }
  <p class="muted" style="margin-top:24px">Generated ${new Date().toLocaleString("en-GH")} · Status: ${esc(slip.status)}</p>
  ${autoPrint ? "<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script>" : ""}
</body></html>`
}

export function renderPayrollRegisterHtml(run: any, slips: any[], opts?: { autoPrint?: boolean }) {
  const autoPrint = opts?.autoPrint !== false
  const period = run?.pay_period_start
    ? String(run.pay_period_start).slice(0, 7)
    : slips[0]?.pay_period || ""
  const rows = slips
    .map(
      (s) => `<tr>
      <td>${esc(s.snapshot_employee_id_no || "")}</td>
      <td>${esc(s.snapshot_employee_name || s.employee_id)}</td>
      <td>${esc(s.snapshot_department || "")}</td>
      <td class="right">${money(s.basic_salary)}</td>
      <td class="right">${money(s.gross_pay)}</td>
      <td class="right">${money(s.paye_tax)}</td>
      <td class="right">${money(s.ssnit_employee)}</td>
      <td class="right">${money(s.total_deductions)}</td>
      <td class="right">${money(s.net_pay)}</td>
    </tr>`,
    )
    .join("")

  const totals = slips.reduce(
    (a, s) => ({
      gross: a.gross + Number(s.gross_pay || 0),
      ded: a.ded + Number(s.total_deductions || 0),
      net: a.net + Number(s.net_pay || 0),
    }),
    { gross: 0, ded: 0, net: 0 },
  )

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Payroll Register - ${esc(period)}</title>
<style>
  body{font-family:Georgia,serif;color:#111;margin:20px;font-size:12px}
  h1{font-size:18px;margin:0 0 4px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border:1px solid #ccc;padding:6px;text-align:left}
  th{background:#eee}
  .right{text-align:right}
  .total{font-weight:700;background:#f8f8f8}
  @media print{button{display:none}}
</style></head><body>
  <button onclick="window.print()">Print / Save as PDF</button>
  <h1>Payroll Register</h1>
  <div>Period: ${esc(period)} · Status: ${esc(run?.status || "")} · Employees: ${slips.length}</div>
  <table>
    <thead>
      <tr>
        <th>Emp ID</th><th>Name</th><th>Dept</th>
        <th class="right">Basic</th><th class="right">Gross</th><th class="right">PAYE</th>
        <th class="right">SSNIT</th><th class="right">Deductions</th><th class="right">Net</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total">
        <td colspan="4">Totals</td>
        <td class="right">${money(totals.gross)}</td>
        <td colspan="2"></td>
        <td class="right">${money(totals.ded)}</td>
        <td class="right">${money(totals.net)}</td>
      </tr>
    </tbody>
  </table>
  ${autoPrint ? "<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script>" : ""}
</body></html>`
}
