"use client"

/**
 * PayslipDocument
 *
 * Renders a formatted payslip suitable for:
 *  - In-app modal preview
 *  - Print-to-PDF (via window.print())
 *
 * Accepts a PayslipRow from the DB (uses snapshot_* fields so the document
 * is accurate even if the employee's details have since changed).
 */

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { PayslipRow } from "@/lib/services/payslip-service"
import {
  buildPayslipDeductionLines,
  buildPayslipEarningsLines,
} from "@/lib/payroll/payslip-lines"

interface Props {
  payslip: PayslipRow & {
    allowance_lines?: unknown
    deduction_lines?: unknown
    uniform_allowance?: number
  }
  showPrintButton?: boolean
}

const fmt = (n: number | string | null | undefined) =>
  Number(n ?? 0).toFixed(2)

const fmtLabel = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2 })

export function PayslipDocument({ payslip: p, showPrintButton = true }: Props) {
  const earningsAll = buildPayslipEarningsLines(p as any).map((e) => ({
    name: e.label,
    amount: e.amount,
  }))
  const deductionRows = buildPayslipDeductionLines(p as any).map((d) => ({
    name: d.label,
    amount: d.amount,
  }))

  const maxRows = Math.max(earningsAll.length, deductionRows.length)
  const earningsPadded    = [...earningsAll,    ...Array(Math.max(0, maxRows - earningsAll.length)).fill(null)]
  const deductionsPadded  = [...deductionRows,  ...Array(Math.max(0, maxRows - deductionRows.length)).fill(null)]

  return (
    <div className="bg-white">
      {showPrintButton && (
        <div className="flex justify-end mb-4 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      )}

      {/* Payslip content */}
      <div className="font-mono text-sm border border-gray-800 p-6" id="payslip-print">
        {/* Company header */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            {p.snapshot_company_name ?? "AKWAABA HOLDINGS LIMITED"}
          </h1>
          <h2 className="text-base font-semibold mt-1">PAYSLIP</h2>
        </div>

        <Separator className="bg-gray-800 mb-4" />

        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-6 mb-4 text-xs">
          <div className="space-y-1">
            <Row label="Date"    value={p.pay_date} />
            <Row label="Period"  value={p.pay_period} />
          </div>
          <div className="space-y-1">
            <Row label="SSNIT No."  value={p.snapshot_ssnit_number ?? "—"} />
            <Row label="Bank"       value={p.snapshot_bank_name ?? "—"} />
            <Row label="Account"    value={p.snapshot_account_number ?? "—"} />
          </div>
        </div>

        {/* Employee info */}
        <div className="mb-4 text-xs space-y-1">
          <Row label="Employee Name" value={(p.snapshot_employee_name ?? "—").toUpperCase()} bold />
          <Row label="Employee ID"   value={p.snapshot_employee_id_no ?? "—"} />
          <Row label="Job Title"     value={(p.snapshot_position ?? "—").toUpperCase()} />
          <Row label="Department"    value={(p.snapshot_department ?? "—").toUpperCase()} />
        </div>

        <Separator className="bg-gray-800 mb-0" />

        {/* Earnings / Deductions table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-800">
              <th className="p-2 text-left border-r border-gray-800 font-bold uppercase">Earnings</th>
              <th className="p-2 text-right border-r border-gray-800 font-bold uppercase">AMT (GH¢)</th>
              <th className="p-2 text-left border-r border-gray-800 font-bold uppercase">Deductions</th>
              <th className="p-2 text-right font-bold uppercase">AMT (GH¢)</th>
            </tr>
          </thead>
          <tbody>
            {earningsPadded.map((earning, i) => {
              const deduction = deductionsPadded[i]
              return (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-800 font-semibold">
                    {earning?.name ?? ""}
                  </td>
                  <td className="p-2 border-r border-gray-800 text-right font-semibold">
                    {earning ? fmt(earning.amount) : ""}
                  </td>
                  <td className="p-2 border-r border-gray-800 font-semibold">
                    {deduction?.name ?? ""}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {deduction ? fmt(deduction.amount) : ""}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-800">
              <td className="p-2 border-r border-gray-800 font-bold">GROSS SALARY</td>
              <td className="p-2 border-r border-gray-800 text-right font-bold">{fmt(p.gross_pay)}</td>
              <td className="p-2 border-r border-gray-800 font-bold">TOTAL DEDUCTIONS</td>
              <td className="p-2 text-right font-bold">{fmt(p.total_deductions)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Net pay box */}
        <div className="text-center my-5">
          <div className="inline-block border-2 border-gray-800 bg-gray-100 px-10 py-3">
            <span className="font-bold text-base">
              NET PAY: GHS {fmtLabel(p.net_pay)}
            </span>
          </div>
        </div>

        {/* Employer contributions */}
        <div className="text-xs mb-4 space-y-1">
          <p className="font-semibold">Employer Contributions:</p>
          <div className="pl-4 space-y-1">
            <EmpRow label="SSNIT – Employer (13%)"    value={fmtLabel(p.ssnit_employer)} />
            {Number(p.tier3_employer) > 0 && (
              <EmpRow label="Tier 3 – Employer"       value={fmtLabel(p.tier3_employer)} />
            )}
            <EmpRow label="Total Employer Cost"       value={fmtLabel(p.total_employer_cost)} strong />
          </div>
        </div>

        {/* PAYE breakdown (if available) */}
        {(p.calculation_breakdown?.paye_band_breakdown?.length ?? 0) > 0 && (
          <div className="text-xs mb-4">
            <p className="font-semibold mb-1">PAYE Band Breakdown:</p>
            <div className="pl-4 space-y-0.5">
              {(p.calculation_breakdown?.paye_band_breakdown ?? []).map((band, i) => (
                <div key={i} className="flex justify-between">
                  <span>{band.description}: GHS {fmtLabel(band.taxable_in_band)}</span>
                  <span className="font-semibold">GHS {fmtLabel(band.tax_in_band)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Number(p.loan_balance) > 0 && (
          <div className="text-xs mb-4">
            <span className="font-semibold">Outstanding Loan Balance: </span>
            <span>GHS {fmtLabel(p.loan_balance)}</span>
          </div>
        )}

        <Separator className="bg-gray-300 my-3" />

        {/* Footer */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>akwaabahrpay — Welcome to Growth</span>
          <span>Print date: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ── Helper sub-components ────────────────────────────────────────────────────

function Row({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex gap-1">
      <span className="w-28 shrink-0">{label}:</span>
      <span className={bold ? "font-bold" : "font-semibold"}>{value}</span>
    </div>
  )
}

function EmpRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold border-t border-gray-300 pt-1 mt-1" : ""}`}>
      <span>{label}:</span>
      <span className="font-semibold">GHS {value}</span>
    </div>
  )
}
