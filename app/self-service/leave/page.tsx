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
import { CalendarPlus, Loader2, X } from "lucide-react"
import {
  usePortalMe,
  usePortalResource,
  portalMutate,
  formatDate,
} from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatusBadge,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
} from "@/components/self-service/portal-ui"

function workingDays(start: string, end: string) {
  if (!start || !end) return 0
  const from = new Date(start)
  const to = new Date(end)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return 0
  let days = 0
  const cursor = new Date(from)
  while (cursor <= to) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export default function LeavePage() {
  const { data: me } = usePortalMe()
  const { data, error, isLoading, mutate } = usePortalResource<any>(
    me ? "/api/self-service/leave" : null,
  )

  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [form, setForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" })

  const days = useMemo(
    () => workingDays(form.start_date, form.end_date),
    [form.start_date, form.end_date],
  )

  if (error) return <ErrorBlock error={error} />
  if (isLoading || !data) return <LoadingBlock rows={4} />

  const requests = data.requests || []
  const balances = data.balances || []
  const leaveTypes = data.leave_types || []

  const submit = async () => {
    setSubmitting(true)
    try {
      await portalMutate("/api/self-service/leave", "POST", { ...form, days_requested: days })
      toast({ title: "Leave requested", description: `${days} working day(s) sent for approval.` })
      setOpen(false)
      setForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" })
      mutate()
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const cancel = async (id: string) => {
    setCancellingId(id)
    try {
      await portalMutate("/api/self-service/leave", "PATCH", { id })
      toast({ title: "Request cancelled" })
      mutate()
    } catch (err) {
      toast({
        title: "Could not cancel",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Leave"
        description="Check your balances, request time off and track approvals."
        action={
          <Button onClick={() => setOpen(true)} disabled={!leaveTypes.length}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Request leave
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balances for {data.year}</CardTitle>
          <CardDescription>Entitlements come from your HR leave policy</CardDescription>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <EmptyState
              title="No leave balance recorded"
              description="HR has not allocated leave entitlements to you for this year yet."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {balances.map((b: any) => {
                const entitled = Number(b.entitled_days || 0)
                const used = Number(b.used_days || 0)
                const pct = entitled ? Math.min(100, (used / entitled) * 100) : 0
                return (
                  <div key={b.id} className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-slate-900">{b.leave_type_name}</span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {Number(b.remaining_days || 0)} left
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <span className="text-xs text-slate-500">
                      {used} used of {entitled} days
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My requests</CardTitle>
          <CardDescription>{requests.length} request(s) on record</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <EmptyState
              title="No leave requests"
              description="Use the request button to book time off."
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {requests.map((r: any) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{r.leave_type_name}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(r.start_date)} – {formatDate(r.end_date)} ·{" "}
                      {Number(r.days_requested || 0)} day(s)
                    </p>
                    {r.reason && <p className="mt-1 text-xs text-slate-500">{r.reason}</p>}
                    {r.rejection_reason && (
                      <p className="mt-1 text-xs text-rose-600">Reason: {r.rejection_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {String(r.status).toLowerCase() === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={cancellingId === r.id}
                        onClick={() => cancel(r.id)}
                      >
                        {cancellingId === r.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-1 h-4 w-4" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>
              Weekends are excluded automatically from the day count.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="leave-type">Leave type</Label>
              <Select
                value={form.leave_type_id}
                onValueChange={(v) => setForm({ ...form, leave_type_id: v })}
              >
                <SelectTrigger id="leave-type">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.is_paid === false ? " (unpaid)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end">End date</Label>
                <Input
                  id="end"
                  type="date"
                  min={form.start_date || undefined}
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            {days > 0 && (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {days} working day(s) will be requested.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Give your approver useful context"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting || !form.leave_type_id || days <= 0}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
