"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  Calculator,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChartIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Clock,
  Building,
} from "lucide-react"

const payrollTrends = [
  {
    period: "2024-07",
    month: "Jul",
    gross: 405000,
    paye: 60750,
    ssnit: 36450,
    tier3: 20250,
    net: 287550,
    employees: 230,
  },
  {
    period: "2024-08",
    month: "Aug",
    gross: 420000,
    paye: 63000,
    ssnit: 37800,
    tier3: 21000,
    net: 298200,
    employees: 235,
  },
  {
    period: "2024-09",
    month: "Sep",
    gross: 435000,
    paye: 65250,
    ssnit: 39150,
    tier3: 21750,
    net: 308850,
    employees: 240,
  },
  {
    period: "2024-10",
    month: "Oct",
    gross: 448000,
    paye: 67200,
    ssnit: 40320,
    tier3: 22400,
    net: 318080,
    employees: 245,
  },
  {
    period: "2024-11",
    month: "Nov",
    gross: 462000,
    paye: 69300,
    ssnit: 41580,
    tier3: 23100,
    net: 328020,
    employees: 250,
  },
  {
    period: "2024-12",
    month: "Dec",
    gross: 478900,
    paye: 71835,
    ssnit: 43101,
    tier3: 23945,
    net: 340019,
    employees: 245,
  },
  {
    period: "2025-01",
    month: "Jan",
    gross: 485200,
    paye: 72780,
    ssnit: 43668,
    tier3: 24260,
    net: 344492,
    employees: 247,
  },
]

const departmentAnalytics = [
  {
    department: "Technology",
    employees: 45,
    cost: 382500,
    avgSalary: 8500,
    turnover: 8.9,
    satisfaction: 4.2,
    productivity: 92,
    budget: 400000,
    utilization: 95.6,
  },
  {
    department: "Sales",
    employees: 62,
    cost: 359600,
    avgSalary: 5800,
    turnover: 12.3,
    satisfaction: 3.8,
    productivity: 88,
    budget: 380000,
    utilization: 94.6,
  },
  {
    department: "Marketing",
    employees: 28,
    cost: 173600,
    avgSalary: 6200,
    turnover: 7.1,
    satisfaction: 4.0,
    productivity: 85,
    budget: 180000,
    utilization: 96.4,
  },
  {
    department: "Finance",
    employees: 18,
    cost: 129600,
    avgSalary: 7200,
    turnover: 5.6,
    satisfaction: 4.1,
    productivity: 90,
    budget: 140000,
    utilization: 92.6,
  },
  {
    department: "HR",
    employees: 12,
    cost: 81600,
    avgSalary: 6800,
    turnover: 8.3,
    satisfaction: 4.3,
    productivity: 87,
    budget: 85000,
    utilization: 96.0,
  },
  {
    department: "Operations",
    employees: 82,
    cost: 393600,
    avgSalary: 4800,
    turnover: 15.2,
    satisfaction: 3.6,
    productivity: 82,
    budget: 420000,
    utilization: 93.7,
  },
]

const leaveAnalytics = [
  { month: "Jul", annual: 42, sick: 10, personal: 6, emergency: 2, maternity: 1, paternity: 0 },
  { month: "Aug", annual: 45, sick: 12, personal: 8, emergency: 3, maternity: 2, paternity: 1 },
  { month: "Sep", annual: 52, sick: 18, personal: 6, emergency: 2, maternity: 1, paternity: 0 },
  { month: "Oct", annual: 38, sick: 15, personal: 9, emergency: 4, maternity: 0, paternity: 1 },
  { month: "Nov", annual: 41, sick: 22, personal: 7, emergency: 1, maternity: 1, paternity: 0 },
  { month: "Dec", annual: 67, sick: 19, personal: 12, emergency: 5, maternity: 2, paternity: 2 },
  { month: "Jan", annual: 28, sick: 14, personal: 5, emergency: 2, maternity: 1, paternity: 1 },
]

const complianceMetrics = [
  { metric: "PAYE Compliant", current: 247, total: 247, percentage: 100, status: "excellent" },
  { metric: "SSNIT Registered", current: 247, total: 247, percentage: 100, status: "excellent" },
  { metric: "Tier 2 Enrolled", current: 244, total: 247, percentage: 98.8, status: "good" },
  { metric: "Min Wage Compliant", current: 244, total: 247, percentage: 98.8, status: "warning" },
  { metric: "Contract Updated", current: 235, total: 247, percentage: 95.1, status: "warning" },
]

