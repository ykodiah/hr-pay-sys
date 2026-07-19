// @ts-nocheck
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import {
  Search,
  Download,
  Printer,
  FileText,
  Users,
  Building2,
  MapPin,
  Layers,
  Globe,
  Sliders,
  RefreshCw,
  CheckSquare2,
  XSquare,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  Loader2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Building,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PayslipRow {
  id: string
  employee_id: string
  snapshot_employee_name: string | null
  snapshot_employee_id_no: string | null
  snapshot_department: string | null
  snapshot_position: string | null
  snapshot_location: string | null
  snapshot_division: string | null
  snapshot_subsidiary: string | null
  snapshot_ssnit_number: string | null
  snapshot_bank_name: string | null
  snapshot_account_number: string | null
  snapshot_company_name: string | null
  pay_period: string
  pay_date: string | null
  basic_salary: number
  transport_allowance: number
  housing_allowance: number
  medical_allowance: number
  meal_allowance: number
  communication_allowance: number
  other_allowances: number
  overtime_pay: number
  bonus_pay: number
  gross_pay: number
  ssnit_employee: number
  tier2_employee: number
  tier3_employee: number
  paye_taxable_income: number
  paye_tax: number
  loan_deduction: number
  advance_deduction: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  loan_balance: number
  ytd_gross: number
  ytd_net: number
  ytd_paye: number
  ytd_ssnit: number
  status: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  employee_id: string
  department: string | null
  division: string | null
  location: string | null
  subsidiary_id: string | null
}

interface PayrollRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  status: string
}

interface ActiveLoan {
  id: string
  loan_type: string
  principal: number
  interest_rate: number
  monthly_payment: number
  remaining_balance: number
  amount_paid: number
  start_date: string
  end_date: string
  purpose: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function money(n: number | null | undefined) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtPeriod(p: string) {
  if (!p) return ""
  const [y, m] = p.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GH", { month: "long", year: "numeric" })
}

function periodFromDate(d: string) {
  // "2026-07-01" → "2026-07"
  return d.slice(0, 7)
}

function statusBadge(status: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    draft:    { label: "Draft",    cls: "bg-gray-100 text-gray-700" },
    issued:   { label: "Issued",   cls: "bg-emerald-100 text-emerald-800" },
    viewed:   { label: "Viewed",   cls: "bg-blue-100 text-blue-800" },
    archived: { label: "Archived", cls: "bg-orange-100 text-orange-700" },
  }
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" }
  return <Badge className={`text-xs ${c.cls}`}>{c.label}</Badge>
}

// ─── Payslip Preview Component ────────────────────────────────────────────────

