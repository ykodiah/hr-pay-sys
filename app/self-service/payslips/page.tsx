"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { FileText, Download, Eye, Calendar, DollarSign, Calculator, TrendingDown, AlertCircle } from "lucide-react"
import type { PayslipRow } from "@/lib/services/payslip-service"
import { PayslipDocument } from "@/components/payslip-document"

// ── Demo employee ID – replace with auth session once auth is wired ──────────
const DEMO_EMPLOYEE_ID = "demo"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SummaryData {
  totalGross: number
  totalNet: number
  totalPaye: number
  totalSsnit: number
  payslipCount: number
  latestPayDate: string | null
}

export default function PayslipsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRow | null>(null)

  const { data, error, isLoading } = useSWR<{
    success: boolean
    data: PayslipRow[]
    summary: SummaryData
  }>(
    `/api/payslips?employee_id=${DEMO_EMPLOYEE_ID}&year=${selectedYear}`,
    fetcher
  )

  const payslips: PayslipRow[] = data?.data ?? []
  const summary: SummaryData = data?.summary ?? {
    totalGross: 0,
    totalNet: 0,
    totalPaye: 0,
    totalSsnit: 0,
    payslipCount: 0,
    latestPayDate: null,
  }

  // ── Download as HTML (print-ready) ──────────────────────────────────────
  const handleDownload = (payslip: PayslipRow) => {
    try {
      const html = buildPayslipHTML(payslip)
      const blob = new Blob([html], { type: "text/html" })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href     = url
      link.download = `Payslip_${payslip.pay_period.replace(" ", "_")}_${payslip.snapshot_employee_name ?? "Employee"}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Mark as viewed via PATCH
      fetch(`/api/payslips/${payslip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_viewed" }),
      }).catch(console.error)

      toast({ title: "Payslip Downloaded", description: `Payslip for ${payslip.pay_period} downloaded successfully.` })
    } catch (err) {
      console.error("[v0] download error", err)
      toast({ title: "Download Error", description: "Error generating payslip. Please try again.", variant: "destructive" })
    }
  }

  const yearOptions = Array.from({ length: 4 }, (_, i) => String(currentYear - i))

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900">Failed to load payslips</h2>
        <p className="text-sm text-gray-500">Check your connection and try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600">View and download your salary statements</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} value={`GHS ${summary.totalGross.toLocaleString()}`} label="Total Gross Pay" />
        <SummaryCard icon={<Calculator className="w-5 h-5 text-blue-600" />} value={summary.payslipCount.toString()} label="Payslips" />
        <SummaryCard icon={<TrendingDown className="w-5 h-5 text-red-600" />} value={`GHS ${summary.totalPaye.toLocaleString()}`} label="Total PAYE" />
        <SummaryCard icon={<Calculator className="w-5 h-5 text-purple-600" />} value={`GHS ${summary.totalSsnit.toLocaleString()}`} label="Total SSNIT" />
        <SummaryCard icon={<FileText className="w-5 h-5 text-emerald-600" />} value={`GHS ${summary.totalNet.toLocaleString()}`} label="Total Net Pay" />
      </div>

      {/* Payslips list */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips for {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700">No payslips found for {selectedYear}</h3>
              <p className="text-sm text-gray-500 mt-1">Payslips will appear here once payroll has been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payslips.map((payslip) => (
                <div
                  key={payslip.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{payslip.pay_period}</h3>
                      <p className="text-sm text-gray-600">
                        Paid on {new Date(payslip.pay_date).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 md:gap-6 text-center text-sm">
                    <div>
                      <p className="font-medium text-gray-900">GHS {Number(payslip.gross_pay).toLocaleString()}</p>
                      <p className="text-gray-500">Gross Pay</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">-GHS {Number(payslip.paye_tax).toLocaleString()}</p>
                      <p className="text-gray-500">PAYE</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-600">-GHS {Number(payslip.ssnit_employee).toLocaleString()}</p>
                      <p className="text-gray-500">SSNIT</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-600">GHS {Number(payslip.net_pay).toLocaleString()}</p>
                      <p className="text-gray-500">Net Pay</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <StatusBadge status={payslip.status} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayslip(payslip)}
                          className="bg-transparent"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Payslip — {payslip.pay_period}</DialogTitle>
                        </DialogHeader>
                        {selectedPayslip && <PayslipDocument payslip={selectedPayslip} />}
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleDownload(payslip)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    issued: "bg-emerald-100 text-emerald-800",
    viewed:  "bg-blue-100 text-blue-800",
    draft:   "bg-yellow-100 text-yellow-800",
    archived:"bg-gray-100 text-gray-600",
  }
  return (
    <Badge className={map[status] ?? "bg-gray-100 text-gray-600"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// ── HTML payslip generator (for download) ───────────────────────────────────
function buildPayslipHTML(p: PayslipRow): string {
  const allowanceRows = [
    p.transport_allowance > 0     ? { name: "Transport Allowance",      amount: Number(p.transport_allowance) }     : null,
    p.housing_allowance > 0       ? { name: "Housing Allowance",        amount: Number(p.housing_allowance) }       : null,
    p.medical_allowance > 0       ? { name: "Medical Allowance",        amount: Number(p.medical_allowance) }       : null,
    p.meal_allowance > 0          ? { name: "Meal Allowance",           amount: Number(p.meal_allowance) }          : null,
    p.communication_allowance > 0 ? { name: "Communication Allowance",  amount: Number(p.communication_allowance) } : null,
    p.other_allowances > 0        ? { name: "Other Allowances",         amount: Number(p.other_allowances) }        : null,
  ].filter(Boolean) as { name: string; amount: number }[]

  const deductionRows = [
    { name: "SSNIT EMPLOYEE (5.5%)", amount: Number(p.ssnit_employee) },
    p.tier2_employee > 0  ? { name: "TIER 2 (5%)",       amount: Number(p.tier2_employee) }  : null,
    p.tier3_employee > 0  ? { name: "TIER 3",            amount: Number(p.tier3_employee) }  : null,
    { name: "PAYE (INCOME TAX)",      amount: Number(p.paye_tax) },
    p.loan_deduction > 0  ? { name: "LOAN DEDUCTION",    amount: Number(p.loan_deduction) }  : null,
    p.advance_deduction > 0 ? { name: "ADVANCE",         amount: Number(p.advance_deduction) } : null,
    p.other_deductions > 0  ? { name: "OTHER DEDUCTIONS",amount: Number(p.other_deductions) } : null,
  ].filter(Boolean) as { name: string; amount: number }[]

  const fmt = (n: number) => n.toFixed(2)

  const maxRows = Math.max(allowanceRows.length + 1, deductionRows.length)
  const earningsAll = [{ name: "BASIC SALARY", amount: Number(p.basic_salary) }, ...allowanceRows]
  const earningsPadded = [...earningsAll, ...Array(Math.max(0, maxRows - earningsAll.length)).fill({ name: "", amount: null })]
  const deductionsPadded = [...deductionRows, ...Array(Math.max(0, maxRows - deductionRows.length)).fill({ name: "", amount: null })]

  const tableRows = earningsPadded.map((e, i) => {
    const d = deductionsPadded[i]
    return `<tr>
      <td>${e.name}</td>
      <td class="amt">${e.amount !== null ? fmt(e.amount) : ""}</td>
      <td>${d?.name ?? ""}</td>
      <td class="amt">${d?.amount !== null && d?.amount !== undefined ? fmt(d.amount) : ""}</td>
    </tr>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payslip – ${p.pay_period}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none; } }
  body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; color: #000; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; font-weight: bold; margin: 0 0 16px; }
  .center { text-align: center; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .meta div { line-height: 1.8; }
  table { border: 2px solid #000; border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-weight: bold; text-align: center; }
  .amt { text-align: right; font-weight: bold; }
  tfoot td { background: #f0f0f0; font-weight: bold; }
  .net { text-align: center; margin: 16px 0; }
  .net-box { display: inline-block; border: 2px solid #000; background: #f0f0f0; padding: 12px 24px; font-size: 14px; font-weight: bold; }
  .employer { font-size: 11px; margin-bottom: 16px; }
  .footer { display: flex; justify-content: space-between; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; }
  .print-btn { display: inline-block; margin: 16px 0; padding: 8px 20px; background: #059669; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
<div class="center">
  <h1>${p.snapshot_company_name ?? "COMPANY"}</h1>
  <h2>PAYSLIP</h2>
</div>
<div class="meta">
  <div>
    <strong>Date:</strong> ${p.pay_date}<br>
    <strong>Period:</strong> ${p.pay_period}
  </div>
  <div>
    <strong>SSNIT No.:</strong> ${p.snapshot_ssnit_number ?? "—"}<br>
    <strong>Bank:</strong> ${p.snapshot_bank_name ?? "—"}<br>
    <strong>Account:</strong> ${p.snapshot_account_number ?? "—"}
  </div>
</div>
<div style="margin-bottom:12px; line-height:1.8;">
  <strong>Employee Name:</strong> ${p.snapshot_employee_name ?? "—"}<br>
  <strong>Employee ID:</strong> ${p.snapshot_employee_id_no ?? "—"}<br>
  <strong>Position:</strong> ${p.snapshot_position ?? "—"}<br>
  <strong>Department:</strong> ${p.snapshot_department ?? "—"}
</div>
<table>
  <thead><tr><th>EARNINGS</th><th>AMT (GH¢)</th><th>DEDUCTIONS</th><th>AMT (GH¢)</th></tr></thead>
  <tbody>${tableRows}</tbody>
  <tfoot><tr>
    <td>GROSS SALARY</td><td class="amt">${fmt(Number(p.gross_pay))}</td>
    <td>TOTAL DEDUCTIONS</td><td class="amt">${fmt(Number(p.total_deductions))}</td>
  </tr></tfoot>
</table>
<div class="net"><div class="net-box">NET PAY: GHS ${fmt(Number(p.net_pay))}</div></div>
<div class="employer">
  <strong>Employer Contributions:</strong><br>
  SSNIT – Employer (13%): GHS ${fmt(Number(p.ssnit_employer))}<br>
  ${p.tier2_employer > 0 ? `Tier 2 – Employer (5%): GHS ${fmt(Number(p.tier2_employer))}<br>` : ""}
  ${p.tier3_employer > 0 ? `Tier 3 – Employer: GHS ${fmt(Number(p.tier3_employer))}<br>` : ""}
</div>
<div class="footer">
  <span>akwaabahrpay — Welcome to Growth</span>
  <span>Generated: ${new Date().toLocaleString()}</span>
</div>
</body>
</html>`
}
