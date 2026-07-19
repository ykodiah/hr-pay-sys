"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Calculator,
  CheckSquare,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  Users,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
import { useToast } from "@/hooks/use-toast"

type CatalogRelief = {
  id: string
  name: string
  description: string
  amount: number
  annualAmount: number
  currency: string
  category: string
  graCode: string
}

type Assignment = {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  department: string
  taxReliefId: string
  reliefName: string
  reliefCode: string
  category: string
  taxYear: number
  annualAmount: number
  overrideAmount: number | null
  documentUrl: string | null
  documentName: string | null
  vaultDocumentId: string | null
  notes: string
}

type EmployeeOption = {
  id: string
  employee_id?: string
  full_name?: string
  first_name?: string
  last_name?: string
  department?: string
}

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function yearOptions() {
  const y = new Date().getFullYear()
  return [y + 1, y, y - 1, y - 2, y - 3]
}

export default function PayrollTaxReliefsPage() {
  const { toast } = useToast()
  const [companyId, setCompanyId] = useState("")
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [catalog, setCatalog] = useState<CatalogRelief[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [migrationRequired, setMigrationRequired] = useState(false)

  // Single assign dialog
  const [showAssign, setShowAssign] = useState(false)
  const [assignEmployeeId, setAssignEmployeeId] = useState("")
  const [assignReliefIds, setAssignReliefIds] = useState<string[]>([])
  const [assignOverride, setAssignOverride] = useState("")
  const [assignNotes, setAssignNotes] = useState("")

  // Bulk dialog
  const [showBulk, setShowBulk] = useState(false)
  const [bulkReliefIds, setBulkReliefIds] = useState<string[]>([])
  const [bulkSelected, setBulkSelected] = useState<Record<string, boolean>>({})
  const [bulkSearch, setBulkSearch] = useState("")

  // Document upload
  const [uploadTarget, setUploadTarget] = useState<Assignment | null>(null)
  const [uploading, setUploading] = useState(false)

  const loadCompany = useCallback(async () => {
    // Prefer employees/meta, then Settings company bootstrap resolver.
    const res = await fetch("/api/employees/meta", { cache: "no-store", credentials: "include" })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.company_id) {
      setCompanyId(json.company_id)
      return json.company_id as string
    }

    const companyRes = await fetch("/api/settings/company", { cache: "no-store", credentials: "include" })
    const companyJson = await companyRes.json().catch(() => ({}))
    if (companyRes.ok && companyJson.company?.id) {
      setCompanyId(companyJson.company.id)
      return companyJson.company.id as string
    }

    throw new Error(
      json.error ||
        companyJson.error ||
        "Unable to resolve company for this user. Open Company settings and save your company first.",
    )
  }, [])

  const loadReliefs = useCallback(async (cid: string, year: number) => {
    const res = await fetch(
      `/api/payroll/tax-reliefs?company_id=${encodeURIComponent(cid)}&tax_year=${year}`,
      { cache: "no-store", credentials: "include" },
    )
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load tax reliefs")
    setCatalog(Array.isArray(json.catalog) ? json.catalog : [])
    setAssignments(Array.isArray(json.assignments) ? json.assignments : [])
    setMigrationRequired(Boolean(json.migration_required))
  }, [])

  const loadEmployees = useCallback(async (cid: string) => {
    const res = await fetch(
      `/api/employees?company_id=${encodeURIComponent(cid)}&status=active&limit=2000&options=true`,
      { cache: "no-store", credentials: "include" },
    )
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load employees")
    const list = json.employees || json.data || []
    setEmployees(list)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const cid = companyId || (await loadCompany())
      await Promise.all([loadReliefs(cid, taxYear), loadEmployees(cid)])
    } catch (err) {
      toast({
        title: "Could not load tax reliefs",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [companyId, taxYear, loadCompany, loadReliefs, loadEmployees, toast])

  useEffect(() => {
    void refresh()
  }, [taxYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assignments
    return assignments.filter(
      (a) =>
        a.employeeName.toLowerCase().includes(q) ||
        a.employeeCode.toLowerCase().includes(q) ||
        a.reliefName.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q),
    )
  }, [assignments, search])

  const bulkEmployees = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const name = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`
      return (
        name.toLowerCase().includes(q) ||
        String(e.employee_id || "").toLowerCase().includes(q) ||
        String(e.department || "").toLowerCase().includes(q)
      )
    })
  }, [employees, bulkSearch])

  const toggleRelief = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const handleAssign = async () => {
    if (!assignEmployeeId || !assignReliefIds.length) {
      toast({
        title: "Missing fields",
        description: "Select an employee and at least one relief.",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/payroll/tax-reliefs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          company_id: companyId,
          tax_year: taxYear,
          employee_id: assignEmployeeId,
          tax_relief_ids: assignReliefIds,
          override_amount: assignOverride === "" ? null : Number(assignOverride),
          notes: assignNotes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Assign failed")
      toast({
        title: "Relief assigned",
        description: `Saved for tax year ${taxYear}. Payroll runs in ${taxYear} will use this set.`,
      })
      setShowAssign(false)
      setAssignEmployeeId("")
      setAssignReliefIds([])
      setAssignOverride("")
      setAssignNotes("")
      await loadReliefs(companyId, taxYear)
    } catch (err) {
      toast({
        title: "Assign failed",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAssign = async () => {
    const employeeIds = Object.entries(bulkSelected)
      .filter(([, v]) => v)
      .map(([id]) => id)
    if (!employeeIds.length || !bulkReliefIds.length) {
      toast({
        title: "Missing selection",
        description: "Select employees and at least one relief.",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/payroll/tax-reliefs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_assign",
          company_id: companyId,
          tax_year: taxYear,
          employee_ids: employeeIds,
          tax_relief_ids: bulkReliefIds,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Bulk assign failed")
      toast({
        title: "Bulk assignment saved",
        description: `${json.assigned || employeeIds.length} assignment(s) for ${taxYear}.`,
      })
      setShowBulk(false)
      setBulkSelected({})
      setBulkReliefIds([])
      await loadReliefs(companyId, taxYear)
    } catch (err) {
      toast({
        title: "Bulk assign failed",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUnassign = async (assignment: Assignment) => {
    setSaving(true)
    try {
      const res = await fetch("/api/payroll/tax-reliefs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unassign",
          company_id: companyId,
          assignment_id: assignment.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Remove failed")
      toast({
        title: "Relief removed",
        description: `${assignment.reliefName} removed for ${assignment.employeeName} (${taxYear}).`,
      })
      await loadReliefs(companyId, taxYear)
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUploadDocument = async (file: File) => {
    if (!uploadTarget) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const up = await fetch("/api/upload/document", { method: "POST", body: form, credentials: "include" })
      const upJson = await up.json()
      if (!up.ok) throw new Error(upJson.error || "Upload failed")

      const res = await fetch("/api/payroll/tax-reliefs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach_document",
          company_id: companyId,
          assignment_id: uploadTarget.id,
          file_url: upJson.url,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not attach document")

      toast({
        title: "Document saved",
        description: json.vault_ok
          ? "Attached to assignment and copied to Document Vault → Tax Relief."
          : "Attached to assignment. Vault copy may need migration.",
      })
      setUploadTarget(null)
      await loadReliefs(companyId, taxYear)
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const periodHint = `${taxYear}-01`

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Reliefs</h1>
          <p className="text-gray-600 mt-1">
            Assign employee tax reliefs by tax year. Payroll Process for periods in that year uses only
            that year&apos;s assignments (annual amount ÷ 12 each month).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/settings">
              <Shield className="w-4 h-4 mr-2" />
              Relief catalog (Settings)
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/app/payroll?pay_period=${periodHint}`}>
              <Calculator className="w-4 h-4 mr-2" />
              Open Process Payroll
            </Link>
          </Button>
          <Button
            variant="outline"
            disabled={migrationRequired}
            onClick={() => {
              if (migrationRequired) {
                toast({
                  title: "Migration required",
                  description: "Run scripts/069_employee_tax_reliefs.sql in Supabase first.",
                  variant: "destructive",
                })
                return
              }
              if (!catalog.length) {
                toast({
                  title: "No catalog reliefs yet",
                  description: "Sync/save reliefs in Settings → Payroll, then click Refresh here.",
                  variant: "destructive",
                })
                return
              }
              setShowBulk(true)
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            Bulk assign
          </Button>
          <Button
            disabled={migrationRequired}
            onClick={() => {
              if (migrationRequired) {
                toast({
                  title: "Migration required",
                  description: "Run scripts/069_employee_tax_reliefs.sql in Supabase first.",
                  variant: "destructive",
                })
                return
              }
              if (!catalog.length) {
                toast({
                  title: "No catalog reliefs yet",
                  description: "Sync/save reliefs in Settings → Payroll, then click Refresh here.",
                  variant: "destructive",
                })
                return
              }
              setShowAssign(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign relief
          </Button>
        </div>
      </div>

      {migrationRequired && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-900">
            Run <code className="font-mono">scripts/069_employee_tax_reliefs.sql</code> in Supabase to
            enable employee assignments.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Label>Tax year</Label>
            <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Re-running payroll for {taxYear} uses only this year&apos;s set.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Catalog reliefs</p>
            <p className="text-2xl font-semibold">{catalog.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Assignments ({taxYear})</p>
            <p className="text-2xl font-semibold">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active employees</p>
            <p className="text-2xl font-semibold">{employees.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company relief catalog</CardTitle>
          <CardDescription>
            Definitions from Settings → Payroll. Assignments below apply these to employees for {taxYear}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!catalog.length ? (
            <div className="text-sm text-muted-foreground">
              No active reliefs.{" "}
              <Link href="/app/settings" className="text-blue-600 underline">
                Add them in Settings → Payroll
              </Link>
              , then return here to assign.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {catalog.map((r) => (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                    <Badge variant="secondary">{money(r.annualAmount)}</Badge>
                  </div>
                  {r.graCode ? (
                    <p className="text-xs mt-2 font-mono text-muted-foreground">{r.graCode}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Assignments for {taxYear}</CardTitle>
            <CardDescription>
              Upload supporting documents — a copy is stored in Document Vault under Tax Relief.
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search employee or relief…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading…
            </div>
          ) : !filteredAssignments.length ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No assignments for {taxYear}. Use Assign or Bulk assign.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Employee</th>
                    <th className="py-2 pr-3">Relief</th>
                    <th className="py-2 pr-3">Annual</th>
                    <th className="py-2 pr-3">Monthly (÷12)</th>
                    <th className="py-2 pr-3">Document</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-3 pr-3">
                        <div className="font-medium">{a.employeeName || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.employeeCode}
                          {a.department ? ` · ${a.department}` : ""}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div>{a.reliefName}</div>
                        {a.reliefCode ? (
                          <div className="text-xs font-mono text-muted-foreground">{a.reliefCode}</div>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3">{money(a.annualAmount)}</td>
                      <td className="py-3 pr-3">{money(a.annualAmount / 12)}</td>
                      <td className="py-3 pr-3">
                        {a.documentUrl ? (
                          <a
                            href={a.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            {a.documentName || "View"}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => setUploadTarget(a)}>
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => void handleUnassign(a)}
                          disabled={saving}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single assign */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign tax relief</DialogTitle>
            <DialogDescription>
              Applies only to tax year {taxYear}. Other years are unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim()} (
                      {e.employee_id || "—"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reliefs</Label>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-2 rounded border p-3">
                {catalog.map((r) => (
                  <label key={r.id} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={assignReliefIds.includes(r.id)}
                      onCheckedChange={() =>
                        toggleRelief(r.id, assignReliefIds, setAssignReliefIds)
                      }
                    />
                    <span>
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground"> · {money(r.annualAmount)}/yr</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Override annual amount (optional)</Label>
              <Input
                type="number"
                className="mt-1"
                value={assignOverride}
                onChange={(e) => setAssignOverride(e.target.value)}
                placeholder="Leave blank to use catalog amount"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                className="mt-1"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleAssign()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
              Save assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk assign */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk assign tax reliefs</DialogTitle>
            <DialogDescription>
              Assign selected reliefs to multiple employees for tax year {taxYear}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reliefs</Label>
              <div className="mt-2 max-h-36 overflow-y-auto space-y-2 rounded border p-3">
                {catalog.map((r) => (
                  <label key={r.id} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={bulkReliefIds.includes(r.id)}
                      onCheckedChange={() => toggleRelief(r.id, bulkReliefIds, setBulkReliefIds)}
                    />
                    <span>
                      {r.name} · {money(r.annualAmount)}/yr
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label>Employees</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      bulkEmployees.forEach((e) => {
                        next[e.id] = true
                      })
                      setBulkSelected(next)
                    }}
                  >
                    Select visible
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setBulkSelected({})}>
                    Clear
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Filter employees…"
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-56 overflow-y-auto space-y-1 rounded border p-2">
                {bulkEmployees.map((e) => {
                  const name = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim()
                  return (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={Boolean(bulkSelected[e.id])}
                        onCheckedChange={(checked) =>
                          setBulkSelected((prev) => ({ ...prev, [e.id]: Boolean(checked) }))
                        }
                      />
                      <span className="flex-1">
                        {name}
                        <span className="text-muted-foreground"> · {e.employee_id || "—"}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{e.department || ""}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulk(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleBulkAssign()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Assign to selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload document */}
      <Dialog open={Boolean(uploadTarget)} onOpenChange={(o) => !o && setUploadTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload relief document</DialogTitle>
            <DialogDescription>
              {uploadTarget
                ? `${uploadTarget.reliefName} · ${uploadTarget.employeeName} · ${taxYear}`
                : ""}
              . A copy is saved to Document Vault (Tax Relief).
            </DialogDescription>
          </DialogHeader>
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUploadDocument(file)
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadTarget(null)} disabled={uploading}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
