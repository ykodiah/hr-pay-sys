"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { CUSTOM_FIELD_CATALOG } from "@/lib/services/reports/field-catalog"
import type { ReportColumn } from "@/lib/services/reports/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  Download,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  History,
  ChevronRight,
  Building2,
  ShieldCheck,
  Landmark,
  Wallet,
  Users,
  BarChart3,
  X,
} from "lucide-react"
import type { ReportType, ComplianceReportRecord } from "@/lib/services/reports/types"
import { REPORT_LABELS, REPORT_CATEGORIES } from "@/lib/services/reports/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportDefinition {
  type:        ReportType
  description: string
  authority:   string
  frequency:   string
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    type:        "paye",
    description: "PAYE deductions per employee with Ghana Card numbers for GRA monthly filing.",
    authority:   "Ghana Revenue Authority",
    frequency:   "Monthly",
  },
  {
    type:        "ssnit_tier1",
    description: "Tier 1 employee (0.5%) and employer (13%) contributions with SSNIT numbers.",
    authority:   "SSNIT",
    frequency:   "Monthly",
  },
  {
    type:        "ssnit_tier2",
    description: "Tier 2 occupational pension — employee 5% of basic (Act 766).",
    authority:   "Licensed Trustee / SSNIT",
    frequency:   "Monthly",
  },
  {
    type:        "provident_fund",
    description: "Voluntary Tier 3 provident fund contributions per enrolled employee.",
    authority:   "Fund Manager",
    frequency:   "Quarterly",
  },
  {
    type:        "payroll_summary",
    description: "Full payroll register — gross pay, all deductions, and net pay per employee.",
    authority:   "Internal / Finance",
    frequency:   "Monthly",
  },
  {
    type:        "bank_advice",
    description: "Net salary payment instructions by bank account for electronic bulk transfer.",
    authority:   "Company Bank",
    frequency:   "Per payroll run",
  },
  {
    type:        "cost_to_company",
    description: "Total cost per employee including all employer statutory contributions.",
    authority:   "Finance / Management",
    frequency:   "Monthly",
  },
  {
    type:        "allowances",
    description: "Itemised allowances breakdown — transport, housing, medical and others.",
    authority:   "HR / Finance",
    frequency:   "Monthly",
  },
  {
    type:        "loans",
    description: "Loan and advance deductions with outstanding balances per employee.",
    authority:   "Finance",
    frequency:   "Monthly",
  },
  {
    type:        "deductions",
    description: "Non-tax deductions register — loans, advances, and other recoveries.",
    authority:   "Finance / Payroll",
    frequency:   "Monthly",
  },
]

const CATEGORY_META = {
  compliance: {
    label: "Statutory Compliance",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg:    "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  },
  payroll: {
    label: "Payroll / Financial Reports",
    icon: Wallet,
    color: "text-amber-600",
    bg:    "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
  },
  finance: {
    label: "Banking & Finance Reports",
    icon: Landmark,
    color: "text-emerald-600",
    bg:    "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
  },
  custom: {
    label: "Custom Reports",
    icon: FileText,
    color: "text-purple-600",
    bg:    "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
  },
}

const STATUS_META = {
  generated: { label: "Generated",  icon: Clock,        className: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted",  icon: Send,          className: "bg-amber-100 text-amber-700" },
  filed:     { label: "Filed",      icon: CheckCircle2,  className: "bg-green-100 text-green-700" },
  voided:    { label: "Voided",     icon: X,             className: "bg-red-100 text-red-700" },
}

// ─── SWR fetcher ──────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load")
    return r.json()
  })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodOptions(): string[] {
  const periods: string[] = []
  const now = new Date()
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return periods
}

function fmtPeriod(p: string): string {
  const [y, m] = p.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-GH", {
    month: "long",
    year:  "numeric",
  })
}

