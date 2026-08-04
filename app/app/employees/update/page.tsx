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

export default function UpdateEmployeeDataPage() {
  const [employees, setEmployees] = useState<Emp[]>([])
  const [search, setSearch] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [loadingList, setLoadingList] = useState(true)
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [reason, setReason] = useState("")
  const [diffs, setDiffs] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, any>>({})
  const [financial, setFinancial] = useState<Record<string, any>>({})
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
        // Org fields shown read-only
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
          patch: form,
          financial: {
            ...financial,
            monthly_salary:
              financial.monthly_salary === "" ? undefined : Number(financial.monthly_salary),
            annual_salary:
              financial.annual_salary === "" ? undefined : Number(financial.annual_salary),
            provident_fund_rate:
              financial.provident_fund_rate === ""
                ? undefined
                : Number(financial.provident_fund_rate),
          },
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
    setSaving(true)
    try {
      const res = await fetch("/api/employees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_id: employeeId,
          reason,
          patch: form,
          financial: {
            ...financial,
            monthly_salary:
              financial.monthly_salary === "" ? undefined : Number(financial.monthly_salary),
            annual_salary:
              financial.annual_salary === "" ? undefined : Number(financial.annual_salary),
            provident_fund_rate:
              financial.provident_fund_rate === ""
                ? undefined
                : Number(financial.provident_fund_rate),
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Update failed")
      setDiffs(data.diffs || [])
      toast({
        title: "Employee updated",
        description: data.message || `${(data.diffs || []).length} field(s) saved to database with audit trail.`,
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
                <TabsList>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
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
              </Tabs>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Confirm & save</CardTitle>
                  <CardDescription>Preview diffs, then save with a reason — logged to the audit trail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Reason for update *</Label>
                    <Textarea
                      placeholder="e.g. Corrected phone after employee request CR-204"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
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
