"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Users,
  CalendarCheck,
  UserPlus,
  Wallet,
  GraduationCap,
  Target,
  HeartHandshake,
  Scale,
  ShieldAlert,
  Network,
  Download,
  RefreshCw,
  Loader2,
  Database,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import type { CategoryReport, HrFormulaReportBundle, MetricResult } from "@/lib/services/hr-formula-reports"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  workforce: Users,
  attendance: CalendarCheck,
  recruitment: UserPlus,
  compensation: Wallet,
  training: GraduationCap,
  performance: Target,
  engagement: HeartHandshake,
  relations: Scale,
  safety: ShieldAlert,
  general: Network,
}

const ACCENTS: Record<string, string> = {
  workforce: "bg-sky-50 text-sky-800 border-sky-100",
  attendance: "bg-emerald-50 text-emerald-800 border-emerald-100",
  recruitment: "bg-blue-50 text-blue-800 border-blue-100",
  compensation: "bg-amber-50 text-amber-900 border-amber-100",
  training: "bg-teal-50 text-teal-800 border-teal-100",
  performance: "bg-rose-50 text-rose-800 border-rose-100",
  engagement: "bg-indigo-50 text-indigo-800 border-indigo-100",
  relations: "bg-stone-50 text-stone-800 border-stone-200",
  safety: "bg-lime-50 text-lime-900 border-lime-100",
  general: "bg-slate-50 text-slate-800 border-slate-200",
}

function formatValue(m: MetricResult): string {
  if (m.value == null || Number.isNaN(m.value)) return "—"
  switch (m.unit) {
    case "percent":
      return `${Number(m.value).toFixed(1)}%`
    case "currency":
      return `GHS ${Number(m.value).toLocaleString("en-GH", { maximumFractionDigits: 2 })}`
    case "days":
      return `${Number(m.value).toFixed(1)} days`
    case "hours":
      return `${Number(m.value).toFixed(1)} hrs`
    case "ratio":
      return Number(m.value).toFixed(2)
    case "rate":
      return Number(m.value).toLocaleString("en-GH", { maximumFractionDigits: 2 })
    default:
      return String(m.value)
  }
}

function statusBadge(status: MetricResult["dataStatus"]) {
  if (status === "ok") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Live</Badge>
  if (status === "partial")
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partial</Badge>
  if (status === "no_data")
    return <Badge variant="outline" className="text-slate-500">No data</Badge>
  return <Badge variant="destructive">Error</Badge>
}

function defaultMonthBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export function HrFormulaReportsPanel({
  compact = false,
  categoryFilter,
}: {
  compact?: boolean
  categoryFilter?: string[]
}) {
  const bounds = defaultMonthBounds()
  const [periodStart, setPeriodStart] = useState(bounds.start)
  const [periodEnd, setPeriodEnd] = useState(bounds.end)
  const [bundle, setBundle] = useState<HrFormulaReportBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        period_start: periodStart,
        period_end: periodEnd,
      })
      const res = await fetch(`/api/analytics/hr-formulas?${qs}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load formula reports")
      setBundle(data as HrFormulaReportBundle)
      if (!activeCategory && data.categories?.[0]?.id) {
        setActiveCategory(data.categories[0].id)
      }
    } catch (err) {
      toast({
        title: "Formula reports failed",
        description: err instanceof Error ? err.message : "Could not compute reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [periodStart, periodEnd, activeCategory])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodStart, periodEnd])

  const categories = (bundle?.categories || []).filter((c) =>
    categoryFilter ? categoryFilter.includes(c.id) : true,
  )
  const visible = compact ? categories.slice(0, 4) : categories
  const selected: CategoryReport | undefined =
    visible.find((c) => c.id === activeCategory) || visible[0]

  const persistAndDownload = async (category: CategoryReport) => {
    setSavingId(category.id)
    try {
      await fetch("/api/analytics/hr-formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          category: category.id,
          persist: true,
        }),
      })

      const qs = new URLSearchParams({
        period_start: periodStart,
        period_end: periodEnd,
        category: category.id,
        format: "csv",
      })
      const res = await fetch(`/api/analytics/hr-formulas?${qs}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("CSV download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hr-${category.id}-${periodStart}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: `${category.title} report ready`,
        description: "Saved to database and downloaded as CSV.",
      })
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export report",
        variant: "destructive",
      })
    } finally {
      setSavingId(null)
    }
  }

  if (compact) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">HR Formula Reports</CardTitle>
              <CardDescription>Live metrics from portal data for this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !bundle ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Computing formulas…
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((cat) => {
                const Icon = ICONS[cat.id] || Database
                return (
                  <div key={cat.id} className={`rounded-xl border p-3 ${ACCENTS[cat.id] || ACCENTS.general}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <h3 className="text-sm font-semibold">{cat.title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {cat.metrics.slice(0, 3).map((m) => (
                        <li key={m.id} className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5">
                          <span className="text-xs font-medium text-slate-700">{m.name.replace(/ \(.+\)$/, "")}</span>
                          <span className="text-xs font-bold text-slate-900">{formatValue(m)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg">HR Formula Reports</CardTitle>
              <CardDescription>
                Each cheat-sheet heading is a live report computed from your company database.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="hf-start" className="text-xs">
                  Period start
                </Label>
                <Input
                  id="hf-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <Label htmlFor="hf-end" className="text-xs">
                  Period end
                </Label>
                <Input
                  id="hf-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2">
        {visible.map((cat) => {
          const Icon = ICONS[cat.id] || Database
          const active = (selected?.id || "") === cat.id
          return (
            <Button
              key={cat.id}
              size="sm"
              variant={active ? "default" : "outline"}
              className={active ? "bg-teal-600 hover:bg-teal-700" : ""}
              onClick={() => setActiveCategory(cat.id)}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {cat.title}
            </Button>
          )
        })}
      </div>

      {loading && !selected ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Computing formula reports from portal data…
          </CardContent>
        </Card>
      ) : selected ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                {(() => {
                  const Icon = ICONS[selected.id] || Database
                  return <Icon className="h-5 w-5 text-teal-700" />
                })()}
                {selected.title} Report
              </CardTitle>
              <CardDescription>
                {selected.description} · {periodStart} → {periodEnd}
              </CardDescription>
            </div>
            <Button
              className="bg-teal-600 hover:bg-teal-700 gap-2"
              onClick={() => void persistAndDownload(selected)}
              disabled={savingId === selected.id}
            >
              {savingId === selected.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Save & Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {selected.metrics.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl border p-4 ${ACCENTS[selected.id] || ACCENTS.general}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-600">{m.formula}</p>
                    </div>
                    {statusBadge(m.dataStatus)}
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">{formatValue(m)}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    {Object.entries(m.inputs || {})
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <span key={k}>
                          <span className="capitalize text-slate-500">{k.replace(/([A-Z])/g, " $1")}:</span>{" "}
                          <span className="font-medium text-slate-800">{String(v ?? "—")}</span>
                        </span>
                      ))}
                  </div>
                  {m.note ? (
                    <p className="mt-2 flex items-start gap-1 text-[11px] text-amber-800">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {m.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No formula categories available.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
