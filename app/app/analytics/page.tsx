"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
} from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  Calculator,
  Download,
  Filter,
  BarChart3,
  PieChartIcon,
  RefreshCw,
  Target,
  Clock,
  TrendingDown,
} from "lucide-react"

const payrollTrends = [
  { period: "2024-08", gross: 420000, paye: 63000, ssnit: 37800, tier3: 21000, net: 298200, employees: 235 },
  { period: "2024-09", gross: 435000, paye: 65250, ssnit: 39150, tier3: 21750, net: 308850, employees: 240 },
  { period: "2024-10", gross: 448000, paye: 67200, ssnit: 40320, tier3: 22400, net: 318080, employees: 245 },
  { period: "2024-11", gross: 462000, paye: 69300, ssnit: 41580, tier3: 23100, net: 328020, employees: 250 },
  { period: "2024-12", gross: 478900, paye: 71835, ssnit: 43101, tier3: 23945, net: 340019, employees: 245 },
  { period: "2025-01", gross: 485200, paye: 72780, ssnit: 43668, tier3: 24260, net: 344492, employees: 247 },
]

const departmentCosts = [
  {
    department: "Technology",
    employees: 45,
    cost: 156000,
    avgSalary: 8500,
    turnover: 8.2,
    productivity: 92,
    satisfaction: 4.3,
    budget: 160000,
    utilization: 97.5,
  },
  {
    department: "Sales",
    employees: 62,
    cost: 142000,
    avgSalary: 5800,
    turnover: 15.3,
    productivity: 88,
    satisfaction: 3.9,
    budget: 145000,
    utilization: 97.9,
  },
  {
    department: "Marketing",
    employees: 28,
    cost: 98000,
    avgSalary: 6200,
    turnover: 12.1,
    productivity: 85,
    satisfaction: 4.1,
    budget: 100000,
    utilization: 98.0,
  },
  {
    department: "Finance",
    employees: 18,
    cost: 87000,
    avgSalary: 7200,
    turnover: 5.6,
    productivity: 94,
    satisfaction: 4.4,
    budget: 90000,
    utilization: 96.7,
  },
  {
    department: "HR",
    employees: 12,
    cost: 54000,
    avgSalary: 6800,
    turnover: 8.3,
    productivity: 89,
    satisfaction: 4.2,
    budget: 55000,
    utilization: 98.2,
  },
  {
    department: "Operations",
    employees: 82,
    cost: 168000,
    avgSalary: 4800,
    turnover: 18.7,
    productivity: 82,
    satisfaction: 3.7,
    budget: 170000,
    utilization: 98.8,
  },
]

const leaveAnalytics = [
  { month: "Aug", annual: 45, sick: 12, personal: 8, emergency: 3, maternity: 2, paternity: 1 },
  { month: "Sep", annual: 52, sick: 18, personal: 6, emergency: 2, maternity: 1, paternity: 2 },
  { month: "Oct", annual: 38, sick: 15, personal: 9, emergency: 4, maternity: 3, paternity: 1 },
  { month: "Nov", annual: 41, sick: 22, personal: 7, emergency: 1, maternity: 2, paternity: 0 },
  { month: "Dec", annual: 67, sick: 19, personal: 12, emergency: 5, maternity: 1, paternity: 3 },
  { month: "Jan", annual: 28, sick: 14, personal: 5, emergency: 2, maternity: 4, paternity: 1 },
]

const performanceMetrics = [
  { metric: "Employee Satisfaction", current: 4.1, target: 4.5, trend: "up" },
  { metric: "Retention Rate", current: 87.3, target: 90, trend: "up" },
  { metric: "Time to Hire", current: 28, target: 21, trend: "down" },
  { metric: "Training Hours", current: 32, target: 40, trend: "up" },
  { metric: "Productivity Index", current: 88.5, target: 92, trend: "up" },
  { metric: "Absenteeism Rate", current: 3.2, target: 2.5, trend: "down" },
]

