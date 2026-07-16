"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { buildAmortizationPreview } from "@/lib/services/loan-calculations"
import {
  CreditCard, Plus, DollarSign, TrendingDown,
  CheckCircle, AlertCircle, Clock, Eye, X, RefreshCw, Search,
} from "lucide-react"

interface LoanRecord {
  id: string
  employee_id: string
  employee_name: string | null
  employee_id_no: string | null
  department: string | null
  loan_type: string
  purpose: string | null
  principal: number
  interest_rate: number
  repayment_months: number
  monthly_payment: number
  amount_paid: number
  remaining_balance: number
  start_date: string | null
  status: string
  rejection_reason: string | null
  created_at: string
}

const STATUS_MAP: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-blue-100 text-blue-800",
  active:    "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  rejected:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
}

function fmtGHS(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function initials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function AdminLoansPage() {
  const [loans, setLoans]               = useState<LoanRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState("requests")
  const [search, setSearch]             = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected]         = useState<LoanRecord | null>(null)
  const [detailOpen, setDetailOpen]     = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [newLoanOpen, setNewLoanOpen]   = useState(false)
  const [employees, setEmployees]       = useState<any[]>([])
  const [companyId, setCompanyId]       = useState("")

  // new loan form
  const [newForm, setNewForm] = useState({
    employee_id: "", loan_type: "Personal Loan", amount: "",
    interest_rate: "0", repayment_months: "12", purpose: "", notes: "",
  })
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  const loadLoans = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from("employees").select("company_id").eq("id", user.id).single()
      const cid = emp?.company_id ?? ""
      setCompanyId(cid)

      const params = new URLSearchParams()
      if (cid) params.set("company_id", cid)
      if (statusFilter !== "all") params.set("status", statusFilter)

      const res = await fetch(`/api/loans?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLoans(data.loans ?? [])
      }

      // Load employees for new loan form from shared employees API
      const empParams = new URLSearchParams({ status: "active", options: "true", limit: "500" })
      if (cid) empParams.set("company_id", cid)
      const empRes = await fetch(`/api/employees?${empParams}`, { cache: "no-store" })
      if (empRes.ok) {
        const empJson = await empRes.json()
        setEmployees(empJson.employees ?? empJson.data ?? [])
      } else {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, employee_id, department")
          .eq("company_id", cid)
          .in("status", ["Active", "active", "ACTIVE"])
          .order("first_name")
        setEmployees(emps ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { loadLoans() }, [loadLoans])

  const handleAction = async (id: string, action: "approve" | "reject", reason?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejection_reason: reason }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({
        title: action === "approve" ? "Loan Approved" : "Loan Rejected",
        description: action === "approve"
          ? "Loan approved and amortization schedule generated."
          : "Loan application rejected.",
        variant: action === "approve" ? "default" : "destructive",
      })
      setDetailOpen(false)
      setRejectReason("")
      loadLoans()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.employee_id || !newForm.amount || !companyId) {
      toast({ title: "Missing fields", description: "Employee and amount are required.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: newForm.employee_id, company_id: companyId,
          loan_type: newForm.loan_type, purpose: newForm.purpose || null,
          principal: Number(newForm.amount), interest_rate: Number(newForm.interest_rate),
          repayment_months: Number(newForm.repayment_months), notes: newForm.notes || null,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Loan Created", description: "Loan application created successfully." })
      setNewLoanOpen(false)
      setNewForm({ employee_id: "", loan_type: "Personal Loan", amount: "", interest_rate: "0", repayment_months: "12", purpose: "", notes: "" })
      loadLoans()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const filtered = loans.filter((l) => {
    const matchStatus = statusFilter === "all" || l.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || l.employee_name?.toLowerCase().includes(q) || l.loan_type.toLowerCase().includes(q) || l.employee_id_no?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const stats = {
    total:       loans.length,
    pending:     loans.filter((l) => l.status === "pending").length,
    active:      loans.filter((l) => l.status === "active").length,
    outstanding: loans.filter((l) => l.status === "active").reduce((s, l) => s + l.remaining_balance, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loans & Advances</h1>
          <p className="text-muted-foreground">Manage employee loans, approvals, and repayment schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadLoans} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setNewLoanOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />New Loan
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: stats.total,    icon: CreditCard,   color: "text-blue-600"   },
          { label: "Pending Review",     value: stats.pending,  icon: Clock,        color: "text-yellow-600" },
          { label: "Active Loans",       value: stats.active,   icon: CheckCircle,  color: "text-green-600"  },
          { label: "Outstanding (GHS)",  value: fmtGHS(stats.outstanding), icon: TrendingDown, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{loading ? "—" : value}</p>
                </div>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search employee, loan type..." className="pl-9"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["pending","active","completed","rejected","cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardHeader><CardTitle>Loan Applications ({loading ? "…" : filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No loan applications found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials(loan.employee_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{loan.employee_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{loan.department ?? loan.employee_id_no}</p>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{loan.loan_type}</p>
                    <p className="text-xs text-muted-foreground">{fmtGHS(loan.principal)}</p>
                  </div>

                  <div className="hidden lg:block text-sm text-muted-foreground">
                    {loan.repayment_months} months • {fmtGHS(loan.monthly_payment)}/mo
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={STATUS_MAP[loan.status] ?? "bg-gray-100"}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(loan); setDetailOpen(true) }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {loan.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          disabled={actionLoading}
                          onClick={() => handleAction(loan.id, "approve")}>
                          <CheckCircle className="w-4 h-4 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline"
                          className="text-red-700 border-red-300 hover:bg-red-50"
                          disabled={actionLoading}
                          onClick={() => { setSelected(loan); setDetailOpen(true) }}>
                          <X className="w-4 h-4 mr-1" />Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setRejectReason("") }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Loan Application Detail</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Employee</span><p className="font-semibold">{selected.employee_name}</p></div>
                <div><span className="text-muted-foreground">Department</span><p className="font-semibold">{selected.department ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Loan Type</span><p className="font-semibold">{selected.loan_type}</p></div>
                <div><span className="text-muted-foreground">Principal</span><p className="font-semibold">{fmtGHS(selected.principal)}</p></div>
                <div><span className="text-muted-foreground">Duration</span><p className="font-semibold">{selected.repayment_months} months</p></div>
                <div><span className="text-muted-foreground">Monthly Payment</span><p className="font-semibold">{fmtGHS(selected.monthly_payment)}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Purpose</span><p className="font-semibold">{selected.purpose ?? "Not specified"}</p></div>
              </div>

              {/* Amortization preview */}
              <div>
                <p className="font-semibold text-sm mb-2">Amortization Schedule</p>
                <div className="rounded-lg border overflow-hidden max-h-52 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Payment</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buildAmortizationPreview(
                        selected.principal, selected.interest_rate,
                        selected.repayment_months,
                        selected.start_date ?? new Date().toISOString().split("T")[0],
                      ).map((row) => (
                        <TableRow key={row.month_number}>
                          <TableCell className="text-muted-foreground text-xs">{row.month_number}</TableCell>
                          <TableCell className="text-sm">{new Date(row.due_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right text-sm">{fmtGHS(row.payment_amount)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtGHS(row.principal_portion)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtGHS(row.balance_remaining)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selected.status === "pending" && (
                <>
                  <div>
                    <Label>Rejection Reason (required to reject)</Label>
                    <Textarea placeholder="Enter rejection reason..."
                      value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={actionLoading || !rejectReason.trim()}
                      onClick={() => handleAction(selected.id, "reject", rejectReason)}>
                      {actionLoading ? "Processing..." : "Reject"}
                    </Button>
                    <Button disabled={actionLoading} onClick={() => handleAction(selected.id, "approve")}>
                      {actionLoading ? "Processing..." : "Approve"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Loan Dialog */}
      <Dialog open={newLoanOpen} onOpenChange={setNewLoanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Loan for Employee</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={newForm.employee_id} onValueChange={(v) => setNewForm((f) => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} — {e.employee_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loan Type</Label>
                <Select value={newForm.loan_type} onValueChange={(v) => setNewForm((f) => ({ ...f, loan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Personal Loan","Salary Advance","Emergency Loan","Education Loan"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (GHS) *</Label>
                <Input type="number" min="100" value={newForm.amount}
                  onChange={(e) => setNewForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Duration (months)</Label>
                <Select value={newForm.repayment_months} onValueChange={(v) => setNewForm((f) => ({ ...f, repayment_months: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3,6,12,18,24,36].map((m) => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input type="number" min="0" step="0.5" value={newForm.interest_rate}
                  onChange={(e) => setNewForm((f) => ({ ...f, interest_rate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Purpose</Label>
              <Textarea placeholder="Purpose of loan..." rows={2}
                value={newForm.purpose} onChange={(e) => setNewForm((f) => ({ ...f, purpose: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setNewLoanOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Loan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