function PayslipPreview({ slip, loan }: { slip: PayslipRow; loan: ActiveLoan | null }) {
  const earnings = [
    { label: "Basic Salary",            val: slip.basic_salary },
    { label: "Transport Allowance",     val: slip.transport_allowance },
    { label: "Housing Allowance",       val: slip.housing_allowance },
    { label: "Medical Allowance",       val: slip.medical_allowance },
    { label: "Meal Allowance",          val: slip.meal_allowance },
    { label: "Communication Allowance", val: slip.communication_allowance },
    { label: "Other Allowances",        val: slip.other_allowances },
    { label: "Overtime",                val: slip.overtime_pay },
    { label: "Bonus",                   val: slip.bonus_pay },
  ].filter(e => e.val > 0)

  const deductions = [
    { label: "SSNIT (Employee 5.5%)",   val: slip.ssnit_employee },
    { label: "Tier 2 (Employee 5%)",    val: slip.tier2_employee },
    { label: "Tier 3 / Provident Fund", val: slip.tier3_employee },
    { label: "PAYE Tax",                val: slip.paye_tax },
    { label: "Loan Repayment",          val: slip.loan_deduction },
    { label: "Advance Deduction",       val: slip.advance_deduction },
    { label: "Other Deductions",        val: slip.other_deductions },
  ].filter(d => d.val > 0)

  const hasLoan = loan || slip.loan_deduction > 0

  // Determine entity line: subsidiary name or parent company
  const entityName = slip.snapshot_subsidiary || slip.snapshot_company_name || "Company"
  const isSubsidiary = Boolean(slip.snapshot_subsidiary)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header band */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-200 uppercase tracking-wider mb-1">Employee Payslip</p>
            <h2 className="text-xl font-bold">{slip.snapshot_employee_name || "Employee"}</h2>
            <p className="text-sm text-emerald-100 mt-0.5">
              {slip.snapshot_employee_id_no} · {slip.snapshot_department || "—"} · {slip.snapshot_position || "—"}
            </p>
            {/* Subsidiary / company entity */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {isSubsidiary ? (
                <Building className="w-3 h-3 text-emerald-300" />
              ) : (
                <Building2 className="w-3 h-3 text-emerald-300" />
              )}
              <span className="text-xs text-emerald-200">
                {isSubsidiary
                  ? `${entityName} (Subsidiary of ${slip.snapshot_company_name})`
                  : entityName}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">Pay Period</p>
            <p className="text-lg font-semibold">{fmtPeriod(slip.pay_period)}</p>
            <p className="text-xs text-emerald-200 mt-1">Pay Date: {fmtDate(slip.pay_date)}</p>
          </div>
        </div>
      </div>

      {/* Employee Info Grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-200">
        {[
          ["SSNIT Number",   slip.snapshot_ssnit_number],
          ["Bank",           slip.snapshot_bank_name],
          ["Account Number", slip.snapshot_account_number],
          ["Division",       slip.snapshot_division],
          ["Location",       slip.snapshot_location],
          ["Status",         slip.status],
        ].map(([label, val]) => (
          <div key={label} className="bg-white px-4 py-2.5">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{String(val || "—")}</p>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-5">
        {/* Earnings + Deductions side by side on wider screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Earnings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Earnings</h3>
            </div>
            <div className="space-y-1.5">
              {earnings.map(e => (
                <div key={e.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{e.label}</span>
                  <span className="text-sm font-medium text-gray-900">{money(e.val)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 mt-1 bg-emerald-50 rounded-lg px-3">
                <span className="text-sm font-bold text-emerald-800">Gross Pay</span>
                <span className="text-sm font-bold text-emerald-800">{money(slip.gross_pay)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Deductions</h3>
            </div>
            <div className="space-y-1.5">
              {deductions.map(d => (
                <div key={d.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{d.label}</span>
                  <span className="text-sm font-medium text-red-700">{money(d.val)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 mt-1 bg-red-50 rounded-lg px-3">
                <span className="text-sm font-bold text-red-800">Total Deductions</span>
                <span className="text-sm font-bold text-red-800">{money(slip.total_deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay Banner */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Net Pay</p>
            <p className="text-2xl font-bold text-white mt-0.5">{money(slip.net_pay)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Taxable Income</p>
            <p className="text-base font-semibold text-gray-200">{money(slip.paye_taxable_income)}</p>
          </div>
        </div>

        {/* Loan Summary */}
        {hasLoan && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider">Loan Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {loan && (
                <>
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs text-gray-400">Loan Type</p>
                    <p className="text-sm font-semibold text-gray-800">{loan.loan_type}</p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs text-gray-400">Principal</p>
                    <p className="text-sm font-semibold text-gray-800">{money(loan.principal)}</p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs text-gray-400">Monthly Payment</p>
                    <p className="text-sm font-semibold text-gray-800">{money(loan.monthly_payment)}</p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs text-gray-400">Amount Paid</p>
                    <p className="text-sm font-semibold text-emerald-700">{money(loan.amount_paid)}</p>
                  </div>
                </>
              )}
              <div className="bg-amber-100 rounded-lg px-3 py-2 border border-amber-200 col-span-1">
                <p className="text-xs text-amber-700">This Month Deducted</p>
                <p className="text-sm font-bold text-amber-900">{money(slip.loan_deduction)}</p>
              </div>
              <div className="bg-amber-100 rounded-lg px-3 py-2 border border-amber-200 col-span-1">
                <p className="text-xs text-amber-700">Remaining Balance</p>
                <p className="text-sm font-bold text-amber-900">{money(loan?.remaining_balance ?? slip.loan_balance)}</p>
              </div>
            </div>
            {loan && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-amber-700 mb-1">
                  <span>Repayment progress</span>
                  <span>{Math.min(100, Math.round(((loan.principal - loan.remaining_balance) / loan.principal) * 100))}%</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((loan.principal - loan.remaining_balance) / loan.principal) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* YTD Summary */}
        {(slip.ytd_gross > 0 || slip.ytd_net > 0) && (
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Year-to-Date Totals</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "YTD Gross", val: slip.ytd_gross, cls: "text-gray-900" },
                { label: "YTD Net",   val: slip.ytd_net,   cls: "text-emerald-700" },
                { label: "YTD PAYE",  val: slip.ytd_paye,  cls: "text-red-700" },
                { label: "YTD SSNIT", val: slip.ytd_ssnit, cls: "text-blue-700" },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-sm font-bold ${cls}`}>{money(val)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayslipsPage() {
  const supabase = createClient()
  const [companyId, setCompanyId] = useState("")
  const { toast } = useToast()

  // Global state
  const [activeTab, setActiveTab] = useState("individual")
  const [refreshKey, setRefreshKey] = useState(0)

  // Payroll runs — only periods that have been processed
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [loadingRuns, setLoadingRuns] = useState(true)

  // Individual tab state
  const [empSearch, setEmpSearch] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmps, setFilteredEmps] = useState<Employee[]>([])
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [indivSlip, setIndivSlip] = useState<PayslipRow | null>(null)
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null)
  const [loadingSlip, setLoadingSlip] = useState(false)
  const [recentSlips, setRecentSlips] = useState<PayslipRow[]>([])

  // Bulk tab state
  const [bulkPeriod, setBulkPeriod] = useState<string>("")
  const [bulkFilterType, setBulkFilterType] = useState<"department"|"division"|"location"|"subsidiary"|"company">("department")
  const [bulkFilterValue, setBulkFilterValue] = useState<string>("all")
  const [bulkSlips, setBulkSlips] = useState<PayslipRow[]>([])
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [loadingBulk, setLoadingBulk] = useState(false)
  const [bulkSearch, setBulkSearch] = useState("")

  // Custom tab state
  const [customPeriodFrom, setCustomPeriodFrom] = useState("")
  const [customPeriodTo, setCustomPeriodTo] = useState("")
  const [customEmpIds, setCustomEmpIds] = useState<Set<string>>(new Set())
  const [customNotes, setCustomNotes] = useState("")
  const [customSlips, setCustomSlips] = useState<PayslipRow[]>([])
  const [loadingCustom, setLoadingCustom] = useState(false)
  const [customLoaded, setCustomLoaded] = useState(false)

  // Filter lists
  const [departments, setDepartments] = useState<string[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [subsidiaries, setSubsidiaries] = useState<{ id: string; name: string }[]>([])

  // Stats
  const [stats, setStats] = useState({ totalIssued: 0, totalDraft: 0, latestPeriod: "" })

  // ── Period options — derived from real payroll runs ──
  const periodOptions = useMemo(() => {
    const seen = new Set<string>()
    return payrollRuns
      .map(r => {
        const p = periodFromDate(r.pay_period_start)
        if (seen.has(p)) return null
        seen.add(p)
        return { value: p, label: fmtPeriod(p), status: r.status }
      })
      .filter(Boolean) as { value: string; label: string; status: string }[]
  }, [payrollRuns])

  // ── Fetch payroll runs + reference data on mount / refresh ──
  useEffect(() => {
    void loadAll()
  }, [refreshKey])

  const loadAll = async () => {
    setLoadingRuns(true)
    try {
      const cid = companyId || (await resolveClientCompanyId())
      setCompanyId(cid)

      const [runsApi, empsApi, subsRes] = await Promise.all([
        fetch(`/api/payroll/runs?company_id=${encodeURIComponent(cid)}&limit=48`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/employees?company_id=${encodeURIComponent(cid)}&status=active&limit=2000`, {
          cache: "no-store",
          credentials: "include",
        }),
        supabase.from("subsidiaries").select("id, name").eq("company_id", cid).eq("status", "active"),
      ])

      const runsJson = await runsApi.json().catch(() => ({}))
      const empsJson = await empsApi.json().catch(() => ({}))

      const runs = (runsJson.runs ?? runsJson.data ?? []) as PayrollRun[]
      setPayrollRuns(runs)

      const emps = (empsJson.employees ?? empsJson.data ?? []) as Employee[]
      setEmployees(emps)
      setFilteredEmps(emps)

      const depts = [...new Set(emps.map((e) => e.department).filter(Boolean))].sort() as string[]
      const divs = [...new Set(emps.map((e) => e.division).filter(Boolean))].sort() as string[]
      const locs = [...new Set(emps.map((e) => e.location).filter(Boolean))].sort() as string[]
      setDepartments(depts)
      setDivisions(divs)
      setLocations(locs)
      setSubsidiaries((subsRes.data ?? []) as { id: string; name: string }[])

      if (runs.length > 0) {
        const firstPeriod = periodFromDate(runs[0].pay_period_start)
        setSelectedPeriod((prev) => prev || firstPeriod)
        setBulkPeriod((prev) => prev || firstPeriod)
        setCustomPeriodFrom((prev) => prev || firstPeriod)
      }

      void loadStats(cid)
    } catch (err) {
      toast({
        title: "Could not load payslips",
        description: err instanceof Error ? err.message : "Tenant resolve failed",
        variant: "destructive",
      })
      setPayrollRuns([])
      setEmployees([])
      setFilteredEmps([])
    } finally {
      setLoadingRuns(false)
    }
  }

  const loadStats = async (cid?: string) => {
    const company = cid || companyId
    if (!company) return
    // Scope stats via tenant runs → payslips for those runs only
    const runsRes = await fetch(`/api/payroll/runs?company_id=${encodeURIComponent(company)}&limit=100`, {
      cache: "no-store",
      credentials: "include",
    })
    const runsJson = await runsRes.json().catch(() => ({}))
    const runIds = ((runsJson.runs ?? runsJson.data ?? []) as any[]).map((r) => r.id).filter(Boolean)
    if (!runIds.length) {
      setStats({ totalIssued: 0, totalDraft: 0, latestPeriod: "" })
      return
    }
    const [issuedRes, draftRes, periodRes] = await Promise.all([
      supabase
        .from("payslips")
        .select("id", { count: "exact", head: true })
        .eq("status", "issued")
        .in("payroll_run_id", runIds),
      supabase
        .from("payslips")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
        .in("payroll_run_id", runIds),
      supabase
        .from("payslips")
        .select("pay_period")
        .in("payroll_run_id", runIds)
        .order("pay_period", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    setStats({
      totalIssued: issuedRes.count ?? 0,
      totalDraft: draftRes.count ?? 0,
      latestPeriod: (periodRes.data as any)?.pay_period ?? "",
    })
  }

  // ── Employee search filter ──
  useEffect(() => {
    if (!empSearch.trim()) {
      setFilteredEmps(employees)
    } else {
      const q = empSearch.toLowerCase()
      setFilteredEmps(employees.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
      ))
    }
  }, [empSearch, employees])

  // ── Load individual payslip ──
  const loadIndividualSlip = useCallback(async (empId: string, period: string) => {
    if (!empId || !period) return
    const cid = companyId || (await resolveClientCompanyId().catch(() => ""))
    if (cid && !companyId) setCompanyId(cid)
    setLoadingSlip(true)
    setIndivSlip(null)
    setActiveLoan(null)
    try {
      let slipQ = supabase
        .from("payslips")
        .select("*")
        .eq("employee_id", empId)
        .eq("pay_period", period)
        .order("created_at", { ascending: false })
        .limit(1)
      let loanQ = supabase
        .from("employee_loans")
        .select("*")
        .eq("employee_id", empId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
      let recentQ = supabase
        .from("payslips")
        .select("*")
        .eq("employee_id", empId)
        .order("pay_period", { ascending: false })
        .limit(8)
      if (cid) {
        slipQ = slipQ.eq("company_id", cid)
        loanQ = loanQ.eq("company_id", cid)
        recentQ = recentQ.eq("company_id", cid)
      }
      const [slipRes, loanRes, recentRes] = await Promise.all([
        slipQ.maybeSingle(),
        loanQ.maybeSingle(),
        recentQ,
      ])

      if (slipRes.data) setIndivSlip(slipRes.data as PayslipRow)
      if (loanRes.data) setActiveLoan(loanRes.data as ActiveLoan)
      setRecentSlips((recentRes.data ?? []) as PayslipRow[])
    } catch (err) {
      toast({ title: "Error", description: "Could not load payslip.", variant: "destructive" })
    } finally {
      setLoadingSlip(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    if (selectedEmpId && selectedPeriod) void loadIndividualSlip(selectedEmpId, selectedPeriod)
  }, [selectedEmpId, selectedPeriod])

  // ── Refresh handler (re-loads data then re-fetches current slip) ──
  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1)
    await loadStats()
    if (selectedEmpId && selectedPeriod) {
      await loadIndividualSlip(selectedEmpId, selectedPeriod)
    }
    if (activeTab === "bulk") {
      void loadBulkSlips()
    }
    toast({ title: "Refreshed", description: "Payslip data updated from database." })
  }, [selectedEmpId, selectedPeriod, activeTab])

  // ── Print individual payslip ──
  const printIndividualSlip = () => {
    if (!indivSlip?.id) return
    window.open(`/api/payslips/${indivSlip.id}/pdf`, "_blank", "noopener,noreferrer")
  }

  // ── Load bulk payslips ──
  const loadBulkSlips = useCallback(async () => {
    if (!bulkPeriod) return
    const cid = companyId || (await resolveClientCompanyId().catch(() => ""))
    if (cid && !companyId) setCompanyId(cid)
    if (!cid) {
      toast({ title: "Company required", description: "Unable to resolve your company.", variant: "destructive" })
      return
    }
    setLoadingBulk(true)
    setBulkSlips([])
    setBulkSelected(new Set())
    try {
      let query = supabase
        .from("payslips")
        .select("*")
        .eq("company_id", cid)
        .eq("pay_period", bulkPeriod)
        .order("snapshot_employee_name", { ascending: true })

      if (bulkFilterType === "department" && bulkFilterValue !== "all") {
        query = query.eq("snapshot_department", bulkFilterValue)
      } else if (bulkFilterType === "division" && bulkFilterValue !== "all") {
        query = query.eq("snapshot_division", bulkFilterValue)
      } else if (bulkFilterType === "location" && bulkFilterValue !== "all") {
        query = query.eq("snapshot_location", bulkFilterValue)
      }

      const { data, error } = await query.limit(500)
      if (error) throw error

      let slips = (data ?? []) as PayslipRow[]

      // Subsidiary / company filter — client-side, still tenant-scoped
      if (bulkFilterType === "subsidiary" && bulkFilterValue !== "all") {
        const { data: empIds } = await supabase
          .from("employees")
          .select("id")
          .eq("company_id", cid)
          .eq("subsidiary_id", bulkFilterValue)
        const ids = new Set((empIds ?? []).map((e: any) => e.id))
        slips = slips.filter((s) => ids.has(s.employee_id))
      } else if (bulkFilterType === "company") {
        const { data: empIds } = await supabase
          .from("employees")
          .select("id")
          .eq("company_id", cid)
          .is("subsidiary_id", null)
        const ids = new Set((empIds ?? []).map((e: any) => e.id))
        slips = slips.filter((s) => ids.has(s.employee_id))
      }

      setBulkSlips(slips)
      setBulkSelected(new Set(slips.map(s => s.id)))
    } catch (err) {
      toast({ title: "Error", description: "Failed to load payslips for bulk view.", variant: "destructive" })
    } finally {
      setLoadingBulk(false)
    }
  }, [bulkPeriod, bulkFilterType, bulkFilterValue, companyId, supabase, toast])

  useEffect(() => {
    if (activeTab === "bulk" && bulkPeriod) void loadBulkSlips()
  }, [activeTab, bulkPeriod, bulkFilterType, bulkFilterValue])

  // ── Bulk PDF download ──
  const downloadBulkPdf = async () => {
    const ids = [...bulkSelected]
    if (!ids.length) {
      toast({ title: "No payslips selected", description: "Select at least one payslip to download.", variant: "destructive" })
      return
    }
    const params = ids.map(id => `id=${id}`).join("&")
    window.open(`/api/payslips/bulk/pdf?${params}`, "_blank", "noopener,noreferrer")
    toast({ title: "PDF opened", description: `Opening ${ids.length} payslip(s). Use Print → Save as PDF.` })
  }

  // ── Load custom payslips ──
  const loadCustomSlips = async () => {
    if (!customPeriodFrom) {
      toast({ title: "Select a start period", variant: "destructive" })
      return
    }
    const cid = companyId || (await resolveClientCompanyId().catch(() => ""))
    if (cid && !companyId) setCompanyId(cid)
    if (!cid) {
      toast({ title: "Company required", description: "Unable to resolve your company.", variant: "destructive" })
      return
    }
    setLoadingCustom(true)
    setCustomLoaded(false)
    try {
      let query = supabase
        .from("payslips")
        .select("*")
        .eq("company_id", cid)
        .gte("pay_period", customPeriodFrom)
        .order("snapshot_employee_name", { ascending: true })

      if (customPeriodTo && customPeriodTo !== customPeriodFrom) {
        query = query.lte("pay_period", customPeriodTo)
      } else {
        query = query.lte("pay_period", customPeriodFrom)
      }

      if (customEmpIds.size > 0) query = query.in("employee_id", [...customEmpIds])

      const { data, error } = await query.limit(500)
      if (error) throw error
      setCustomSlips((data ?? []) as PayslipRow[])
      setCustomLoaded(true)
    } catch (err) {
      toast({ title: "Error", description: "Failed to load custom payslips.", variant: "destructive" })
    } finally {
      setLoadingCustom(false)
    }
  }

  // ── Filtered bulk slips ──
  const filteredBulkSlips = useMemo(() => {
    if (!bulkSearch.trim()) return bulkSlips
    const q = bulkSearch.toLowerCase()
    return bulkSlips.filter(s =>
      (s.snapshot_employee_name ?? "").toLowerCase().includes(q) ||
      (s.snapshot_employee_id_no ?? "").toLowerCase().includes(q) ||
      (s.snapshot_department ?? "").toLowerCase().includes(q)
    )
  }, [bulkSlips, bulkSearch])

  // ── Bulk filter value list ──
  const bulkFilterOptions = useMemo(() => {
    if (bulkFilterType === "department") return departments
    if (bulkFilterType === "division")   return divisions
    if (bulkFilterType === "location")   return locations
    return []
  }, [bulkFilterType, departments, divisions, locations])

  const selectedEmployee = employees.find(e => e.id === selectedEmpId)

  return (
    <div className="space-y-6 pb-10">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate, preview and download employee payslips by processed pay run</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingRuns}>
            {loadingRuns ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Issued Payslips",  value: stats.totalIssued,              icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Draft Payslips",   value: stats.totalDraft,               icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50" },
          { label: "Active Employees", value: employees.length,               icon: Users,        color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Pay Runs",         value: payrollRuns.length,             icon: Calendar,     color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Tabs ───────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-xl bg-gray-100">
          <TabsTrigger value="individual" className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            Bulk Generate
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* INDIVIDUAL TAB                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="individual" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: employee picker */}
            <div className="lg:col-span-1 space-y-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700">Select Employee</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Period selector — only shows periods with processed runs */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Pay Run Period</Label>
                    {loadingRuns ? (
                      <div className="flex items-center gap-2 h-8 text-xs text-gray-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading pay runs…
                      </div>
                    ) : periodOptions.length === 0 ? (
                      <div className="flex items-center gap-2 h-8 text-xs text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" /> No processed pay runs found
                      </div>
                    ) : (
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select pay run…" />
                        </SelectTrigger>
                        <SelectContent>
                          {periodOptions.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className="flex items-center gap-2">
                                {p.label}
                                <Badge className={`text-[10px] px-1.5 py-0 ${p.status === "completed" || p.status === "approved" || p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                  {p.status}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      placeholder="Search by name or ID..."
                      className="pl-8 h-8 text-sm"
                      value={empSearch}
                      onChange={e => setEmpSearch(e.target.value)}
                    />
                  </div>

                  {/* Employee list */}
                  <div className="max-h-80 overflow-y-auto space-y-1 scrollbar-thin">
                    {filteredEmps.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No employees found</p>
                    ) : filteredEmps.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmpId(emp.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedEmpId === emp.id
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "hover:bg-gray-50 border border-transparent text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-gray-400">{emp.employee_id} · {emp.department || "—"}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent payslips */}
              {recentSlips.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold text-gray-700">Recent Payslips</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-1.5">
                      {recentSlips.map(s => (
                        <div
                          key={s.id}
                          onClick={() => { setSelectedPeriod(s.pay_period); setSelectedEmpId(s.employee_id) }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-medium text-gray-700">{fmtPeriod(s.pay_period)}</p>
                            <p className="text-xs text-gray-400">{money(s.net_pay)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {statusBadge(s.status)}
                            <button
                              onClick={e => { e.stopPropagation(); window.open(`/api/payslips/${s.id}/pdf`, "_blank") }}
                              className="text-gray-400 hover:text-emerald-600"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: payslip preview */}
            <div className="lg:col-span-2">
              {!selectedEmpId ? (
                <div className="flex flex-col items-center justify-center h-full min-h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 py-12 px-6">
                  <FileText className="w-10 h-10 text-gray-300 mb-3" />
                  <h3 className="text-sm font-medium text-gray-500">No employee selected</h3>
                  <p className="text-xs text-gray-400 mt-1">Search and select an employee on the left to preview their payslip.</p>
                </div>
              ) : !selectedPeriod ? (
                <div className="flex flex-col items-center justify-center h-full min-h-64 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50 py-12 px-6">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
                  <h3 className="text-sm font-medium text-amber-700">No pay run available</h3>
                  <p className="text-xs text-amber-600 mt-1">Run payroll for a period first to view payslips.</p>
                </div>
              ) : loadingSlip ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                  <p className="text-sm text-gray-500">Loading payslip...</p>
                </div>
              ) : !indivSlip ? (
                <div className="flex flex-col items-center justify-center h-full min-h-64 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50 py-12 px-6">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
                  <h3 className="text-sm font-medium text-amber-700">No payslip found</h3>
                  <p className="text-xs text-amber-600 mt-1">
                    No payslip for <strong>{selectedEmployee?.first_name} {selectedEmployee?.last_name}</strong> in <strong>{fmtPeriod(selectedPeriod)}</strong>.
                    {periodOptions.length > 0 ? " This pay run did not include this employee." : " Run payroll for this period first."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusBadge(indivSlip.status)}
                      <span className="text-xs text-gray-400">
                        {selectedEmployee?.first_name} {selectedEmployee?.last_name} · {fmtPeriod(selectedPeriod)}
                      </span>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={printIndividualSlip}>
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print / PDF
                    </Button>
                  </div>
                  <PayslipPreview slip={indivSlip} loan={activeLoan} />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* BULK GENERATE TAB                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="bulk" className="mt-4 space-y-4">
          {/* Filter toolbar */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                {/* Group-by selector */}
                <div className="flex-1 min-w-40">
                  <Label className="text-xs text-gray-500 mb-1 block">Group By</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["department", "division", "location", "subsidiary", "company"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => { setBulkFilterType(t); setBulkFilterValue("all") }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          bulkFilterType === t
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        {t === "department"  && <Building2 className="w-3 h-3" />}
                        {t === "division"    && <Layers    className="w-3 h-3" />}
                        {t === "location"    && <MapPin    className="w-3 h-3" />}
                        {t === "subsidiary"  && <Globe     className="w-3 h-3" />}
                        {t === "company"     && <Building2 className="w-3 h-3" />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter value — shown for dept/div/loc/subsidiary (not "company" which is all-parent) */}
                {bulkFilterType !== "company" && (
                  <div className="min-w-48">
                    <Label className="text-xs text-gray-500 mb-1 block capitalize">{bulkFilterType}</Label>
                    <Select value={bulkFilterValue} onValueChange={setBulkFilterValue}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder={`All ${bulkFilterType}s`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {bulkFilterType}s</SelectItem>
                        {bulkFilterType === "subsidiary"
                          ? subsidiaries.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                          : bulkFilterOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Period — only from processed pay runs */}
                <div className="min-w-52">
                  <Label className="text-xs text-gray-500 mb-1 block">Pay Run Period</Label>
                  {periodOptions.length === 0 ? (
                    <div className="flex items-center gap-2 h-8 text-xs text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" /> No pay runs
                    </div>
                  ) : (
                    <Select value={bulkPeriod} onValueChange={setBulkPeriod}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select pay run…" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label} — {p.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button size="sm" variant="outline" onClick={loadBulkSlips} disabled={loadingBulk || !bulkPeriod} className="h-8">
                  {loadingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk results */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 px-4 pt-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {bulkSlips.length} payslip{bulkSlips.length !== 1 ? "s" : ""} — {bulkPeriod ? fmtPeriod(bulkPeriod) : "—"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {bulkSelected.size} selected · Net pay total: {money(bulkSlips.filter(s => bulkSelected.has(s.id)).reduce((sum, s) => sum + s.net_pay, 0))}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                  <Input className="pl-8 h-8 text-sm w-48" placeholder="Search..." value={bulkSearch} onChange={e => setBulkSearch(e.target.value)} />
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs"
                  onClick={() => setBulkSelected(bulkSelected.size === filteredBulkSlips.length ? new Set() : new Set(filteredBulkSlips.map(s => s.id)))}>
                  {bulkSelected.size === filteredBulkSlips.length ? <XSquare className="w-3.5 h-3.5 mr-1" /> : <CheckSquare2 className="w-3.5 h-3.5 mr-1" />}
                  {bulkSelected.size === filteredBulkSlips.length ? "Deselect All" : "Select All"}
                </Button>
                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={downloadBulkPdf} disabled={bulkSelected.size === 0}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download PDF ({bulkSelected.size})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {loadingBulk ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : !bulkPeriod ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">Select a pay run period above</p>
                </div>
              ) : filteredBulkSlips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No payslips found for this selection</p>
                  <p className="text-xs mt-1">Run payroll for this period first, or adjust the filter.</p>
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-10 pl-4 py-2"><span className="sr-only">Select</span></th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Employee</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Department</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Gross Pay</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Deductions</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Net Pay</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Loan</th>
                        <th className="w-10 pr-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBulkSlips.map(s => (
                        <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${bulkSelected.has(s.id) ? "bg-emerald-50/30" : ""}`}>
                          <td className="pl-4 py-2.5">
                            <Checkbox
                              checked={bulkSelected.has(s.id)}
                              onCheckedChange={checked => {
                                const next = new Set(bulkSelected)
                                checked ? next.add(s.id) : next.delete(s.id)
                                setBulkSelected(next)
                              }}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-gray-900">{s.snapshot_employee_name}</div>
                            <div className="text-xs text-gray-400">{s.snapshot_employee_id_no}</div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">{s.snapshot_department || "—"}</td>
                          <td className="py-2.5 px-3 text-right text-gray-700">{money(s.gross_pay)}</td>
                          <td className="py-2.5 px-3 text-right text-red-600">{money(s.total_deductions)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{money(s.net_pay)}</td>
                          <td className="py-2.5 px-3 text-center">{statusBadge(s.status)}</td>
                          <td className="py-2.5 px-3 text-center">
                            {s.loan_deduction > 0
                              ? <Badge className="bg-amber-100 text-amber-700 text-xs">{money(s.loan_deduction)}</Badge>
                              : <span className="text-xs text-gray-300">—</span>
                            }
                          </td>
                          <td className="pr-4 py-2.5 text-center">
                            <button onClick={() => window.open(`/api/payslips/${s.id}/pdf`, "_blank")} className="text-gray-400 hover:text-emerald-600 transition-colors">
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Footer summary */}
              {filteredBulkSlips.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex flex-wrap gap-6">
                  {[
                    { label: "Total Gross", val: filteredBulkSlips.reduce((s, r) => s + r.gross_pay, 0),       cls: "text-gray-800" },
                    { label: "Total PAYE",  val: filteredBulkSlips.reduce((s, r) => s + r.paye_tax, 0),        cls: "text-red-700" },
                    { label: "Total SSNIT", val: filteredBulkSlips.reduce((s, r) => s + r.ssnit_employee, 0),  cls: "text-blue-700" },
                    { label: "Total Loans", val: filteredBulkSlips.reduce((s, r) => s + r.loan_deduction, 0),  cls: "text-amber-700" },
                    { label: "Total Net",   val: filteredBulkSlips.reduce((s, r) => s + r.net_pay, 0),         cls: "text-emerald-700 font-bold" },
                  ].map(({ label, val, cls }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className={`text-sm ${cls}`}>{money(val)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CUSTOM TAB                                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Custom Payslip Generation
              </CardTitle>
              <CardDescription className="text-xs">Filter by pay run period range and specific employees for a tailored payslip batch.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">From Period</Label>
                  {periodOptions.length === 0 ? (
                    <div className="flex items-center gap-2 h-8 text-xs text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" /> No pay runs
                    </div>
                  ) : (
                    <Select value={customPeriodFrom} onValueChange={setCustomPeriodFrom}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {periodOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">To Period (optional)</Label>
                  <Select value={customPeriodTo} onValueChange={setCustomPeriodTo}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Same as from" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Same as from</SelectItem>
                      {periodOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-gray-500 mb-1 block">Custom Notes (printed on payslip footer)</Label>
                  <Input
                    placeholder="e.g. Bonus payrun for Q4 2025"
                    className="h-8 text-sm"
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-gray-500 mb-2 block">
                  Employees
                  <span className="ml-1 text-gray-400">({customEmpIds.size === 0 ? "All active employees" : `${customEmpIds.size} selected`})</span>
                </Label>
                <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 scrollbar-thin">
                  {employees.map(emp => (
                    <label key={emp.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer border text-xs transition-colors ${
                      customEmpIds.has(emp.id) ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}>
                      <Checkbox
                        checked={customEmpIds.has(emp.id)}
                        onCheckedChange={checked => {
                          const next = new Set(customEmpIds)
                          checked ? next.add(emp.id) : next.delete(emp.id)
                          setCustomEmpIds(next)
                        }}
                        className="w-3.5 h-3.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <span className="truncate">{emp.first_name} {emp.last_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 h-8"
                  onClick={loadCustomSlips}
                  disabled={loadingCustom || !customPeriodFrom}
                >
                  {loadingCustom ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Filter className="w-3.5 h-3.5 mr-1.5" />}
                  Generate List
                </Button>
                {customLoaded && customSlips.length > 0 && (
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => {
                      const ids = customSlips.map(s => `id=${s.id}`).join("&")
                      window.open(`/api/payslips/bulk/pdf?${ids}`, "_blank")
                    }}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download All PDF ({customSlips.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom results */}
          {customLoaded && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {customSlips.length} payslip{customSlips.length !== 1 ? "s" : ""} matched
                </CardTitle>
                {customSlips.length === 0 && (
                  <CardDescription className="text-xs text-amber-600">
                    No payslips found for the selected criteria. Ensure payroll has been run for this period.
                  </CardDescription>
                )}
              </CardHeader>
              {customSlips.length > 0 && (
                <CardContent className="px-0 pb-0">
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500">Employee</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Period</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Department</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Net Pay</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                          <th className="text-center py-2 px-4 text-xs font-semibold text-gray-500">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customSlips.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-4">
                              <div className="font-medium text-gray-900">{s.snapshot_employee_name}</div>
                              <div className="text-xs text-gray-400">{s.snapshot_employee_id_no}</div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 text-xs">{fmtPeriod(s.pay_period)}</td>
                            <td className="py-2.5 px-3 text-gray-600 text-xs">{s.snapshot_department || "—"}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{money(s.net_pay)}</td>
                            <td className="py-2.5 px-3 text-center">{statusBadge(s.status)}</td>
                            <td className="py-2.5 px-4 text-center">
                              <button onClick={() => window.open(`/api/payslips/${s.id}/pdf`, "_blank")} className="text-gray-400 hover:text-emerald-600">
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
