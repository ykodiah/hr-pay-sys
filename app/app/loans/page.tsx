"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Banknote,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  XCircle,
} from "lucide-react"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import { buildAmortizationPreview } from "@/lib/services/loan-calculations"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type LoanStatus =
  | "pending"
  | "approved"
  | "active"
  | "completed"
  | "rejected"
  | "defaulted"
  | "cancelled"

type Loan = {
  id: string
  company_id: string
  employee_id: string
  loan_type: string
  purpose: string | null
  principal: number
  interest_rate: number
  repayment_months: number
  monthly_payment: number
  amount_paid: number
  remaining_balance: number
  start_date: string | null
  end_date: string | null
  status: LoanStatus
  auto_deduct: boolean
  notes: string | null
  rejection_reason: string | null
  employee_name?: string | null
  employee_id_no?: string | null
  department?: string | null
  created_at: string
}

type EmployeeOption = {
  id: string
  employee_id?: string
  full_name?: string
  first_name?: string
  last_name?: string
  department?: string
}

type LoanTypeOption = {
  id: string
  code: string
  name: string
  description?: string | null
  annual_interest_rate: number
  min_amount: number
  max_amount: number
  min_tenure_months: number
  max_tenure_months: number
  default_tenure_months: number
  is_active?: boolean
}

function money(n: number) {
  return `GHS ${Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
    case "approved":
      return "default"
    case "pending":
      return "secondary"
    case "rejected":
    case "defaulted":
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

function employeeLabel(e: EmployeeOption) {
  return (
    e.full_name ||
    `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ||
    e.employee_id ||
    e.id
  )
}

