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
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const CATEGORIES = [
  { key: "allowance", label: "Allowances", icon: Plus, color: "from-emerald-500 to-teal-600" },
  { key: "deduction", label: "Deductions", icon: MinusCircle, color: "from-rose-500 to-red-600" },
  { key: "provident_fund", label: "Provident Fund", icon: PiggyBank, color: "from-indigo-500 to-violet-600" },
  { key: "bonus", label: "Bonus", icon: Gift, color: "from-amber-500 to-orange-600" },
  { key: "backpay", label: "Backpay", icon: RotateCcw, color: "from-sky-500 to-blue-600" },
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
  subsidiary_id?: string
}

const currentPeriod = () => new Date().toISOString().slice(0, 7)
const initialForm = {
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
  frequency: "monthly",
  tax_treatment: "taxable",
  pensionable: false,
  proratable: false,
  proration_method: "calendar_days",
  include_in_overtime_base: false,
  scope_type: "individual",
  scope_value: "",
  employee_id: "",
  taxable: true,
  recurring: true,
  end_period: "",
  source_period: "",
  reason_code: "",
  payment_method: "with_payroll",
  pay_date: "",
  gl_debit_account: "",
  gl_credit_account: "",
  cost_center: "",
  project_code: "",
  external_reference: "",
  approval_status: "approved",
  notes: "",
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

export default function PayrollComponentsPage() {
  const [category, setCategory] = useState<Category>("allowance")
  const [payPeriod, setPayPeriod] = useState(currentPeriod)
  const [data, setData] = useState<any>({ assignments: [], employees: [], subsidiaries: [], period: { status: "open" } })
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [periodBusy, setPeriodBusy] = useState(false)
  const [backpayRunning, setBackpayRunning] = useState(false)
  const [csvEmployeeIds, setCsvEmployeeIds] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [csvFile, setCsvFile] = useState<{ name: string; size: number } | null>(null)
  const [csvErrors, setCsvErrors] = useState<Array<{ row: number; employee_id?: string; errors: string[] }>>([])
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
          database_ready: json.setup_required ? false : current.database_ready,
          database_warnings: [json.error].filter(Boolean),
        }))
        throw new Error(json.error || "Could not load payroll assignments")
      }
      setData(json)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [category, payPeriod])

  useEffect(() => {
    void load()
  }, [load])

  const scopeOptions = useMemo(() => {
    if (form.scope_type === "subsidiary") {
      return (data.subsidiaries || []).map((row: any) => ({ value: row.id, label: row.name }))
    }
    if (!["department", "location", "division"].includes(form.scope_type)) return []
    return [...new Set((data.employees || []).map((row: any) => row[form.scope_type]).filter(Boolean))]
      .sort()
      .map((value) => ({ value: String(value), label: String(value) }))
  }, [data.employees, data.subsidiaries, form.scope_type])

  async function saveAssignment() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        category,
        effective_period: payPeriod,
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
      setForm(initialForm)
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
    setPeriodBusy(true)
    try {
      const res = await fetch("/api/payroll/periods", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pay_period: payPeriod, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Could not ${action} period`)
      toast.success(action === "close" ? "Period closed and audit snapshots created" : "Period reopened")
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
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBackpayRunning(false)
    }
  }

  async function readCsv(file?: File) {
    if (!file) return
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
      setForm({ ...initialForm, component_definition_id: "" })
      return
    }
    setForm({
      ...form,
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
      frequency: definition.frequency || "monthly",
      recurring: definition.frequency !== "one_time",
      tax_treatment: definition.tax_treatment || "taxable",
      taxable: definition.tax_treatment === "taxable",
      pensionable: Boolean(definition.pensionable),
      proratable: Boolean(definition.proratable),
      include_in_overtime_base: Boolean(definition.include_in_overtime_base),
      min_amount: definition.min_amount == null ? "" : String(definition.min_amount),
      max_amount: definition.max_amount == null ? "" : String(definition.max_amount),
      gl_debit_account: definition.gl_debit_account || "",
      gl_credit_account: definition.gl_credit_account || "",
      cost_center: definition.cost_center || "",
    })
  }

  const activeCategory = CATEGORIES.find((item) => item.key === category)!
  const ActiveIcon = activeCategory.icon

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 p-4 md:p-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-slate-950 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-indigo-200">
            <Banknote className="h-4 w-4" /> Payroll configuration
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">Pay components</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Assign earnings and deductions individually, by CSV, or by organisation group. Employee cards update automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white/10 p-3">
          <div>
            <Label htmlFor="period" className="text-xs text-slate-300">Payroll period</Label>
            <Input id="period" type="month" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} className="mt-1 bg-white text-slate-950" />
          </div>
          <Button
            variant={closed ? "outline" : "destructive"}
            disabled={periodBusy}
            onClick={() => updatePeriod(closed ? "reopen" : "close")}
          >
            {periodBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {closed ? "Reopen period" : "Close period"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              category === key ? "border-indigo-400 bg-white ring-2 ring-indigo-100" : "border-slate-200 bg-white/80"
            }`}
          >
            <span className={`mb-3 inline-flex rounded-lg bg-gradient-to-br ${color} p-2 text-white`}><Icon className="h-5 w-5" /></span>
            <span className="block font-semibold text-slate-900">{label}</span>
          </button>
        ))}
      </div>

      {!loading && data.database_ready === false && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <p className="font-semibold text-red-950">Payroll database setup is incomplete</p>
            <p className="mt-1 text-sm text-red-800">
              Apply migrations 20260820170000 and 20260820210000. Entries cannot be safely stored until all component, period and import tables are available.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Active assignments", (data.assignments || []).filter((row: any) => row.status === "active").length],
          ["Component codes", (data.definitions || []).length],
          ["Employees available", (data.employees || []).length],
          ["Recent imports", (data.imports || []).length],
        ].map(([label, value]) => (
          <Card key={String(label)} className="border-slate-200 bg-white/90">
            <CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {closed && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-amber-950">{payPeriod} is closed</p>
              <p className="text-sm text-amber-800">Entries are locked. Download the exact category snapshots used for audit.</p>
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

      <div className="grid gap-6 xl:grid-cols-[500px_1fr]">
        <Card className="h-fit border-0 shadow-lg">
          <CardHeader className={`rounded-t-xl bg-gradient-to-r ${activeCategory.color} text-white`}>
            <CardTitle className="flex items-center gap-2"><ActiveIcon className="h-5 w-5" /> Add {activeCategory.label}</CardTitle>
            <CardDescription className="text-white/80">Changes save directly to the tenant payroll database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label>Component catalogue</Label>
              <Select value={form.component_definition_id || "custom"} onValueChange={(value) => applyDefinition(value === "custom" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Select an existing payroll code" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Create a new component code</SelectItem>
                  {(data.definitions || []).map((definition: any) => (
                    <SelectItem key={definition.id} value={definition.id}>{definition.code} — {definition.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Catalogue values load from the database and can be overridden for this assignment.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. TRANS" /></div>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Transport" /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Purpose and payroll policy for this component" /></div>
            <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Calculation</Label>
              <Select value={form.calculation_type} onValueChange={(value) => setForm({ ...form, calculation_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="amount">Fixed amount</SelectItem><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="rate_x_quantity">Rate × quantity</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Calculation basis</Label>
              <Select value={form.calculation_basis} onValueChange={(value) => setForm({ ...form, calculation_basis: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="basic_salary">Basic salary</SelectItem><SelectItem value="gross_pay">Gross pay</SelectItem><SelectItem value="taxable_pay">Taxable pay</SelectItem><SelectItem value="fixed">Fixed value</SelectItem><SelectItem value="custom">Custom basis</SelectItem></SelectContent>
              </Select>
            </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.calculation_type === "amount" && <div><Label>Employee amount</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>}
              {form.calculation_type === "percentage" && <div><Label>Employee percentage</Label><Input type="number" min="0" step="0.01" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} /></div>}
              {form.calculation_type === "rate_x_quantity" && <>
                <div><Label>Rate</Label><Input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div>
                <div><Label>Quantity / units</Label><Input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              </>}
              <div><Label>Currency</Label><Input maxLength={3} value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })} /></div>
            </div>
            <div>
              <Label>Assign to</Label>
              <Select value={form.scope_type} onValueChange={(value) => { setForm({ ...form, scope_type: value, scope_value: "", employee_id: "" }); setCsvEmployeeIds([]) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual employee</SelectItem>
                  <SelectItem value="csv">Bulk CSV upload</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="division">Division</SelectItem>
                  <SelectItem value="subsidiary">Subsidiary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.scope_type === "individual" && (
              <Select value={form.employee_id} onValueChange={(value) => setForm({ ...form, employee_id: value })}>
                <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                <SelectContent>{(data.employees || []).map((employee: Employee) => <SelectItem key={employee.id} value={employee.id}>{employee.employee_id} — {employeeName(employee)}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {form.scope_type === "csv" && (
              <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-semibold text-indigo-950">1. Download the controlled template</p><p className="text-xs text-indigo-700">It includes active employee IDs and every supported payroll field.</p></div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/payroll/components/template?category=${category}&pay_period=${payPeriod}`}>
                      <Download className="mr-1.5 h-4 w-4" /> Download CSV
                    </a>
                  </Button>
                </div>
                <div className="border-t border-indigo-200 pt-3 text-center">
                  <p className="mb-2 text-sm font-semibold text-indigo-950">2. Complete and upload</p>
                <input ref={fileRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => void readCsv(e.target.files?.[0])} />
                <Upload className="mx-auto mb-2 h-6 w-6 text-indigo-600" />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose CSV</Button>
                  <p className="mt-2 text-xs text-slate-600">
                    {csvFile ? `${csvFile.name} · ${csvRows.length} rows · ${csvEmployeeIds.length} employees matched` : "Upload only the completed template"}
                  </p>
                </div>
                {csvErrors.length > 0 && <div className="max-h-36 overflow-auto rounded-md bg-red-50 p-2 text-left text-xs text-red-800">
                  {csvErrors.slice(0, 20).map((error) => <p key={`${error.row}-${error.employee_id}`}>Row {error.row} ({error.employee_id || "blank"}): {error.errors.join("; ")}</p>)}
                </div>}
              </div>
            )}
            {scopeOptions.length > 0 && (
              <Select value={form.scope_value} onValueChange={(value) => setForm({ ...form, scope_value: value })}>
                <SelectTrigger><SelectValue placeholder={`Choose ${form.scope_type}`} /></SelectTrigger>
              <SelectContent>{scopeOptions.map((option: { value: string; label: string }) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {category === "backpay" && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                <div><Label>Source period</Label><Input type="month" value={form.source_period} onChange={(e) => setForm({ ...form, source_period: e.target.value })} /></div>
                <div><Label>Reason</Label><Select value={form.reason_code} onValueChange={(value) => setForm({ ...form, reason_code: value })}><SelectTrigger><SelectValue placeholder="Choose reason" /></SelectTrigger><SelectContent><SelectItem value="PAY_CORRECTION">Pay correction</SelectItem><SelectItem value="LATE_INCREASE">Late salary increase</SelectItem><SelectItem value="MISSED_EARNING">Missed earning</SelectItem><SelectItem value="PROMOTION">Promotion adjustment</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
                <div><Label>Payroll treatment</Label><Select value={form.payment_method} onValueChange={(value) => setForm({ ...form, payment_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="with_payroll">Include in regular payroll</SelectItem><SelectItem value="separate_run">Separate off-cycle run</SelectItem></SelectContent></Select></div>
                <div><Label>Pay date</Label><Input type="date" value={form.pay_date} onChange={(e) => setForm({ ...form, pay_date: e.target.value })} /></div>
              </div>
            )}

            <details open className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Tax, frequency and effective dating</summary>
              <div className="grid grid-cols-2 gap-3 border-t p-4">
                <div><Label>Frequency</Label><Select value={form.frequency} onValueChange={(value) => setForm({ ...form, frequency: value, recurring: value !== "one_time" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">One time</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem><SelectItem value="per_payroll">Every payroll</SelectItem></SelectContent></Select></div>
                <div><Label>Tax treatment</Label><Select value={form.tax_treatment} onValueChange={(value) => setForm({ ...form, tax_treatment: value, taxable: value === "taxable" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="taxable">Taxable</SelectItem><SelectItem value="non_taxable">Non-taxable</SelectItem><SelectItem value="tax_relief">Tax relief</SelectItem><SelectItem value="post_tax">Post-tax deduction</SelectItem></SelectContent></Select></div>
                <div><Label>End period (optional)</Label><Input type="month" value={form.end_period} onChange={(e) => setForm({ ...form, end_period: e.target.value })} /></div>
                <div><Label>Proration method</Label><Select value={form.proration_method} onValueChange={(value) => setForm({ ...form, proration_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="calendar_days">Calendar days</SelectItem><SelectItem value="working_days">Working days</SelectItem><SelectItem value="none">No proration</SelectItem></SelectContent></Select></div>
                {[["pensionable", "Pensionable"], ["proratable", "Proratable"], ["include_in_overtime_base", "Include in overtime base"]] .map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-md bg-slate-50 p-2"><Label>{label}</Label><Switch checked={Boolean((form as any)[key])} onCheckedChange={(checked) => setForm({ ...form, [key]: checked })} /></div>
                ))}
              </div>
            </details>

            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Employer contribution and limits</summary>
              <div className="grid grid-cols-2 gap-3 border-t p-4">
                <div><Label>Employer amount</Label><Input type="number" value={form.employer_amount} onChange={(e) => setForm({ ...form, employer_amount: e.target.value })} /></div>
                <div><Label>Employer %</Label><Input type="number" value={form.employer_percentage} onChange={(e) => setForm({ ...form, employer_percentage: e.target.value })} /></div>
                <div><Label>Minimum amount</Label><Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></div>
                <div><Label>Maximum amount</Label><Input type="number" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
              </div>
            </details>

            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Accounting and audit</summary>
              <div className="grid grid-cols-2 gap-3 border-t p-4">
                <div><Label>GL debit account</Label><Input value={form.gl_debit_account} onChange={(e) => setForm({ ...form, gl_debit_account: e.target.value })} /></div>
                <div><Label>GL credit account</Label><Input value={form.gl_credit_account} onChange={(e) => setForm({ ...form, gl_credit_account: e.target.value })} /></div>
                <div><Label>Cost center</Label><Input value={form.cost_center} onChange={(e) => setForm({ ...form, cost_center: e.target.value })} /></div>
                <div><Label>Project code</Label><Input value={form.project_code} onChange={(e) => setForm({ ...form, project_code: e.target.value })} /></div>
                <div><Label>External reference</Label><Input value={form.external_reference} onChange={(e) => setForm({ ...form, external_reference: e.target.value })} /></div>
                <div><Label>Approval status</Label><Select value={form.approval_status} onValueChange={(value) => setForm({ ...form, approval_status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approved</SelectItem><SelectItem value="pending">Pending approval</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select></div>
                <div className="col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            </details>
            <Button className="w-full bg-slate-950 hover:bg-slate-800" disabled={closed || saving} onClick={saveAssignment}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgePercent className="mr-2 h-4 w-4" />}
              {closed ? "Period locked" : `Assign ${activeCategory.label}`}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{activeCategory.label} for {payPeriod}</CardTitle>
                <CardDescription>Effective employee assignments. Group and CSV batches are expanded into auditable individual records.</CardDescription>
              </div>
              {category === "backpay" && (
                <Button onClick={runSeparateBackpay} disabled={closed || backpayRunning}>
                  {backpayRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create separate backpay run
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-16 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading assignments</div>
            ) : !(data.assignments || []).length ? (
              <div className="p-16 text-center text-sm text-muted-foreground">No {activeCategory.label.toLowerCase()} assigned for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Component</TableHead><TableHead>Value</TableHead><TableHead>Tax / frequency</TableHead><TableHead>Effective</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                  <TableBody>{data.assignments.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell><p className="font-medium">{employeeName(row.employee || {})}</p><p className="text-xs text-muted-foreground">{row.employee?.employee_id}</p></TableCell>
                      <TableCell><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.code}</p></TableCell>
                      <TableCell className="font-medium">{row.calculation_type === "percentage" ? `${row.percentage}% of ${String(row.calculation_basis || "basic salary").replaceAll("_", " ")}` : row.calculation_type === "rate_x_quantity" ? `${row.currency_code || "GHS"} ${Number(row.rate).toLocaleString()} × ${row.quantity}` : `${row.currency_code || "GHS"} ${Number(row.amount).toLocaleString()}`}</TableCell>
                      <TableCell><p className="capitalize">{String(row.tax_treatment || (row.taxable ? "taxable" : "non taxable")).replaceAll("_", " ")}</p><p className="text-xs capitalize text-muted-foreground">{row.frequency || (row.recurring ? "monthly" : "one time")}</p></TableCell>
                      <TableCell><p>{row.effective_period}</p><p className="text-xs text-muted-foreground">{row.end_period ? `to ${row.end_period}` : "No end date"}</p></TableCell>
                      <TableCell className="capitalize">{row.source_scope_type.replace("_", " ")}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{row.approval_status || row.status}</span></TableCell>
                      <TableCell><Button size="icon" variant="ghost" disabled={closed || row.status !== "active"} onClick={() => void removeAssignment(row.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
