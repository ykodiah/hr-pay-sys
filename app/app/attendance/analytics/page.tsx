"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, AlertTriangle, Users, Download } from "lucide-react"
import { getAnalytics, getComplianceReport, getAbsenteeismRisks } from "@/app/actions/analytics"

export default function AttendanceAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  async function fetchData() {
    setLoading(true)
    try {
      const [analyticsData, complianceData, risksData] = await Promise.all([
        getAnalytics(startDate, endDate),
        getComplianceReport(startDate, endDate),
        getAbsenteeismRisks(),
      ])
      setAnalytics(analyticsData)
      setCompliance(complianceData)
      setRisks(risksData)
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Analytics</h1>
          <p className="text-muted-foreground">Insights and trends for workforce management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={fetchData}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.attendanceRate}%</div>
            <Progress value={analytics?.overview.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.presentToday}</div>
            <p className="text-xs text-muted-foreground">{analytics?.overview.absentToday} absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.lateToday}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Daily attendance patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#3b82f6" name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" />
                  <Line type="monotone" dataKey="late" stroke="#f59e0b" name="Late" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Hours Worked</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgHours" fill="#3b82f6" name="Avg Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Statistics</CardTitle>
              <CardDescription>Attendance metrics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.departmentStats.map((dept: any) => (
                  <div key={dept.department} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{dept.department}</h3>
                      <Badge>{dept.totalEmployees} employees</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-bold">{dept.avgAttendanceRate}%</p>
                        <Progress value={dept.avgAttendanceRate} className="mt-2" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                        <p className="text-2xl font-bold">{dept.avgHoursPerDay}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Late Count</p>
                        <p className="text-2xl font-bold text-orange-600">{dept.lateCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Compliance Rate</span>
                      <span className="text-sm font-bold">{compliance?.complianceRate}%</span>
                    </div>
                    <Progress value={compliance?.complianceRate} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold">{compliance?.totalRecords}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">Compliant</p>
                      <p className="text-2xl font-bold text-green-600">{compliance?.compliantRecords}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issues Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">Missing Clock Out</span>
                    <Badge variant="destructive">{compliance?.missingClockOut}</Badge>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">Late Arrivals</span>
                    <Badge variant="secondary">{compliance?.lateArrivals}</Badge>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">High Anomaly Score</span>
                    <Badge variant="outline">{compliance?.highAnomalyScore}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overtime Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded p-4">
                  <p className="text-sm text-muted-foreground">Total OT Hours</p>
                  <p className="text-2xl font-bold">{analytics?.overtimeStats.totalOvertimeHours}</p>
                </div>
                <div className="border rounded p-4">
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{analytics?.overtimeStats.totalOvertimeRequests}</p>
                </div>
                <div className="border rounded p-4">
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{analytics?.overtimeStats.approvedRequests}</p>
                </div>
                <div className="border rounded p-4">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics?.overtimeStats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absenteeism Risk Prediction</CardTitle>
              <CardDescription>Employees at risk of chronic absenteeism</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks.map((risk, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{risk.employee?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{risk.employee?.department}</p>
                      </div>
                      <Badge
                        variant={risk.riskScore > 0.5 ? "destructive" : risk.riskScore > 0.3 ? "secondary" : "outline"}
                      >
                        Risk: {(risk.riskScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Absent Days</p>
                        <p className="font-bold">
                          {risk.absentDays}/{risk.totalDays}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Late Days</p>
                        <p className="font-bold">{risk.lateDays}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Anomaly</p>
                        <p className="font-bold">{(risk.averageAnomalyScore * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <Progress value={risk.riskScore * 100} className="mt-3" />
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
