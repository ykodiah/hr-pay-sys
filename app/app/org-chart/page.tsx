"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Network,
  RefreshCw,
  Save,
  Download,
  Eye,
  CheckCircle2,
  Loader2,
  Trash2,
  Sparkles,
  AlertTriangle,
} from "lucide-react"

type OrgChart = {
  id: string
  name: string
  description?: string | null
  chart_type: string
  chart_style: string
  subsidiary_id?: string | null
  scope?: string | null
  chart_data: any
  preview_image?: string | null
  source_employee_count?: number
  source_hash?: string | null
  is_active?: boolean
  is_stale?: boolean
  created_at?: string
  updated_at?: string
}

type Subsidiary = { id: string; name: string }

function chartPreviewSrc(chart: Pick<OrgChart, "preview_image" | "chart_data" | "name"> | null | undefined) {
  if (!chart) return null
  if (chart.preview_image) return chart.preview_image
  // Fallback: if API returned SVG data URL inside chart_data (rare), ignore; otherwise no client rebuild
  return null
}

export default function OrgChartPage() {
  const [companyId, setCompanyId] = useState("")
  const [charts, setCharts] = useState<OrgChart[]>([])
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [chartType, setChartType] = useState("hierarchical")
  const [chartStyle, setChartStyle] = useState("modern")
  const [scope, setScope] = useState("all")
  const [preview, setPreview] = useState<{
    chart_data: any
    preview_image: string
    source_employee_count: number
  } | null>(null)
  const [viewChart, setViewChart] = useState<OrgChart | null>(null)

  const load = useCallback(async (cid?: string) => {
    setLoading(true)
    try {
      const id = cid || companyId
      const url = id ? `/api/org-charts?company_id=${encodeURIComponent(id)}` : "/api/org-charts"
      const res = await fetch(url, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load org charts")

      setCompanyId(json.company_id || id || "")
      setCharts(json.charts ?? [])
      setSubsidiaries(json.subsidiaries ?? [])
      setEmployeeCount(json.employee_count ?? (json.employees ?? []).length)
      setSyncedAt(json.meta?.fetched_at ?? new Date().toISOString())
    } catch (err) {
      toast({
        title: "Could not load org charts",
        description: err instanceof Error ? err.message : "Sync failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void load()
  }, [load])

  const handleGenerate = async (save: boolean) => {
    if (!name.trim()) {
      toast({ title: "Chart name required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/org-charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId || undefined,
          name,
          description,
          chart_type: chartType,
          chart_style: chartStyle,
          scope,
          save,
          is_active: false,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Generation failed")

      if (save) {
        toast({ title: "Chart saved", description: `${json.chart.source_employee_count} people included.` })
        setPreview(null)
        setName("")
        setDescription("")
        await load(companyId || json.chart?.company_id)
      } else {
        setPreview({
          chart_data: json.chart_data,
          preview_image: json.preview_image,
          source_employee_count: json.source_employee_count,
        })
      }
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Could not generate chart",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    const res = await fetch(`/api/org-charts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate" }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast({ title: "Activate failed", description: json.error, variant: "destructive" })
      return
    }
    toast({ title: "Chart activated" })
    await load(companyId)
  }

  const handleRegenerate = async (id: string) => {
    const res = await fetch(`/api/org-charts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate" }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast({ title: "Regenerate failed", description: json.error, variant: "destructive" })
      return
    }
    toast({ title: "Chart regenerated from current employees" })
    await load(companyId)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this org chart?")) return
    const res = await fetch(`/api/org-charts/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok) {
      toast({ title: "Delete failed", description: json.error, variant: "destructive" })
      return
    }
    toast({ title: "Chart deleted" })
    await load(companyId)
  }

  const download = (id: string, format: "csv" | "json" | "svg") => {
    window.open(`/api/org-charts/${id}?format=${format}`, "_blank")
  }

  const openPreview = async (chart: OrgChart) => {
    if (chart.preview_image) {
      setViewChart(chart)
      return
    }
    try {
      const res = await fetch(`/api/org-charts/${chart.id}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load chart")
      setViewChart(json.chart as OrgChart)
    } catch (err) {
      toast({
        title: "Preview unavailable",
        description: err instanceof Error ? err.message : "Could not open preview",
        variant: "destructive",
      })
    }
  }

  const scopeLabel = useMemo(() => {
    if (scope === "all") return "Entire company"
    if (scope === "parent") return "Parent company only"
    return subsidiaries.find((s) => s.id === scope)?.name || "Subsidiary"
  }, [scope, subsidiaries])

  const viewSrc = chartPreviewSrc(viewChart)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="h-6 w-6 text-emerald-700" />
            <h1 className="text-2xl font-bold text-gray-900">Organizational Chart</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Build charts from live employee reporting lines (`direct_supervisor`, department heads)
            and save them to the database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => load(companyId)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync
          </Button>
          {syncedAt && (
            <Badge variant="outline" className="h-9">
              {employeeCount} employees · synced {new Date(syncedAt).toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="manage">Manage ({charts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate chart</CardTitle>
              <CardDescription>
                Scope: {scopeLabel}. Nodes and edges are computed from the employees table.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Chart name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 Company Structure" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <select className="h-10 w-full rounded-md border px-3 text-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="all">Entire company</option>
                  <option value="parent">Parent company only</option>
                  {subsidiaries.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Chart type</Label>
                <select className="h-10 w-full rounded-md border px-3 text-sm" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="matrix">Matrix</option>
                  <option value="flat">Flat</option>
                  <option value="functional">Functional</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <select className="h-10 w-full rounded-md border px-3 text-sm" value={chartStyle} onChange={(e) => setChartStyle(e.target.value)}>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button onClick={() => handleGenerate(false)} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Preview
                </Button>
                <Button variant="outline" onClick={() => handleGenerate(true)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Generate & Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview — {preview.source_employee_count} people</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preview.preview_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.preview_image} alt="Org chart preview" className="w-full rounded-md border bg-slate-50" />
                )}
                <p className="text-sm text-muted-foreground">
                  {(preview.chart_data?.edges?.length ?? 0)} reporting lines · type {preview.chart_data?.type || chartType}
                </p>
                <Button onClick={() => handleGenerate(true)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" /> Save this chart
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading charts…
            </div>
          ) : charts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No saved charts yet. Generate one from the Create tab.
              </CardContent>
            </Card>
          ) : (
            charts.map((chart) => (
              <Card key={chart.id}>
                <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{chart.name}</p>
                      {chart.is_active && <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>}
                      {chart.is_stale && (
                        <Badge variant="outline" className="border-amber-300 text-amber-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stale
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {chart.chart_type} · {chart.chart_style} · scope {chart.scope || chart.subsidiary_id || "all"} ·{" "}
                      {chart.source_employee_count ?? 0} people
                      {chart.updated_at ? ` · updated ${new Date(chart.updated_at).toLocaleDateString()}` : ""}
                    </p>
                    {chart.description && <p className="text-sm mt-1">{chart.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void openPreview(chart)}>
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => download(chart.id, "csv")}>
                      <Download className="h-4 w-4 mr-1" /> CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => download(chart.id, "svg")}>
                      <Download className="h-4 w-4 mr-1" /> SVG
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => download(chart.id, "json")}>
                      JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRegenerate(chart.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                    {!chart.is_active && (
                      <Button size="sm" onClick={() => handleActivate(chart.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Activate
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(chart.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewChart} onOpenChange={(o) => !o && setViewChart(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewChart?.name}</DialogTitle>
          </DialogHeader>
          {viewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewSrc} alt={viewChart?.name || "Org chart"} className="w-full rounded-md border" />
          ) : (
            <p className="text-sm text-muted-foreground">
              No preview image stored. Use Refresh to regenerate from current employees.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => viewChart && download(viewChart.id, "csv")}>
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => viewChart && download(viewChart.id, "svg")}>
              Download SVG
            </Button>
            <Button onClick={() => setViewChart(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
