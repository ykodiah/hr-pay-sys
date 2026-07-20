// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Download,
  Eye,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  ArrowUpDown,
  FileSpreadsheet,
  FileDown,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface PayrollRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  total_gross_pay: number
  total_deductions: number
  total_net_pay: number
  status: string
  created_at: string
  employee_count?: number
  approved_by?: string
  approved_at?: string
  created_by?: string
  subsidiary_id?: string
}

interface PayrollItem {
  id: string
  employee_id: string
  basic_salary: number
  gross_pay: number
  total_deductions: number
  net_pay: number
  tax_deduction: number
  ssnit_employee: number
  ssnit_employer: number
  allowances: any
  deductions: any
}

interface Subsidiary {
  id: string
  name: string
}

export default function PayrollHistoryPage() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [filteredRuns, setFilteredRuns] = useState<PayrollRun[]>([])
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("all")
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [sortField, setSortField] = useState<"pay_date" | "total_gross_pay" | "total_net_pay" | "employee_count">(
    "pay_date",
  )
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const itemsPerPage = 10
  const { toast } = useToast()

  const supabase = createClient()

  const [deductionTotals, setDeductionTotals] = useState({
    paye: 0,
    ssnit: 0,
    tier3: 0,
    other: 0,
  })

  const fetchPayrollHistory = async () => {
    setIsLoading(true)

    try {
      const { resolveClientCompanyId } = await import("@/lib/tenant/resolve-company-client")
      const companyId = await resolveClientCompanyId()

      const [{ data: subsidiariesData }, runsRes] = await Promise.all([
        supabase.from("subsidiaries").select("id, name").eq("company_id", companyId).eq("status", "active"),
        fetch(`/api/payroll/runs?company_id=${encodeURIComponent(companyId)}&limit=200`, {
          cache: "no-store",
          credentials: "include",
        }),
      ])

      if (subsidiariesData) {
        setSubsidiaries(subsidiariesData)
      }

      const runsJson = await runsRes.json()
      if (!runsRes.ok) {
        throw new Error(runsJson.error || "Failed to load payroll history")
      }

      const runsWithCounts = (runsJson.runs ?? runsJson.data ?? []) as PayrollRun[]
      setPayrollRuns(runsWithCounts)
      setFilteredRuns(runsWithCounts)

      // Real deduction breakdown from payslips (not estimated ratios)
      const runIds = runsWithCounts.map((r) => r.id).filter(Boolean)
      if (runIds.length > 0) {
        const { data: slips } = await supabase
          .from("payslips")
          .select("paye_tax, ssnit_employee, tier2_employee, tier3_employee, loan_deduction, advance_deduction, other_deductions")
          .in("payroll_run_id", runIds.slice(0, 50))

        const totals = (slips ?? []).reduce(
          (acc, s: any) => ({
            paye: acc.paye + Number(s.paye_tax ?? 0),
            // Tier 2 is report-only — do not include in payroll deduction charts
            ssnit: acc.ssnit + Number(s.ssnit_employee ?? 0),
            tier3: acc.tier3 + Number(s.tier3_employee ?? 0),
            other:
              acc.other +
              Number(s.loan_deduction ?? 0) +
              Number(s.advance_deduction ?? 0) +
              Number(s.other_deductions ?? 0),
          }),
          { paye: 0, ssnit: 0, tier3: 0, other: 0 },
        )
        setDeductionTotals(totals)
      } else {
        setDeductionTotals({ paye: 0, ssnit: 0, tier3: 0, other: 0 })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchPayrollHistory()
  }, [])

  // Filter payroll runs
  useEffect(() => {
    let filtered = [...payrollRuns]

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter((run) => run.pay_date?.startsWith(yearFilter))
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((run) => run.status === statusFilter)
    }

    if (subsidiaryFilter !== "all") {
      filtered = filtered.filter((run) => run.subsidiary_id === subsidiaryFilter)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (run) =>
          run.pay_period_start?.includes(searchQuery) ||
          run.pay_period_end?.includes(searchQuery) ||
          run.pay_date?.includes(searchQuery),
      )
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "pay_date") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredRuns(filtered)
    setCurrentPage(1)
  }, [yearFilter, statusFilter, subsidiaryFilter, searchQuery, payrollRuns, sortField, sortDirection])

  // Calculate summary statistics
  const totalProcessed = filteredRuns.length
  const totalGrossPay = filteredRuns.reduce((sum, run) => sum + (run.total_gross_pay || 0), 0)
  const totalNetPay = filteredRuns.reduce((sum, run) => sum + (run.total_net_pay || 0), 0)
  const totalDeductions = filteredRuns.reduce((sum, run) => sum + (run.total_deductions || 0), 0)
  const avgEmployees =
    filteredRuns.length > 0
      ? Math.round(filteredRuns.reduce((sum, run) => sum + (run.employee_count || 0), 0) / filteredRuns.length)
      : 0

  // Declare helpers before any computed values that use them (avoids TDZ crash)
  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const trendData = filteredRuns
    .slice(0, 12)
    .reverse()
    .map((run) => ({
      period: formatDate(run.pay_period_start),
      grossPay: run.total_gross_pay || 0,
      netPay: run.total_net_pay || 0,
      deductions: run.total_deductions || 0,
    }))

  const deductionBreakdown =
    deductionTotals.paye + deductionTotals.ssnit + deductionTotals.tier3 + deductionTotals.other > 0
      ? [
          { name: "PAYE Tax", value: Math.round(deductionTotals.paye), color: "#ef4444" },
          { name: "SSNIT", value: Math.round(deductionTotals.ssnit), color: "#3b82f6" },
          { name: "Tier 3", value: Math.round(deductionTotals.tier3), color: "#8b5cf6" },
          { name: "Other", value: Math.round(deductionTotals.other), color: "#6b7280" },
        ]
      : filteredRuns.length > 0
        ? [{ name: "Total Deductions", value: Math.round(totalDeductions), color: "#6b7280" }]
        : []

  // Pagination
  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRuns = filteredRuns.slice(startIndex, endIndex)

  // Generate years for filter
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
      approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800", icon: FileText },
      failed: { label: "Failed", className: "bg-red-100 text-red-800", icon: AlertCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleRefresh = async () => {
    await fetchPayrollHistory()
    toast({
      title: "Refreshed",
      description: "Payroll history synced from the database.",
    })
  }

  const downloadTextFile = (content: string, filename: string, mime = "text/csv;charset=utf-8") => {
    const blob = new Blob(["\uFEFF" + content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = (format: "excel" | "csv" | "pdf") => {
    if (format === "pdf") {
      const approved = payrollRuns.find((r) => r.status === "approved") || payrollRuns[0]
      if (approved) {
        window.open(`/api/payroll/runs/${approved.id}/pdf`, "_blank", "noopener,noreferrer")
        toast({
          title: "PDF register opened",
          description: "Use Print → Save as PDF. For a specific run, use that row’s export menu.",
        })
        return
      }
    }
    const columns = [
      "Pay Period Start",
      "Pay Period End",
      "Pay Date",
      "Status",
      "Employees",
      "Gross Pay (GHS)",
      "Total Deductions (GHS)",
      "Net Pay (GHS)",
    ]
    const rows = filteredRuns.map((run) => [
      run.pay_period_start ?? "",
      run.pay_period_end ?? "",
      run.pay_date ?? "",
      run.status ?? "",
      String(run.employee_count ?? 0),
      String(Number(run.total_gross_pay ?? 0).toFixed(2)),
      String(Number(run.total_deductions ?? 0).toFixed(2)),
      String(Number(run.total_net_pay ?? 0).toFixed(2)),
    ])
    const csv = [
      `"Payroll History Export"`,
      `"Generated At","${new Date().toISOString()}"`,
      "",
      columns.map((c) => `"${c}"`).join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    downloadTextFile(csv, `payroll-history-${new Date().toISOString().slice(0, 10)}.csv`)
    toast({
      title: "Download ready",
      description: `Payroll history exported as ${format === "pdf" ? "CSV (PDF preview not available)" : format.toUpperCase()} with headings.`,
    })
  }

  const handleExportSingle = async (run: PayrollRun, format: "excel" | "csv" | "pdf") => {
    try {
      if (format === "pdf") {
        window.open(`/api/payroll/runs/${run.id}/pdf`, "_blank", "noopener,noreferrer")
        toast({
          title: "PDF register opened",
          description: "Use Print → Save as PDF in the browser dialog.",
        })
        return
      }

      if ((run as any).company_id) {
        const period =
          (run as any).pay_period ||
          (run.pay_period_start ? String(run.pay_period_start).slice(0, 7) : new Date().toISOString().slice(0, 7))
        const res = await fetch("/api/reports/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: (run as any).company_id,
            report_type: "payroll_summary",
            pay_period: period,
            payroll_run_id: run.id,
          }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `payroll-summary-${period}.csv`
          a.click()
          URL.revokeObjectURL(url)
          toast({
            title: "Download ready",
            description: `Payroll summary for ${formatDate(run.pay_period_start)} exported with headings.`,
          })
          return
        }
      }

      // Fallback: export payroll_items for this run with headings
      const { data: items } = await supabase.from("payroll_items").select("*").eq("payroll_run_id", run.id)
      const columns = [
        "Employee ID",
        "Basic Salary (GHS)",
        "Gross Pay (GHS)",
        "PAYE (GHS)",
        "SSNIT Employee (GHS)",
        "Total Deductions (GHS)",
        "Net Pay (GHS)",
      ]
      const rows = (items ?? []).map((item: any) => [
        item.employee_id ?? "",
        Number(item.basic_salary ?? 0).toFixed(2),
        Number(item.gross_pay ?? 0).toFixed(2),
        Number(item.tax_deduction ?? item.paye_tax ?? 0).toFixed(2),
        Number(item.ssnit_employee ?? 0).toFixed(2),
        Number(item.total_deductions ?? 0).toFixed(2),
        Number(item.net_pay ?? 0).toFixed(2),
      ])
      const csv = [
        `"Payroll Run Export"`,
        `"Pay Period","${run.pay_period_start ?? ""} - ${run.pay_period_end ?? ""}"`,
        `"Generated At","${new Date().toISOString()}"`,
        "",
        columns.map((c) => `"${c}"`).join(","),
        ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")
      downloadTextFile(csv, `payroll-run-${run.id.slice(0, 8)}.csv`)
      toast({
        title: "Download ready",
        description: `Exported as ${format.toUpperCase()} with column headings.`,
      })
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export payroll run",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPayslip = async (employeeId: string, runId: string) => {
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/payslips`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load payslips")
      const slip = (json.payslips || []).find((p: any) => p.employee_id === employeeId)
      if (!slip?.id) {
        toast({
          title: "Payslip not found",
          description: "Approve the payroll run to issue payslips, or re-process the period.",
          variant: "destructive",
        })
        return
      }
      window.open(`/api/payslips/${slip.id}/pdf`, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Could not open payslip",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = async (run: PayrollRun) => {
    setSelectedRun(run)
    setIsLoadingItems(true)

    try {
      const { data, error } = await supabase.from("payroll_items").select("*").eq("payroll_run_id", run.id)

      if (error) {
        console.error("Error fetching payroll items:", error)
        toast({
          title: "Error",
          description: "Failed to load payroll details.",
          variant: "destructive",
        })
        setPayrollItems([])
      } else {
        setPayrollItems(data || [])
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setPayrollItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll History</h1>
          <p className="text-gray-600">View and analyze historical payroll records with advanced filtering</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Select onValueChange={(value) => handleExportAll(value as "excel" | "csv" | "pdf")}>
            <SelectTrigger className="w-40">
              <Download className="w-4 h-4 mr-2" />
              <span>Export All</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center">
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Link href="/app/payroll">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Calendar className="w-4 h-4 mr-2" />
              Current Payroll
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Payroll History Overview</h3>
              <p className="text-sm text-gray-600">
                You have processed <span className="font-semibold text-emerald-600">{totalProcessed}</span> payroll runs
                with a total gross pay of{" "}
                <span className="font-semibold text-emerald-600">{formatCurrency(totalGrossPay)}</span>. Use the filters
                below to analyze specific periods or subsidiaries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">
            <FileText className="w-4 h-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <TrendingUp className="w-4 h-4 mr-2" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalProcessed}</div>
                    <p className="text-sm text-gray-600">Total Processed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{avgEmployees}</div>
                    <p className="text-sm text-gray-600">Avg Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalGrossPay)}</div>
                    <p className="text-sm text-gray-600">Total Gross Pay</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalNetPay)}</div>
                    <p className="text-sm text-gray-600">Total Net Pay</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by period or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={subsidiaryFilter} onValueChange={setSubsidiaryFilter}>
                  <SelectTrigger>
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Subsidiaries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subsidiaries</SelectItem>
                    {subsidiaries.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payroll History List */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records ({filteredRuns.length})</CardTitle>
              <CardDescription>Click on any record to view detailed breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading payroll history...</p>
                </div>
              ) : currentRuns.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No payroll records found</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or create a new payroll run</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            <button
                              onClick={() => handleSort("pay_date")}
                              className="flex items-center space-x-1 hover:text-emerald-600"
                            >
                              <span>Pay Period</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pay Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            <button
                              onClick={() => handleSort("employee_count")}
                              className="flex items-center space-x-1 hover:text-emerald-600"
                            >
                              <span>Employees</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            <button
                              onClick={() => handleSort("total_gross_pay")}
                              className="flex items-center justify-end space-x-1 hover:text-emerald-600 w-full"
                            >
                              <span>Gross Pay</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Deductions</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            <button
                              onClick={() => handleSort("total_net_pay")}
                              className="flex items-center justify-end space-x-1 hover:text-emerald-600 w-full"
                            >
                              <span>Net Pay</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRuns.map((run) => (
                          <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(run.pay_period_start)}
                              </div>
                              <div className="text-xs text-gray-500">to {formatDate(run.pay_period_end)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-900">{formatDate(run.pay_date)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-900">{run.employee_count || 0}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(run.total_gross_pay || 0)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-sm text-gray-900">{formatCurrency(run.total_deductions || 0)}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(run.total_net_pay || 0)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">{getStatusBadge(run.status)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(run)}
                                  className="h-8 w-8 p-0"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Select
                                  onValueChange={(value) => handleExportSingle(run, value as "excel" | "csv" | "pdf")}
                                >
                                  <SelectTrigger className="h-8 w-8 p-0 border-0">
                                    <Download className="w-4 h-4" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="excel">Excel</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                  </SelectContent>
                                </Select>
                                {run.status === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/payroll/runs/${run.id}/mark-paid`, {
                                          method: "POST",
                                          credentials: "include",
                                        })
                                        const json = await res.json()
                                        if (!res.ok) throw new Error(json.error || "Failed")
                                        toast({
                                          title: "Marked as paid",
                                          description: "Payroll run status set to paid after disbursement.",
                                        })
                                        fetchPayrollHistory()
                                      } catch (err) {
                                        toast({
                                          title: "Could not mark paid",
                                          description:
                                            err instanceof Error ? err.message : "Try again after approval",
                                          variant: "destructive",
                                        })
                                      }
                                    }}
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredRuns.length)} of {filteredRuns.length}{" "}
                        records
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page
                            if (totalPages <= 5) {
                              page = i + 1
                            } else if (currentPage <= 3) {
                              page = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i
                            } else {
                              page = currentPage - 2 + i
                            }
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                              >
                                {page}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends (Last 12 Periods)</CardTitle>
                <CardDescription>Track gross pay, net pay, and deductions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="grossPay" stroke="#10b981" name="Gross Pay" strokeWidth={2} />
                    <Line type="monotone" dataKey="netPay" stroke="#3b82f6" name="Net Pay" strokeWidth={2} />
                    <Line type="monotone" dataKey="deductions" stroke="#ef4444" name="Deductions" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Deduction Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Deduction Breakdown</CardTitle>
                <CardDescription>Distribution of total deductions across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={deductionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deductionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Comparison Bar Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Payroll Comparison</CardTitle>
                <CardDescription>Compare payroll metrics across recent periods</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="grossPay" fill="#10b981" name="Gross Pay" />
                    <Bar dataKey="deductions" fill="#ef4444" name="Deductions" />
                    <Bar dataKey="netPay" fill="#3b82f6" name="Net Pay" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Period-over-Period Comparison</CardTitle>
              <CardDescription>Compare payroll metrics between different periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredRuns.length >= 2 ? (
                  <>
                    {/* Comparison Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-blue-200">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600 mb-2">Latest vs Previous</p>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Gross Pay Change:</span>
                              <span
                                className={`text-sm font-semibold ${
                                  (filteredRuns[0]?.total_gross_pay || 0) > (filteredRuns[1]?.total_gross_pay || 0)
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(
                                  (((filteredRuns[0]?.total_gross_pay || 0) - (filteredRuns[1]?.total_gross_pay || 0)) /
                                    (filteredRuns[1]?.total_gross_pay || 1)) *
                                  100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Employee Count:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {(filteredRuns[0]?.employee_count || 0) - (filteredRuns[1]?.employee_count || 0) > 0
                                  ? "+"
                                  : ""}
                                {(filteredRuns[0]?.employee_count || 0) - (filteredRuns[1]?.employee_count || 0)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-emerald-200">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600 mb-2">Year-to-Date Average</p>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Avg Gross Pay:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(totalGrossPay / (filteredRuns.length || 1))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Avg Net Pay:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(totalNetPay / (filteredRuns.length || 1))}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-200">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600 mb-2">Deduction Rate</p>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Average Rate:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {((totalDeductions / totalGrossPay) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Total Deductions:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(totalDeductions)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Employees</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Gross Pay</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Deductions</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Pay</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Deduction %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRuns.slice(0, 6).map((run, index) => (
                            <tr key={run.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900">{formatDate(run.pay_period_start)}</div>
                                <div className="text-xs text-gray-500">to {formatDate(run.pay_period_end)}</div>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900">{run.employee_count || 0}</td>
                              <td className="py-3 px-4 text-right font-medium text-gray-900">
                                {formatCurrency(run.total_gross_pay || 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900">
                                {formatCurrency(run.total_deductions || 0)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                                {formatCurrency(run.total_net_pay || 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900">
                                {(((run.total_deductions || 0) / (run.total_gross_pay || 1)) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Not enough data for comparison</p>
                    <p className="text-sm text-gray-500 mt-2">At least 2 payroll periods are required</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              {selectedRun && (
                <>
                  Pay Period: {formatDate(selectedRun.pay_period_start)} - {formatDate(selectedRun.pay_period_end)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pay Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedRun.pay_date)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Employees</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRun.employee_count || 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Gross Pay</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedRun.total_gross_pay || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Deductions</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedRun.total_deductions || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Net Pay</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(selectedRun.total_net_pay || 0)}
                  </span>
                </div>
              </div>

              {isLoadingItems ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2 text-sm">Loading employee details...</p>
                </div>
              ) : payrollItems.length > 0 ? (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Employee Breakdown ({payrollItems.length})</h4>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Employee ID</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Basic Salary</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Gross Pay</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Deductions</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Net Pay</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Payslip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollItems.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900">{item.employee_id?.substring(0, 8)}...</td>
                            <td className="py-2 px-3 text-right text-gray-900">
                              {formatCurrency(item.basic_salary || 0)}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-900">
                              {formatCurrency(item.gross_pay || 0)}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-900">
                              {formatCurrency(item.total_deductions || 0)}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                              {formatCurrency(item.net_pay || 0)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  selectedRun && handleDownloadPayslip(item.employee_id, selectedRun.id)
                                }
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
