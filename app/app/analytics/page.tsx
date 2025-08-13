"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
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
} from "lucide-react"

// Mock analytics data
const payrollTrends = [
  { period: "2024-08", gross: 420000, paye: 63000, ssnit: 37800, net: 319200 },
  { period: "2024-09", gross: 435000, paye: 65250, ssnit: 39150, net: 330600 },
  { period: "2024-10", gross: 448000, paye: 67200, ssnit: 40320, net: 340480 },
  { period: "2024-11", gross: 462000, paye: 69300, ssnit: 41580, net: 351120 },
  { period: "2024-12", gross: 478900, paye: 71835, ssnit: 43101, net: 363964 },
  { period: "2025-01", gross: 485200, paye: 72780, ssnit: 43668, net: 368752 },
]

const departmentCosts = [
  { department: "Technology", employees: 45, cost: 156000, avgSalary: 8500 },
  { department: "Sales", employees: 62, cost: 142000, avgSalary: 5800 },
  { department: "Marketing", employees: 28, cost: 98000, avgSalary: 6200 },
  { department: "Finance", employees: 18, cost: 87000, avgSalary: 7200 },
  { department: "HR", employees: 12, cost: 54000, avgSalary: 6800 },
  { department: "Operations", employees: 82, cost: 168000, avgSalary: 4800 },
]

const leaveAnalytics = [
  { month: "Aug", annual: 45, sick: 12, personal: 8, emergency: 3 },
  { month: "Sep", annual: 52, sick: 18, personal: 6, emergency: 2 },
  { month: "Oct", annual: 38, sick: 15, personal: 9, emergency: 4 },
  { month: "Nov", annual: 41, sick: 22, personal: 7, emergency: 1 },
  { month: "Dec", annual: 67, sick: 19, personal: 12, emergency: 5 },
  { month: "Jan", annual: 28, sick: 14, personal: 5, emergency: 2 },
]

const complianceData = [
  { name: "PAYE Compliant", value: 247, color: "#10b981" },
  { name: "SSNIT Registered", value: 247, color: "#3b82f6" },
  { name: "Min Wage Review", value: 3, color: "#f59e0b" },
]

const headcountTrends = [
  { period: "2024-08", total: 235, new: 8, left: 3 },
  { period: "2024-09", total: 240, new: 12, left: 7 },
  { period: "2024-10", total: 245, new: 9, left: 4 },
  { period: "2024-11", total: 250, new: 11, left: 6 },
  { period: "2024-12", total: 245, new: 6, left: 11 },
  { period: "2025-01", total: 247, new: 14, left: 12 },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months")
  const [selectedView, setSelectedView] = useState("overview")

  const currentMonth = payrollTrends[payrollTrends.length - 1]
  const previousMonth = payrollTrends[payrollTrends.length - 2]
  const grossChange = ((currentMonth.gross - previousMonth.gross) / previousMonth.gross) * 100
  const netChange = ((currentMonth.net - previousMonth.net) / previousMonth.net) * 100

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
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
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

        <Card>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">{headcountTrends[headcountTrends.length - 1].total}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  GHS{" "}
                  {Math.round(currentMonth.gross / headcountTrends[headcountTrends.length - 1].total).toLocaleString()}
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payroll Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Payroll Trends</span>
            </CardTitle>
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
                <Line type="monotone" dataKey="paye" stroke="#ef4444" strokeWidth={2} name="PAYE" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Department Costs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip formatter={(value) => [`GHS ${Number(value).toLocaleString()}`, ""]} />
                <Bar dataKey="cost" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leave Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Leave Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={leaveAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="annual" stackId="1" stroke="#10b981" fill="#10b981" />
                <Area type="monotone" dataKey="sick" stackId="1" stroke="#ef4444" fill="#ef4444" />
                <Area type="monotone" dataKey="personal" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5" />
              <span>Compliance Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {complianceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Headcount Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Headcount Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={headcountTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={2} name="New Hires" />
                <Line type="monotone" dataKey="left" stroke="#ef4444" strokeWidth={2} name="Departures" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Employees</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Salary</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {departmentCosts.map((dept, index) => {
                  const totalCost = departmentCosts.reduce((sum, d) => sum + d.cost, 0)
                  const percentage = ((dept.cost / totalCost) * 100).toFixed(1)
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{dept.employees}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        GHS {dept.cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">GHS {dept.avgSalary.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant="outline" className="bg-transparent">
                          {percentage}%
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

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-900">Payroll Growth</p>
                  <p className="text-sm text-emerald-800">
                    Monthly payroll has increased by {grossChange.toFixed(1)}% compared to last month, indicating
                    business growth and potential new hires.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Department Distribution</p>
                  <p className="text-sm text-blue-800">
                    Operations has the highest headcount (82 employees) while Technology has the highest average salary
                    (GHS 8,500).
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Leave Patterns</p>
                  <p className="text-sm text-orange-800">
                    December showed the highest annual leave usage (67 days), typical for holiday season. Sick leave
                    remains consistent.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                <Calculator className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Compliance Alert</p>
                  <p className="text-sm text-yellow-800">
                    3 employees require minimum wage review. Ensure compliance with Ghana's 2025 minimum wage
                    requirements.
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
