"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { calcMonthlyPayment, buildAmortizationPreview } from "@/lib/services/loan-service"
import {
  CreditCard, Plus, Calendar, DollarSign, Clock,
  CheckCircle, AlertCircle, XCircle, RefreshCw, Eye,
} from "lucide-react"

interface LoanRecord {
  id: string
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
  status: string
  rejection_reason: string | null
  created_at: string
}

const LOAN_TYPES = ["Personal Loan", "Salary Advance", "Emergency Loan", "Education Loan", "Equipment Loan"]
const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-blue-100 text-blue-800",
  active:    "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  rejected:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
}

function fmtGHS(n: number) { return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export default function SSLoansPage() {
  const [loans, setLoans]             = useState<LoanRecord[]>([])
  const [loading, setLoading]         = useState(true)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [selected, setSelected]       = useState<LoanRecord | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [companyId, setCompanyId]     = useState<string>("")
  const [employeeId, setEmployeeId]   = useState<string>("")

  const [form, setForm] = useState({
    loan_type: "", amount: "", repayment_months: "", purpose: "", notes: "",
  })

  const supabase = createClient()

  const loadLoans = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmployeeId(user.id)

      // Get company_id from employees table
      const { data: emp } = await supabase
        .from("employees").select("company_id").eq("id", user.id).single()
      if (emp?.company_id) setCompanyId(emp.company_id)

      const res = await fetch(`/api/loans?employee_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setLoans(data.loans ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLoans() }, [loadLoans])

  const previewMonthly = form.amount && form.repayment_months
    ? calcMonthlyPayment(Number(form.amount), 0, Number(form.repayment_months))
    : null

  const amortizationPreview = selected && selected.status === "pending"
    ? buildAmortizationPreview(
        selected.principal, selected.interest_rate,
        selected.repayment_months, selected.start_date ?? new Date().toISOString().split("T")[0],
      )
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.loan_type || !form.amount || !form.repayment_months) {
      toast({ title: "Missing fields", description: "Loan type, amount and duration are required.", variant: "destructive" })
      return
    }
    if (!employeeId || !companyId) {
      toast({ title: "Not authenticated", description: "Please reload and try again.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id:      employeeId,
          company_id:       companyId,
          loan_type:        form.loan_type,
          purpose:          form.purpose || null,
          principal:        Number(form.amount),
          interest_rate:    0,
          repayment_months: Number(form.repayment_months),
          notes:            form.notes || null,
          auto_deduct:      true,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Loan Request Submitted", description: "Your request has been submitted for HR review." })
      setDialogOpen(false)
      setForm({ loan_type: "", amount: "", repayment_months: "", purpose: "", notes: "" })
      loadLoans()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Cancelled", description: "Loan request cancelled." })
      loadLoans()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setCancellingId(null)
    }
  }

  const activeLoans    = loans.filter((l) => l.status === "active")
  const totalBalance   = activeLoans.reduce((s, l) => s + l.remaining_balance, 0)
  const monthlyTotal   = activeLoans.reduce((s, l) => s + l.monthly_payment, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Requests</h1>
          <p className="text-muted-foreground">Manage your loan applications and track repayments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadLoans} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Loan Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Submit Loan Request</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Loan Type *</Label>
                  <Select value={form.loan_type} onValueChange={(v) => setForm((f) => ({ ...f, loan_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (GHS) *</Label>
                  <Input type="number" min="100" placeholder="e.g. 5000"
                    value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <Label>Repayment Duration *</Label>
                  <Select value={form.repayment_months} onValueChange={(v) => setForm((f) => ({ ...f, repayment_months: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select months" /></SelectTrigger>
                    <SelectContent>
                      {[3,6,12,18,24,36].map((m) => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {previewMonthly && (
                  <p className="text-sm bg-muted rounded-lg p-3">
                    Estimated monthly deduction: <strong>{fmtGHS(previewMonthly)}</strong>
                  </p>
                )}
                <div>
                  <Label>Purpose</Label>
                  <Input placeholder="Brief purpose of loan"
                    value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
                </div>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea placeholder="Any additional details..."
                    value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
                  Loan requests require HR Manager approval. You will be notified once reviewed.
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Loans",       value: String(activeLoans.length), icon: CreditCard, color: "text-blue-600" },
          { label: "Outstanding Balance", value: fmtGHS(totalBalance),      icon: DollarSign, color: "text-red-600"  },
          { label: "Monthly Deductions",  value: fmtGHS(monthlyTotal),      icon: Calendar,   color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{loading ? "—" : value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loan History */}
      <Card>
        <CardHeader><CardTitle>Loan History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No loan applications yet</p>
              <p className="text-sm">Click &quot;New Loan Request&quot; to apply.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div key={loan.id} className="border rounded-lg p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{loan.loan_type}</p>
                      <p className="text-sm text-muted-foreground">{loan.purpose ?? "No purpose specified"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[loan.status] ?? "bg-gray-100"}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => { setSelected(loan); setScheduleOpen(true) }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {loan.status === "pending" && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"
                          disabled={cancellingId === loan.id}
                          onClick={() => handleCancel(loan.id)}>
                          {cancellingId === loan.id ? <Clock className="w-4 h-4 animate-spin" /> : "Cancel"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Principal</p><p className="font-medium">{fmtGHS(loan.principal)}</p></div>
                    <div><p className="text-muted-foreground">Monthly</p><p className="font-medium">{fmtGHS(loan.monthly_payment)}</p></div>
                    <div><p className="text-muted-foreground">Paid</p><p className="font-medium text-green-600">{fmtGHS(loan.amount_paid)}</p></div>
                    <div><p className="text-muted-foreground">Balance</p><p className="font-medium text-red-600">{fmtGHS(loan.remaining_balance)}</p></div>
                  </div>
                  {loan.status === "active" && loan.principal > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Repayment Progress</span>
                        <span>{Math.round((loan.amount_paid / loan.principal) * 100)}%</span>
                      </div>
                      <Progress value={(loan.amount_paid / loan.principal) * 100} className="h-1.5" />
                    </div>
                  )}
                  {loan.rejection_reason && (
                    <p className="text-xs text-red-600 mt-2">Rejection reason: {loan.rejection_reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amortization Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Loan Details — {selected?.loan_type}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Principal</span><p className="font-semibold">{fmtGHS(selected.principal)}</p></div>
                <div><span className="text-muted-foreground">Monthly Payment</span><p className="font-semibold">{fmtGHS(selected.monthly_payment)}</p></div>
                <div><span className="text-muted-foreground">Duration</span><p className="font-semibold">{selected.repayment_months} months</p></div>
                <div><span className="text-muted-foreground">Balance</span><p className="font-semibold text-red-600">{fmtGHS(selected.remaining_balance)}</p></div>
              </div>
              <div>
                <p className="font-semibold mb-2 text-sm">Amortization Schedule (Preview)</p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
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
                          <TableCell className="text-muted-foreground">{row.month_number}</TableCell>
                          <TableCell>{new Date(row.due_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{fmtGHS(row.payment_amount)}</TableCell>
                          <TableCell className="text-right">{fmtGHS(row.principal_portion)}</TableCell>
                          <TableCell className="text-right">{fmtGHS(row.balance_remaining)}</TableCell>
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
    </div>
  )
}