const performanceMetrics = [
  { period: "2024-07", productivity: 85, satisfaction: 3.8, retention: 92, engagement: 78 },
  { period: "2024-08", productivity: 87, satisfaction: 3.9, retention: 91, engagement: 80 },
  { period: "2024-09", productivity: 89, satisfaction: 4.0, retention: 93, engagement: 82 },
  { period: "2024-10", productivity: 88, satisfaction: 4.1, retention: 94, engagement: 84 },
  { period: "2024-11", productivity: 90, satisfaction: 4.0, retention: 92, engagement: 83 },
  { period: "2024-12", productivity: 87, satisfaction: 3.9, retention: 89, engagement: 81 },
  { period: "2025-01", productivity: 91, satisfaction: 4.2, retention: 95, engagement: 86 },
]

const costBreakdown = [
  { category: "Base Salaries", amount: 320000, percentage: 65.9, color: "#10b981" },
  { category: "Allowances", amount: 85000, percentage: 17.5, color: "#3b82f6" },
  { category: "PAYE Tax", amount: 72780, percentage: 15.0, color: "#ef4444" },
  { category: "SSNIT (Employer)", amount: 43668, percentage: 9.0, color: "#f59e0b" },
  { category: "Tier 3 (Employer)", amount: 24260, percentage: 5.0, color: "#8b5cf6" },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState<any>(null)
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 1000)
      }, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  const filteredData = useMemo(() => {
    let filtered = payrollTrends

    if (selectedPeriod === "last-3-months") {
      filtered = payrollTrends.slice(-3)
    } else if (selectedPeriod === "last-12-months") {
      // Would fetch more data in real implementation
      filtered = payrollTrends
    }

    return filtered
  }, [selectedPeriod])

  const currentMonth = filteredData[filteredData.length - 1]
  const previousMonth = filteredData[filteredData.length - 2]
  const grossChange = previousMonth ? ((currentMonth.gross - previousMonth.gross) / previousMonth.gross) * 100 : 0
  const netChange = previousMonth ? ((currentMonth.net - previousMonth.net) / previousMonth.net) * 100 : 0
  const employeeChange = previousMonth ? currentMonth.employees - previousMonth.employees : 0

  const kpis = useMemo(() => {
    const totalCost = departmentAnalytics.reduce((sum, dept) => sum + dept.cost, 0)
    const totalBudget = departmentAnalytics.reduce((sum, dept) => sum + dept.budget, 0)
    const avgTurnover = departmentAnalytics.reduce((sum, dept) => sum + dept.turnover, 0) / departmentAnalytics.length
    const avgSatisfaction =
      departmentAnalytics.reduce((sum, dept) => sum + dept.satisfaction, 0) / departmentAnalytics.length
    const avgProductivity =
      departmentAnalytics.reduce((sum, dept) => sum + dept.productivity, 0) / departmentAnalytics.length

    return {
      budgetUtilization: (totalCost / totalBudget) * 100,
      avgTurnover,
      avgSatisfaction,
      avgProductivity,
      costPerEmployee: totalCost / currentMonth.employees,
    }
  }, [currentMonth.employees])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const handleExport = (format: string) => {
    // Simulate export functionality
    console.log(`Exporting analytics data in ${format} format`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your workforce and payroll data</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Select onValueChange={(value) => handleExport(value)}>
            <SelectTrigger className="w-32">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
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
              <div className="p-3 bg-emerald-100 rounded-full">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonth.employees}</p>
                <div className="flex items-center mt-1">
                  {employeeChange >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-red-600 mr-1 rotate-180" />
                  )}
                  <span className={`text-xs ${employeeChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {employeeChange >= 0 ? "+" : ""}
                    {employeeChange} from last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.avgSatisfaction.toFixed(1)}/5.0</p>
                <div className="flex items-center mt-1">
                  <Target className="w-3 h-3 text-purple-600 mr-1" />
                  <span className="text-xs text-purple-600">{kpis.avgProductivity.toFixed(0)}% productivity</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.budgetUtilization.toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  <Calculator className="w-3 h-3 text-orange-600 mr-1" />
                  <span className="text-xs text-orange-600">GHS {kpis.costPerEmployee.toLocaleString()}/employee</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enhanced Payroll Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Payroll Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [`GHS ${Number(value).toLocaleString()}`, name]} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="gross" fill="#10b981" name="Gross Pay" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="employees"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Employees"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5" />
                  <span>Cost Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`GHS ${Number(value).toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="truncate">{item.category}</span>
                      <span className="font-medium ml-auto">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Leave Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={leaveAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="annual"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    name="Annual Leave"
                  />
                  <Area type="monotone" dataKey="sick" stackId="1" stroke="#ef4444" fill="#ef4444" name="Sick Leave" />
                  <Area
                    type="monotone"
                    dataKey="personal"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="Personal Leave"
                  />
                  <Area
                    type="monotone"
                    dataKey="emergency"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    name="Emergency Leave"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Components Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`GHS ${Number(value).toLocaleString()}`, ""]} />
                    <Legend />
                    <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} name="Gross Pay" />
                    <Line type="monotone" dataKey="paye" stroke="#ef4444" strokeWidth={2} name="PAYE Tax" />
                    <Line type="monotone" dataKey="ssnit" stroke="#3b82f6" strokeWidth={2} name="SSNIT" />
                    <Line type="monotone" dataKey="tier3" stroke="#8b5cf6" strokeWidth={2} name="Tier 3" />
                    <Line type="monotone" dataKey="net" stroke="#f59e0b" strokeWidth={2} name="Net Pay" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Efficiency Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.slice(-3).map((period, index) => {
                    const taxRate = (period.paye / period.gross) * 100
                    const ssnitRate = (period.ssnit / period.gross) * 100
                    const netRate = (period.net / period.gross) * 100

                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{period.month} 2025</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Effective Tax Rate:</span>
                            <span className="font-medium">{taxRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>SSNIT Rate:</span>
                            <span className="font-medium">{ssnitRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Net Pay Rate:</span>
                            <span className="font-medium text-emerald-600">{netRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Employees</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Cost</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Salary</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Turnover</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Satisfaction</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Productivity</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Budget Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentAnalytics.map((dept, index) => {
                      const budgetUsage = (dept.cost / dept.budget) * 100
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{dept.department}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">{dept.employees}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-900">
                            GHS {dept.cost.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">GHS {dept.avgSalary.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={dept.turnover > 10 ? "destructive" : dept.turnover > 7 ? "secondary" : "default"}
                            >
                              {dept.turnover}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="font-medium">{dept.satisfaction}</span>
                              <span className="text-gray-400">/5</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                dept.productivity > 90
                                  ? "default"
                                  : dept.productivity > 85
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {dept.productivity}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={budgetUsage > 95 ? "destructive" : budgetUsage > 90 ? "secondary" : "default"}
                            >
                              {budgetUsage.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="productivity" stroke="#10b981" strokeWidth={2} name="Productivity %" />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Satisfaction (x20)"
                  />
                  <Line type="monotone" dataKey="retention" stroke="#8b5cf6" strokeWidth={2} name="Retention %" />
                  <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} name="Engagement %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Compliance Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {metric.status === "excellent" ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : metric.status === "good" ? (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{metric.metric}</p>
                          <p className="text-sm text-gray-600">
                            {metric.current} of {metric.total} employees
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          metric.status === "excellent"
                            ? "default"
                            : metric.status === "good"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          metric.status === "excellent"
                            ? "bg-emerald-100 text-emerald-800"
                            : metric.status === "good"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {metric.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Minimum Wage Review</p>
                      <p className="text-sm text-yellow-800">
                        3 employees need salary adjustment to meet 2025 minimum wage requirements
                      </p>
                      <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                        Review Cases
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Contract Updates</p>
                      <p className="text-sm text-blue-800">
                        12 employment contracts require updates for 2025 compliance
                      </p>
                      <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                        Update Contracts
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-900">SSNIT Compliance</p>
                      <p className="text-sm text-emerald-800">
                        All employees are properly registered and contributions are up to date
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Enhanced Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-900">Payroll Optimization</p>
                  <p className="text-sm text-emerald-800">
                    Your payroll efficiency has improved by {grossChange.toFixed(1)}% this month. Consider implementing
                    performance-based bonuses to maintain this growth trajectory.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900">Employee Satisfaction</p>
                  <p className="text-sm text-purple-800">
                    Technology department shows highest satisfaction (4.2/5) while Operations needs attention (3.6/5).
                    Consider targeted engagement programs.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Retention Strategy</p>
                  <p className="text-sm text-blue-800">
                    Operations department has the highest turnover (15.2%). Focus on career development and compensation
                    review for this department.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                <Calculator className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Budget Management</p>
                  <p className="text-sm text-orange-800">
                    Current budget utilization is at {kpis.budgetUtilization.toFixed(1)}%. You have room for strategic
                    investments in high-performing departments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
