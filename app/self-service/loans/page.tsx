"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
import { toast } from "@/hooks/use-toast"
import { CreditCard, Loader2, PlusCircle, Wallet, X } from "lucide-react"
import {
  usePortalMe,
  usePortalResource,
  portalMutate,
  formatMoney,
  formatDate,
} from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
} from "@/components/self-service/portal-ui"

function instalmentOf(principal: number, rate: number, months: number, type: string) {
  if (!principal || !months) return 0
  if (!rate) return principal / months
  if (String(type).toLowerCase() === "reducing") {
    const r = rate / 100 / 12
    if (!r) return principal / months
    return (principal * r) / (1 - Math.pow(1 + r, -months))
  }
  return (principal + principal * (rate / 100) * (months / 12)) / months
}

export default function LoansPage() {
  const { data: me } = usePortalMe()
  const { data, error, isLoading, mutate } = usePortalResource<any>(
    me ? "/api/self-service/loans" : null,
  )

  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    loan_type_id: "",
    principal: "",
    tenure_months: "",
    purpose: "",
  })

  const loanTypes = data?.loan_types || []
  const selectedType = loanTypes.find((t: any) => t.id === form.loan_type_id)

  const preview = useMemo(() => {
    const principal = Number(form.principal) || 0
    const months = Number(form.tenure_months) || 0
    const rate = Number(selectedType?.annual_interest_rate || 0)
    const monthly = instalmentOf(principal, rate, months, selectedType?.interest_type || "flat")
    return { monthly, total: monthly * months, interest: monthly * months - principal }
  }, [form.principal, form.tenure_months, selectedType])

  if (error) return <ErrorBlock error={error} />
  if (isLoading || !data) return <LoadingBlock rows={4} />

  const loans = data.loans || []
  const schedule = data.schedule || []

  const submit = async () => {
    setSubmitting(true)
    try {
      await portalMutate("/api/self-service/loans", "POST", {
        loan_type_id: form.loan_type_id,
        principal: Number(form.principal),
        tenure_months: Number(form.tenure_months),
        purpose: form.purpose,
      })
      toast({ title: "Application submitted", description: "HR will review your loan request." })
      setOpen(false)
      setForm({ loan_type_id: "", principal: "", tenure_months: "", purpose: "" })
      mutate()
    } catch (err) {
      toast({
        title: "Could not apply",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const withdraw = async (id: string) => {
    try {
      await portalMutate("/api/self-service/loans", "PATCH", { id })
      toast({ title: "Application withdrawn" })
      mutate()
    } catch (err) {
      toast({
        title: "Could not withdraw",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Loans"
        description="Apply for staff loans and track repayments deducted from your payroll."
        action={
          <Button onClick={() => setOpen(true)} disabled={!loanTypes.length}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Apply for a loan
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total outstanding"
          value={formatMoney(data.summary?.total_outstanding)}
          icon={CreditCard}
          tone={Number(data.summary?.total_outstanding) > 0 ? "warning" : "default"}
        />
        <StatCard label="Active loans" value={data.summary?.active_count || 0} icon={Wallet} />
        <StatCard
          label="Monthly salary on file"
          value={formatMoney(data.monthly_salary)}
          hint="Used for affordability checks"
        />
      </section>

      {!loanTypes.length && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5 text-sm text-amber-900">
            Your organisation has not published any loan products yet. Contact HR if you need a staff
            loan.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My loans</CardTitle>
          <CardDescription>{loans.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <EmptyState
              title="No loans yet"
              description="Your loan applications and balances will appear here."
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {loans.map((loan: any) => {
                const principal = Number(loan.principal_amount ?? loan.principal ?? 0)
                const outstanding = Number(loan.outstanding_balance ?? loan.remaining_balance ?? 0)
                const paid = Math.max(0, principal - outstanding)
                const pct = principal ? Math.min(100, (paid / principal) * 100) : 0
                const rows = schedule.filter((s: any) => s.loan_id === loan.id)
                return (
                  <li key={loan.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {loan.loan_type || "Staff loan"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatMoney(principal)} over{" "}
                          {loan.tenure_months || loan.repayment_months || 0} months ·{" "}
                          {Number(loan.interest_rate || 0)}% {loan.interest_type || "flat"}
                        </p>
                        {loan.purpose && (
                          <p className="mt-1 text-xs text-slate-500">Purpose: {loan.purpose}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={loan.status} />
                        {String(loan.status).toLowerCase() === "pending" && (
                          <Button size="sm" variant="ghost" onClick={() => withdraw(loan.id)}>
                            <X className="mr-1 h-4 w-4" />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>

                    {principal > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        <Progress value={pct} className="h-2" />
                        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                          <span>Repaid {formatMoney(paid)}</span>
                          <span>Outstanding {formatMoney(outstanding)}</span>
                          <span>
                            Monthly{" "}
                            {formatMoney(loan.monthly_installment ?? loan.monthly_payment ?? 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {rows.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-medium text-emerald-700">
                          Repayment schedule ({rows.length} instalments)
                        </summary>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-slate-500">
                              <tr>
                                <th className="py-1 pr-4">#</th>
                                <th className="py-1 pr-4">Due</th>
                                <th className="py-1 pr-4">Payment</th>
                                <th className="py-1 pr-4">Balance</th>
                                <th className="py-1">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((s: any) => (
                                <tr key={s.id} className="border-t">
                                  <td className="py-1.5 pr-4">{s.month_number}</td>
                                  <td className="py-1.5 pr-4">{formatDate(s.due_date)}</td>
                                  <td className="py-1.5 pr-4">{formatMoney(s.payment_amount)}</td>
                                  <td className="py-1.5 pr-4">{formatMoney(s.balance_remaining)}</td>
                                  <td className="py-1.5 capitalize">{s.status || "scheduled"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for a loan</DialogTitle>
            <DialogDescription>
              Limits and interest come from your organisation&apos;s loan policy.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="loan-type">Loan product</Label>
              <Select
                value={form.loan_type_id}
                onValueChange={(v) => {
                  const t = loanTypes.find((x: any) => x.id === v)
                  setForm({
                    ...form,
                    loan_type_id: v,
                    tenure_months: t?.default_tenure_months
                      ? String(t.default_tenure_months)
                      : form.tenure_months,
                  })
                }}
              >
                <SelectTrigger id="loan-type">
                  <SelectValue placeholder="Select a loan product" />
                </SelectTrigger>
                <SelectContent>
                  {loanTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {Number(t.annual_interest_rate || 0)}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType?.description && (
                <p className="text-xs text-slate-500">{selectedType.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="principal">Amount</Label>
                <Input
                  id="principal"
                  type="number"
                  min={selectedType?.min_amount || 0}
                  max={selectedType?.max_amount || undefined}
                  value={form.principal}
                  onChange={(e) => setForm({ ...form, principal: e.target.value })}
                />
                {selectedType && (
                  <p className="text-xs text-slate-500">
                    {formatMoney(selectedType.min_amount)} – {formatMoney(selectedType.max_amount)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tenure">Months</Label>
                <Input
                  id="tenure"
                  type="number"
                  min={selectedType?.min_tenure_months || 1}
                  max={selectedType?.max_tenure_months || undefined}
                  value={form.tenure_months}
                  onChange={(e) => setForm({ ...form, tenure_months: e.target.value })}
                />
                {selectedType && (
                  <p className="text-xs text-slate-500">
                    {selectedType.min_tenure_months || 1} – {selectedType.max_tenure_months || "—"}{" "}
                    months
                  </p>
                )}
              </div>
            </div>

            {preview.monthly > 0 && (
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimated monthly repayment</span>
                  <span className="font-semibold">{formatMoney(preview.monthly)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-600">Total interest</span>
                  <span>{formatMoney(preview.interest)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-600">Total payable</span>
                  <span>{formatMoney(preview.total)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                rows={3}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="What will the loan be used for?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                submitting ||
                !form.loan_type_id ||
                !Number(form.principal) ||
                !Number(form.tenure_months)
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
