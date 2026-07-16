"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { calculateGhanaTax, DEFAULT_TAX_RATES, round2 } from "@/lib/ghana-tax/engine"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calculator,
  RefreshCw,
  Play,
  Database,
  Users,
  DollarSign,
  ClipboardList,
  History,
  CheckSquare,
  Download,
  Loader2,
} from "lucide-react"

type PayInputApiRow = {
  employee_id: string
  employee_code: string
  full_name: string
  department: string | null
  position?: string | null
  master: {
    basic_salary: number
    transport_allowance: number
    housing_allowance: number
    medical_allowance: number
    meal_allowance: number
    communication_allowance: number
    uniform_allowance: number
    other_allowances: number
    tier2_applicable: boolean
    tier3_applicable: boolean
  }
  input: {
    basic_salary: number | null
    transport_allowance: number | null
    housing_allowance: number | null
    medical_allowance: number | null
    meal_allowance: number | null
    communication_allowance: number | null
    uniform_allowance: number | null
    other_allowances: number | null
    overtime_amount: number
    bonus_amount: number
    loan_deduction: number
    advance_deduction: number
    other_deductions: number
    tier2_applicable: boolean
    tier3_applicable: boolean
    tier3_employee_rate: number
    status: string
  }
}

type WorksheetRow = {
  employeeId: string
  employeeCode: string
  name: string
  department: string
  position: string
  basicSalary: number
  allowances: number
  overtime: number
  bonus: number
  loan: number
  advance: number
  other: number
  tier2: boolean
  tier3: boolean
  tier3Rate: number
  grossPay: number
  paye: number
  ssnitEmployee: number
  totalDeductions: number
  netPay: number
  selected: boolean
  status: "Loaded" | "Calculated" | "Processed"
}

type PayrollRunSummary = {
  id: string
  status: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  total_gross_pay?: number
  total_deductions?: number
  total_net_pay?: number
  employee_count?: number
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

function periodOptions(count = 12) {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return out
}

function fmtPeriod(p: string) {
  const [y, m] = p.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-GH", {
    month: "long",
    year: "numeric",
  })
}

function pick(override: number | null | undefined, master: number) {
  return override != null && override !== ("" as unknown) ? Number(override) : Number(master ?? 0)
}

function mapApiRow(row: PayInputApiRow): WorksheetRow {
  const basic = pick(row.input.basic_salary, row.master.basic_salary)
  const allowances =
    pick(row.input.transport_allowance, row.master.transport_allowance) +
    pick(row.input.housing_allowance, row.master.housing_allowance) +
    pick(row.input.medical_allowance, row.master.medical_allowance) +
    pick(row.input.meal_allowance, row.master.meal_allowance) +
    pick(row.input.communication_allowance, row.master.communication_allowance) +
    pick(row.input.uniform_allowance, row.master.uniform_allowance) +
    pick(row.input.other_allowances, row.master.other_allowances)

  return {
    employeeId: row.employee_id,
    employeeCode: row.employee_code ?? "",
    name: row.full_name,
    department: row.department ?? "",
    position: row.position ?? "",
    basicSalary: basic,
    allowances,
    overtime: Number(row.input.overtime_amount ?? 0),
    bonus: Number(row.input.bonus_amount ?? 0),
    loan: Number(row.input.loan_deduction ?? 0),
    advance: Number(row.input.advance_deduction ?? 0),
    other: Number(row.input.other_deductions ?? 0),
    tier2: row.input.tier2_applicable !== false,
    tier3: Boolean(row.input.tier3_applicable),
    tier3Rate: Number(row.input.tier3_employee_rate ?? 0),
    grossPay: 0,
    paye: 0,
    ssnitEmployee: 0,
    totalDeductions: 0,
    netPay: 0,
    selected: true,
    status: "Loaded",
  }
}

