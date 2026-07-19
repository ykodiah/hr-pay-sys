"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import { TrendingUp, Users, DollarSign, Calculator, Download, RefreshCw } from "lucide-react"
import type { ReportType } from "@/lib/services/reports/types"

const simpleReports: {
  id: number
  name: string
  description: string
  category: string
  status: string
  reportType: ReportType
}[] = [
  {
    id: 1,
    name: "Monthly Payroll Summary",
    description: "Complete payroll breakdown with PAYE, SSNIT, and net pay",
    category: "Payroll",
    status: "active",
    reportType: "payroll_summary",
  },
  {
    id: 2,
    name: "PAYE Tax Report",
    description: "Tax calculations using current Ghana PAYE bands",
    category: "Compliance",
    status: "active",
    reportType: "paye",
  },
  {
    id: 3,
    name: "Bank Payment Advice",
    description: "Net salary payment instructions by bank account",
    category: "Banking",
    status: "active",
    reportType: "bank_advice",
  },
  {
    id: 4,
    name: "Cost to Company",
    description: "Employer cost including statutory contributions",
    category: "Financial",
    status: "active",
    reportType: "cost_to_company",
  },
]

function currentPayPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [companyId, setCompanyId] = useState("")
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [basicMetrics, setBasicMetrics] = useState({
    totalPayroll: 0,
    netPay: 0,
    employees: 0,
    avgSalary: 0,
  })
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  const loadMetrics = async (cid: string) => {
    setLoadingMetrics(true)
    try {
      const res = await fetch("/api/dashboard/summary", { credentials: "include", cache: "no-store" })
      const dash = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(dash.error || "Failed to load analytics")
      const employees = Number(dash.totalEmployees || 0)
      const netPay = Number(dash.monthlyPayroll || 0)
      setBasicMetrics({
        totalPayroll: netPay,
        netPay,
        employees,
        avgSalary: employees > 0 ? Math.round(netPay / employees) : 0,
      })
      if (dash.company_id && dash.company_id !== cid) {
        setCompanyId(dash.company_id)
      }
    } catch (err) {
      toast({
        title: "Analytics load failed",
        description: err instanceof Error ? err.message : "Could not load tenant metrics",
        variant: "destructive",
      })
    } finally {
      setLoadingMetrics(false)
    }
  }

  useEffect(() => {
    void resolveClientCompanyId()
      .then(async (id) => {
        setCompanyId(id)
        await loadMetrics(id)
      })
      .catch((err) => {
        setLoadingMetrics(false)
        toast({
          title: "Company required",
          description: err instanceof Error ? err.message : "Unable to resolve company",
          variant: "destructive",
        })
      })
  }, [])

  const handleRefreshData = () => {
    if (!companyId) return
    void loadMetrics(companyId).then(() =>
      toast({
        title: "Data Refreshed",
        description: "Analytics data has been updated for your company.",
      }),
    )
  }

  const handleDownloadReport = async (reportId: number, reportType: ReportType) => {
    if (!companyId) {
      toast({
        variant: "destructive",
        title: "Company required",
        description: "Load a company before downloading reports.",
      })
      return
    }

    setDownloadingId(reportId)
    try {
      const payPeriod = currentPayPeriod()
      const res = await fetch("/api/reports/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          report_type: reportType,
          pay_period: payPeriod,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Download failed")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const filename =
        res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ??
        `${reportType}-${payPeriod}.csv`
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Download ready",
        description: "CSV includes report title, period metadata, and column headings.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: err instanceof Error ? err.message : "Could not generate report",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive HR insights and payroll reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/app/reports")}>
            <Download className="w-4 h-4 mr-2" />
            All Reports
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {basicMetrics.totalPayroll.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+4.2% from last month</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Pay</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {basicMetrics.netPay.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+3.8% from last month</span>
                    </div>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{basicMetrics.employees}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+2 from last month</span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {basicMetrics.avgSalary.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+3.2% from last month</span>
                    </div>
                  </div>
                  <Calculator className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                    <p className="text-gray-600">Payroll trending upward</p>
                    <p className="text-sm text-gray-500">+4.2% growth this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Technology</span>
                    <Badge>18 employees</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Operations</span>
                    <Badge>15 employees</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Sales</span>
                    <Badge>12 employees</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Available Reports</h2>
              <p className="text-gray-600">
                Download compliance, financial, and banking reports as CSV with headings
              </p>
            </div>

            <div className="grid gap-4">
              {simpleReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{report.name}</h3>
                          <Badge className="bg-blue-100 text-blue-700">{report.category}</Badge>
                          <Badge className="bg-green-100 text-green-700">{report.status}</Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{report.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/app/reports")}>
                          Open Designer
                        </Button>
                        <Button
                          size="sm"
                          disabled={downloadingId === report.id}
                          onClick={() => handleDownloadReport(report.id, report.reportType)}
                        >
                          {downloadingId === report.id ? "Downloading…" : "Download CSV"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
