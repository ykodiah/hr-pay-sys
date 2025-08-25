"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Users, DollarSign, Calculator, Download, RefreshCw, Clock, TrendingDown } from "lucide-react"

const payrollTrends = [
  { period: "Jan 2024", gross: 285000, net: 196000, employees: 45 },
  { period: "Feb 2024", gross: 292000, net: 201000, employees: 47 },
  { period: "Mar 2024", gross: 298000, net: 205000, employees: 48 },
  { period: "Apr 2024", gross: 305000, net: 210000, employees: 50 },
  { period: "May 2024", gross: 312000, net: 215000, employees: 52 },
  { period: "Jun 2024", gross: 325000, net: 224000, employees: 54 },
]

const departmentCosts = [
  { department: "Technology", cost: 125000, budget: 130000, employees: 18, utilization: 96 },
  { department: "Operations", cost: 85000, budget: 80000, employees: 15, utilization: 106 },
  { department: "Sales", cost: 65000, budget: 70000, employees: 12, utilization: 93 },
  { department: "HR", cost: 35000, budget: 40000, employees: 6, utilization: 88 },
  { department: "Finance", cost: 45000, budget: 45000, employees: 8, utilization: 100 },
]

const performanceMetrics = [
  { metric: "Employee Satisfaction", current: 4.2, target: 4.0, trend: "up" },
  { metric: "Turnover Rate", current: 8.5, target: 10.0, trend: "down" },
  { metric: "Productivity Index", current: 87, target: 85, trend: "up" },
  { metric: "Training Hours", current: 32, target: 30, trend: "up" },
]

const payrollReports = [
  {
    id: 1,
    name: "Monthly Payroll Summary",
    description: "Complete payroll breakdown with 2024 PAYE calculations",
    category: "Payroll",
    status: "active",
    frequency: "Monthly",
    records: 54,
    totalAmount: "GHS 325,000",
    lastGenerated: "Dec 1, 2024",
    downloadFormats: ["PDF", "Excel"],
  },
  {
    id: 2,
    name: "PAYE Tax Report",
    description: "Tax calculations using 2024 Ghana tax bands",
    category: "Tax",
    status: "active",
    frequency: "Monthly",
    records: 54,
    totalAmount: "GHS 48,700",
    lastGenerated: "Dec 1, 2024",
    downloadFormats: ["PDF", "Excel"],
  },
  {
    id: 3,
    name: "SSNIT Tier 1 & 2 Report",
    description: "Social Security contributions with employee details",
    category: "Statutory",
    status: "active",
    frequency: "Monthly",
    records: 54,
    totalAmount: "GHS 31,200",
    lastGenerated: "Dec 1, 2024",
    downloadFormats: ["PDF", "Excel"],
  },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months")
  const [activeTab, setActiveTab] = useState("overview")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const currentMonth = payrollTrends[payrollTrends.length - 1]
  const previousMonth = payrollTrends[payrollTrends.length - 2]
  const grossChange = ((currentMonth.gross - previousMonth.gross) / previousMonth.gross) * 100
  const netChange = ((currentMonth.net - previousMonth.net) / previousMonth.net) * 100
  const employeeChange = currentMonth.employees - previousMonth.employees

  const handleRefreshData = () => {
    setLastUpdated(new Date())
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated with the latest information.",
    })
  }

  const handleDownloadReport = (reportId: number, format: string) => {
    toast({
      title: "Download Started",
      description: `${format} report is being generated and will download shortly.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics & Reports</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-600">Comprehensive HR insights and payroll reports</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Reports</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {currentMonth.gross.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+{grossChange.toFixed(1)}% from last month</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Pay</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {currentMonth.net.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+{netChange.toFixed(1)}% from last month</span>
                    </div>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonth.employees}</p>
                    <div className="flex items-center mt-1">
                      {employeeChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                      )}
                      <span className={`text-xs ${employeeChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {employeeChange >= 0 ? "+" : ""}
                        {employeeChange} from last month
                      </span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
                      GHS {Math.round(currentMonth.gross / currentMonth.employees).toLocaleString()}
                    </p>
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

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={payrollTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`GHS ${Number(value).toLocaleString()}`, ""]} />
                    <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} name="Gross Pay" />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net Pay" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentCosts}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="employees"
                      label={({ department, employees }) => `${department}: ${employees}`}
                    >
                      {departmentCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Payroll Reports</h2>
                <p className="text-gray-600">All payroll reports with 2024 PAYE calculations and Ghana compliance</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Bulk Download
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {payrollReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{report.name}</h3>
                          <Badge
                            className={
                              report.category === "Payroll"
                                ? "bg-blue-100 text-blue-700"
                                : report.category === "Tax"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                            }
                          >
                            {report.category}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700">{report.status}</Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{report.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>{report.frequency}</span>
                          <span>{report.records} records</span>
                          <span>{report.totalAmount}</span>
                          <span>Last: {report.lastGenerated}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id, "PDF")}>
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id, "Excel")}>
                          Excel
                        </Button>
                        <Button size="sm">Generate</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Employees</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Cost</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Budget</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentCosts.map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                        <td className="py-3 px-4 text-right">{dept.employees}</td>
                        <td className="py-3 px-4 text-right">GHS {dept.cost.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-600">GHS {dept.budget.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant={dept.utilization > 100 ? "destructive" : "default"}>
                            {dept.utilization}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                      <div className="flex items-center space-x-1">
                        {metric.trend === "up" ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <span className="text-xs text-gray-500">{metric.current}</span>
                      </div>
                    </div>
                    <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Current: {metric.current}</span>
                      <span>Target: {metric.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