const salaryBenchmarks = [
  { position: "Software Engineer", internal: 8500, market: 9200, variance: -7.6 },
  { position: "HR Manager", internal: 7200, market: 7800, variance: -7.7 },
  { position: "Sales Rep", internal: 5800, market: 5500, variance: 5.5 },
  { position: "Finance Officer", internal: 6500, market: 6800, variance: -4.4 },
  { position: "Marketing Specialist", internal: 6200, market: 6400, variance: -3.1 },
]

const diversityMetrics = [
  { category: "Gender", male: 58, female: 42 },
  { category: "Age Groups", "20-30": 35, "31-40": 42, "41-50": 18, "50+": 5 },
  { category: "Education", Bachelor: 45, Master: 35, PhD: 8, Diploma: 12 },
]

const complianceData = [
  { name: "PAYE Compliant", value: 247, total: 247, color: "#10b981", status: "compliant" },
  { name: "SSNIT Registered", value: 247, total: 247, color: "#3b82f6", status: "compliant" },
  { name: "Tier 3 Enrolled", value: 235, total: 247, color: "#8b5cf6", status: "warning" },
  { name: "Min Wage Review", value: 3, total: 247, color: "#f59e0b", status: "action_required" },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months")
  const [selectedView, setSelectedView] = useState("overview")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false)

  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        setLastUpdated(new Date())
      }, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isRealTimeEnabled])

  const currentMonth = payrollTrends[payrollTrends.length - 1]
  const previousMonth = payrollTrends[payrollTrends.length - 2]
  const grossChange = ((currentMonth.gross - previousMonth.gross) / previousMonth.gross) * 100
  const netChange = ((currentMonth.net - previousMonth.net) / previousMonth.net) * 100
  const employeeChange = currentMonth.employees - previousMonth.employees

  const filteredDepartmentData =
    selectedDepartments.length > 0
      ? departmentCosts.filter((dept) => selectedDepartments.includes(dept.department))
      : departmentCosts

  const handleDepartmentToggle = (department: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(department) ? prev.filter((d) => d !== department) : [...prev, department],
    )
  }

  const handleRefreshData = () => {
    setLastUpdated(new Date())
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated with the latest information.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll Analytics</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-600">Comprehensive insights into your workforce and payroll data</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="realtime" checked={isRealTimeEnabled} onCheckedChange={setIsRealTimeEnabled} />
            <Label htmlFor="realtime" className="text-sm">
              Real-time updates
            </Label>
          </div>
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("payroll")}>
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

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("payroll")}>
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

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveTab("workforce")}
            >
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

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveTab("performance")}
            >
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
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Key Performance Indicators</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <span className="text-xs text-gray-500">
                          {metric.current}
                          {metric.metric.includes("Rate") || metric.metric.includes("Index")
                            ? "%"
                            : metric.metric.includes("Time")
                              ? " days"
                              : metric.metric.includes("Hours")
                                ? " hrs"
                                : ""}
                        </span>
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

          {/* Quick Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Payroll Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={payrollTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        `${name === "employees" ? "" : "GHS "}${Number(value).toLocaleString()}`,
                        name === "employees" ? "Employees" : name,
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="gross" fill="#10b981" name="Gross Pay" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="employees"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Employees"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5" />
                  <span>Department Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredDepartmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="employees"
                      label={({ department, employees }) => `${department}: ${employees}`}
                    >
                      {filteredDepartmentData.map((entry, index) => (
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
          <PayrollAnalytics data={payrollTrends} departments={filteredDepartmentData} />
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <WorkforceAnalytics
            departments={filteredDepartmentData}
            selectedDepartments={selectedDepartments}
            onDepartmentToggle={handleDepartmentToggle}
            diversityData={diversityMetrics}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalytics
            metrics={performanceMetrics}
            salaryBenchmarks={salaryBenchmarks}
            departments={filteredDepartmentData}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceAnalytics data={complianceData} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsAnalytics
            payrollData={payrollTrends}
            departmentData={filteredDepartmentData}
            performanceData={performanceMetrics}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PayrollAnalytics({ data, departments }: { data: any[]; departments: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              GHS {data[data.length - 1].gross.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Current Gross Payroll</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">GHS {data[data.length - 1].paye.toLocaleString()}</div>
            <p className="text-sm text-gray-600">PAYE Tax</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">GHS {data[data.length - 1].ssnit.toLocaleString()}</div>
            <p className="text-sm text-gray-600">SSNIT Contributions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">GHS {data[data.length - 1].tier3.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Tier 3 Contributions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Breakdown Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`GHS ${Number(value).toLocaleString()}`, ""]} />
              <Legend />
              <Area type="monotone" dataKey="gross" stackId="1" stroke="#10b981" fill="#10b981" name="Gross Pay" />
              <Area type="monotone" dataKey="paye" stackId="2" stroke="#ef4444" fill="#ef4444" name="PAYE" />
              <Area type="monotone" dataKey="ssnit" stackId="2" stroke="#3b82f6" fill="#3b82f6" name="SSNIT" />
              <Area type="monotone" dataKey="tier3" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" name="Tier 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Payroll Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Budget</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Utilization</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Variance</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => {
                  const variance = ((dept.cost - dept.budget) / dept.budget) * 100
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                      <td className="py-3 px-4 text-right">GHS {dept.cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-600">GHS {dept.budget.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{ width: `${dept.utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{dept.utilization}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={variance > 0 ? "destructive" : "default"}>
                          {variance > 0 ? "+" : ""}
                          {variance.toFixed(1)}%
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
    </div>
  )
}

function WorkforceAnalytics({
  departments,
  selectedDepartments,
  onDepartmentToggle,
  diversityData,
}: {
  departments: any[]
  selectedDepartments: string[]
  onDepartmentToggle: (dept: string) => void
  diversityData: any[]
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Department Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <div key={dept.department} className="flex items-center space-x-2">
                <Checkbox
                  id={dept.department}
                  checked={selectedDepartments.includes(dept.department)}
                  onCheckedChange={() => onDepartmentToggle(dept.department)}
                />
                <Label htmlFor={dept.department} className="text-sm">
                  {dept.department} ({dept.employees})
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Turnover Rate by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, "Turnover Rate"]} />
                <Bar dataKey="turnover" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={departments}>
                <RadialBar dataKey="satisfaction" cornerRadius={10} fill="#10b981" />
                <Tooltip formatter={(value) => [`${value}/5`, "Satisfaction"]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{dept.department}</span>
                    <span className="text-sm text-gray-600">{dept.productivity}%</span>
                  </div>
                  <Progress value={dept.productivity} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workforce Diversity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {diversityData.map((category, index) => (
              <div key={index}>
                <h4 className="font-medium mb-3">{category.category}</h4>
                <div className="space-y-2">
                  {Object.entries(category)
                    .filter(([key]) => key !== "category")
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm">{key}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
                          </div>
                          <span className="text-sm w-8">{value}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PerformanceAnalytics({
  metrics,
  salaryBenchmarks,
  departments,
}: {
  metrics: any[]
  salaryBenchmarks: any[]
  departments: any[]
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{metric.metric}</p>
                    <p className="text-sm text-gray-600">
                      Current: {metric.current} | Target: {metric.target}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <Progress value={(metric.current / metric.target) * 100} className="w-20 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Benchmarking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={salaryBenchmarks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="internal" name="Internal Salary" />
                <YAxis dataKey="market" name="Market Rate" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => [`GHS ${value}`, name === "internal" ? "Internal" : "Market"]}
                />
                <Scatter dataKey="market" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Position</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Internal Salary</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Market Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Variance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {salaryBenchmarks.map((position, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{position.position}</td>
                    <td className="py-3 px-4 text-right">GHS {position.internal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-600">GHS {position.market.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={position.variance > 0 ? "text-emerald-600" : "text-red-600"}>
                        {position.variance > 0 ? "+" : ""}
                        {position.variance.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={Math.abs(position.variance) > 10 ? "destructive" : "default"}>
                        {Math.abs(position.variance) > 10 ? "Review" : "Competitive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ComplianceAnalytics({ data }: { data: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <Card key={index} className={`border-l-4 ${
            item.status === 'compliant' ? 'border-l-emerald-500' :
            item.status === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'
          }`}>
            <CardContent className="p-4">
\
