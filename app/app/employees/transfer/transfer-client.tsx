"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  FileSearch,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  division?: string
  location?: string
  subsidiary_id?: string
  direct_supervisor?: string
  head_of_department?: string
}

type MetaPerson = {
  id: string
  name: string
  department?: string
  special_role?: string
  position?: string
}

type OrgTarget = {
  subsidiary_id: string
  division: string
  department: string
  location: string
  direct_supervisor: string
  head_of_department: string
}

type TransferRow = {
  id: string
  effective_date?: string
  reason?: string
  reference_no?: string | null
  notes?: string | null
  status?: string
  from_subsidiary_id?: string | null
  to_subsidiary_id?: string | null
  from_division?: string | null
  to_division?: string | null
  from_department?: string | null
  to_department?: string | null
  from_location?: string | null
  to_location?: string | null
  from_direct_supervisor?: string | null
  to_direct_supervisor?: string | null
  from_head_of_department?: string | null
  to_head_of_department?: string | null
  created_at?: string
}

const ORG_KEYS = [
  "subsidiary_id",
  "division",
  "department",
  "location",
  "direct_supervisor",
  "head_of_department",
] as const

type OrgKey = (typeof ORG_KEYS)[number]

const EMPTY_TARGET: OrgTarget = {
  subsidiary_id: "",
  division: "",
  department: "",
  location: "",
  direct_supervisor: "",
  head_of_department: "",
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

function norm(v: unknown) {
  if (v == null) return ""
  return String(v).trim()
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function TransferEmployeePage() {
  const searchParams = useSearchParams()
  const presetId = searchParams.get("employee_id") || ""

  const [employees, setEmployees] = useState<Emp[]>([])
  const [search, setSearch] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [current, setCurrent] = useState<Emp | null>(null)
  const [target, setTarget] = useState<OrgTarget>(EMPTY_TARGET)

  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [subsidiaries, setSubsidiaries] = useState<{ id: string; name: string }[]>([])
  const [supervisors, setSupervisors] = useState<MetaPerson[]>([])
  const [heads, setHeads] = useState<MetaPerson[]>([])

  const [effectiveDate, setEffectiveDate] = useState(todayISO())
  const [reason, setReason] = useState("")
  const [referenceNo, setReferenceNo] = useState("")
  const [notes, setNotes] = useState("")

  const [history, setHistory] = useState<TransferRow[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [applying, setApplying] = useState(false)

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

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true)
    try {
      const res = await fetch("/api/employees/meta", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load org meta")
      setDivisions(Array.isArray(data.divisions) ? data.divisions : [])
      setDepartments(Array.isArray(data.departments) ? data.departments : [])
      setLocations(Array.isArray(data.locations) ? data.locations : [])
      setSubsidiaries(
        (Array.isArray(data.subsidiaries) ? data.subsidiaries : []).map((s: any) => ({
          id: s.id,
          name: s.name || s.id,
        })),
      )
      setSupervisors(Array.isArray(data.supervisors) ? data.supervisors : [])
      setHeads(Array.isArray(data.heads_of_department) ? data.heads_of_department : [])
    } catch (e: any) {
      toast({ title: "Meta load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  const loadHistory = useCallback(async (id: string) => {
    if (!id) {
      setHistory([])
      return
    }
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/employees/transfers?employee_id=${encodeURIComponent(id)}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load transfer history")
      setHistory(data.transfers || [])
    } catch (e: any) {
      toast({ title: "History failed", description: e.message, variant: "destructive" })
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    void loadEmployees()
    void loadMeta()
  }, [loadEmployees, loadMeta])

  const selectEmployee = useCallback(
    async (id: string) => {
      if (!id) return
      setEmployeeId(id)
      setReason("")
      setReferenceNo("")
      setNotes("")
      setEffectiveDate(todayISO())
      setLoadingEmp(true)
      try {
        const res = await fetch(`/api/employees/${id}`, {
          credentials: "include",
          cache: "no-store",
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Failed to load employee")
        const emp: Emp = data.employee || data || {}
        setCurrent(emp)
        setTarget({
          subsidiary_id: norm(emp.subsidiary_id),
          division: norm(emp.division),
          department: norm(emp.department),
          location: norm(emp.location),
          direct_supervisor: norm(emp.direct_supervisor),
          head_of_department: norm(emp.head_of_department),
        })
        void loadHistory(id)
      } catch (e: any) {
        toast({ title: "Load failed", description: e.message, variant: "destructive" })
        setCurrent(null)
        setTarget(EMPTY_TARGET)
      } finally {
        setLoadingEmp(false)
      }
    },
    [loadHistory],
  )

  useEffect(() => {
    if (presetId) {
      void selectEmployee(presetId)
    }
  }, [presetId, selectEmployee])

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

  const personLabel = useCallback(
    (idOrName: string | null | undefined) => {
      const v = norm(idOrName)
      if (!v) return "—"
      const fromMeta =
        supervisors.find((p) => p.id === v || p.name === v) ||
        heads.find((p) => p.id === v || p.name === v)
      if (fromMeta) return fromMeta.name
      const fromList = employees.find((e) => e.id === v)
      if (fromList) return nameOf(fromList)
      return v
    },
    [supervisors, heads, employees],
  )

  const subsidiaryLabel = useCallback(
    (id: string | null | undefined) => {
      const v = norm(id)
      if (!v) return "—"
      return subsidiaries.find((s) => s.id === v)?.name || v
    },
    [subsidiaries],
  )

  const changedKeys = useMemo(() => {
    if (!current) return [] as OrgKey[]
    return ORG_KEYS.filter((key) => norm(target[key]) !== norm((current as any)[key]))
  }, [current, target])

  const hasChanges = changedKeys.length > 0

  function setOrgField(key: OrgKey, value: string) {
    setTarget((t) => ({ ...t, [key]: value === "__none__" ? "" : value }))
  }

  async function applyTransfer() {
    if (!employeeId || !current) return
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Enter why this organisational transfer is being made.",
        variant: "destructive",
      })
      return
    }
    if (!effectiveDate) {
      toast({
        title: "Effective date required",
        description: "Choose when the transfer takes effect.",
        variant: "destructive",
      })
      return
    }
    if (!hasChanges) {
      toast({
        title: "No changes",
        description: "Update at least one organisational field before applying.",
        variant: "destructive",
      })
      return
    }

    setApplying(true)
    try {
      const body: Record<string, any> = {
        employee_id: employeeId,
        effective_date: effectiveDate,
        reason: reason.trim(),
        reference_no: referenceNo.trim() || null,
        notes: notes.trim() || null,
      }
      for (const key of changedKeys) {
        body[`to_${key}`] = target[key] || null
      }

      const res = await fetch("/api/employees/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Transfer failed")

      toast({
        title: "Transfer applied",
        description:
          data.message ||
          `${(data.diffs || []).length || changedKeys.length} organisational field(s) updated.`,
      })

      const emp: Emp = data.employee || current
      setCurrent(emp)
      setTarget({
        subsidiary_id: norm(emp.subsidiary_id),
        division: norm(emp.division),
        department: norm(emp.department),
        location: norm(emp.location),
        direct_supervisor: norm(emp.direct_supervisor),
        head_of_department: norm(emp.head_of_department),
      })
      setReason("")
      setReferenceNo("")
      setNotes("")
      void loadHistory(employeeId)
      void loadEmployees()
    } catch (e: any) {
      toast({ title: "Transfer failed", description: e.message, variant: "destructive" })
    } finally {
      setApplying(false)
    }
  }

  function fromValue(key: OrgKey) {
    if (!current) return "—"
    if (key === "subsidiary_id") return subsidiaryLabel(current.subsidiary_id)
    if (key === "direct_supervisor" || key === "head_of_department") {
      return personLabel((current as any)[key])
    }
    return norm((current as any)[key]) || "—"
  }

  function historySummary(t: TransferRow) {
    const parts: string[] = []
    if (norm(t.from_department) !== norm(t.to_department)) {
      parts.push(`${t.from_department || "—"} → ${t.to_department || "—"}`)
    }
    if (norm(t.from_division) !== norm(t.to_division)) {
      parts.push(`Div: ${t.from_division || "—"} → ${t.to_division || "—"}`)
    }
    if (norm(t.from_location) !== norm(t.to_location)) {
      parts.push(`Loc: ${t.from_location || "—"} → ${t.to_location || "—"}`)
    }
    if (norm(t.from_subsidiary_id) !== norm(t.to_subsidiary_id)) {
      parts.push(
        `Sub: ${subsidiaryLabel(t.from_subsidiary_id)} → ${subsidiaryLabel(t.to_subsidiary_id)}`,
      )
    }
    if (norm(t.from_direct_supervisor) !== norm(t.to_direct_supervisor)) {
      parts.push(
        `Sup: ${personLabel(t.from_direct_supervisor)} → ${personLabel(t.to_direct_supervisor)}`,
      )
    }
    if (norm(t.from_head_of_department) !== norm(t.to_head_of_department)) {
      parts.push(
        `HoD: ${personLabel(t.from_head_of_department)} → ${personLabel(t.to_head_of_department)}`,
      )
    }
    return parts.length ? parts.join(" · ") : "Organisational transfer"
  }

  const selectValue = (v: string) => (v ? v : "__none__")

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
              <ArrowRightLeft className="h-6 w-6 text-teal-700" />
              Transfer Employee
            </h1>
            <p className="text-sm text-muted-foreground">
              Move an employee across subsidiary, division, department, location, or reporting lines.
              Personal data updates use{" "}
              <Link href="/app/employees/update" className="text-teal-700 underline">
                Update Employee Data
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/employees/update">
              Update data
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
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                void loadEmployees()
                void loadMeta()
              }}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh list
            </Button>
            <div className="max-h-[28rem] space-y-1 overflow-auto">
              {loadingList ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No employees found</p>
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
                Select an employee to plan an organisational transfer.
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
                    <p className="text-lg font-semibold">{nameOf(current)}</p>
                    <p className="text-sm text-muted-foreground">
                      {current?.employee_id || "—"} · {current?.position || "No position"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {fromValue("department")}
                      </Badge>
                      <Badge variant="outline">{fromValue("division")}</Badge>
                      <Badge variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {fromValue("location")}
                      </Badge>
                      {hasChanges ? (
                        <Badge className="bg-teal-100 text-teal-900">
                          {changedKeys.length} field(s) changing
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No org changes yet</Badge>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/employees/update?employee_id=${employeeId}`}>
                      Update personal data
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      From (current)
                    </CardTitle>
                    <CardDescription>Existing organisational placement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {(
                      [
                        ["Subsidiary", "subsidiary_id"],
                        ["Division", "division"],
                        ["Department", "department"],
                        ["Location", "location"],
                        ["Direct supervisor", "direct_supervisor"],
                        ["Head of department", "head_of_department"],
                      ] as const
                    ).map(([label, key]) => (
                      <div
                        key={key}
                        className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 ${
                          changedKeys.includes(key) ? "border-amber-200 bg-amber-50/40" : "bg-slate-50"
                        }`}
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-right">{fromValue(key)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-teal-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      To (new)
                      <ArrowRight className="h-4 w-4 text-teal-600" />
                    </CardTitle>
                    <CardDescription>
                      {loadingMeta ? "Loading org options…" : "Set the destination organisation fields"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Subsidiary</Label>
                      <Select
                        value={selectValue(target.subsidiary_id)}
                        onValueChange={(v) => setOrgField("subsidiary_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subsidiary" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None / parent company</SelectItem>
                          {subsidiaries.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Division</Label>
                      <Select
                        value={selectValue(target.division)}
                        onValueChange={(v) => setOrgField("division", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {divisions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Department</Label>
                      <Select
                        value={selectValue(target.department)}
                        onValueChange={(v) => setOrgField("department", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Location</Label>
                      <Select
                        value={selectValue(target.location)}
                        onValueChange={(v) => setOrgField("location", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Direct supervisor</Label>
                      <Select
                        value={selectValue(target.direct_supervisor)}
                        onValueChange={(v) => setOrgField("direct_supervisor", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {supervisors.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                              {p.department ? ` · ${p.department}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Head of department</Label>
                      <Select
                        value={selectValue(target.head_of_department)}
                        onValueChange={(v) => setOrgField("head_of_department", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select head of department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {heads.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                              {p.department ? ` · ${p.department}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Transfer details</CardTitle>
                  <CardDescription>
                    Effective date and reason are required. Only changed organisational fields are sent.
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
                      <Label>Reference no.</Label>
                      <Input
                        placeholder="e.g. HR-TRF-204"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Reason *</Label>
                    <Textarea
                      placeholder="e.g. Reorganisation — moved to Finance under Accra HQ"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Optional internal notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {hasChanges ? (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                        {changedKeys.length} field(s) will be transferred
                      </div>
                      <div className="divide-y">
                        {changedKeys.map((key) => (
                          <div key={key} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                            <p className="font-medium capitalize">{key.replace(/_/g, " ")}</p>
                            <p className="text-muted-foreground truncate">{fromValue(key)}</p>
                            <p className="text-teal-800 font-medium truncate flex items-center gap-1">
                              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                              {key === "subsidiary_id"
                                ? subsidiaryLabel(target[key])
                                : key === "direct_supervisor" || key === "head_of_department"
                                  ? personLabel(target[key])
                                  : target[key] || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => void applyTransfer()}
                      disabled={applying || !reason.trim() || !hasChanges}
                    >
                      {applying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                      )}
                      Apply transfer
                    </Button>
                    {hasChanges && reason.trim() ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready to apply
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Transfer history</CardTitle>
                      <CardDescription>Previous organisational moves for this employee</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void loadHistory(employeeId)}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
                    </div>
                  ) : history.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No transfers recorded yet. Apply a transfer to create the first entry.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border px-3 py-2.5 text-sm flex flex-wrap items-start justify-between gap-2"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{t.effective_date || "—"}</span>
                              <Badge
                                variant="outline"
                                className={
                                  t.status === "reversed"
                                    ? "bg-amber-50 text-amber-900"
                                    : "bg-teal-50 text-teal-900"
                                }
                              >
                                {t.status || "applied"}
                              </Badge>
                              {t.reference_no ? (
                                <span className="text-xs text-muted-foreground">{t.reference_no}</span>
                              ) : null}
                            </div>
                            <p className="text-muted-foreground">{t.reason || "—"}</p>
                            <p className="text-xs text-slate-600">{historySummary(t)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
