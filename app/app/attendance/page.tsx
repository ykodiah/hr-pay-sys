"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Download, Filter, Brain, TrendingUp, AlertTriangle, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clockIn, clockOut, getAttendanceRecords, getCompanyInfo } from "@/app/actions/attendance"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { calculateAIAttendanceScore } from "@/lib/attendance/ml-engine"
import { useRouter } from "next/navigation"

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [selectedRecordForAI, setSelectedRecordForAI] = useState<any>(null)
  const [aiPredictions, setAiPredictions] = useState<any>(null)

  // Date filters
  const [dateFilter, setDateFilter] = useState("today")
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()

  // Search filters
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [divisionFilter, setDivisionFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [departments, setDepartments] = useState<string[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    overtime: 0,
    totalHours: 0,
  })

  useEffect(() => {
    loadCurrentUser()
    loadCompanyInfo()
    loadAttendanceData()
    loadFilterOptions()
    loadAIPredictions()
  }, [])

  useEffect(() => {
    loadAttendanceData()
  }, [dateFilter, customStartDate, customEndDate, departmentFilter, divisionFilter, locationFilter])

  async function loadCurrentUser() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*, employee:employees(*)")
        .eq("id", user.id)
        .single()
      setCurrentUser(profile)
    }
  }

  async function loadCompanyInfo() {
    const info = await getCompanyInfo()
    setCompanyInfo(info)
  }

  async function loadFilterOptions() {
    const supabase = createClient()
    const { data: employees } = await supabase.from("employees").select("department, division, location")

    if (employees) {
      setDepartments([...new Set(employees.map((e) => e.department).filter(Boolean))])
      setDivisions([...new Set(employees.map((e) => e.division).filter(Boolean))])
      setLocations([...new Set(employees.map((e) => e.location).filter(Boolean))])
    }
  }

  async function loadAttendanceData() {
    setLoading(true)

    // Calculate date range
    let startDate, endDate
    const today = new Date()

    switch (dateFilter) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString()
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
        endDate = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
        break
      case "week":
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString()
        endDate = new Date().toISOString()
        break
      case "month":
        startDate = new Date(today.setDate(today.getDate() - 30)).toISOString()
        endDate = new Date().toISOString()
        break
      case "custom":
        if (customStartDate) startDate = customStartDate.toISOString()
        if (customEndDate) endDate = customEndDate.toISOString()
        break
    }

    const result = await getAttendanceRecords({
      startDate,
      endDate,
      department: departmentFilter,
      division: divisionFilter,
      location: locationFilter,
    })

    if (result.success) {
      const recordsWithAI = result.data.map((record: any) => ({
        ...record,
        aiScore: calculateAIAttendanceScore(record),
      }))
      setRecords(recordsWithAI)
      calculateStats(recordsWithAI)
    }

    setLoading(false)
  }

  function calculateStats(data: any[]) {
    const present = data.filter((r) => r.status === "present").length
    const absent = data.filter((r) => r.status === "absent").length
    const late = data.filter((r) => r.late_by_minutes && r.late_by_minutes > 0).length
    const totalHours = data.reduce((sum, r) => sum + (r.total_hours || 0), 0)
    const overtime = data.filter((r) => r.overtime_hours && r.overtime_hours > 0).length

    setStats({ present, absent, late, overtime, totalHours })
  }

  async function loadAIPredictions() {
    setAiInsightsLoading(true)
    try {
      const response = await fetch("/api/attendance/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "burnout-risks" }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiPredictions(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load AI predictions:", error)
    } finally {
      setAiInsightsLoading(false)
    }
  }

  async function analyzeEmployee(employeeId: string) {
    setAiInsightsLoading(true)
    try {
      const response = await fetch("/api/attendance/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "predict-risk", employeeId }),
      })

      if (response.ok) {
        const insights = await response.json()
        setSelectedRecordForAI(insights)
        setShowAIInsights(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to analyze employee",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      })
    } finally {
      setAiInsightsLoading(false)
    }
  }

  async function handleClockIn() {
    if (!currentUser?.employee) {
      toast({ title: "Error", description: "Employee profile not found", variant: "destructive" })
      return
    }

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await clockIn(currentUser.employee.id, position.coords.latitude, position.coords.longitude)

          if (result.success) {
            toast({ title: "Success", description: "Clocked in successfully" })
            loadAttendanceData()
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get your location. Clocking in without location.",
            variant: "destructive",
          })
          // Clock in without location
          clockIn(currentUser.employee.id).then((result) => {
            if (result.success) {
              toast({ title: "Success", description: "Clocked in successfully" })
              loadAttendanceData()
            }
          })
        },
      )
    } else {
      // Browser doesn't support geolocation
      const result = await clockIn(currentUser.employee.id)
      if (result.success) {
        toast({ title: "Success", description: "Clocked in successfully" })
        loadAttendanceData()
      }
    }
  }

  async function handleClockOut() {
    if (!currentUser?.employee) return

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await clockOut(currentUser.employee.id, position.coords.latitude, position.coords.longitude)

          if (result.success) {
            toast({ title: "Success", description: "Clocked out successfully" })
            loadAttendanceData()
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        },
        () => {
          clockOut(currentUser.employee.id).then((result) => {
            if (result.success) {
              toast({ title: "Success", description: "Clocked out successfully" })
              loadAttendanceData()
            }
          })
        },
      )
    } else {
      const result = await clockOut(currentUser.employee.id)
      if (result.success) {
        toast({ title: "Success", description: "Clocked out successfully" })
        loadAttendanceData()
      }
    }
  }

  async function downloadReport(reportType: string) {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          filters: {
            startDate: customStartDate?.toISOString(),
            endDate: customEndDate?.toISOString(),
            department: departmentFilter,
            division: divisionFilter,
            location: locationFilter,
          },
        }),
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-${Date.now()}.pdf`
      a.click()

      toast({ title: "Success", description: "Report downloaded successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to download report", variant: "destructive" })
    }
    setLoading(false)
  }

  function getAIScoreBadge(score: number) {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>
    if (score >= 75) return <Badge className="bg-blue-500">Good</Badge>
    if (score >= 60) return <Badge className="bg-yellow-500">Fair</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Clock In/Out */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage employee attendance</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/app/attendance/ai-insights")}
            variant="outline"
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
          >
            <Brain className="h-4 w-4" />
            AI Insights
          </Button>
          <Button onClick={handleClockIn} className="gap-2">
            <Clock className="h-4 w-4" />
            Clock In
          </Button>
          <Button onClick={handleClockOut} variant="outline" className="gap-2 bg-transparent">
            <Clock className="h-4 w-4" />
            Clock Out
          </Button>
        </div>
      </div>

      {aiPredictions && aiPredictions.employees && aiPredictions.employees.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  AI Alert: {aiPredictions.employees.length} Employee(s) at Risk of Burnout
                </h3>
                <p className="text-sm text-orange-800">
                  ML analysis detected excessive overtime patterns. Review recommended for:{" "}
                  {aiPredictions.employees.map((e: any) => e.name).join(", ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/app/attendance/ai-insights")}
                className="border-orange-300"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overtime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Division</label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map((div) => (
                    <SelectItem key={div} value={div}>
                      {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      {customStartDate ? format(customStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      {customEndDate ? format(customEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => downloadReport("Daily Attendance Report")} variant="outline">
            Daily Report
          </Button>
          <Button onClick={() => downloadReport("Weekly Attendance Summary")} variant="outline">
            Weekly Summary
          </Button>
          <Button onClick={() => downloadReport("Monthly Attendance Analysis")} variant="outline">
            Monthly Analysis
          </Button>
          <Button onClick={() => downloadReport("Department Attendance Report")} variant="outline">
            Department Report
          </Button>
          <Button onClick={() => downloadReport("Overtime Report")} variant="outline">
            Overtime Report
          </Button>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Employee</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Division</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Clock In</th>
                    <th className="text-left p-2">Clock Out</th>
                    <th className="text-left p-2">Hours</th>
                    <th className="text-left p-2">GPS</th>
                    <th className="text-left p-2">AI Score</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{record.employee?.full_name}</td>
                      <td className="p-2">{record.employee?.department || "-"}</td>
                      <td className="p-2">{record.employee?.division || "-"}</td>
                      <td className="p-2">{record.employee?.location || "-"}</td>
                      <td className="p-2">{new Date(record.clock_in).toLocaleDateString()}</td>
                      <td className="p-2">{new Date(record.clock_in).toLocaleTimeString()}</td>
                      <td className="p-2">
                        {record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : "-"}
                      </td>
                      <td className="p-2">{record.total_hours?.toFixed(2) || "-"}</td>
                      <td className="p-2">
                        {record.clock_in_latitude && record.clock_in_longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${record.clock_in_latitude},${record.clock_in_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <MapPin className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{record.aiScore}</span>
                          {getAIScoreBadge(record.aiScore)}
                        </div>
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => analyzeEmployee(record.employee_id)}
                          disabled={aiInsightsLoading}
                          className="gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Analyze
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAIInsights && selectedRecordForAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Employee Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Risk Level */}
              <div>
                <h4 className="font-semibold mb-2">Risk Assessment</h4>
                <Badge
                  className={
                    selectedRecordForAI.riskLevel === "critical"
                      ? "bg-red-600"
                      : selectedRecordForAI.riskLevel === "high"
                        ? "bg-orange-600"
                        : selectedRecordForAI.riskLevel === "medium"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                  }
                >
                  {selectedRecordForAI.riskLevel?.toUpperCase()}
                </Badge>
              </div>

              {/* Risk Factors */}
              {selectedRecordForAI.riskFactors && selectedRecordForAI.riskFactors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Risk Factors</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedRecordForAI.riskFactors.map((factor: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Predictions */}
              {selectedRecordForAI.predictions && (
                <div>
                  <h4 className="font-semibold mb-2">ML Predictions</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="text-xs text-muted-foreground mb-1">Absenteeism Risk</div>
                      <div className="text-lg font-bold text-orange-600">
                        {selectedRecordForAI.predictions.absenteeismRisk}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="text-xs text-muted-foreground mb-1">Burnout Risk</div>
                      <div className="text-lg font-bold text-red-600">
                        {selectedRecordForAI.predictions.burnoutRisk}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="text-xs text-muted-foreground mb-1">Time Theft Risk</div>
                      <div className="text-lg font-bold text-purple-600">
                        {selectedRecordForAI.predictions.timeTheftRisk}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedRecordForAI.recommendations && selectedRecordForAI.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">AI Recommendations</h4>
                  <div className="space-y-2">
                    {selectedRecordForAI.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-2">
                          <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>{rec.priority}</Badge>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{rec.action}</div>
                            <div className="text-xs text-muted-foreground mt-1">{rec.expectedImpact}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend Analysis */}
              {selectedRecordForAI.trendAnalysis && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trend Analysis
                  </h4>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border">
                    <Badge className="mb-2">{selectedRecordForAI.trendAnalysis.direction}</Badge>
                    <p className="text-sm">{selectedRecordForAI.trendAnalysis.summary}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAIInsights(false)}>
                  Close
                </Button>
                <Button onClick={() => router.push("/app/attendance/ai-insights")}>View Full AI Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
