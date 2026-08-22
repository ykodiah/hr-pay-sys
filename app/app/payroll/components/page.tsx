"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BadgePercent,
  Banknote,
  Download,
  Gift,
  Loader2,
  Lock,
  MinusCircle,
  PiggyBank,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  BookOpen,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

const CATEGORIES = [
  { key: "allowance", label: "Allowances", icon: Plus, color: "from-teal-600 to-emerald-700" },
  { key: "deduction", label: "Deductions", icon: MinusCircle, color: "from-rose-600 to-red-700" },
  { key: "provident_fund", label: "Provident Fund", icon: PiggyBank, color: "from-slate-700 to-slate-900" },
  { key: "bonus", label: "Bonus", icon: Gift, color: "from-amber-600 to-orange-700" },
  { key: "backpay", label: "Backpay", icon: RotateCcw, color: "from-sky-600 to-cyan-700" },
] as const

type Category = (typeof CATEGORIES)[number]["key"]
type Employee = {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  department?: string
  location?: string
  division?: string
  position?: string
  job_title?: string
  subsidiary_id?: string
}

const currentPeriod = () => new Date().toISOString().slice(0, 7)

function baseForm(category: Category = "allowance") {
  const oneTime = category === "bonus" || category === "backpay"
  return {
    component_definition_id: "",
    code: "",
    name: "",
    description: "",
    calculation_type: "amount",
    calculation_basis: "basic_salary",
    amount: "",
    percentage: "",
    rate: "",
    quantity: "1",
    employer_amount: "",
    employer_percentage: "",
    min_amount: "",
    max_amount: "",
    currency_code: "GHS",
    frequency: oneTime ? "one_time" : "monthly",
    tax_treatment: category === "deduction" ? "post_tax" : category === "provident_fund" ? "tax_relief" : "taxable",
    pensionable: category === "provident_fund",
    proratable: category === "allowance",
    proration_method: "calendar_days",
    include_in_overtime_base: false,
    affects_gross_pay: category !== "deduction",
    employer_component: false,
    scope_type: "individual",
    scope_value: "",
    scope_values: [] as string[],
    employee_id: "",
    taxable: category !== "deduction" && category !== "provident_fund",
    recurring: !oneTime,
    end_period: "",
    source_period: category === "backpay" ? currentPeriod() : "",
    reason_code: category === "backpay" ? "PAY_CORRECTION" : "",
    payment_method: "with_payroll",
    pay_date: "",
    arrears_months: category === "backpay" ? "1" : "0",
    unit_of_measure: "amount",
    rounding_rule: "nearest_0_01",
    priority: "100",
    statutory_code: "",
    jurisdiction_code: "GH",
    payslip_label: "",
    display_on_payslip: true,
    ytd_cap: "",
    period_cap: "",
    contribution_tier: "",
    formula_expression: "",
    eligibility_notes: "",
    gl_debit_account: "",
    gl_credit_account: "",
    cost_center: "",
    project_code: "",
    external_reference: "",
    approval_status: "approved",
    override_reason: "",
    notes: "",
  }
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let value = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"'
        i += 1
      } else quoted = !quoted
    } else if (char === "," && !quoted) {
      values.push(value.trim())
      value = ""
    } else value += char
  }
  values.push(value.trim())
  return values
}