function fmtGHS(v: number): string {
  return new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ─── Report card component ────────────────────────────────────────────────────

function ReportCard({
  def,
  companyId,
  period,
  history,
  onGenerate,
  onDownload,
  generating,
  downloading,
}: {
  def:         ReportDefinition
  companyId:   string
  period:      string
  history:     ComplianceReportRecord[]
  onGenerate:  (type: ReportType) => void
  onDownload:  (type: ReportType, format?: "csv" | "pdf") => void
  generating:  boolean
  downloading: boolean
}) {
  const cat     = REPORT_CATEGORIES[def.type]
  const meta    = CATEGORY_META[cat]
  const Icon    = meta.icon
  const latest  = history.find((h) => h.report_type === def.type && h.pay_period === period)
  const status  = latest?.status
  const StatusIcon = status ? STATUS_META[status].icon : null

  return (
    <Card className="flex flex-col h-full border border-border hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`p-2 rounded-lg ${meta.bg} shrink-0`}>
            <Icon className={`h-4 w-4 ${meta.color}`} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
              {meta.label}
            </span>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold leading-tight mt-2">
          {REPORT_LABELS[def.type]}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {def.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 border-t pt-3">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {def.authority}
          </span>
          <span>{def.frequency}</span>
        </div>

        {status && StatusIcon && (
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md mb-3 ${STATUS_META[status].className}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{STATUS_META[status].label}</span>
            {latest?.generated_at && (
              <span className="ml-auto opacity-70">{fmtDate(latest.generated_at)}</span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1 h-8 text-xs"
            onClick={() => onGenerate(def.type)}
            disabled={generating}
          >
            {generating ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <BarChart3 className="h-3 w-3 mr-1" />
            )}
            Generate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-2"
            onClick={() => onDownload(def.type, "csv")}
            disabled={downloading}
            title="Download CSV"
          >
            {downloading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span className="ml-1">CSV</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-2"
            onClick={() => onDownload(def.type, "pdf")}
            disabled={downloading}
            title="Download PDF"
          >
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ComplianceReportsPage() {
  const [period,      setPeriod]      = useState<string>(() => getPeriodOptions()[0])
  const [companyId,   setCompanyId]   = useState<string>("")
  const [activeTab,   setActiveTab]   = useState("reports")
  const [generating,  setGenerating]  = useState<ReportType | "all" | null>(null)
  const [downloading, setDownloading] = useState<ReportType | null>(null)
  const [previewReport, setPreviewReport] = useState<any | null>(null)
  const [fileDialogId,  setFileDialogId]  = useState<string | null>(null)
  const [submissionRef, setSubmissionRef] = useState("")

  useEffect(() => {
    const supabase = createClient()
    void supabase
      .from("companies")
      .select("id, name")
      .limit(5)
      .then(({ data }) => {
        if (data?.[0]?.id) setCompanyId((prev) => prev || data[0].id)
      })
  }, [])

  // ── Fetch company list (to populate the company selector) ────────────────
  const { data: companiesData } = useSWR("/api/subsidiaries", fetcher)
  const companies: { id: string; name: string }[] = companiesData?.data ?? []

  // Custom report designer state
  const [customName, setCustomName] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customCategory, setCustomCategory] = useState<"compliance" | "financial" | "banking" | "payroll" | "custom">("custom")
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "employee_id_no",
    "employee_name",
    "gross_pay",
    "paye_tax",
    "net_pay",
  ])
  const [customSaving, setCustomSaving] = useState(false)
  const [customRunning, setCustomRunning] = useState(false)
  const customKey = companyId ? `/api/reports/custom?company_id=${companyId}` : null
  const { data: customData, mutate: mutateCustom } = useSWR(customKey, fetcher)
  const savedCustomDefs = customData?.definitions ?? []

  // ── Fetch history for the selected period ────────────────────────────────
  const historyKey = companyId
    ? `/api/reports?company_id=${companyId}&pay_period=${period}&limit=50`
    : null
  const { data: historyData, isLoading: historyLoading } = useSWR(historyKey, fetcher)
  const history: ComplianceReportRecord[] = historyData?.data ?? []

  // ── Generate a single report ─────────────────────────────────────────────
  const handleGenerate = useCallback(async (type: ReportType) => {
    if (!companyId) {
      toast({ title: "Company required", description: "Select or load a company first.", variant: "destructive" })
      return
    }
    setGenerating(type)
    try {
      const res = await fetch("/api/reports", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify({ company_id: companyId, report_type: type, pay_period: period }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to generate")

      setPreviewReport(json.data)
      if (historyKey) mutate(historyKey)
      toast({ title: "Report generated", description: `${REPORT_LABELS[type]} — ${json.data.row_count} employees` })
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
    } finally {
      setGenerating(null)
    }
  }, [companyId, period, historyKey])

  // ── Generate all reports for the period ──────────────────────────────────
  const handleGenerateAll = useCallback(async () => {
    if (!companyId) {
      toast({ title: "Company required", description: "Select or load a company first.", variant: "destructive" })
      return
    }
    setGenerating("all")
    try {
      const res = await fetch("/api/reports", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify({ company_id: companyId, pay_period: period, generate_all: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to generate")

      if (historyKey) mutate(historyKey)
      toast({ title: "All reports generated", description: `${json.count} reports generated for ${fmtPeriod(period)}` })
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
    } finally {
      setGenerating(null)
    }
  }, [companyId, period, historyKey])

  // ── Download CSV / PDF ────────────────────────────────────────────────────
  const handleDownload = useCallback(async (type: ReportType, format: "csv" | "pdf" = "csv") => {
    if (!companyId) {
      toast({ title: "Company required", description: "Select or load a company first.", variant: "destructive" })
      return
    }
    setDownloading(type)
    try {
      const res = await fetch("/api/reports/download", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify({
          company_id: companyId,
          report_type: type,
          pay_period: period,
          format,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Download failed")
      }
      if (format === "pdf") {
        const html = await res.text()
        const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }))
        window.open(url, "_blank", "noopener,noreferrer")
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        toast({
          title: "PDF opened",
          description: `${REPORT_LABELS[type]} — Print → Save as PDF. Company letterhead + AkwaabaHRPay footer included.`,
        })
      } else {
        const blob     = await res.blob()
        const url      = URL.createObjectURL(blob)
        const a        = document.createElement("a")
        const filename = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1]
                      ?? `${type}-${period}.csv`
        a.href         = url
        a.download     = filename
        a.click()
        URL.revokeObjectURL(url)
        toast({
          title: "Download ready",
          description: `${REPORT_LABELS[type]} CSV includes company details and AkwaabaHRPay brand footer.`,
        })
      }
      if (historyKey) mutate(historyKey)
    } catch (err) {
      toast({ title: "Download failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
    } finally {
      setDownloading(null)
    }
  }, [companyId, period, historyKey])

  // ── File a report ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async () => {
    if (!fileDialogId || !submissionRef.trim()) return
    try {
      const res = await fetch(`/api/reports/${fileDialogId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "file", submission_ref: submissionRef.trim() }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      if (historyKey) mutate(historyKey)
      toast({ title: "Report filed", description: `Reference: ${submissionRef}` })
      setFileDialogId(null)
      setSubmissionRef("")
    } catch (err) {
      toast({ title: "Failed to file", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
    }
  }, [fileDialogId, submissionRef, historyKey])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const periodHistory   = history.filter((h) => h.pay_period === period)
  const generatedCount  = periodHistory.length
  const filedCount      = periodHistory.filter((h) => h.status === "filed").length
  const submittedCount  = periodHistory.filter((h) => h.status === "submitted").length

  const periodOptions = getPeriodOptions()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, download, and file statutory reports for GRA, SSNIT, and your bank.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((p) => (
                <SelectItem key={p} value={p}>{fmtPeriod(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-9 text-sm"
            onClick={handleGenerateAll}
            disabled={generating === "all"}
          >
            {generating === "all" ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            Generate All
          </Button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Reports This Period",  value: generatedCount,  icon: FileText,     color: "text-foreground" },
          { label: "Filed",                value: filedCount,      icon: CheckCircle2, color: "text-green-600"  },
          { label: "Submitted",            value: submittedCount,  icon: Send,          color: "text-amber-600"  },
          { label: "Report Types",         value: REPORT_DEFINITIONS.length, icon: BarChart3, color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="reports" className="text-sm">Report Catalogue</TabsTrigger>
          <TabsTrigger value="custom" className="text-sm">Custom Designer</TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            History
            {history.length > 0 && (
              <span className="ml-1.5 bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.5 font-medium">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Report Catalogue tab ── */}
        <TabsContent value="reports" className="mt-4">
          {/* Group by category */}
          {(["compliance", "payroll", "finance"] as const).map((cat) => {
            const defs = REPORT_DEFINITIONS.filter((d) => REPORT_CATEGORIES[d.type] === cat)
            const meta = CATEGORY_META[cat]
            const CatIcon = meta.icon
            return (
              <div key={cat} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CatIcon className={`h-4 w-4 ${meta.color}`} />
                  <h2 className="text-sm font-semibold text-foreground">{meta.label}</h2>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {defs.map((def) => (
                    <ReportCard
                      key={def.type}
                      def={def}
                      companyId={companyId}
                      period={period}
                      history={history}
                      onGenerate={handleGenerate}
                      onDownload={handleDownload}
                      generating={generating === def.type}
                      downloading={downloading === def.type}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </TabsContent>

        {/* ── Custom Designer tab ── */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Design a custom report</CardTitle>
              <CardDescription>
                Choose fields for compliance, financial, banking, or payroll extracts.
                Downloads always include a title block and column headings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Report name</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Department Net Pay Extract"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={customCategory} onValueChange={(v: any) => setCustomCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="banking">Banking</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Optional notes for this report type"
                />
              </div>

              <div>
                <Label className="mb-2 block">Columns (select headings)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto border rounded-lg p-3">
                  {CUSTOM_FIELD_CATALOG.map((field) => {
                    const checked = selectedFields.includes(field.key)
                    return (
                      <label
                        key={field.key}
                        className="flex items-start gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            setSelectedFields((prev) =>
                              val ? [...prev, field.key] : prev.filter((k) => k !== field.key),
                            )
                          }}
                        />
                        <span>
                          <span className="font-medium">{field.label}</span>
                          <span className="block text-xs text-muted-foreground capitalize">{field.source}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!companyId || !customName || selectedFields.length === 0 || customSaving}
                  onClick={async () => {
                    setCustomSaving(true)
                    try {
                      const columns: ReportColumn[] = selectedFields.map((key) => {
                        const f = CUSTOM_FIELD_CATALOG.find((c) => c.key === key)!
                        return { key: f.key, label: f.label, type: f.type }
                      })
                      const res = await fetch("/api/reports/custom", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "save",
                          definition: {
                            company_id: companyId,
                            name: customName,
                            description: customDescription,
                            category: customCategory,
                            data_source: "payroll",
                            columns,
                          },
                        }),
                      })
                      const json = await res.json()
                      if (!res.ok) throw new Error(json.error || "Save failed")
                      mutateCustom()
                      toast({ title: "Custom report saved", description: customName })
                    } catch (err) {
                      toast({
                        title: "Save failed",
                        description: err instanceof Error ? err.message : "Unknown error",
                        variant: "destructive",
                      })
                    } finally {
                      setCustomSaving(false)
                    }
                  }}
                >
                  {customSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save report type
                </Button>
                <Button
                  variant="outline"
                  disabled={!companyId || selectedFields.length === 0 || customRunning}
                  onClick={async () => {
                    setCustomRunning(true)
                    try {
                      const columns: ReportColumn[] = selectedFields.map((key) => {
                        const f = CUSTOM_FIELD_CATALOG.find((c) => c.key === key)!
                        return { key: f.key, label: f.label, type: f.type }
                      })
                      const res = await fetch("/api/reports/custom", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "run",
                          download: true,
                          company_id: companyId,
                          pay_period: period,
                          definition: {
                            company_id: companyId,
                            name: customName || "Custom Report",
                            description: customDescription,
                            category: customCategory,
                            data_source: "payroll",
                            columns,
                          },
                        }),
                      })
                      if (!res.ok) {
                        const json = await res.json()
                        throw new Error(json.error || "Download failed")
                      }
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `custom-report-${period}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                      mutate(historyKey)
                      toast({ title: "Download ready", description: "CSV includes title and column headings." })
                    } catch (err) {
                      toast({
                        title: "Download failed",
                        description: err instanceof Error ? err.message : "Unknown error",
                        variant: "destructive",
                      })
                    } finally {
                      setCustomRunning(false)
                    }
                  }}
                >
                  {customRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {savedCustomDefs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saved custom report types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedCustomDefs.map((def: any) => (
                  <div
                    key={def.id}
                    className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{def.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(def.columns?.length ?? 0)} columns · {def.category}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const res = await fetch("/api/reports/custom", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "run",
                            download: true,
                            company_id: companyId,
                            pay_period: period,
                            definition_id: def.id,
                          }),
                        })
                        if (!res.ok) {
                          const json = await res.json()
                          toast({ title: "Download failed", description: json.error, variant: "destructive" })
                          return
                        }
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `${def.name.replace(/\s+/g, "-").toLowerCase()}-${period}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── History tab ── */}
        <TabsContent value="history" className="mt-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading report history...
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No reports generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the Report Catalogue tab to generate reports.
              </p>
            </div>
          ) : (
            <Card className="border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Report</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Period</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5">Rows</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Generated</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Ref</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((rec) => {
                      const statusMeta = STATUS_META[rec.status]
                      const SIcon = statusMeta.icon
                      return (
                        <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{rec.report_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{rec.pay_period ? fmtPeriod(rec.pay_period) : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono">{rec.row_count}</td>
                          <td className="px-4 py-3 text-muted-foreground">{fmtDate(rec.generated_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.className}`}>
                              <SIcon className="h-3 w-3" />
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                            {rec.submission_ref ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Download CSV"
                                onClick={() => handleDownload(rec.report_type)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              {rec.status === "generated" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs px-2"
                                  onClick={() => setFileDialogId(rec.id)}
                                >
                                  File
                                  <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Report Preview Dialog ── */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {previewReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{previewReport.report_name}</DialogTitle>
                <DialogDescription className="text-xs">
                  {fmtPeriod(previewReport.pay_period)} &middot; {previewReport.row_count} employees &middot; Generated {fmtDate(previewReport.generated_at)}
                </DialogDescription>
              </DialogHeader>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                {Object.entries(previewReport.summary as Record<string, number>).map(([key, val]) => (
                  <div key={key} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {typeof val === "number" && key.includes("total")
                        ? `GHS ${fmtGHS(val)}`
                        : String(val)}
                    </p>
                  </div>
                ))}
              </div>

              {/* First 10 rows preview */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      {previewReport.columns.map((col: any) => (
                        <th key={col.key} className="text-left font-semibold text-muted-foreground px-3 py-2 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewReport.rows.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        {previewReport.columns.map((col: any) => (
                          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                            {col.type === "currency"
                              ? `GHS ${fmtGHS(Number(row[col.key] ?? 0))}`
                              : String(row[col.key] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {previewReport.rows.length > 10 && (
                      <tr>
                        <td colSpan={previewReport.columns.length} className="px-3 py-2 text-center text-muted-foreground italic">
                          ... and {previewReport.rows.length - 10} more rows — download CSV for full data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewReport(null)}>Close</Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleDownload(previewReport.report_type)
                    setPreviewReport(null)
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download CSV
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── File Report Dialog ── */}
      <Dialog open={!!fileDialogId} onOpenChange={() => { setFileDialogId(null); setSubmissionRef("") }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>File Report</DialogTitle>
            <DialogDescription>
              Enter the GRA / SSNIT / bank submission reference number to mark this report as filed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="ref" className="text-xs">Submission Reference *</Label>
              <Input
                id="ref"
                className="mt-1 h-9"
                placeholder="e.g. GRA-2025-01-XXXXX"
                value={submissionRef}
                onChange={(e) => setSubmissionRef(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => { setFileDialogId(null); setSubmissionRef("") }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleFile} disabled={!submissionRef.trim()}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Mark as Filed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
