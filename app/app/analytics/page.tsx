"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { TrendingUp, Users, DollarSign, Calculator, Download, RefreshCw } from "lucide-react"

const basicMetrics = {
  totalPayroll: 325000,
  netPay: 224000,
  employees: 54,
  avgSalary: 6019,
}

const simpleReports = [
  {
    id: 1,
    name: "Monthly Payroll Summary",
    description: "Complete payroll breakdown with 2024 PAYE calculations",
    category: "Payroll",
    status: "active",
    records: 54,
    totalAmount: "GHS 325,000",
  },
  {
    id: 2,
    name: "PAYE Tax Report",
    description: "Tax calculations using 2024 Ghana tax bands",
    category: "Tax",
    status: "active",
    records: 54,
    totalAmount: "GHS 48,700",
  },
]

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  console.log("[v0] Analytics page rendering...")

  const handleRefreshData = () => {
    console.log("[v0] Refresh data clicked")
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated.",
    })
  }

  const handleDownloadReport = (reportId: number) => {
    console.log("[v0] Download report:", reportId)
    toast({
      title: "Download Started",
      description: "Report is being generated.",
    })
  }

  return (
    <div className="space-y-6 p-6">
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
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
              <p className="text-gray-600">Generate and download payroll reports</p>
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
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>{report.records} records</span>
                          <span>{report.totalAmount}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => handleDownloadReport(report.id)}>
                          Download
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
