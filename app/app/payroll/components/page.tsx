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
  code: "",
  name: "",
  calculation_type: "amount",
  amount: "",
  percentage: "",
  scope_type: "individual",
  scope_value: "",
  employee_id: "",
  taxable: true,
  recurring: true,
  end_period: "",
  backpay_treatment: "include_in_period",
  notes: "",
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
  const [csvEmployeeIds, setCsvEmployeeIds] = useState<string[]>([])
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
      if (!res.ok) throw new Error(json.error || "Could not load payroll assignments")
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
      }
      const res = await fetch("/api/payroll/components", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Assignment failed")
      toast.success(`${json.assigned} employee${json.assigned === 1 ? "" : "s"} assigned`)
      setForm(initialForm)
      setCsvEmployeeIds([])
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

  async function readCsv(file?: File) {
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const headers = (lines.shift() || "").split(",").map((h) => h.trim().toLowerCase())
    const codeIndex = headers.findIndex((h) => ["employee_id", "employee_code", "staff_id"].includes(h))
    if (codeIndex < 0) return toast.error("CSV requires an employee_id column")
    const codes = lines.map((line) => line.split(",")[codeIndex]?.trim().replace(/^"|"$/g, "")).filter(Boolean)
    const codeSet = new Set(codes.map((code) => code.toLowerCase()))
    const ids = (data.employees || [])
      .filter((employee: Employee) => codeSet.has(String(employee.employee_id).toLowerCase()))
      .map((employee: Employee) => employee.id)
    setCsvEmployeeIds(ids)
    toast.success(`${ids.length} of ${codes.length} CSV employees matched`)
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

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit border-0 shadow-lg">
          <CardHeader className={`rounded-t-xl bg-gradient-to-r ${activeCategory.color} text-white`}>
            <CardTitle className="flex items-center gap-2"><ActiveIcon className="h-5 w-5" /> Add {activeCategory.label}</CardTitle>
            <CardDescription className="text-white/80">Changes save directly to the tenant payroll database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. TRANS" /></div>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Transport" /></div>
            </div>
            <div>
              <Label>Calculation</Label>
              <Select value={form.calculation_type} onValueChange={(value) => setForm({ ...form, calculation_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="amount">Fixed amount</SelectItem><SelectItem value="percentage">Percentage of basic</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.calculation_type === "amount" ? "Amount (GHS)" : "Percentage (%)"}</Label>
              <Input type="number" min="0" step="0.01" value={form.calculation_type === "amount" ? form.amount : form.percentage}
                onChange={(e) => setForm({ ...form, [form.calculation_type === "amount" ? "amount" : "percentage"]: e.target.value })} />
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
              <div className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50 p-4 text-center">
                <input ref={fileRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => void readCsv(e.target.files?.[0])} />
                <Upload className="mx-auto mb-2 h-6 w-6 text-indigo-600" />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose CSV</Button>
                <p className="mt-2 text-xs text-slate-600">Required column: employee_id · {csvEmployeeIds.length} matched</p>
              </div>
            )}
            {scopeOptions.length > 0 && (
              <Select value={form.scope_value} onValueChange={(value) => setForm({ ...form, scope_value: value })}>
                <SelectTrigger><SelectValue placeholder={`Choose ${form.scope_type}`} /></SelectTrigger>
              <SelectContent>{scopeOptions.map((option: { value: string; label: string }) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {category === "backpay" && (
              <div>
                <Label>Payroll treatment</Label>
                <Select value={form.backpay_treatment} onValueChange={(value) => setForm({ ...form, backpay_treatment: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="include_in_period">Include in period payroll</SelectItem><SelectItem value="separate_run">Separate backpay run</SelectItem></SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div><Label>Recurring</Label><p className="text-xs text-muted-foreground">Continue into future open periods</p></div>
              <Switch checked={form.recurring} onCheckedChange={(checked) => setForm({ ...form, recurring: checked })} />
            </div>
            {category !== "deduction" && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <Label>Taxable</Label><Switch checked={form.taxable} onCheckedChange={(checked) => setForm({ ...form, taxable: checked })} />
              </div>
            )}
            <Button className="w-full bg-slate-950 hover:bg-slate-800" disabled={closed || saving} onClick={saveAssignment}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgePercent className="mr-2 h-4 w-4" />}
              {closed ? "Period locked" : `Assign ${activeCategory.label}`}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>{activeCategory.label} for {payPeriod}</CardTitle>
            <CardDescription>Effective employee assignments. Group and CSV batches are expanded into auditable individual records.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-16 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading assignments</div>
            ) : !(data.assignments || []).length ? (
              <div className="p-16 text-center text-sm text-muted-foreground">No {activeCategory.label.toLowerCase()} assigned for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Component</TableHead><TableHead>Value</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                  <TableBody>{data.assignments.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell><p className="font-medium">{employeeName(row.employee || {})}</p><p className="text-xs text-muted-foreground">{row.employee?.employee_id}</p></TableCell>
                      <TableCell><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.code}</p></TableCell>
                      <TableCell className="font-medium">{row.calculation_type === "percentage" ? `${row.percentage}%` : `GHS ${Number(row.amount).toLocaleString()}`}</TableCell>
                      <TableCell className="capitalize">{row.source_scope_type.replace("_", " ")}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{row.status}</span></TableCell>
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
