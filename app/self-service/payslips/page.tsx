"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Download, Eye, Loader2, Printer, Receipt, TrendingDown, Wallet } from "lucide-react"
import {
  usePortalMe,
  usePortalResource,
  portalFetcher,
  formatMoney,
  formatDate,
} from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
} from "@/components/self-service/portal-ui"

function Row({
  label,
  value,
  strong,
  negative,
}: {
  label: string
  value: number
  strong?: boolean
  negative?: boolean
}) {
  if (!value && !strong) return null
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${strong ? "font-semibold" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <span className={negative ? "text-rose-600" : "text-slate-900"}>
        {negative ? "-" : ""}
        {formatMoney(Math.abs(value))}
      </span>
    </div>
  )
}

export default function PayslipsPage() {
  const [year, setYear] = useState<string>("all")
  const [selected, setSelected] = useState<any>(null)
  const [loadingSlip, setLoadingSlip] = useState(false)

  const { data: me } = usePortalMe()
  const query = year === "all" ? "" : `?year=${year}`
  const { data, error, isLoading } = usePortalResource<any>(
    me ? `/api/self-service/payslips${query}` : null,
  )

  if (error) return <ErrorBlock error={error} />
  if (isLoading || !data) return <LoadingBlock rows={4} />

  const payslips = data.payslips || []
  const totals = data.totals || { gross: 0, net: 0, tax: 0, ssnit: 0 }

  const openPayslip = async (id: string) => {
    setLoadingSlip(true)
    try {
      const result = await portalFetcher(`/api/self-service/payslips?id=${id}`)
      setSelected(result.payslip)
    } catch (err) {
      toast({
        title: "Could not open payslip",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setLoadingSlip(false)
    }
  }

  const downloadCsv = () => {
    const header = ["Period", "Pay date", "Gross", "PAYE", "SSNIT", "Deductions", "Net"]
    const rows = payslips.map((p: any) => [
      p.pay_period,
      p.pay_date || "",
      p.gross_pay || 0,
      p.paye_tax || 0,
      p.ssnit_employee || 0,
      p.total_deductions || 0,
      p.net_pay || 0,
    ])
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `payslips-${data.employee_name || "employee"}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: "Download started", description: `${rows.length} payslip row(s) exported.` })
  }

  const printPayslip = () => window.print()

  const allowanceLines = Array.isArray(selected?.allowance_lines) ? selected.allowance_lines : []
  const deductionLines = Array.isArray(selected?.deduction_lines) ? selected.deduction_lines : []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="My payslips"
        description="Every payslip issued to you by payroll, with year-to-date totals."
        action={
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {(data.years || []).map((y: string) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={downloadCsv} disabled={!payslips.length}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total gross" value={formatMoney(totals.gross)} icon={Wallet} />
        <StatCard
          label="Total net"
          value={formatMoney(totals.net)}
          icon={Receipt}
          tone="positive"
        />
        <StatCard label="PAYE paid" value={formatMoney(totals.tax)} icon={TrendingDown} />
        <StatCard label="SSNIT paid" value={formatMoney(totals.ssnit)} icon={TrendingDown} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payslip history</CardTitle>
          <CardDescription>
            {payslips.length} payslip(s){year !== "all" ? ` for ${year}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <EmptyState
              title="No payslips yet"
              description="Payslips appear here once payroll issues them for your account."
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {payslips.map((p: any) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{p.pay_period}</p>
                    <p className="text-xs text-slate-500">
                      Paid {formatDate(p.pay_date)} · Gross {formatMoney(p.gross_pay)} · Deductions{" "}
                      {formatMoney(p.total_deductions)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-700">
                      {formatMoney(p.net_pay)}
                    </span>
                    <StatusBadge status={p.status} />
                    <Button size="sm" variant="outline" onClick={() => openPayslip(p.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/api/payslips/${p.id}/pdf`} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip · {selected?.pay_period}</DialogTitle>
            <DialogDescription>
              {selected?.snapshot_company_name || me?.company_name} · paid{" "}
              {formatDate(selected?.pay_date)}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">Employee</p>
                  <p className="font-medium">{selected.snapshot_employee_name || data.employee_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Staff ID</p>
                  <p className="font-medium">{selected.snapshot_employee_id_no || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Position</p>
                  <p className="font-medium">{selected.snapshot_position || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">SSNIT</p>
                  <p className="font-medium">{selected.snapshot_ssnit_number || "—"}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Earnings
                </h3>
                <Row label="Basic salary" value={Number(selected.basic_salary || 0)} />
                {allowanceLines.length > 0
                  ? allowanceLines.map((line: any, i: number) => (
                      <Row
                        key={i}
                        label={line.label || line.name || "Allowance"}
                        value={Number(line.amount || 0)}
                      />
                    ))
                  : (
                      <>
                        <Row label="Transport allowance" value={Number(selected.transport_allowance || 0)} />
                        <Row label="Housing allowance" value={Number(selected.housing_allowance || 0)} />
                        <Row label="Medical allowance" value={Number(selected.medical_allowance || 0)} />
                        <Row label="Meal allowance" value={Number(selected.meal_allowance || 0)} />
                        <Row
                          label="Communication allowance"
                          value={Number(selected.communication_allowance || 0)}
                        />
                        <Row label="Other allowances" value={Number(selected.other_allowances || 0)} />
                      </>
                    )}
                <Row label="Overtime" value={Number(selected.overtime_pay || 0)} />
                <Row label="Bonus" value={Number(selected.bonus_pay || 0)} />
                <Separator className="my-2" />
                <Row label="Gross pay" value={Number(selected.gross_pay || 0)} strong />
              </div>

              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Deductions
                </h3>
                <Row label="SSNIT (employee)" value={Number(selected.ssnit_employee || 0)} negative />
                <Row label="Tier 3" value={Number(selected.tier3_employee || 0)} negative />
                <Row label="PAYE tax" value={Number(selected.paye_tax || 0)} negative />
                <Row label="Loan repayment" value={Number(selected.loan_deduction || 0)} negative />
                <Row label="Salary advance" value={Number(selected.advance_deduction || 0)} negative />
                {deductionLines.map((line: any, i: number) => (
                  <Row
                    key={i}
                    label={line.label || line.name || "Deduction"}
                    value={Number(line.amount || 0)}
                    negative
                  />
                ))}
                <Row label="Other deductions" value={Number(selected.other_deductions || 0)} negative />
                <Separator className="my-2" />
                <Row
                  label="Total deductions"
                  value={Number(selected.total_deductions || 0)}
                  strong
                  negative
                />
              </div>

              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900">Net pay</span>
                  <span className="text-xl font-bold text-emerald-700">
                    {formatMoney(selected.net_pay)}
                  </span>
                </div>
                {(selected.ytd_gross || selected.ytd_net) && (
                  <p className="mt-2 text-xs text-emerald-800">
                    Year to date · gross {formatMoney(selected.ytd_gross)} · net{" "}
                    {formatMoney(selected.ytd_net)}
                  </p>
                )}
              </div>

              {Number(selected.loan_balance || 0) > 0 && (
                <p className="text-xs text-slate-500">
                  Outstanding loan balance after this period: {formatMoney(selected.loan_balance)}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button onClick={printPayslip}>
              <Printer className="mr-2 h-4 w-4" />
              Print / save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loadingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      )}
    </div>
  )
}
