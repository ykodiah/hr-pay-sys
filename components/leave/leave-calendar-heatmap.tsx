"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

function currentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function heatColor(heat: number, pending: number) {
  if (heat <= 0 && pending <= 0) return "bg-slate-50 text-slate-400"
  if (heat >= 0.75) return "bg-rose-500 text-white"
  if (heat >= 0.45) return "bg-orange-400 text-white"
  if (heat >= 0.2) return "bg-amber-200 text-amber-950"
  if (heat > 0) return "bg-teal-100 text-teal-900"
  return "bg-sky-50 text-sky-800" // pending only
}

export function LeaveCalendarHeatmap() {
  const [month, setMonth] = useState(currentMonth())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leave/calendar?month=${month}`, {
        credentials: "include",
        cache: "no-store",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load calendar")
      setData(json)
      setSelected(null)
    } catch (e: any) {
      toast({ title: "Calendar failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const weeks = useMemo(() => {
    const days = data?.days || []
    if (!days.length) return []
    const firstDow = days[0].weekday // 0=Sun
    const pad: any[] = Array.from({ length: firstDow }, (_, i) => ({ empty: true, key: `pad-${i}` }))
    const cells = [...pad, ...days]
    const rows: any[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7))
    }
    while (rows.length && rows[rows.length - 1].length < 7) {
      rows[rows.length - 1].push({ empty: true, key: `tail-${rows[rows.length - 1].length}` })
    }
    return rows
  }, [data])

  const weekSummary = useMemo(() => {
    return weeks.map((row, wi) => {
      const filled = row.filter((c) => !c.empty)
      const total = filled.reduce((s, c) => s + (c.count || 0), 0)
      const peak = Math.max(0, ...filled.map((c) => c.count || 0))
      return { week: wi + 1, total, peak, people: peak }
    })
  }, [weeks])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Leave calendar heat map</h2>
          <p className="text-sm text-muted-foreground">
            Who&apos;s out by day and week — darker cells mean more people on approved leave.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[7rem] text-center text-sm font-medium">{month}</span>
          <Button variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {data?.summary ? (
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-teal-100 text-teal-900">{data.summary.people_out} people out</Badge>
          <Badge className="bg-emerald-100 text-emerald-900">{data.summary.approved} approved spans</Badge>
          <Badge className="bg-amber-100 text-amber-900">{data.summary.pending} pending</Badge>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3 max-w-4xl">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm">Month heat map</CardTitle>
            <CardDescription className="text-xs">Click a day to see who is out</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-3">
            {loading && !data ? (
              <div className="flex items-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                <div className="mb-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px] font-medium uppercase text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="space-y-0.5 max-w-md">
                  {weeks.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-7 gap-0.5">
                      {row.map((cell, ci) =>
                        cell.empty ? (
                          <div key={cell.key || `e-${ri}-${ci}`} className="h-8 rounded bg-transparent" />
                        ) : (
                          <button
                            key={cell.date}
                            type="button"
                            onClick={() => setSelected(cell)}
                            className={`h-8 rounded px-1 text-left transition hover:ring-2 hover:ring-teal-500 ${heatColor(
                              cell.heat || 0,
                              cell.pending_count || 0,
                            )} ${selected?.date === cell.date ? "ring-2 ring-teal-600" : ""}`}
                            title={`${cell.date}: ${cell.count} out`}
                          >
                            <div className="text-[10px] font-semibold leading-none">{cell.day}</div>
                            <div className="text-[9px] opacity-90 leading-none mt-0.5">{cell.count || "·"}</div>
                          </button>
                        ),
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Heat:</span>
                  <span className="rounded bg-slate-50 px-2 py-0.5">0</span>
                  <span className="rounded bg-teal-100 px-2 py-0.5">low</span>
                  <span className="rounded bg-amber-200 px-2 py-0.5">med</span>
                  <span className="rounded bg-orange-400 px-2 py-0.5 text-white">high</span>
                  <span className="rounded bg-rose-500 px-2 py-0.5 text-white">peak</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly load</CardTitle>
              <CardDescription>Total leave-days counted per calendar week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {weekSummary.map((w) => (
                <div key={w.week} className="flex items-center gap-2 text-sm">
                  <span className="w-16 text-muted-foreground">Week {w.week}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${Math.min(100, (w.total / Math.max(1, weekSummary[0]?.total || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{w.total}</span>
                </div>
              ))}
              {!weekSummary.length ? (
                <p className="text-sm text-muted-foreground">No weeks yet.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selected ? selected.date : "Day detail"}
              </CardTitle>
              <CardDescription>
                {selected ? `${selected.count} approved · ${selected.pending_count || 0} pending` : "Select a day"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-auto">
              {(selected?.people || []).map((p: any, i: number) => (
                <div key={`${p.id}-${i}`} className="rounded-md border px-3 py-2 text-sm">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.leave_type}
                    {p.department ? ` · ${p.department}` : ""}
                  </p>
                </div>
              ))}
              {selected && !(selected.people || []).length ? (
                <p className="text-sm text-muted-foreground">Nobody on approved leave this day.</p>
              ) : null}
              {!selected ? (
                <p className="text-sm text-muted-foreground">Pick a cell to inspect who&apos;s out.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