function calculateRow(row: WorksheetRow): WorksheetRow {
  const tax = calculateGhanaTax(
    {
      monthly_basic: row.basicSalary,
      monthly_allowances: { other: row.allowances },
      monthly_overtime: row.overtime,
      monthly_bonus: row.bonus,
      tier2_applicable: row.tier2,
      tier3_applicable: row.tier3,
      other_deductions: {
        loan: row.loan,
        advance: row.advance,
        other: row.other,
      },
    },
    {
      ...DEFAULT_TAX_RATES,
      tier3: {
        employee_rate: row.tier3Rate || 0,
        employer_rate: 0,
      },
    },
  )

  return {
    ...row,
    grossPay: round2(tax.monthly_gross + tax.monthly_overtime + tax.monthly_bonus),
    paye: tax.monthly_total_paye_withheld,
    ssnitEmployee: tax.monthly_pension_employee,
    totalDeductions: tax.monthly_total_employee_deductions,
    netPay: tax.monthly_net_pay,
    status: "Calculated",
  }
}

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PayrollPage() {
  const [companyId, setCompanyId] = useState("")
  const [payPeriod, setPayPeriod] = useState(currentPeriod())
  const [rows, setRows] = useState<WorksheetRow[]>([])
  const [runs, setRuns] = useState<PayrollRunSummary[]>([])
  const [activeRun, setActiveRun] = useState<PayrollRunSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [search, setSearch] = useState("")
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const resolveCompany = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("companies").select("id, name").limit(1).maybeSingle()
    if (data?.id) setCompanyId(data.id)
    return data?.id ?? ""
  }, [])

  const loadWorksheet = useCallback(async (cid: string, period: string) => {
    setLoading(true)
    try {
      const [inputRes, runsRes] = await Promise.all([
        fetch(
          `/api/payroll/input?company_id=${encodeURIComponent(cid)}&pay_period=${encodeURIComponent(period)}`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/payroll/runs?company_id=${encodeURIComponent(cid)}&limit=24`,
          { cache: "no-store" },
        ),
      ])

      const inputJson = await inputRes.json()
      if (!inputRes.ok) throw new Error(inputJson.error || "Failed to load employees")

      const runsJson = runsRes.ok ? await runsRes.json() : { runs: [] }
      const periodRuns: PayrollRunSummary[] = runsJson.runs ?? runsJson.data ?? []

      const mapped = (inputJson.rows ?? []).map((r: PayInputApiRow) => calculateRow(mapApiRow(r)))
      const matchingRun =
        periodRuns.find((r) => String(r.pay_period_start ?? "").startsWith(period)) ?? null

      startTransition(() => {
        setRows(mapped)
        setRuns(periodRuns)
        setActiveRun(matchingRun)
        setLastSyncedAt(inputJson.meta?.fetched_at ?? new Date().toISOString())
      })

      if (inputJson.meta?.warnings?.length) {
        toast({
          title: "Partial sync",
          description: inputJson.meta.warnings.join("; "),
        })
      }
    } catch (err) {
      toast({
        title: "Could not load payroll",
        description: err instanceof Error ? err.message : "Database sync failed",
        variant: "destructive",
      })
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const cid = companyId || (await resolveCompany())
      if (cid) await loadWorksheet(cid, payPeriod)
      else setLoading(false)
    })()
  }, [companyId, payPeriod, resolveCompany, loadWorksheet])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q),
    )
  }, [rows, search])

  const selected = rows.filter((r) => r.selected)
  const totals = useMemo(() => {
    const source = selected.length ? selected : rows
    return {
      employees: source.length,
      gross: source.reduce((s, r) => s + r.grossPay, 0),
      deductions: source.reduce((s, r) => s + r.totalDeductions, 0),
      net: source.reduce((s, r) => s + r.netPay, 0),
      paye: source.reduce((s, r) => s + r.paye, 0),
    }
  }, [rows, selected])

  const handleSelectAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })))
  }

  const handleRecalculate = () => {
    setRows((prev) => prev.map((r) => (r.selected ? calculateRow(r) : r)))
    toast({ title: "Recalculated", description: "Preview figures refreshed from loaded DB values." })
  }

  const handleProcess = async () => {
    if (!companyId) return
    setProcessing(true)
    try {
      const res = await fetch("/api/payroll/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          pay_period: payPeriod,
          payroll_run_id: activeRun?.id,
          submit_for_approval: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Processing failed")

      toast({
        title: "Payroll processed",
        description: `${json.processed} employee(s) synced to payroll_items / payslips${
          json.errors?.length ? ` (${json.errors.length} warnings)` : ""
        }.`,
      })
      await loadWorksheet(companyId, payPeriod)
    } catch (err) {
      toast({
        title: "Process failed",
        description: err instanceof Error ? err.message : "Could not process payroll",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = () => {
    const source = selected.length ? selected : rows
    if (!source.length) {
      toast({ title: "Nothing to export", variant: "destructive" })
      return
    }
    const columns = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Basic Salary (GHS)",
      "Allowances (GHS)",
      "Overtime (GHS)",
      "Gross Pay (GHS)",
      "PAYE (GHS)",
      "SSNIT Employee (GHS)",
      "Total Deductions (GHS)",
      "Net Pay (GHS)",
    ]
    const bom = "\uFEFF"
    const lines = [
      `"Payroll Processing Export"`,
      `"Pay Period","${fmtPeriod(payPeriod)}"`,
      `"Generated At","${new Date().toISOString()}"`,
      "",
      columns.map((c) => `"${c}"`).join(","),
      ...source.map((r) =>
        [
          r.employeeCode,
          r.name,
          r.department,
          r.basicSalary,
          r.allowances,
          r.overtime,
          r.grossPay,
          r.paye,
          r.ssnitEmployee,
          r.totalDeductions,
          r.netPay,
        ]
          .map((v) => (typeof v === "number" ? String(round2(v)) : `"${String(v).replace(/"/g, '""')}"`))
          .join(","),
      ),
    ]
    const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payroll-${payPeriod}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600 max-w-2xl">
            Employees, financials, period inputs, and loans load from the database. Process writes
            payroll_items and payslips, then queues the run for approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/payroll/input">
              <ClipboardList className="h-4 w-4 mr-2" />
              Pay Inputs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/payroll/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/approvals">
              <CheckSquare className="h-4 w-4 mr-2" />
              Approvals
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Pay period</label>
          <select
            className="mt-1 block h-10 rounded-md border px-3 text-sm"
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
          >
            {periodOptions().map((p) => (
              <option key={p} value={p}>
                {fmtPeriod(p)}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => companyId && loadWorksheet(companyId, payPeriod)}
          disabled={loading || !companyId}
        >
          {loading || isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync from DB
        </Button>
        <Button variant="outline" onClick={handleRecalculate} disabled={!rows.length}>
          <Calculator className="h-4 w-4 mr-2" />
          Recalculate
        </Button>
        <Button onClick={handleProcess} disabled={processing || !rows.length || !companyId}>
          {processing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Process & Submit
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={!rows.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        {lastSyncedAt && (
          <Badge variant="outline" className="h-8 gap-1">
            <Database className="h-3.5 w-3.5" />
            Synced {new Date(lastSyncedAt).toLocaleTimeString()}
          </Badge>
        )}
        {activeRun && (
          <Badge className="h-8">
            Run {activeRun.status} · {activeRun.employee_count ?? 0} items
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Employees", value: String(totals.employees), icon: Users },
          { label: "Gross Pay", value: money(totals.gross), icon: DollarSign },
          { label: "Deductions", value: money(totals.deductions), icon: Calculator },
          { label: "Net Pay", value: money(totals.net), icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Employee worksheet — {fmtPeriod(payPeriod)}</CardTitle>
              <CardDescription>
                Sourced from employees, employee_financial, payroll_pay_inputs, and employee_loans.
              </CardDescription>
            </div>
            <Input
              className="max-w-xs"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading employees from database…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No active employees found for this company.</p>
              <p className="text-sm mt-1">
                Add employees and financial records, or capture period values in{" "}
                <Link href="/app/payroll/input" className="underline text-emerald-700">
                  Pay Inputs
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={rows.length > 0 && rows.every((r) => r.selected)}
                        onCheckedChange={(v) => handleSelectAll(Boolean(v))}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Basic</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">PAYE</TableHead>
                    <TableHead className="text-right">SSNIT</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.employeeId}>
                      <TableCell>
                        <Checkbox
                          checked={row.selected}
                          onCheckedChange={(v) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.employeeId === row.employeeId
                                  ? { ...r, selected: Boolean(v) }
                                  : r,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.employeeCode}</div>
                      </TableCell>
                      <TableCell>{row.department || "—"}</TableCell>
                      <TableCell className="text-right">{money(row.basicSalary)}</TableCell>
                      <TableCell className="text-right">{money(row.grossPay)}</TableCell>
                      <TableCell className="text-right">{money(row.paye)}</TableCell>
                      <TableCell className="text-right">{money(row.ssnitEmployee)}</TableCell>
                      <TableCell className="text-right font-medium">{money(row.netPay)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent payroll runs</CardTitle>
            <CardDescription>Loaded from payroll_runs with item counts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.slice(0, 8).map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {run.pay_period_start} → {run.pay_period_end}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {run.employee_count ?? 0} employees · Net {money(Number(run.total_net_pay ?? 0))}
                  </span>
                </div>
                <Badge>{run.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
