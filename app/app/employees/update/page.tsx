"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  FileSearch,
  Loader2,
  PencilLine,
  RefreshCw,
  Save,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

type Emp = {
  id: string
  first_name?: string
  last_name?: string
  full_name?: string
  display_name?: string
  employee_id?: string
  department?: string
  position?: string
  status?: string
}

function nameOf(e: Emp | any) {
  return (
    e?.display_name ||
    e?.full_name ||
    `${e?.first_name || ""} ${e?.last_name || ""}`.trim() ||
    e?.employee_id ||
    "Employee"
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Never send org transfer fields on Update — Transfer Employee owns those */
function buildNonOrgPatch(form: Record<string, any>) {
  const {
    department: _d,
    division: _v,
    location: _l,
    subsidiary_id: _s,
    ...rest
  } = form
  return rest
}

export default function UpdateEmployeeDataPage() {
  const [employees, setEmployees] = useState<Emp[]>([])
  const [search, setSearch] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [loadingList, setLoadingList] = useState(true)
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [reason, setReason] = useState("")
  const [effectiveDate, setEffectiveDate] = useState(today())
  const [diffs, setDiffs] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, any>>({})
  const [financial, setFinancial] = useState<Record<string, any>>({})
  const [allowances, setAllowances] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [catalogAllowances, setCatalogAllowances] = useState<any[]>([])
  const [lastTransferDate, setLastTransferDate] = useState<string | null>(null)
  const [section, setSection] = useState("personal")

  const loadEmployees = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch("/api/employees?status=active&limit=500", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load employees")
      setEmployees(data.employees || data.data || [])
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees.slice(0, 80)
    return employees
      .filter((e) => {
        const hay = `${nameOf(e)} ${e.employee_id || ""} ${e.department || ""} ${e.position || ""}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 80)
  }, [employees, search])

  async function selectEmployee(id: string) {
    setEmployeeId(id)
    setDiffs([])
    setReason("")
    setLoadingEmp(true)
    try {
      const res = await fetch(`/api/employees/${id}?include_financial=true`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load employee")
      const emp = data.employee || {}
      setLastTransferDate(emp.last_transfer_date || null)
      setForm({
        prefix: emp.prefix || "",
        first_name: emp.first_name || "",
        other_names: emp.other_names || "",
        last_name: emp.last_name || "",
        personal_email: emp.personal_email || "",
        corporate_email: emp.corporate_email || "",
        phone: emp.phone || "",
        date_of_birth: emp.date_of_birth || "",
        gender: emp.gender || "",
        marital_status: emp.marital_status || "",
        address: emp.address || "",
        educational_level: emp.educational_level || "",
        emergency_contact_name: emp.emergency_contact_name || "",
        emergency_contact_tel: emp.emergency_contact_tel || "",
        position: emp.position || "",
        employee_id: emp.employee_id || "",
        special_role: emp.special_role || "",
        contract_type: emp.contract_type || "",
        date_of_joining: emp.date_of_joining || "",
        date_of_exit: emp.date_of_exit || "",
        status: emp.status || "Active",
        inactive_reason: emp.inactive_reason || "",
        probation_period: emp.probation_period || "",
        confirmation_date: emp.confirmation_date || "",
        notice_period: emp.notice_period || "",
        direct_supervisor: emp.direct_supervisor || "",
        head_of_department: emp.head_of_department || "",
        ghana_card_number: emp.ghana_card_number || "",
        // Org fields display-only (never patched from this screen)
        department: emp.department || "",
        division: emp.division || "",
        location: emp.location || "",
        subsidiary_id: emp.subsidiary_id || "",
      })
      const fin = emp.financial || {}
      setFinancial({
        monthly_salary: fin.monthly_salary ?? "",
        annual_salary: fin.annual_salary ?? "",
        bank_name: fin.bank_name || "",
        bank_branch: fin.bank_branch || "",
        bank_account_number: fin.bank_account_number || "",
        ssnit_number: fin.ssnit_number || "",
        provident_fund_rate: fin.provident_fund_rate ?? "",
        provident_fund_enrolled: fin.provident_fund_enrolled ?? false,
      })
      setAllowances(
        (emp.allowances || []).map((a: any) => ({
          id: a.allowance_id || a.id,
          code: a.code,
          description: a.description,
          amount: a.amount,
          percentage: a.percentage,
          taxable: a.taxable,
          recurring: a.recurring,
        })),
      )
      setDocuments(
        (emp.documents || []).map((d: any) => ({
          document_type: d.document_type,
          fileName: d.file_name || d.document_name,
          file_url: d.file_url || d.file_path,
          notes: d.notes,
        })),
      )
      setEffectiveDate(today())
      // Catalog for adding allowances
      try {
        const meta = await fetch("/api/employees/meta", { credentials: "include", cache: "no-store" })
        const mj = await meta.json().catch(() => ({}))
        if (meta.ok) setCatalogAllowances(mj.allowances || [])
      } catch {
        /* optional */
      }
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoadingEmp(false)
    }
  }

  function setField(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
    setDiffs([])
  }

  function setFin(key: string, value: any) {
    setFinancial((f) => ({ ...f, [key]: value }))
    setDiffs([])
  }

  function financialPayload() {
    return {
      ...financial,
      monthly_salary: financial.monthly_salary === "" ? undefined : Number(financial.monthly_salary),
      annual_salary: financial.annual_salary === "" ? undefined : Number(financial.annual_salary),
      provident_fund_rate:
        financial.provident_fund_rate === "" ? undefined : Number(financial.provident_fund_rate),
    }
  }

  async function preview() {
    if (!employeeId) return
    setPreviewing(true)
    try {
      const res = await fetch("/api/employees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "preview",
          employee_id: employeeId,
          effective_date: effectiveDate,
          patch: buildNonOrgPatch(form),
          financial: financialPayload(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Preview failed")
      setDiffs(data.diffs || [])
      if (!(data.diffs || []).length) {
        toast({ title: "No changes", description: "Nothing differs from the database record." })
      }
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" })
    } finally {
      setPreviewing(false)
    }
  }

  async function save() {
    if (!employeeId) return
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "Enter why this update is being made.", variant: "destructive" })
      return
    }
    if (!effectiveDate) {
      toast({ title: "Effective date required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/employees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_id: employeeId,
          reason,
          effective_date: effectiveDate,
          patch: buildNonOrgPatch(form),
          financial: financialPayload(),
          allowances,
          documents,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Update failed")
      setDiffs(data.diffs || [])
      toast({
        title: "Employee updated",
        description:
          data.message ||
          `${(data.diffs || []).length} field(s) apply from ${effectiveDate}. Prior periods unchanged.`,
      })
      setReason("")
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
            <Link href="/app/employees">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Employees
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <PencilLine className="h-6 w-6 text-teal-700" />
              Update Employee Data
            </h1>
            <p className="text-sm text-muted-foreground">
              Governed HR updates with reason and field-level audit. Org moves use{" "}
              <Link href="/app/employees/transfer" className="text-teal-700 underline">
                Transfer Employee
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/employees/transfer">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/employees/audit">
              <FileSearch className="mr-2 h-4 w-4" />
              Audit trail
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="shadow-sm h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Select employee</CardTitle>
            <CardDescription>Active employees from your company database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, code, dept…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => void loadEmployees()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh list
            </Button>
            <div className="max-h-[28rem] space-y-1 overflow-auto">
              {loadingList ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                filtered.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => void selectEmployee(e.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:border-teal-300 hover:bg-teal-50/50 ${
                      employeeId === e.id ? "border-teal-500 bg-teal-50" : "border-transparent bg-slate-50"
                    }`}
                  >
                    <p className="font-medium truncate">{nameOf(e)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.employee_id || "—"} · {e.department || "No dept"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!employeeId ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                Select an employee to begin a governed update.
              </CardContent>
            </Card>
          ) : loadingEmp ? (
            <div className="flex items-center gap-2 py-16 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading employee…
            </div>
          ) : (
            <>
              <Card className="shadow-sm border-teal-100 bg-gradient-to-br from-teal-50/60 to-white">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-lg font-semibold">{nameOf(form)}</p>
                    <p className="text-sm text-muted-foreground">
                      {form.employee_id} · {form.position || "No position"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline">Dept: {form.department || "—"}</Badge>
                      <Badge variant="outline">Div: {form.division || "—"}</Badge>
                      <Badge variant="outline">Loc: {form.location || "—"}</Badge>
                      <Badge className="bg-amber-100 text-amber-900">Org via Transfer only</Badge>
                    </div>
                    {lastTransferDate ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Last transfer effective: <span className="font-medium text-slate-700">{lastTransferDate}</span>
                        {" "}(current org shown above)
                      </p>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/employees/transfer?employee_id=${employeeId}`}>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transfer this employee
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Tabs value={section} onValueChange={setSection}>
                <TabsList className="flex h-auto flex-wrap">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="allowances">Allowances</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-4">
                  <Card className="shadow-sm">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                      {[
                        ["first_name", "First name"],
                        ["other_names", "Other names"],
                        ["last_name", "Last name"],
                        ["personal_email", "Personal email"],
                        ["corporate_email", "Corporate email"],
                        ["phone", "Phone"],
                        ["date_of_birth", "Date of birth", "date"],
                        ["gender", "Gender"],
                        ["marital_status", "Marital status"],
                        ["educational_level", "Education"],
                        ["emergency_contact_name", "Emergency contact"],
                        ["emergency_contact_tel", "Emergency phone"],
                      ].map(([key, label, type]) => (
                        <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type={type || "text"}
                            value={form[key] || ""}
                            onChange={(e) => setField(key, e.target.value)}
                          />
                        </div>
                      ))}
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Address</Label>
                        <Textarea
                          value={form.address || ""}
                          onChange={(e) => setField("address", e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="employment" className="mt-4">
                  <Card className="shadow-sm">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                      {[
                        ["position", "Position"],
                        ["employee_id", "Employee code"],
                        ["special_role", "Special role"],
                        ["contract_type", "Contract type"],
                        ["date_of_joining", "Date of joining", "date"],
                        ["date_of_exit", "Date of exit", "date"],
                        ["status", "Status"],
                        ["probation_period", "Probation period"],
                        ["confirmation_date", "Confirmation date", "date"],
                        ["notice_period", "Notice period"],
                        ["ghana_card_number", "Ghana Card"],
                      ].map(([key, label, type]) => (
                        <div key={key}>
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type={type || "text"}
                            value={form[key] || ""}
                            onChange={(e) => setField(key, e.target.value)}
                          />
                        </div>
                      ))}
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Inactive reason</Label>
                        <Input
                          value={form.inactive_reason || ""}
                          onChange={(e) => setField("inactive_reason", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financial" className="mt-4">
                  <Card className="shadow-sm">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Monthly salary</Label>
                        <Input
                          type="number"
                          value={financial.monthly_salary}
                          onChange={(e) => setFin("monthly_salary", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Annual salary</Label>
                        <Input
                          type="number"
                          value={financial.annual_salary}
                          onChange={(e) => setFin("annual_salary", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bank name</Label>
                        <Input
                          value={financial.bank_name || ""}
                          onChange={(e) => setFin("bank_name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bank branch</Label>
                        <Input
                          value={financial.bank_branch || ""}
                          onChange={(e) => setFin("bank_branch", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Account number</Label>
                        <Input
                          value={financial.bank_account_number || ""}
                          onChange={(e) => setFin("bank_account_number", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SSNIT number</Label>
                        <Input
                          value={financial.ssnit_number || ""}
                          onChange={(e) => setFin("ssnit_number", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Provident fund rate %</Label>
                        <Input
                          type="number"
                          value={financial.provident_fund_rate}
                          onChange={(e) => setFin("provident_fund_rate", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="allowances" className="mt-4">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Allowances</CardTitle>
                      <CardDescription>
                        Saved with effective date — applies from that date forward in payroll.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {allowances.map((a, i) => (
                        <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
                          <div className="min-w-[120px] flex-1">
                            <Label className="text-xs">Code / desc</Label>
                            <Input
                              value={a.code || a.description || ""}
                              onChange={(e) => {
                                const next = [...allowances]
                                next[i] = { ...a, code: e.target.value, description: e.target.value }
                                setAllowances(next)
                              }}
                            />
                          </div>
                          <div className="w-28">
                            <Label className="text-xs">Amount</Label>
                            <Input
                              type="number"
                              value={a.amount ?? ""}
                              onChange={(e) => {
                                const next = [...allowances]
                                next[i] = { ...a, amount: Number(e.target.value) }
                                setAllowances(next)
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700"
                            onClick={() => setAllowances(allowances.filter((_, j) => j !== i))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        <Select
                          onValueChange={(id) => {
                            const cat = catalogAllowances.find((c) => c.id === id)
                            if (!cat) return
                            setAllowances([
                              ...allowances,
                              {
                                id: cat.id,
                                code: cat.code,
                                description: cat.description,
                                amount: cat.amount || 0,
                                percentage: cat.percentage || 0,
                                taxable: cat.taxable,
                                recurring: cat.recurring !== false,
                              },
                            ])
                          }}
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Add from catalog" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogAllowances.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.code} — {c.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllowances([
                              ...allowances,
                              { code: "", description: "", amount: 0, taxable: true, recurring: true },
                            ])
                          }
                        >
                          Add custom
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Documents</CardTitle>
                      <CardDescription>Update document metadata / links (vault uploads still via Employees).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {documents.map((d, i) => (
                        <div key={i} className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Input
                              value={d.document_type || ""}
                              onChange={(e) => {
                                const next = [...documents]
                                next[i] = { ...d, document_type: e.target.value }
                                setDocuments(next)
                              }}
                              placeholder="contract, id, cv…"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">File name</Label>
                            <Input
                              value={d.fileName || ""}
                              onChange={(e) => {
                                const next = [...documents]
                                next[i] = { ...d, fileName: e.target.value }
                                setDocuments(next)
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">File URL / path</Label>
                            <Input
                              value={d.file_url || ""}
                              onChange={(e) => {
                                const next = [...documents]
                                next[i] = { ...d, file_url: e.target.value }
                                setDocuments(next)
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDocuments([
                            ...documents,
                            { document_type: "", fileName: "", file_url: "", notes: "" },
                          ])
                        }
                      >
                        Add document row
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Confirm & save</CardTitle>
                  <CardDescription>
                    Effective date drives when changes apply system-wide; prior months stay as they were.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Effective date *</Label>
                      <Input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Reason for update *</Label>
                      <Textarea
                        placeholder="e.g. Corrected phone after employee request CR-204"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  {diffs.length ? (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                        {diffs.length} change(s) to apply
                      </div>
                      <div className="divide-y max-h-48 overflow-auto">
                        {diffs.map((d, i) => (
                          <div key={`${d.field_name}-${i}`} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium">{d.field_label}</p>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {d.sensitivity}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground truncate">{d.old_value ?? "—"}</p>
                            <p className="text-teal-800 font-medium truncate">{d.new_value ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => void preview()} disabled={previewing || saving}>
                      {previewing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileSearch className="mr-2 h-4 w-4" />
                      )}
                      Preview changes
                    </Button>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => void save()}
                      disabled={saving || !reason.trim()}
                    >
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save to database
                    </Button>
                    {diffs.length ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Diff ready
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
