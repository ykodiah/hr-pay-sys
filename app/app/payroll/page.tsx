"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calculator,
  RefreshCw,
  Database,
  Users,
  DollarSign,
  ClipboardList,
  History,
  CheckSquare,
  Download,
  Loader2,
  ArrowRight,
  Zap,
  Shield,
} from "lucide-react"

type PayInputApiRow = {
  employee_id: string
  employee_code: string
  full_name: string
  department: string | null
  position?: string | null
  date_of_joining?: string | null
  master: {
    basic_salary: number
    transport_allowance: number
    housing_allowance: number
    medical_allowance: number
    meal_allowance: number
    communication_allowance: number
    uniform_allowance: number
    other_allowances: number
    card_allowances?: number
    card_deductions?: number
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

type TaxReliefItem = {
  relief_code: string
  relief_name: string
  annual_amount: number
}

type WorksheetRow = {
  employeeId: string
  employeeCode: string
  name: string
  department: string
  position: string
  dateOfJoining: string | null
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
  providentFund: number
  ssnitEmployee: number
  tier2Employee: number
  taxableIncome: number
  paye: number
  overtimeTax: number
  bonusTax: number
  taxReliefTotal: number
  totalDeductions: number
  netPay: number
  selected: boolean
  status: "Loaded" | "Calculated" | "Processed" | "Submitted"
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

type CompanyInfo = {
  id: string
  name?: string | null
  address?: string | null
  logo_url?: string | null
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
  const cardAllow = Number(row.master.card_allowances ?? 0)
  const cardDed = Number(row.master.card_deductions ?? 0)
  const allowances =
    pick(row.input.transport_allowance, row.master.transport_allowance) +
    pick(row.input.housing_allowance, row.master.housing_allowance) +
    pick(row.input.medical_allowance, row.master.medical_allowance) +
    pick(row.input.meal_allowance, row.master.meal_allowance) +
    pick(row.input.communication_allowance, row.master.communication_allowance) +
    pick(row.input.uniform_allowance, row.master.uniform_allowance) +
    pick(row.input.other_allowances, row.master.other_allowances) +
    cardAllow

  return {
    employeeId: row.employee_id,
    employeeCode: row.employee_code ?? "",
    name: row.full_name,
    department: row.department ?? "",
    position: row.position ?? "",
    dateOfJoining: row.date_of_joining ?? null,
    basicSalary: basic,
    allowances,
    overtime: Number(row.input.overtime_amount ?? 0),
    bonus: Number(row.input.bonus_amount ?? 0),
    loan: Number(row.input.loan_deduction ?? 0),
    advance: Number(row.input.advance_deduction ?? 0),
    other: Number(row.input.other_deductions ?? 0) + cardDed,
    tier2: row.input.tier2_applicable !== false,
    tier3: Boolean(row.input.tier3_applicable),
    tier3Rate: Number(row.input.tier3_employee_rate ?? 0),
    grossPay: 0,
    providentFund: 0,
    ssnitEmployee: 0,
    tier2Employee: 0,
    taxableIncome: 0,
    paye: 0,
    overtimeTax: 0,
    bonusTax: 0,
    taxReliefTotal: 0,
    totalDeductions: 0,
    netPay: 0,
    selected: false,
    status: "Loaded",
  }
}

function calculateRow(
  row: WorksheetRow,
  taxRates = DEFAULT_TAX_RATES,
  annualTaxReliefs: TaxReliefItem[] = [],
): WorksheetRow {
  const tax = calculateGhanaTax(
    {
      monthly_basic: row.basicSalary,
      monthly_allowances: { other: row.allowances },
      monthly_overtime: row.overtime,
      monthly_bonus: row.bonus,
      tier2_applicable: row.tier2,
      tier3_applicable: row.tier3,
      tier3_employee_rate: row.tier3Rate || undefined,
      annual_tax_reliefs: annualTaxReliefs,
      other_deductions: {
        loan: row.loan,
        advance: row.advance,
        other: row.other,
      },
    },
    {
      ...taxRates,
      tier3: {
        employee_rate: row.tier3Rate || taxRates.tier3?.employee_rate || 0,
        employer_rate: taxRates.tier3?.employer_rate || 0,
      },
    },
  )

  return {
    ...row,
    grossPay: round2(tax.monthly_gross + tax.monthly_overtime + tax.monthly_bonus),
    providentFund: round2(tax.monthly_tier3_employee),
    ssnitEmployee: round2(tax.monthly_ssnit_employee),
    tier2Employee: round2(tax.monthly_tier2_employee),
    taxableIncome: round2(tax.monthly_taxable_income),
    paye: round2(tax.monthly_total_paye_withheld),
    overtimeTax: round2(tax.monthly_overtime_tax),
    bonusTax: round2(tax.monthly_bonus_tax),
    taxReliefTotal: round2((tax.annual_tax_reliefs || 0) / 12),
    totalDeductions: round2(tax.monthly_total_employee_deductions),
    netPay: round2(tax.monthly_net_pay),
    status: "Calculated",
  }
}

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function moneyPlain(n: number) {
  return Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function exportPayload(rows: WorksheetRow[]) {
  return rows.map((r) => ({
    employeeCode: r.employeeCode,
    employeeId: r.employeeId,
    name: r.name,
    department: r.department,
    basicSalary: r.basicSalary,
    allowances: r.allowances,
    overtime: r.overtime,
    grossPay: r.grossPay,
    tier2Employee: r.tier2Employee,
    overtimeTax: r.overtimeTax,
    bonusTax: r.bonusTax,
    providentFund: r.providentFund,
    ssnitEmployee: r.ssnitEmployee,
    taxableIncome: r.taxableIncome,
    paye: r.paye,
    loan: r.loan,
    totalDeductions: r.totalDeductions,
    netPay: r.netPay,
  }))
}

function sumRows(rows: WorksheetRow[]) {
  return {
    basicSalary: rows.reduce((s, r) => s + r.basicSalary, 0),
    allowances: rows.reduce((s, r) => s + r.allowances, 0),
    overtime: rows.reduce((s, r) => s + r.overtime, 0),
    grossPay: rows.reduce((s, r) => s + r.grossPay, 0),
    providentFund: rows.reduce((s, r) => s + r.providentFund, 0),
    ssnitEmployee: rows.reduce((s, r) => s + r.ssnitEmployee, 0),
    taxableIncome: rows.reduce((s, r) => s + r.taxableIncome, 0),
    paye: rows.reduce((s, r) => s + r.paye, 0),
    loan: rows.reduce((s, r) => s + r.loan, 0),
    totalDeductions: rows.reduce((s, r) => s + r.totalDeductions, 0),
    netPay: rows.reduce((s, r) => s + r.netPay, 0),
  }
}

function ensureDemoSessionCookie() {
  if (typeof document === "undefined") return
  if (!document.cookie.includes("demo-session=active")) {
    document.cookie = "demo-session=active; path=/; max-age=86400; SameSite=Lax"
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 45000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal, credentials: "include" })
  } finally {
    clearTimeout(timer)
  }
}

function downloadClientCsv(rows: WorksheetRow[], payPeriod: string, companyName?: string | null) {
  const totals = sumRows(rows)
  const columns = [
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
  ]
  const bom = "\uFEFF"
  const lines = [
    `"Payroll Processing Export"`,
    `"Company","${(companyName || "Company").replace(/"/g, '""')}"`,
    `"Pay Period","${fmtPeriod(payPeriod)}"`,
    `"Generated At","${new Date().toISOString()}"`,
    "",
    columns.map((c) => `"${c}"`).join(","),
    ...rows.map((r) =>
      [
        r.employeeCode,
        r.name,
        r.department,
        round2(r.basicSalary),
        round2(r.allowances),
        round2(r.overtime),
        round2(r.grossPay),
        round2(r.providentFund),
        round2(r.ssnitEmployee),
        round2(r.taxableIncome),
        round2(r.paye),
        round2(r.loan),
        round2(r.totalDeductions),
        round2(r.netPay),
      ]
        .map((v) => (typeof v === "number" ? String(v) : `"${String(v).replace(/"/g, '""')}"`))
        .join(","),
    ),
    [
      `"TOTALS"`,
      `""`,
      `""`,
      round2(totals.basicSalary),
      round2(totals.allowances),
      round2(totals.overtime),
      round2(totals.grossPay),
      round2(totals.providentFund),
      round2(totals.ssnitEmployee),
      round2(totals.taxableIncome),
      round2(totals.paye),
      round2(totals.loan),
      round2(totals.totalDeductions),
      round2(totals.netPay),
    ].join(","),
    "",
    `"Payroll processing by AkwaabaHRPay · Ghana HR & Payroll Management"`,
  ]
  const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `payroll-${payPeriod}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function openClientPdf(rows: WorksheetRow[], payPeriod: string, companyName?: string | null) {
  const totals = sumRows(rows)
  const bodyRows = rows
    .map(
      (r) => `<tr>
      <td>${r.employeeCode}</td><td>${r.name}</td><td>${r.department || "—"}</td>
      <td style="text-align:right">${moneyPlain(r.basicSalary)}</td>
      <td style="text-align:right">${moneyPlain(r.allowances)}</td>
      <td style="text-align:right">${moneyPlain(r.overtime)}</td>
      <td style="text-align:right">${moneyPlain(r.grossPay)}</td>
      <td style="text-align:right">${moneyPlain(r.providentFund)}</td>
      <td style="text-align:right">${moneyPlain(r.ssnitEmployee)}</td>
      <td style="text-align:right">${moneyPlain(r.taxableIncome)}</td>
      <td style="text-align:right">${moneyPlain(r.paye)}</td>
      <td style="text-align:right">${moneyPlain(r.loan)}</td>
      <td style="text-align:right">${moneyPlain(r.totalDeductions)}</td>
      <td style="text-align:right">${moneyPlain(r.netPay)}</td>
    </tr>`,
    )
    .join("")
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payroll ${fmtPeriod(payPeriod)}</title>
  <style>
    body{font-family:Georgia,serif;padding:24px;color:#14201a}
    h1{margin:0 0 4px;font-size:22px} .muted{color:#5b6b62;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #d7ddd8;padding:6px 7px} th{background:#eef6f1}
    .right{text-align:right} .total{font-weight:700;background:#f7faf8}
    .brand{margin-top:20px;color:#0f6b4c;font-weight:700}
    button{margin-bottom:12px;background:#0f6b4c;color:#fff;border:0;padding:8px 12px;border-radius:6px}
    @media print{button{display:none}}
  </style></head><body>
  <button onclick="window.print()">Print / Save as PDF</button>
  <h1>${companyName || "Company"}</h1>
  <div class="muted">Payroll Processing Register · ${fmtPeriod(payPeriod)} · ${new Date().toLocaleString("en-GH")}</div>
  <table>
    <thead><tr>
      <th>Employee ID</th><th>Employee Name</th><th>Department</th>
      <th class="right">Basic Salary</th><th class="right">Allowances</th><th class="right">Overtime</th>
      <th class="right">Gross Pay</th><th class="right">Provident Fund</th><th class="right">SSNIT Employee</th>
      <th class="right">Taxable Income</th><th class="right">PAYE</th><th class="right">Loans</th>
      <th class="right">Total Deductions</th><th class="right">Net Pay</th>
    </tr></thead>
    <tbody>
      ${bodyRows}
      <tr class="total">
        <td colspan="3">TOTALS (${rows.length} employees)</td>
        <td class="right">${moneyPlain(totals.basicSalary)}</td>
        <td class="right">${moneyPlain(totals.allowances)}</td>
        <td class="right">${moneyPlain(totals.overtime)}</td>
        <td class="right">${moneyPlain(totals.grossPay)}</td>
        <td class="right">${moneyPlain(totals.providentFund)}</td>
        <td class="right">${moneyPlain(totals.ssnitEmployee)}</td>
        <td class="right">${moneyPlain(totals.taxableIncome)}</td>
        <td class="right">${moneyPlain(totals.paye)}</td>
        <td class="right">${moneyPlain(totals.loan)}</td>
        <td class="right">${moneyPlain(totals.totalDeductions)}</td>
        <td class="right">${moneyPlain(totals.netPay)}</td>
      </tr>
    </tbody>
  </table>
  <div class="brand">Payroll processing by AkwaabaHRPay · Ghana HR & Payroll Management</div>
  <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250))</script>
  </body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }))
  window.open(url, "_blank", "noopener,noreferrer")
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function PayrollPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [companyId, setCompanyId] = useState("")
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [payPeriod, setPayPeriod] = useState(() => {
    const fromQuery = searchParams?.get("pay_period") || ""
    return /^\d{4}-\d{2}$/.test(fromQuery) ? fromQuery : currentPeriod()
  })
  const [rows, setRows] = useState<WorksheetRow[]>([])
  const [runs, setRuns] = useState<PayrollRunSummary[]>([])
  const [activeRun, setActiveRun] = useState<PayrollRunSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null)
  const [search, setSearch] = useState("")
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [lastProcessMessage, setLastProcessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Tax rates fetched from DB (falls back to GRA defaults if not configured)
  const [dbTaxRates, setDbTaxRates] = useState(DEFAULT_TAX_RATES)
  // Employee → tax-year reliefs (loaded for the pay period's year)
  const [reliefsByEmployee, setReliefsByEmployee] = useState<Record<string, TaxReliefItem[]>>({})

  // Prorate dialog state
  type ProrateEmployee = { employeeId: string; name: string; dateOfJoining: string; proratedDays: number; totalDays: number }
  const [prorateQueue, setProrateQueue] = useState<ProrateEmployee[]>([])
  const [prorateDecisions, setProrateDecisions] = useState<Record<string, "prorate" | "full">>({})
  const [showProrateDialog, setShowProrateDialog] = useState(false)
  const [pendingRunFn, setPendingRunFn] = useState<(() => void) | null>(null)

  const resolveCompany = useCallback(async () => {
    // Prefer authenticated meta resolution (tenant isolation) over first-company fallback
    try {
      const metaRes = await fetch("/api/employees/meta", { cache: "no-store", credentials: "include" })
      const meta = await metaRes.json()
      if (metaRes.ok && meta.company_id) {
        setCompanyId(meta.company_id)
        setCompany({
          id: meta.company_id,
          name: meta.company?.name,
          address: meta.company?.address,
          logo_url: meta.company?.logo_url,
        })
        try {
          const taxRes = await fetch(
            `/api/settings/tax?company_id=${encodeURIComponent(meta.company_id)}`,
            { credentials: "include" },
          )
          if (taxRes.ok) {
            const tax = await taxRes.json()
            setDbTaxRates({
              paye_bands: tax.paye_bands ?? DEFAULT_TAX_RATES.paye_bands,
              paye_bands_are_monthly: DEFAULT_TAX_RATES.paye_bands_are_monthly,
              ssnit: tax.ssnit
                ? { employee_rate: tax.ssnit.employee_rate, employer_rate: tax.ssnit.employer_rate }
                : DEFAULT_TAX_RATES.ssnit,
              tier2: tax.tier2
                ? { employee_rate: tax.tier2.employee_rate, employer_rate: tax.tier2.employer_rate }
                : DEFAULT_TAX_RATES.tier2,
              tier3: tax.tier3
                ? { employee_rate: tax.tier3.employee_rate, employer_rate: tax.tier3.employer_rate }
                : DEFAULT_TAX_RATES.tier3,
            })
          }
        } catch {
          // GRA defaults
        }
        return meta.company_id as string
      }
    } catch {
      // fall through
    }
    return ""
  }, [])

  const loadWorksheet = useCallback(async (cid: string, period: string) => { // eslint-disable-line react-hooks/exhaustive-deps
    setLoading(true)
    try {
      const taxYear = Number(String(period).split("-")[0]) || new Date().getFullYear()
      const [inputRes, runsRes, reliefRes] = await Promise.all([
        fetch(
          `/api/payroll/input?company_id=${encodeURIComponent(cid)}&pay_period=${encodeURIComponent(period)}`,
          { cache: "no-store", credentials: "include" },
        ),
        fetch(`/api/payroll/runs?company_id=${encodeURIComponent(cid)}&limit=24`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          `/api/payroll/tax-reliefs?company_id=${encodeURIComponent(cid)}&tax_year=${taxYear}&mode=payroll_map`,
          { cache: "no-store", credentials: "include" },
        ),
      ])

      const inputJson = await inputRes.json()
      if (!inputRes.ok) throw new Error(inputJson.error || "Failed to load employees")

      const runsJson = runsRes.ok ? await runsRes.json() : { runs: [] }
      const periodRuns: PayrollRunSummary[] = runsJson.runs ?? runsJson.data ?? []

      const reliefJson = reliefRes.ok ? await reliefRes.json() : { by_employee: {} }
      const byEmp: Record<string, TaxReliefItem[]> = reliefJson.by_employee || {}
      setReliefsByEmployee(byEmp)

      const mapped = (inputJson.rows ?? []).map((r: PayInputApiRow) => {
        const base = mapApiRow(r)
        return calculateRow(base, dbTaxRates, byEmp[base.employeeId] || [])
      })
      const matchingRun =
        periodRuns.find((r) => String(r.pay_period_start ?? "").startsWith(period)) ?? null

      startTransition(() => {
        setRows(mapped)
        setRuns(periodRuns)
        setActiveRun(matchingRun)
        setLastSyncedAt(inputJson.meta?.fetched_at ?? new Date().toISOString())
      })
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
  }, [dbTaxRates])

  useEffect(() => {
    ensureDemoSessionCookie()
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
  const worksheetSource = selected.length ? selected : rows
  const columnTotals = useMemo(() => sumRows(worksheetSource), [worksheetSource])
  const totals = useMemo(
    () => ({
      employees: worksheetSource.length,
      gross: columnTotals.grossPay,
      deductions: columnTotals.totalDeductions,
      net: columnTotals.netPay,
      paye: columnTotals.paye,
    }),
    [worksheetSource.length, columnTotals],
  )

  const handleSelectAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })))
  }

  const handleRecalculate = () => {
    setRows((prev) =>
      prev.map((r) =>
        r.selected ? calculateRow(r, dbTaxRates, reliefsByEmployee[r.employeeId] || []) : r,
      ),
    )
    toast({
      title: "Recalculated",
      description: `Preview refreshed using ${payPeriod.slice(0, 4)} tax reliefs and current rates.`,
    })
  }

  const handleProcess = async () => {
    ensureDemoSessionCookie()
    if (!companyId) {
      toast({
        title: "Company required",
        description: "Load a company before processing payroll.",
        variant: "destructive",
      })
      return
    }
    if (!rows.length) {
      toast({
        title: "No employees",
        description: "Sync employees from the database first.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    setLastProcessMessage(null)
    try {
      const res = await fetchWithTimeout(
        "/api/payroll/process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            pay_period: payPeriod,
            payroll_run_id:
              activeRun && !["approved", "paid", "cancelled"].includes(activeRun.status)
                ? activeRun.id
                : undefined,
            submit_for_approval: true,
            // Send calculated worksheet so Process never re-hangs on a second tax pass
            rows: (selected.length ? selected : rows).map((r) => ({
              employeeId: r.employeeId,
              employeeCode: r.employeeCode,
              name: r.name,
              department: r.department,
              position: r.position,
              basicSalary: r.basicSalary,
              allowances: r.allowances,
              overtime: r.overtime,
              bonus: r.bonus,
              loan: r.loan,
              advance: r.advance,
              other: r.other,
              grossPay: r.grossPay,
              providentFund: r.providentFund,
              ssnitEmployee: r.ssnitEmployee,
              taxableIncome: r.taxableIncome,
              paye: r.paye,
              overtimeTax: r.overtimeTax,
              bonusTax: r.bonusTax,
              tier2Employee: r.tier2Employee,
              taxReliefTotal: r.taxReliefTotal,
              totalDeductions: r.totalDeductions,
              netPay: r.netPay,
            })),
          }),
        },
        60000,
      )
      const json = await res.json().catch(() => ({}))
      
      // Handle different response statuses
      if (res.status === 422) {
        // Partial success - some employees processed, others failed
        const processed = json.processed || 0
        const totalRequested = rows.length
        const errors = json.errors || []
        
        setLastProcessMessage(
          `${processed} of ${totalRequested} employee(s) processed${
            errors.length > 0 ? ` with ${errors.length} issue(s)` : ""
          }. Review errors below and retry after fixing.`,
        )
        
        toast({
          title: "Partial Processing",
          description: `${processed}/${totalRequested} employees processed. See details for warnings.`,
          variant: "default",
        })
        
        // Show detailed error list if available
        if (errors.length > 0 && errors.length <= 10) {
          const errorDetails = errors.slice(0, 5).join("\n")
          toast({
            title: "Processing Issues",
            description: errorDetails + (errors.length > 5 ? `\n+ ${errors.length - 5} more` : ""),
            variant: "destructive",
          })
        }
        return
      }
      
      if (!res.ok) {
        const errorMsg = json.error || `Processing failed (${res.status})`
        const details = json.details || ""
        throw new Error(errorMsg + (details ? `\n${details}` : ""))
      }

      // Success case - update UI and navigate
      const processed = json.processed || 0
      const warnings = json.errors || []
      const reconciliation = json.reconciliation
      
      setRows((prev) => prev.map((r) => ({ ...r, status: "Submitted" })))
      
      // Build detailed success message
      let successMessage = `${processed} employee(s) processed and queued for approval`
      if (reconciliation?.matched === reconciliation?.total_items) {
        successMessage += " (data validated)"
      } else if (reconciliation?.matched) {
        successMessage += ` (${reconciliation.matched}/${reconciliation.total_items} validated)`
      }
      successMessage += ". Next: Approvals → Approve → History / Payslips / Compliance."
      
      setLastProcessMessage(successMessage)
      
      toast({
        title: "Success! Submitted for approval",
        description: `${processed} employee(s) saved${
          warnings.length ? ` with ${warnings.length} warning(s)` : ""
        }. Opening Approvals in 2 seconds…`,
      })
      
      // Show any warnings/info messages
      if (warnings.length > 0) {
        const warningText = warnings
          .filter((w: string) => w.includes("⚠"))
          .slice(0, 3)
          .join("\n")
        if (warningText) {
          toast({
            title: "Data Validation Notes",
            description: warningText,
            variant: "default",
          })
        }
      }
      
      // Navigate to approvals after brief delay so user sees success message
      setTimeout(() => {
        router.push("/app/approvals")
        void loadWorksheet(companyId, payPeriod)
      }, 2000)
      
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out. Check Supabase connectivity and retry."
            : err.message
          : "Could not process payroll"
      toast({
        title: "Process failed",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Check if any selected employees joined mid-month in the selected pay period.
   * Returns an array of employees that need a prorate decision.
   */
  function getMidMonthJoiners(employeeRows: WorksheetRow[], period: string) {
    const [year, month] = period.split("-").map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0) // last day of month
    const totalDays = periodEnd.getDate()

    return employeeRows
      .filter((r) => {
        if (!r.dateOfJoining) return false
        const joined = new Date(r.dateOfJoining)
        // Joined within the selected pay period month but not on day 1
        return (
          joined.getFullYear() === year &&
          joined.getMonth() === month - 1 &&
          joined.getDate() > 1
        )
      })
      .map((r) => {
        const joined = new Date(r.dateOfJoining!)
        const proratedDays = totalDays - joined.getDate() + 1
        return {
          employeeId: r.employeeId,
          name: r.name,
          dateOfJoining: r.dateOfJoining!,
          proratedDays,
          totalDays,
        }
      })
  }

  /**
   * Entry point for Run Payroll — checks for mid-month joiners and shows
   * the prorate dialog if needed, otherwise runs payroll directly.
   */
  const handleRunPayrollWithCheck = () => {
    const employeesToRun = selected.length ? selected : rows
    const midMonthJoiners = getMidMonthJoiners(employeesToRun, payPeriod)

    if (midMonthJoiners.length > 0) {
      // Pre-fill decisions: default to "full" for each joiner
      const defaults: Record<string, "prorate" | "full"> = {}
      midMonthJoiners.forEach((e) => { defaults[e.employeeId] = "full" })
      setProrateQueue(midMonthJoiners)
      setProrateDecisions(defaults)
      setShowProrateDialog(true)
      // Store the actual run function to call after dialog confirmation
      setPendingRunFn(() => () => handleRunPayroll(defaults))
    } else {
      void handleRunPayroll({})
    }
  }

  /**
   * Run Payroll — process selected (or all) worksheet rows and queue for approval.
   */
  const handleRunPayroll = async (prorateMeta: Record<string, "prorate" | "full"> = {}) => {
    ensureDemoSessionCookie()
    if (!companyId) {
      toast({ title: "Company required", description: "Load a company before running payroll.", variant: "destructive" })
      return
    }
    if (!rows.length) {
      toast({ title: "No employees", description: "Sync employees from the database first.", variant: "destructive" })
      return
    }

    setProcessing(true)
    setLastProcessMessage(null)
    try {
      // Always recalculate the set we're about to process so amounts aren't stale
      const baseEmployees = (selected.length ? selected : rows).map((r) =>
        calculateRow(r, dbTaxRates, reliefsByEmployee[r.employeeId] || []),
      )
      if (!baseEmployees.length || baseEmployees.some((r) => !r.employeeId)) {
        throw new Error("Selected employees are missing ids. Sync from DB and try again.")
      }

      // Apply prorate decisions: scale basicSalary, allowances, grossPay, netPay proportionally
      const employeesToRun = baseEmployees.map((r) => {
        const decision = prorateMeta[r.employeeId]
        if (decision !== "prorate") return r
        // Find the joiner entry to get day ratio
        const joinerInfo = prorateQueue.find((j) => j.employeeId === r.employeeId)
        if (!joinerInfo) return r
        const ratio = joinerInfo.proratedDays / joinerInfo.totalDays
        return {
          ...r,
          basicSalary: round2(r.basicSalary * ratio),
          allowances: round2(r.allowances * ratio),
          overtime: round2(r.overtime * ratio),
          grossPay: round2(r.grossPay * ratio),
          netPay: round2(r.netPay * ratio),
          totalDeductions: round2(r.totalDeductions * ratio),
          paye: round2(r.paye * ratio),
          ssnitEmployee: round2(r.ssnitEmployee * ratio),
          providentFund: round2(r.providentFund * ratio),
        }
      })
      const res = await fetchWithTimeout(
        "/api/payroll/process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            pay_period: payPeriod,
            payroll_run_id:
              activeRun && !["approved", "paid", "cancelled"].includes(activeRun.status)
                ? activeRun.id
                : undefined,
            submit_for_approval: true,
            rows: employeesToRun.map((r) => ({
              employeeId: r.employeeId,
              employee_id: r.employeeId,
              employeeCode: r.employeeCode,
              name: r.name,
              department: r.department,
              position: r.position,
              basicSalary: r.basicSalary,
              allowances: r.allowances,
              overtime: r.overtime,
              bonus: r.bonus,
              loan: r.loan,
              advance: r.advance,
              other: r.other,
              grossPay: r.grossPay,
              providentFund: r.providentFund,
              ssnitEmployee: r.ssnitEmployee,
              taxableIncome: r.taxableIncome,
              paye: r.paye,
              overtimeTax: r.overtimeTax,
              bonusTax: r.bonusTax,
              tier2Employee: r.tier2Employee,
              taxReliefTotal: r.taxReliefTotal,
              totalDeductions: r.totalDeductions,
              netPay: r.netPay,
            })),
          }),
        },
        60000,
      )
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.error || `Run failed (${res.status})`)
      }

      const processed = json.processed || 0
      if (processed < 1) {
        throw new Error(json.error || "No employees were saved to the payroll run.")
      }
      const warnings = json.errors || []
      setRows((prev) => prev.map((r) => ({ ...r, status: "Submitted" })))
      setLastProcessMessage(
        `${processed} employee(s) processed and queued for approval.`,
      )
      toast({
        title: "✓ Submitted for approval",
        description: `${processed} of ${employeesToRun.length} employee(s) saved${warnings.length ? ` with ${warnings.length} warning(s)` : ""}. Open Approvals to review.`,
      })
      setTimeout(() => void loadWorksheet(companyId, payPeriod), 1500)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out. Check connectivity and retry."
            : err.message
          : "Could not run payroll"
      toast({ title: "Run failed", description: msg, variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = async (format: "csv" | "pdf") => {
    ensureDemoSessionCookie()
    const source = selected.length ? selected : rows
    if (!source.length) {
      toast({ title: "Nothing to export", variant: "destructive" })
      return
    }
    setExporting(format)
    try {
      const res = await fetchWithTimeout(
        "/api/payroll/export",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            pay_period: payPeriod,
            format,
            rows: exportPayload(source),
          }),
        },
        20000,
      )
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error || "Export failed")
      }

      if (format === "pdf") {
        const html = await res.text()
        const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }))
        window.open(url, "_blank", "noopener,noreferrer")
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `payroll-${payPeriod}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast({
        title: format === "pdf" ? "PDF opened" : "CSV downloaded",
        description: "Includes totals, company details, and AkwaabaHRPay footer.",
      })
    } catch (err) {
      // Always succeed via client fallback so the button never appears dead
      if (format === "pdf") openClientPdf(source, payPeriod, company?.name)
      else downloadClientCsv(source, payPeriod, company?.name)
      toast({
        title: format === "pdf" ? "PDF opened (local)" : "CSV downloaded (local)",
        description:
          err instanceof Error
            ? `Server export unavailable (${err.message}). Used on-page data instead.`
            : "Used on-page worksheet data.",
      })
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600 max-w-2xl">
            {company?.name ? `${company.name} · ` : ""}
            Process writes payroll_items and payslips, then queues the run for approval.
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
            <Link href="/app/payroll/tax-reliefs">
              <Shield className="h-4 w-4 mr-2" />
              Tax Reliefs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/approvals">
              <CheckSquare className="h-4 w-4 mr-2" />
              Approvals
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/payroll/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
        </div>
      </div>

      {lastProcessMessage && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-emerald-900">{lastProcessMessage}</p>
            <Button size="sm" asChild>
              <Link href="/app/approvals">
                Go to Approvals
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
        <Button onClick={handleRunPayrollWithCheck} disabled={processing || !rows.length || !companyId}>
          {processing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Run Payroll
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport("csv")}
          disabled={!rows.length || exporting !== null}
        >
          {exporting === "csv" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport("pdf")}
          disabled={!rows.length || exporting !== null}
        >
          {exporting === "pdf" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export PDF
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
                Columns include Provident Fund, taxable income, PAYE, loans, and net pay.
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
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Basic Salary</TableHead>
                    <TableHead className="text-right">Allowances</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">Provident Fund</TableHead>
                    <TableHead className="text-right">SSNIT Employee</TableHead>
                    <TableHead className="text-right">Taxable Income</TableHead>
                    <TableHead className="text-right">PAYE</TableHead>
                    <TableHead className="text-right">Loans</TableHead>
                    <TableHead className="text-right">Total Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
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
                      <TableCell className="font-mono text-xs">{row.employeeCode || "—"}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                      <TableCell>{row.department || "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.basicSalary)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.allowances)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.overtime)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.grossPay)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.providentFund)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.ssnitEmployee)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.taxableIncome)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.paye)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.loan)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(row.totalDeductions)}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {money(row.netPay)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length > 0 && (
                    <TableRow className="bg-emerald-50/80 font-semibold">
                      <TableCell />
                      <TableCell colSpan={3}>
                        TOTALS ({worksheetSource.length} employee
                        {worksheetSource.length === 1 ? "" : "s"}
                        {selected.length ? " selected" : ""})
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.basicSalary)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.allowances)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.overtime)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.grossPay)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.providentFund)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.ssnitEmployee)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.taxableIncome)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.paye)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.loan)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {money(columnTotals.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-emerald-700">
                        {money(columnTotals.netPay)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens after Run Payroll?</CardTitle>
          <CardDescription>End-to-end payroll flow</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Run Payroll</strong> writes{" "}
              <code>payroll_items</code> + draft <code>payslips</code> and sets the run to{" "}
              <em>pending</em>.
            </li>
            <li>
              <strong className="text-foreground">Approvals</strong> — HR/Finance approve or reject.
            </li>
            <li>
              On <strong className="text-foreground">Approve</strong>: payslips are issued, loan
              installments posted, pay inputs marked posted, and the run appears in{" "}
              <strong className="text-foreground">Payroll History</strong>.
            </li>
            <li>
              Next: download individual payslips, bank advice / compliance reports, then mark the
              run as paid when funds are disbursed.
            </li>
          </ol>
        </CardContent>
      </Card>

      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent payroll runs</CardTitle>
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

      {/* Mid-month joiner prorate dialog */}
      <Dialog open={showProrateDialog} onOpenChange={setShowProrateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mid-month joiners detected</DialogTitle>
            <DialogDescription>
              The following employee(s) joined during {fmtPeriod(payPeriod)}. Choose whether to
              pay a prorated amount (based on days worked) or the full month salary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {prorateQueue.map((emp) => {
              const decision = prorateDecisions[emp.employeeId] ?? "full"
              return (
                <div key={emp.employeeId} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(emp.dateOfJoining).toLocaleDateString("en-GH", {
                          day: "numeric", month: "long", year: "numeric",
                        })} · {emp.proratedDays} of {emp.totalDays} days
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {emp.proratedDays}/{emp.totalDays} days
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={decision === "prorate" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() =>
                        setProrateDecisions((prev) => ({ ...prev, [emp.employeeId]: "prorate" }))
                      }
                    >
                      Prorate ({emp.proratedDays}/{emp.totalDays} days)
                    </Button>
                    <Button
                      size="sm"
                      variant={decision === "full" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() =>
                        setProrateDecisions((prev) => ({ ...prev, [emp.employeeId]: "full" }))
                      }
                    >
                      Full month
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowProrateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowProrateDialog(false)
                if (pendingRunFn) pendingRunFn()
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Confirm &amp; Run Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
