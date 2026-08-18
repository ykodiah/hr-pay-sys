"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Clock, Plus, TrendingUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { fetcher, postJson, patchJson, usePortalMe, formatMoney, formatDate } from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingBlock,
  ErrorBlock,
} from "@/components/self-service/portal-ui"

type OvertimeRequest = {
  id: string
  date: string | null
  hours_requested: number | null
  hours_approved: number | null
  reason: string | null
  rejection_reason: string | null
  status: string | null
  amount_earned: number | null
  rate_label: string | null
  multiplier_used: number | null
  approved_at: string | null
  created_at: string | null
}

type OvertimeRate = {
  id: string
  rate_type: string | null
  multiplier: number | null
  description: string | null
  is_active: boolean | null
}

type MonthlySummary = {
  month: string
  clocked: number
  requested: number
  approved: number
  pending: number
  earned: number
}

type OvertimeResponse = {
  requests: OvertimeRequest[]
  rates: OvertimeRate[]
  monthly_summary: MonthlySummary[]
  summary: { approved_hours: number; pending: number; total_earned: number }
}

export default function SelfServiceOvertimePage() {
  const { data: me } = usePortalMe()
  const { data, error, isLoading, mutate } = useSWR<OvertimeResponse>("/api/self-service/overtime", fetcher)

  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: "", hours_requested: "", rate_type_id: "", reason: "" })

  const currency = me?.company?.currency || "GHS"
  const requests = data?.requests ?? []
  const rates = useMemo(() => (data?.rates ?? []).filter((r) => r.is_active !== false), [data?.rates])

  const monthHours = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7)
    return requests
      .filter((r) => r.date?.startsWith(monthKey))
      .reduce((sum, r) => sum + Number(r.hours_approved ?? r.hours_requested ?? 0), 0)
  }, [requests])

  function resetForm() {
    setForm({ date: "", hours_requested: "", rate_type_id: "", reason: "" })
  }

  async function handleSubmit() {
    if (!form.date || !form.hours_requested || !form.reason.trim()) {
      toast.error("Date, hours and reason are all required")
      return
    }
    setSubmitting(true)
    try {
      await postJson("/api/self-service/overtime", {
        date: form.date,
        hours_requested: Number(form.hours_requested),
        rate_type_id: form.rate_type_id || null,
        reason: form.reason,
      })
      toast.success("Overtime submitted for approval")
      setOpen(false)
      resetForm()
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not submit overtime")
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelRequest(id: string) {
    setCancellingId(id)
    try {
      await patchJson("/api/self-service/overtime", { id })
      toast.success("Claim cancelled")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not cancel claim")
    } finally {
      setCancellingId(null)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading overtime records" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My overtime"
        description="Log extra hours worked and track approval and estimated pay."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hours this month" value={monthHours.toFixed(1)} icon={Clock} />
        <StatCard label="Approved hours" value={(data?.summary.approved_hours ?? 0).toFixed(1)} icon={TrendingUp} />
        <StatCard label="Pending approval" value={String(data?.summary.pending ?? 0)} icon={Clock} />
        <StatCard label="Total earned" value={formatMoney(data?.summary.total_earned, currency)} icon={TrendingUp} />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
        <h2 className="text-sm font-semibold text-card-foreground">How overtime works</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Clocked hours are attendance evidence. Hours beyond your scheduled shift are shown as clocked overtime,
          but they are not automatically payable. Submit a request for review; your manager or HR must approve it
          before payroll uses the configured overtime rate.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Monthly summary</h2>
          <p className="text-xs text-muted-foreground">Clocked evidence compared with submitted and approved overtime.</p>
        </div>
        {(data?.monthly_summary ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No overtime activity to summarize yet.</p>
        ) : (
          <div className="overflow-x-auto px-5 py-2">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr><th className="py-2">Month</th><th>Clocked</th><th>Requested</th><th>Approved</th><th>Pending</th><th>Earned</th></tr>
              </thead>
              <tbody>
                {data?.monthly_summary.map((row) => (
                  <tr key={row.month} className="border-t border-border">
                    <td className="py-3 font-medium">{row.month}</td>
                    <td>{row.clocked.toFixed(1)}h</td>
                    <td>{row.requested.toFixed(1)}h</td>
                    <td>{row.approved.toFixed(1)}h</td>
                    <td>{row.pending.toFixed(1)}h</td>
                    <td>{formatMoney(row.earned, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Request history</h2>
          <p className="text-xs text-muted-foreground">Every overtime claim you have raised.</p>
        </div>
        {requests.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No overtime logged"
            description="When you work beyond your scheduled hours, log it here so it reaches payroll."
          />
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((r) => {
              const isPending = String(r.status).toLowerCase() === "pending"
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-card-foreground">{formatDate(r.date)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Number(r.hours_approved ?? r.hours_requested ?? 0).toFixed(1)} hrs
                      {r.rate_label ? ` · ${r.rate_label}` : ""}
                      {r.multiplier_used ? ` (x${Number(r.multiplier_used).toFixed(2)})` : ""}
                    </span>
                    {r.reason ? <span className="truncate text-xs text-muted-foreground">{r.reason}</span> : null}
                    {r.rejection_reason ? (
                      <span className="text-xs text-destructive">Reason: {r.rejection_reason}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-card-foreground">
                        {formatMoney(r.amount_earned, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.approved_at ? `Approved ${formatDate(r.approved_at)}` : "Awaiting review"}
                      </p>
                    </div>
                    {isPending ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelRequest(r.id)}
                        disabled={cancellingId === r.id}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        {cancellingId === r.id ? "Cancelling" : "Cancel"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New overtime request</DialogTitle>
            <DialogDescription>
              Submit hours worked beyond your schedule. Your manager reviews it before payroll picks it up.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ot-date">Date *</Label>
                <Input
                  id="ot-date"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ot-hours">Hours *</Label>
                <Input
                  id="ot-hours"
                  type="number"
                  min="0.5"
                  max="16"
                  step="0.5"
                  placeholder="e.g. 2"
                  value={form.hours_requested}
                  onChange={(e) => setForm((f) => ({ ...f, hours_requested: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ot-type">Rate type</Label>
              {rates.length === 0 ? (
                <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Your company has not configured overtime rates yet. HR will apply the correct rate on approval.
                </p>
              ) : (
                <Select
                  value={form.rate_type_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, rate_type_id: v }))}
                >
                  <SelectTrigger id="ot-type">
                    <SelectValue placeholder="Let HR decide" />
                  </SelectTrigger>
                  <SelectContent>
                    {rates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.id}>
                        {rate.description || rate.rate_type}
                        {rate.multiplier ? ` (x${Number(rate.multiplier).toFixed(2)})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ot-reason">Reason / description *</Label>
              <Textarea
                id="ot-reason"
                rows={3}
                placeholder="Describe the work done during overtime"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