export default function PayrollLoansPage() {
  const { toast } = useToast()
  const [companyId, setCompanyId] = useState("")
  const [loans, setLoans] = useState<Loan[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loanTypes, setLoanTypes] = useState<LoanTypeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [showCreate, setShowCreate] = useState(false)
  const [employeeId, setEmployeeId] = useState("")
  const [loanTypeId, setLoanTypeId] = useState("")
  const [principal, setPrincipal] = useState("")
  const [interestRate, setInterestRate] = useState("0")
  const [repaymentMonths, setRepaymentMonths] = useState("6")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [purpose, setPurpose] = useState("")
  const [notes, setNotes] = useState("")
  const [autoDeduct, setAutoDeduct] = useState(true)
  const [activateNow, setActivateNow] = useState(true)

  const selectedLoanType = useMemo(
    () => loanTypes.find((t) => t.id === loanTypeId) || null,
    [loanTypes, loanTypeId],
  )

  const [detailLoan, setDetailLoan] = useState<Loan | null>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [rejectLoan, setRejectLoan] = useState<Loan | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const preview = useMemo(() => {
    const p = Number(principal)
    const r = Number(interestRate)
    const m = Number(repaymentMonths)
    if (!p || !m || p <= 0 || m <= 0) return null
    return buildAmortizationPreview(p, r || 0, m, startDate || new Date().toISOString().split("T")[0])
  }, [principal, interestRate, repaymentMonths, startDate])

  const monthlyPreview = preview?.[0]?.payment_amount ?? 0

  const loadCompany = useCallback(async () => {
    const cid = await resolveClientCompanyId()
    setCompanyId(cid)
    return cid
  }, [])

  const loadLoans = useCallback(async (cid: string, status?: string) => {
    const params = new URLSearchParams({ company_id: cid })
    if (status && status !== "all") params.set("status", status)
    const res = await fetch(`/api/loans?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || "Failed to load loans")
    setLoans(Array.isArray(json.loans) ? json.loans : [])
  }, [])

  const loadEmployees = useCallback(async (cid: string) => {
    const res = await fetch(
      `/api/employees?company_id=${encodeURIComponent(cid)}&status=active&limit=2000&options=true`,
      { cache: "no-store", credentials: "include" },
    )
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || "Failed to load employees")
    setEmployees(json.employees || json.data || [])
  }, [])

  const loadLoanTypes = useCallback(async (cid: string) => {
    const res = await fetch(`/api/loans/loan-types?company_id=${encodeURIComponent(cid)}`, {
      cache: "no-store",
      credentials: "include",
    })
    const json = await res.json().catch(() => ([]))
    if (!res.ok) throw new Error(json.error || "Failed to load loan types")
    const list = Array.isArray(json) ? json : []
    setLoanTypes(list)
    return list as LoanTypeOption[]
  }, [])

  const applyLoanTypeDefaults = useCallback((type: LoanTypeOption | null | undefined) => {
    if (!type) return
    setLoanTypeId(type.id)
    setInterestRate(String(type.annual_interest_rate ?? 0))
    setRepaymentMonths(String(type.default_tenure_months ?? type.min_tenure_months ?? 6))
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const cid = companyId || (await loadCompany())
      const [, , types] = await Promise.all([
        loadLoans(cid, statusFilter),
        loadEmployees(cid),
        loadLoanTypes(cid),
      ])
      if (!loanTypeId && types.length) {
        applyLoanTypeDefaults(types[0])
      }
    } catch (err) {
      toast({
        title: "Could not load loans",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [
    companyId,
    statusFilter,
    loanTypeId,
    loadCompany,
    loadLoans,
    loadEmployees,
    loadLoanTypes,
    applyLoanTypeDefaults,
    toast,
  ])

  useEffect(() => {
    void refresh()
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return loans
    return loans.filter(
      (l) =>
        (l.employee_name || "").toLowerCase().includes(q) ||
        (l.employee_id_no || "").toLowerCase().includes(q) ||
        (l.loan_type || "").toLowerCase().includes(q) ||
        (l.department || "").toLowerCase().includes(q) ||
        (l.purpose || "").toLowerCase().includes(q),
    )
  }, [loans, search])

  const stats = useMemo(() => {
    const active = loans.filter((l) => l.status === "active" || l.status === "approved")
    const pending = loans.filter((l) => l.status === "pending")
    const outstanding = active.reduce((sum, l) => sum + Number(l.remaining_balance || 0), 0)
    const monthly = active.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0)
    return {
      total: loans.length,
      active: active.length,
      pending: pending.length,
      outstanding,
      monthly,
    }
  }, [loans])

  const resetCreateForm = () => {
    setEmployeeId("")
    setPrincipal("")
    setStartDate(new Date().toISOString().split("T")[0])
    setPurpose("")
    setNotes("")
    setAutoDeduct(true)
    setActivateNow(true)
    applyLoanTypeDefaults(loanTypes[0] || null)
  }

  const openCreateDialog = async () => {
    try {
      if (companyId) {
        const types = await loadLoanTypes(companyId)
        if (!types.length) {
          toast({
            title: "No loan types configured",
            description: "Create a loan type first under Loan Types.",
            variant: "destructive",
          })
          return
        }
        applyLoanTypeDefaults(types.find((t) => t.id === loanTypeId) || types[0])
      }
      setShowCreate(true)
    } catch (err) {
      toast({
        title: "Could not load loan types",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    }
  }

  const handleCreate = async () => {
    if (!companyId || !employeeId) {
      toast({ title: "Select an employee", variant: "destructive" })
      return
    }
    if (!loanTypeId || !selectedLoanType) {
      toast({
        title: "Select a loan type",
        description: "Loan types are loaded from the database. Configure them under Loan Types.",
        variant: "destructive",
      })
      return
    }
    const p = Number(principal)
    const months = Number(repaymentMonths)
    if (!p || p <= 0 || !months || months <= 0) {
      toast({ title: "Enter a valid principal and tenure", variant: "destructive" })
      return
    }
    if (p < Number(selectedLoanType.min_amount) || p > Number(selectedLoanType.max_amount)) {
      toast({
        title: "Principal out of range",
        description: `${selectedLoanType.name} allows GHS ${selectedLoanType.min_amount} – ${selectedLoanType.max_amount}`,
        variant: "destructive",
      })
      return
    }
    if (
      months < Number(selectedLoanType.min_tenure_months) ||
      months > Number(selectedLoanType.max_tenure_months)
    ) {
      toast({
        title: "Tenure out of range",
        description: `${selectedLoanType.name} allows ${selectedLoanType.min_tenure_months} – ${selectedLoanType.max_tenure_months} months`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company_id: companyId,
          employee_id: employeeId,
          loan_type_id: loanTypeId,
          loan_type: selectedLoanType.name,
          purpose: purpose || null,
          principal: p,
          interest_rate: Number(interestRate) || 0,
          repayment_months: months,
          start_date: startDate,
          auto_deduct: autoDeduct,
          notes: notes || null,
          activate: activateNow,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to create loan")

      toast({
        title: activateNow ? "Loan created and activated" : "Loan application created",
        description: activateNow
          ? "It will appear as a payroll deduction for the employee."
          : "Approve it when ready to disburse.",
      })
      setShowCreate(false)
      resetCreateForm()
      await loadLoans(companyId, statusFilter)
    } catch (err) {
      toast({
        title: "Could not create loan",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (loan: Loan) => {
    setDetailLoan(loan)
    setDetailLoading(true)
    setSchedule([])
    try {
      const res = await fetch(`/api/loans/${loan.id}?company_id=${encodeURIComponent(companyId)}`, {
        cache: "no-store",
        credentials: "include",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load loan details")
      setDetailLoan(json.loan || loan)
      setSchedule(Array.isArray(json.schedule) ? json.schedule : [])
    } catch (err) {
      toast({
        title: "Could not load loan details",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const runAction = async (loan: Loan, action: "approve" | "reject" | "cancel", reason?: string) => {
    setActionLoading(`${loan.id}:${action}`)
    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company_id: companyId,
          action,
          rejection_reason: reason,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Failed to ${action} loan`)
      toast({ title: json.message || `Loan ${action}d` })
      setRejectLoan(null)
      setRejectReason("")
      if (detailLoan?.id === loan.id) setDetailLoan(null)
      await loadLoans(companyId, statusFilter)
    } catch (err) {
      toast({
        title: `Could not ${action} loan`,
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && !loans.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Loans</h1>
          <p className="text-muted-foreground">
            Create, approve, and track staff loans deducted through payroll
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/settings/loan-settings">
              <Settings2 className="mr-2 h-4 w-4" />
              Loan Types
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => void openCreateDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            New Loan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active loans</CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.pending} awaiting approval
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding balance</CardDescription>
            <CardTitle className="text-2xl">{money(stats.outstanding)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Across active loans</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly deductions</CardDescription>
            <CardTitle className="text-2xl">{money(stats.monthly)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Synced into pay inputs</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>All loans</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Company-wide records</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Loan register</CardTitle>
            <CardDescription>Loaded from the employee_loans database table</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-full pl-8 sm:w-64"
                placeholder="Search employee, type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Banknote className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No loans found</p>
                <p className="text-sm text-muted-foreground">
                  Create a loan for an employee to start payroll deductions.
                </p>
              </div>
              <Button onClick={() => void openCreateDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                New Loan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Tenure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="font-medium">{loan.employee_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {loan.employee_id_no || loan.employee_id}
                          {loan.department ? ` · ${loan.department}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{loan.loan_type}</div>
                        {loan.auto_deduct ? (
                          <div className="text-xs text-muted-foreground">Payroll deduct</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">{money(loan.principal)}</TableCell>
                      <TableCell className="text-right">{money(loan.monthly_payment)}</TableCell>
                      <TableCell className="text-right">{money(loan.remaining_balance)}</TableCell>
                      <TableCell>{loan.repayment_months} mo</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(loan.status)} className="capitalize">
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => void openDetail(loan)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {loan.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading === `${loan.id}:approve`}
                                onClick={() => void runAction(loan, "approve")}
                              >
                                {actionLoading === `${loan.id}:approve` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectLoan(loan)
                                  setRejectReason("")
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create employee loan</DialogTitle>
            <DialogDescription>
              Loans marked active sync into payroll pay inputs as monthly deductions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {employeeLabel(e)}
                      {e.employee_id ? ` (${e.employee_id})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Loan type</Label>
                {loanTypes.length ? (
                  <Select
                    value={loanTypeId}
                    onValueChange={(id) => {
                      const type = loanTypes.find((t) => t.id === id)
                      applyLoanTypeDefaults(type || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type from database" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                    No loan types in database.{" "}
                    <Link href="/app/settings/loan-settings" className="underline">
                      Create loan types
                    </Link>
                  </div>
                )}
                {selectedLoanType ? (
                  <p className="text-xs text-muted-foreground">
                    Range GHS {selectedLoanType.min_amount}–{selectedLoanType.max_amount} ·{" "}
                    {selectedLoanType.min_tenure_months}–{selectedLoanType.max_tenure_months} months ·{" "}
                    {selectedLoanType.annual_interest_rate}% p.a.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Principal (GHS)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="2000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Interest % / yr</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tenure (months)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={repaymentMonths}
                  onChange={(e) => setRepaymentMonths(e.target.value)}
                />
              </div>
            </div>

            {preview ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated monthly payment</span>
                  <span className="font-semibold">{money(monthlyPreview)}</span>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Purpose</Label>
              <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={autoDeduct} onCheckedChange={(v) => setAutoDeduct(Boolean(v))} />
                Auto-deduct from payroll
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={activateNow} onCheckedChange={(v) => setActivateNow(Boolean(v))} />
                Activate immediately (skip pending approval)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={Boolean(detailLoan)} onOpenChange={(open) => !open && setDetailLoan(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Loan details</DialogTitle>
            <DialogDescription>
              {detailLoan?.employee_name} · {detailLoan?.loan_type}
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !detailLoan ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Principal</div>
                  <div className="font-semibold">{money(detailLoan.principal)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Monthly</div>
                  <div className="font-semibold">{money(detailLoan.monthly_payment)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="font-semibold">{money(detailLoan.remaining_balance)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant={statusVariant(detailLoan.status)} className="mt-1 capitalize">
                    {detailLoan.status}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Interest: </span>
                  {Number(detailLoan.interest_rate || 0)}% p.a.
                </div>
                <div>
                  <span className="text-muted-foreground">Tenure: </span>
                  {detailLoan.repayment_months} months
                </div>
                <div>
                  <span className="text-muted-foreground">Start: </span>
                  {detailLoan.start_date || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Paid so far: </span>
                  {money(detailLoan.amount_paid)}
                </div>
                {detailLoan.purpose ? (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Purpose: </span>
                    {detailLoan.purpose}
                  </div>
                ) : null}
                {detailLoan.rejection_reason ? (
                  <div className="sm:col-span-2 text-red-600">
                    Rejection reason: {detailLoan.rejection_reason}
                  </div>
                ) : null}
              </div>

              {detailLoan.status === "pending" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={actionLoading === `${detailLoan.id}:approve`}
                    onClick={() => void runAction(detailLoan, "approve")}
                  >
                    {actionLoading === `${detailLoan.id}:approve` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve & activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectLoan(detailLoan)
                      setRejectReason("")
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Clock3 className="h-4 w-4" />
                  Amortization schedule
                </div>
                <div className="max-h-72 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Payment</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((row) => (
                        <TableRow key={row.id || row.month_number}>
                          <TableCell>{row.month_number}</TableCell>
                          <TableCell>{row.due_date}</TableCell>
                          <TableCell className="text-right">{money(row.payment_amount)}</TableCell>
                          <TableCell className="text-right">{money(row.principal_portion)}</TableCell>
                          <TableCell className="text-right">{money(row.interest_portion)}</TableCell>
                          <TableCell className="text-right">{money(row.balance_remaining)}</TableCell>
                          <TableCell className="capitalize">{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejectLoan)} onOpenChange={(open) => !open && setRejectLoan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject loan</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {rejectLoan?.employee_name}&apos;s loan application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectLoan(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || !rejectLoan || actionLoading === `${rejectLoan.id}:reject`}
              onClick={() => rejectLoan && void runAction(rejectLoan, "reject", rejectReason.trim())}
            >
              {actionLoading === `${rejectLoan?.id}:reject` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reject loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