function employeeName(employee: Employee) {
  return `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
}

export default function PayrollComponentsPage() {
  const [category, setCategory] = useState<Category>("allowance")
  const [payPeriod, setPayPeriod] = useState(currentPeriod)
  const [data, setData] = useState<any>({
    assignments: [],
    employees: [],
    subsidiaries: [],
    definitions: [],
    imports: [],
    runs: [],
    period: { status: "open" },
    database_ready: true,
    category_counts: {
      allowance: 0,
      deduction: 0,
      provident_fund: 0,
      bonus: 0,
      backpay: 0,
    },
  })
  const [form, setForm] = useState(() => baseForm("allowance"))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingDefinition, setSavingDefinition] = useState(false)
  const [periodBusy, setPeriodBusy] = useState(false)
  const [backpayRunning, setBackpayRunning] = useState(false)
  const [csvEmployeeIds, setCsvEmployeeIds] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [csvFile, setCsvFile] = useState<{ name: string; size: number } | null>(null)
  const [csvErrors, setCsvErrors] = useState<Array<{ row: number; employee_id?: string; errors: string[] }>>([])
  const [templateDownloaded, setTemplateDownloaded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const closed = data.period?.status === "closed"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll/components?pay_period=${payPeriod}&category=${category}`, {
        cache: "no-store",
        credentials: "include",
      })
      const json = await res.json()
      if (!res.ok) {
        setData((current: any) => ({
          ...current,
          assignments: [],
          definitions: current.definitions || [],
          database_ready: json.setup_required ? false : current.database_ready,
          database_warnings: [json.error].filter(Boolean),
        }))
        throw new Error(json.error || "Could not load payroll assignments")
      }
      setData(json)
      if (json.catalogue_seeded) toast.success("Standard pay-component catalogue loaded from database")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [category, payPeriod])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setForm(baseForm(category))
    setCsvEmployeeIds([])
    setCsvRows([])
    setCsvFile(null)
    setCsvErrors([])
    setTemplateDownloaded(false)
  }, [category])

  const scopeOptions = useMemo(() => {
    if (form.scope_type === "subsidiary") {
      return (data.subsidiaries || []).map((row: any) => ({ value: row.id, label: row.name }))
    }
    if (form.scope_type === "job_title") {
      return [...new Set((data.employees || []).map((row: any) => row.position || row.job_title).filter(Boolean))]
        .sort()
        .map((value) => ({ value: String(value), label: String(value) }))
    }
    if (!["department", "location", "division"].includes(form.scope_type)) return []
    return [...new Set((data.employees || []).map((row: any) => row[form.scope_type]).filter(Boolean))]
      .sort()
      .map((value) => ({ value: String(value), label: String(value) }))
  }, [data.employees, data.subsidiaries, form.scope_type])

  const selectedScopeValues = useMemo(() => {
    if (Array.isArray(form.scope_values) && form.scope_values.length) return form.scope_values
    return form.scope_value ? [form.scope_value] : []
  }, [form.scope_value, form.scope_values])

  function toggleScopeValue(value: string) {
    const current = selectedScopeValues
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    setForm({ ...form, scope_values: next, scope_value: next.join("|") })
  }

  const separateBackpayCount = useMemo(
    () =>
      (data.assignments || []).filter(
        (row: any) =>
          row.category === "backpay" &&
          (row.payment_method === "separate_run" || row.backpay_treatment === "separate_run") &&
          row.approval_status === "approved",
      ).length,
    [data.assignments],
  )

  async function saveAssignment() {
    setSaving(true)
    try {
      if (form.scope_type === "csv" && !templateDownloaded && !csvFile) {
        throw new Error("Download the CSV template first, complete it, then upload")
      }
      const payload = {
        ...form,
        category,
        effective_period: payPeriod,
        scope_values: selectedScopeValues,
        scope_value: selectedScopeValues.join("|"),
        employee_ids: form.scope_type === "csv" ? csvEmployeeIds : undefined,
        rows: form.scope_type === "csv" ? csvRows : undefined,
        file_name: csvFile?.name,
        file_size_bytes: csvFile?.size,
      }
      const res = await fetch("/api/payroll/components", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        if (Array.isArray(json.errors)) setCsvErrors(json.errors)
        throw new Error(json.error || "Assignment failed")
      }
      toast.success(`${json.assigned} employee${json.assigned === 1 ? "" : "s"} assigned`)
      setForm(baseForm(category))
      setCsvEmployeeIds([])
      setCsvRows([])
      setCsvFile(null)
      setCsvErrors([])
      await load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveDefinition() {
    setSavingDefinition(true)
    try {
      const res = await fetch("/api/payroll/components", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category, record_type: "definition" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not save catalogue item")
      toast.success("Component saved to catalogue")
      await load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSavingDefinition(false)
    }
  }

  async function removeAssignment(id: string) {
    const res = await fetch("/api/payroll/components", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error || "Could not remove assignment")
    toast.success("Assignment removed")
    await load()
  }

  async function updatePeriod(action: "close" | "reopen") {
    const notes =
      action === "reopen"
        ? window.prompt("Enter the audit reason for reopening this payroll period:")
        : window.prompt("Optional close note for the payroll audit:")
    if (action === "reopen" && !notes?.trim()) return
    setPeriodBusy(true)
    try {
      const res = await fetch("/api/payroll/periods", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pay_period: payPeriod, action, notes: notes?.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Could not ${action} period`)
      toast.success(json.message || (action === "close" ? "Period closed and snapshots created" : "Period reopened"))
      await load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setPeriodBusy(false)
    }
  }

  async function runSeparateBackpay() {
    setBackpayRunning(true)
    try {
      const res = await fetch("/api/payroll/backpay/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pay_period: payPeriod }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Backpay run failed")
      toast.success(`${json.employee_count} employee backpay run sent for approval`)
      await load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBackpayRunning(false)
    }
  }

  async function readCsv(file?: File) {
    if (!file) return
    if (!templateDownloaded) {
      toast.message("Tip: download the controlled template first so every enterprise field is present")
    }
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"))
    const headers = parseCsvLine(lines.shift() || "").map((h) => h.trim().toLowerCase())
    const codeIndex = headers.findIndex((h) => ["employee_id", "employee_code", "staff_id"].includes(h))
    if (codeIndex < 0) return toast.error("CSV requires an employee_id column")
    const parsedRows = lines.map((line) => {
      const values = parseCsvLine(line)
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
    })
    const codes = parsedRows.map((row) => row.employee_id || row.employee_code || row.staff_id).filter(Boolean)
    const codeSet = new Set(codes.map((code) => code.toLowerCase()))
    const ids = (data.employees || [])
      .filter((employee: Employee) => codeSet.has(String(employee.employee_id).toLowerCase()))
      .map((employee: Employee) => employee.id)
    setCsvEmployeeIds(ids)
    setCsvRows(parsedRows)
    setCsvFile({ name: file.name, size: file.size })
    setCsvErrors([])
    toast.success(`${ids.length} of ${codes.length} CSV employees matched`)
  }

  function applyDefinition(id: string) {
    const definition = (data.definitions || []).find((row: any) => row.id === id)
    if (!definition) {
      setForm(baseForm(category))
      return
    }
    setForm({
      ...baseForm(category),
      component_definition_id: definition.id,
      code: definition.code || "",
      name: definition.name || "",
      description: definition.description || "",
      calculation_type: definition.calculation_type || "amount",
      calculation_basis: definition.calculation_basis || "basic_salary",
      amount: String(definition.default_amount || ""),
      percentage: String(definition.default_percentage || ""),
      rate: String(definition.default_rate || ""),
      currency_code: definition.currency_code || "GHS",
      frequency: definition.frequency || baseForm(category).frequency,
      recurring: definition.frequency !== "one_time",
      tax_treatment: definition.tax_treatment || "taxable",
      taxable: definition.tax_treatment === "taxable",
      pensionable: Boolean(definition.pensionable),
      proratable: Boolean(definition.proratable),
      include_in_overtime_base: Boolean(definition.include_in_overtime_base),
      affects_gross_pay: definition.affects_gross_pay !== false,
      employer_component: Boolean(definition.employer_component),
      min_amount: definition.min_amount == null ? "" : String(definition.min_amount),
      max_amount: definition.max_amount == null ? "" : String(definition.max_amount),
      gl_debit_account: definition.gl_debit_account || "",
      gl_credit_account: definition.gl_credit_account || "",
      cost_center: definition.cost_center || "",
      unit_of_measure: definition.unit_of_measure || "amount",
      rounding_rule: definition.rounding_rule || "nearest_0_01",
      priority: String(definition.priority || definition.display_order || 100),
      statutory_code: definition.statutory_code || "",
      jurisdiction_code: definition.jurisdiction_code || "GH",
      payslip_label: definition.payslip_label || definition.name || "",
      display_on_payslip: definition.display_on_payslip !== false,
      ytd_cap: definition.ytd_cap == null ? "" : String(definition.ytd_cap),
      period_cap: definition.period_cap == null ? "" : String(definition.period_cap),
      contribution_tier: definition.contribution_tier || "",
      formula_expression: definition.formula_expression || "",
      eligibility_notes: definition.eligibility_notes || "",
    })
  }

  const activeCategory = CATEGORIES.find((item) => item.key === category)!
  const ActiveIcon = activeCategory.icon
  const templateHref = `/api/payroll/components/template?category=${category}&pay_period=${payPeriod}`

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_left,_#ecfdf5,_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 md:p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-teal-200">
            <Banknote className="h-4 w-4" /> Enterprise payroll configuration
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pay components</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Catalogue-driven earnings and deductions with effective dating, tax treatment, employer shares, GL coding,
            CSV bulk assign, period locks, and off-cycle backpay — aligned with modern payroll systems.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white/10 p-3">
          <div>
            <Label htmlFor="period" className="text-xs text-slate-300">Payroll period</Label>
            <Input id="period" type="month" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} className="mt-1 bg-white text-slate-950" />
          </div>
          <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button
            variant={closed ? "outline" : "destructive"}
            disabled={periodBusy || loading}
            onClick={() => updatePeriod(closed ? "reopen" : "close")}
          >
            {periodBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {closed ? "Reopen period" : "Close period"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
          const activeCount = Number(data.category_counts?.[key] ?? 0)
          return (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`rounded-lg border px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              category === key ? "border-teal-500 bg-white ring-2 ring-teal-100" : "border-slate-200 bg-white/90"
            }`}
          >
            <span className={`mb-2 inline-flex rounded-md bg-gradient-to-br ${color} p-1.5 text-white`}><Icon className="h-4 w-4" /></span>
            <span className="block text-sm font-semibold text-slate-900">{label}</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {loading ? "…" : `${activeCount} active`}
            </span>
          </button>
          )
        })}
      </div>

      {!loading && data.database_ready === false && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <p className="font-semibold text-red-950">Payroll database setup is incomplete</p>
            <p className="mt-1 text-sm text-red-800">
              Run <code className="rounded bg-red-100 px-1">scripts/20260820_payroll_and_attendance_complete.sql</code> in
              Supabase SQL Editor (or <code className="rounded bg-red-100 px-1">npm run db:migrate:payroll</code>), then reload.
            </p>
          </CardContent>
        </Card>
      )}

      {(data.database_warnings || []).length > 0 && data.database_ready !== false && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            {(data.database_warnings || []).map((warning: string) => <p key={warning}>{warning}</p>)}
          </CardContent>
        </Card>
      )}

      <Card className="border-teal-200 bg-white/95 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4 text-teal-700" /> CSV template (download before upload)</CardTitle>
          <CardDescription>
            Download the controlled template for <strong>{activeCategory.label}</strong> / {payPeriod}. It includes every
            active employee ID and all enterprise fields. Complete it offline, then assign via Bulk CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="default" className="bg-teal-700 hover:bg-teal-800" onClick={() => setTemplateDownloaded(true)}>
            <a href={templateHref}><Download className="mr-2 h-4 w-4" /> Download {category.replace("_", " ")} CSV template</a>
          </Button>
          <Button variant="outline" onClick={() => { setForm({ ...form, scope_type: "csv" }); setTemplateDownloaded(true) }}>
            Then upload completed file
          </Button>
          {templateDownloaded && <span className="self-center text-xs font-medium text-teal-700">Template downloaded — ready for upload</span>}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-slate-200 bg-white/90"><CardContent className="space-y-3 p-4"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          [
            ["Active assignments", (data.assignments || []).length],
            ["Catalogue codes", (data.definitions || []).length],
            ["Employees available", (data.employees || []).length],
            ["Period status", closed ? "Closed" : "Open"],
          ].map(([label, value]) => (
            <Card key={String(label)} className="border-slate-200 bg-white/90">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {closed && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-amber-950">{payPeriod} is closed and locked</p>
              <p className="text-sm text-amber-800">Download immutable category snapshots used for audit and reconciliation.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...CATEGORIES.map((c) => c.key), "payroll"].map((key) => (
                <Button key={key} size="sm" variant="outline" asChild>
                  <a href={`/api/payroll/periods?pay_period=${payPeriod}&category=${key}&download=csv`}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> {key.replace("_", " ")}
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[560px_1fr]">
        <Card className="h-fit border-0 shadow-lg">
          <CardHeader className={`rounded-t-xl bg-gradient-to-r ${activeCategory.color} text-white`}>
            <CardTitle className="flex items-center gap-2"><ActiveIcon className="h-5 w-5" /> Configure {activeCategory.label}</CardTitle>
            <CardDescription className="text-white/85">
              {category === "allowance" && "Configure taxable/non-taxable earnings, proration and payslip labels."}
              {category === "deduction" && "Configure employee deductions such as welfare, union and garnishment (loans remain on the Loans module)."}
              {category === "provident_fund" && "Configure employee/employer PF and Tier 3 contribution rates."}
              {category === "bonus" && "Configure one-time or periodic bonuses and commission awards."}
              {category === "backpay" && "Configure retroactive corrections with source period and payroll treatment."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {loading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-40 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <Label>Component catalogue (from database)</Label>
                  <Select value={form.component_definition_id || "custom"} onValueChange={(value) => applyDefinition(value === "custom" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Select a wage type / earning code" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Create a new component code</SelectItem>
                      {(data.definitions || []).map((definition: any) => (
                        <SelectItem key={definition.id} value={definition.id}>{definition.code} — {definition.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(data.definitions || []).length} active codes loaded{data.catalogue_seeded ? " (standard pack seeded)" : ""}.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. TRANS" /></div>
                  <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Transport Allowance" /></div>
                </div>
                <div><Label>Payslip label</Label><Input value={form.payslip_label} onChange={(e) => setForm({ ...form, payslip_label: e.target.value })} placeholder="Shown on employee payslip" /></div>
                <div><Label>Description / policy</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Business purpose, eligibility, and payroll policy notes" /></div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Calculation type</Label>
                    <Select value={form.calculation_type} onValueChange={(value) => setForm({ ...form, calculation_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Fixed amount</SelectItem>
                        <SelectItem value="percentage">Percentage of basis</SelectItem>
                        <SelectItem value="rate_x_quantity">Rate × quantity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Calculation basis</Label>
                    <Select value={form.calculation_basis} onValueChange={(value) => setForm({ ...form, calculation_basis: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic_salary">Basic salary</SelectItem>
                        <SelectItem value="gross_pay">Gross pay</SelectItem>
                        <SelectItem value="taxable_pay">Taxable pay</SelectItem>
                        <SelectItem value="fixed">Fixed value</SelectItem>
                        <SelectItem value="custom">Custom / formula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {form.calculation_type === "amount" && <div><Label>Employee amount</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>}
                  {form.calculation_type === "percentage" && <div><Label>Employee %</Label><Input type="number" min="0" step="0.01" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} /></div>}
                  {form.calculation_type === "rate_x_quantity" && (
                    <>
                      <div><Label>Rate</Label><Input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div>
                      <div><Label>Quantity / units</Label><Input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                    </>
                  )}
                  <div><Label>Currency</Label><Input maxLength={3} value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })} /></div>
                  <div><Label>Unit of measure</Label>
                    <Select value={form.unit_of_measure} onValueChange={(value) => setForm({ ...form, unit_of_measure: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {category === "provident_fund" && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <Label>Contribution tier</Label>
                      <Select value={form.contribution_tier || "employee"} onValueChange={(value) => setForm({ ...form, contribution_tier: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="employer">Employer</SelectItem>
                          <SelectItem value="tier3">Tier 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Statutory code</Label>
                      <Input value={form.statutory_code} onChange={(e) => setForm({ ...form, statutory_code: e.target.value })} placeholder="PF-EE / TIER3" />
                    </div>
                  </div>
                )}

                {(category === "bonus" || category === "allowance") && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    {category === "bonus"
                      ? "Bonus defaults to one-time payment. Change frequency only when the award repeats."
                      : "Allowances default to monthly recurring earnings and can be prorated for mid-period joiners."}
                  </div>
                )}

                <div>
                  <Label>Assign to</Label>
                  <Select value={form.scope_type} onValueChange={(value) => { setForm({ ...form, scope_type: value, scope_value: "", scope_values: [], employee_id: "" }); setCsvEmployeeIds([]) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_employees">All Employees</SelectItem>
                      <SelectItem value="individual">Individual employee</SelectItem>
                      <SelectItem value="csv">Bulk CSV upload</SelectItem>
                      <SelectItem value="job_title">Job Title</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="division">Division</SelectItem>
                      <SelectItem value="subsidiary">Subsidiary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.scope_type === "all_employees" && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    This will assign <strong>{activeCategory.label}</strong> to all {(data.employees || []).length} active employees for {payPeriod}.
                  </div>
                )}

                {form.scope_type === "individual" && (
                  <Select value={form.employee_id} onValueChange={(value) => setForm({ ...form, employee_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                    <SelectContent>
                      {(data.employees || []).map((employee: Employee) => (
                        <SelectItem key={employee.id} value={employee.id}>{employee.employee_id} — {employeeName(employee)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {form.scope_type === "csv" && (
                  <div className="space-y-3 rounded-lg border border-teal-200 bg-teal-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-teal-950">1. Download template</p>
                        <p className="text-xs text-teal-800">Includes employee IDs and all supported fields.</p>
                      </div>
                      <Button variant="outline" size="sm" asChild onClick={() => setTemplateDownloaded(true)}>
                        <a href={templateHref}><Download className="mr-1.5 h-4 w-4" /> Download</a>
                      </Button>
                    </div>
                    <div className="border-t border-teal-200 pt-3 text-center">
                      <p className="mb-2 text-sm font-semibold text-teal-950">2. Upload completed file</p>
                      <input ref={fileRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => void readCsv(e.target.files?.[0])} />
                      <Upload className="mx-auto mb-2 h-6 w-6 text-teal-700" />
                      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose CSV</Button>
                      <p className="mt-2 text-xs text-slate-600">
                        {csvFile ? `${csvFile.name} · ${csvRows.length} rows · ${csvEmployeeIds.length} matched` : "Upload only the completed template"}
                      </p>
                    </div>
                    {csvErrors.length > 0 && (
                      <div className="max-h-36 overflow-auto rounded-md bg-red-50 p-2 text-left text-xs text-red-800">
                        {csvErrors.slice(0, 20).map((error) => (
                          <p key={`${error.row}-${error.employee_id}`}>Row {error.row} ({error.employee_id || "blank"}): {error.errors.join("; ")}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {scopeOptions.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Label className="capitalize">Choose {form.scope_type === "job_title" ? "job title" : form.scope_type.replaceAll("_", " ")} (multi-select)</Label>
                      <span className="text-xs text-slate-500">{selectedScopeValues.length} selected</span>
                    </div>
                    <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                      {scopeOptions.map((option: { value: string; label: string }) => {
                        const checked = selectedScopeValues.includes(option.value)
                        return (
                          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-1.5 text-sm hover:bg-teal-50">
                            <Checkbox checked={checked} onCheckedChange={() => toggleScopeValue(option.value)} />
                            <span>{option.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {category === "backpay" && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <div><Label>Source period</Label><Input type="month" value={form.source_period} onChange={(e) => setForm({ ...form, source_period: e.target.value })} /></div>
                    <div>
                      <Label>Reason</Label>
                      <Select value={form.reason_code} onValueChange={(value) => setForm({ ...form, reason_code: value })}>
                        <SelectTrigger><SelectValue placeholder="Choose reason" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAY_CORRECTION">Pay correction</SelectItem>
                          <SelectItem value="LATE_INCREASE">Late salary increase</SelectItem>
                          <SelectItem value="MISSED_EARNING">Missed earning</SelectItem>
                          <SelectItem value="PROMOTION">Promotion adjustment</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Payroll treatment</Label>
                      <Select value={form.payment_method} onValueChange={(value) => setForm({ ...form, payment_method: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="with_payroll">Include in regular payroll (default)</SelectItem>
                          <SelectItem value="separate_run">Separate off-cycle run</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Pay date</Label><Input type="date" value={form.pay_date} onChange={(e) => setForm({ ...form, pay_date: e.target.value })} /></div>
                    <div><Label>Arrears months</Label><Input type="number" min="0" value={form.arrears_months} onChange={(e) => setForm({ ...form, arrears_months: e.target.value })} /></div>
                    <div className="col-span-2 text-xs text-sky-900">
                      Default is include-in-period. Choose separate run, then use “Create separate backpay run”.
                      {separateBackpayCount ? ` ${separateBackpayCount} approved separate-run entries ready.` : ""}
                    </div>
                  </div>
                )}

                <details open className="rounded-lg border bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Tax, frequency and effective dating</summary>
                  <div className="grid grid-cols-2 gap-3 border-t p-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select value={form.frequency} onValueChange={(value) => setForm({ ...form, frequency: value, recurring: value !== "one_time" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One time</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="per_payroll">Every payroll</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tax treatment</Label>
                      <Select value={form.tax_treatment} onValueChange={(value) => setForm({ ...form, tax_treatment: value, taxable: value === "taxable" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="taxable">Taxable</SelectItem>
                          <SelectItem value="non_taxable">Non-taxable</SelectItem>
                          <SelectItem value="tax_relief">Tax relief</SelectItem>
                          <SelectItem value="post_tax">Post-tax deduction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>End period</Label><Input type="month" value={form.end_period} onChange={(e) => setForm({ ...form, end_period: e.target.value })} /></div>
                    <div>
                      <Label>Proration method</Label>
                      <Select value={form.proration_method} onValueChange={(value) => setForm({ ...form, proration_method: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="calendar_days">Calendar days</SelectItem>
                          <SelectItem value="working_days">Working days</SelectItem>
                          <SelectItem value="none">No proration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rounding</Label>
                      <Select value={form.rounding_rule} onValueChange={(value) => setForm({ ...form, rounding_rule: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nearest_0_01">Nearest 0.01</SelectItem>
                          <SelectItem value="round_up">Round up</SelectItem>
                          <SelectItem value="round_down">Round down</SelectItem>
                          <SelectItem value="bankers">Banker’s rounding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Priority / sequence</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
                    {(
                      category === "allowance"
                        ? ([["pensionable", "Pensionable"], ["proratable", "Proratable"], ["include_in_overtime_base", "Include in OT base"], ["affects_gross_pay", "Affects gross pay"], ["display_on_payslip", "Show on payslip"]] as const)
                        : category === "deduction"
                          ? ([["affects_gross_pay", "Affects gross pay"], ["display_on_payslip", "Show on payslip"]] as const)
                          : category === "provident_fund"
                            ? ([["pensionable", "Pensionable"], ["employer_component", "Employer component"], ["display_on_payslip", "Show on payslip"]] as const)
                            : category === "bonus"
                              ? ([["affects_gross_pay", "Affects gross pay"], ["display_on_payslip", "Show on payslip"]] as const)
                              : ([["affects_gross_pay", "Affects gross pay"], ["display_on_payslip", "Show on payslip"]] as const)
                    ).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-md bg-slate-50 p-2">
                        <Label>{label}</Label>
                        <Switch checked={Boolean((form as any)[key])} onCheckedChange={(checked) => setForm({ ...form, [key]: checked })} />
                      </div>
                    ))}
                  </div>
                </details>
<div className="grid gap-2 sm:grid-cols-2">
                  <Button variant="outline" disabled={savingDefinition || !form.code || !form.name} onClick={() => void saveDefinition()}>
                    {savingDefinition ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    Save to catalogue
                  </Button>
                  <Button className="bg-slate-950 hover:bg-slate-800" disabled={closed || saving} onClick={() => void saveAssignment()}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgePercent className="mr-2 h-4 w-4" />}
                    {closed ? "Period locked" : `Assign ${activeCategory.label}`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{activeCategory.label} for {payPeriod}</CardTitle>
                <CardDescription>Active assignments for this category and payroll period. Group and CSV batches expand to individual employee rows.</CardDescription>
              </div>
              {category === "backpay" && (
                <Button onClick={() => void runSeparateBackpay()} disabled={closed || backpayRunning || separateBackpayCount === 0}>
                  {backpayRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create separate backpay run ({separateBackpayCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
                <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading assignments from database…
                </div>
              </div>
            ) : !(data.assignments || []).length ? (
              <div className="p-16 text-center text-sm text-muted-foreground">
                No {activeCategory.label.toLowerCase()} assigned for this period yet. Pick a catalogue code or download the CSV template to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Tax / frequency</TableHead>
                      <TableHead>Effective</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assignments.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium">{employeeName(row.employee || {})}</p>
                          <p className="text-xs text-muted-foreground">{row.employee?.employee_id}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{row.payslip_label || row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.code}{row.priority != null ? ` · #${row.priority}` : ""}</p>
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.calculation_type === "percentage"
                            ? `${row.percentage}% of ${String(row.calculation_basis || "basic salary").replaceAll("_", " ")}`
                            : row.calculation_type === "rate_x_quantity"
                              ? `${row.currency_code || "GHS"} ${Number(row.rate).toLocaleString()} × ${row.quantity}`
                              : `${row.currency_code || "GHS"} ${Number(row.amount).toLocaleString()}`}
                        </TableCell>
                        <TableCell>
                          <p className="capitalize">{String(row.tax_treatment || (row.taxable ? "taxable" : "non taxable")).replaceAll("_", " ")}</p>
                          <p className="text-xs capitalize text-muted-foreground">{row.frequency || (row.recurring ? "monthly" : "one time")}</p>
                        </TableCell>
                        <TableCell>
                          <p>{row.effective_period}</p>
                          <p className="text-xs text-muted-foreground">{row.end_period ? `to ${row.end_period}` : "Open-ended"}</p>
                        </TableCell>
                        <TableCell className="text-xs capitalize">
                          {row.category === "backpay"
                            ? String(row.payment_method || row.backpay_treatment || "with_payroll").replaceAll("_", " ")
                            : "—"}
                        </TableCell>
                        <TableCell className="capitalize">{String(row.source_scope_type || "").replaceAll("_", " ")}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                            {row.approval_status || row.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" disabled={closed || row.status !== "active"} onClick={() => void removeAssignment(row.id)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
