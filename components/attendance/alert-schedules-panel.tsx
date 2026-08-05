"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, RefreshCw, Play, CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

export function AlertSchedulesPanel() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "Daily attendance scan",
    frequency: "daily",
    run_hour: "9",
    lookback_days: "1",
    is_active: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/attendance/alerts/schedules", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load schedules")
      setSchedules(data.schedules || [])
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/alerts/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          frequency: form.frequency,
          run_hour: Number(form.run_hour),
          lookback_days: Number(form.lookback_days),
          is_active: form.is_active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Save failed")
      toast({ title: "Schedule saved", description: "Cron endpoint will pick up due runs automatically." })
      setOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function runNow(scheduleId?: string) {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/alerts/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "run_now", schedule_id: scheduleId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Run failed")
      const created = (data.results || []).reduce((s: number, r: any) => s + (r.created || 0), 0)
      toast({
        title: "Schedule ran",
        description: `Created ${created} alert(s) across ${data.ran || 0} schedule(s)`,
      })
      await load()
    } catch (e: any) {
      toast({ title: "Run failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function toggle(sch: any) {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/alerts/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: sch.id,
          name: sch.name,
          frequency: sch.frequency,
          run_hour: sch.run_hour,
          lookback_days: sch.lookback_days,
          is_active: !sch.is_active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Update failed")
      await load()
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-teal-700" />
            Auto-schedule (cron)
          </h2>
          <p className="text-sm text-muted-foreground">
            Replace manual &quot;Run rules&quot; with hourly / daily / weekday scans. Point external cron at{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">/api/attendance/alerts/cron</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void runNow()}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
            Run due now
          </Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            New schedule
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {schedules.map((s) => (
            <Card key={s.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {s.frequency} · hour {s.run_hour ?? 9} · lookback {s.lookback_days ?? 1}d
                    </CardDescription>
                  </div>
                  <Badge className={s.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"}>
                    {s.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-slate-700">Last run</p>
                    <p>{s.last_run_at ? new Date(s.last_run_at).toLocaleString() : "Never"}</p>
                    <p>
                      {s.last_run_status || "—"}
                      {s.last_created_count != null ? ` · ${s.last_created_count} created` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Next run</p>
                    <p>{s.next_run_at ? new Date(s.next_run_at).toLocaleString() : "—"}</p>
                  </div>
                </div>
                {s.last_run_message ? (
                  <p className="rounded-md bg-slate-50 px-2 py-1.5 text-xs">{s.last_run_message}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                    <span className="text-xs">Active</span>
                    <Switch checked={!!s.is_active} onCheckedChange={() => void toggle(s)} disabled={busy} />
                  </div>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void runNow(s.id)}>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Run this
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!schedules.length ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No schedules yet. Create a daily scan so compliance alerts fire without clicking &quot;Run rules&quot;.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New alert schedule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Run hour (0–23)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.run_hour}
                  onChange={(e) => setForm({ ...form, run_hour: e.target.value })}
                />
              </div>
              <div>
                <Label>Lookback days</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.lookback_days}
                  onChange={(e) => setForm({ ...form, lookback_days: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
