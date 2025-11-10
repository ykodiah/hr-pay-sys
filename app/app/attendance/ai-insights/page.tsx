"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, AlertTriangle, Users, Activity, Target, Sparkles, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(false)
  const [burnoutRisks, setBurnoutRisks] = useState<any[]>([])
  const [departmentInsights, setDepartmentInsights] = useState<any>(null)
  const [selectedDepartment, setSelectedDepartment] = useState("Technology")
  const { toast } = useToast()

  const loadBurnoutRisks = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "burnout-risks" }),
      })

      if (response.ok) {
        const data = await response.json()
        setBurnoutRisks(data.employees || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load burnout risk analysis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDepartmentInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "department-insights",
          department: selectedDepartment,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDepartmentInsights(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load department insights",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBurnoutRisks()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI Insights & Analytics</h1>
              <p className="text-xs text-muted-foreground">Powered by machine learning and predictive analytics</p>
            </div>
          </div>
          <Button
            onClick={() => {
              loadBurnoutRisks()
              if (departmentInsights) loadDepartmentInsights()
            }}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Risk Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Burnout Risk</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{burnoutRisks.length}</div>
                  <p className="text-xs text-muted-foreground">Employees at high risk</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                  <Target className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.2%</div>
                  <p className="text-xs text-muted-foreground">Model prediction accuracy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Patterns Detected</CardTitle>
                  <Activity className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">27</div>
                  <p className="text-xs text-muted-foreground">Significant patterns found</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Insights Generated</CardTitle>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Burnout Risk Employees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Employees at Risk of Burnout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {burnoutRisks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No employees currently at high risk of burnout
                  </p>
                ) : (
                  <div className="space-y-3">
                    {burnoutRisks.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-orange-50 border-orange-200"
                      >
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.department}</div>
                        </div>
                        <Badge variant="destructive">High Risk</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Predictive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ML-powered predictions based on historical attendance patterns
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-medium mb-2">Next Week Forecast</h4>
                    <p className="text-sm text-muted-foreground">
                      Expected attendance rate: <strong>92.3%</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Predicted late arrivals: <strong>23 employees</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Forecasted overtime hours: <strong>187 hours</strong>
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                    <h4 className="font-medium mb-2">Seasonal Trends</h4>
                    <p className="text-sm text-muted-foreground">
                      Absenteeism typically increases by 15% during flu season (November-February)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Anomaly Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">AI-detected unusual patterns in attendance data</p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="destructive" className="mb-2">
                          High Severity
                        </Badge>
                        <h4 className="font-medium">GPS Location Anomaly</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Employee clocked in from unusual location (50km from normal workplace)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          Medium Severity
                        </Badge>
                        <h4 className="font-medium">Timing Pattern</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Consistent late arrival pattern detected (same time for 5 consecutive days)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Analysis Tab */}
          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Department Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={selectedDepartment === "Technology" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDepartment("Technology")}
                    >
                      Technology
                    </Button>
                    <Button
                      variant={selectedDepartment === "Sales" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDepartment("Sales")}
                    >
                      Sales
                    </Button>
                    <Button
                      variant={selectedDepartment === "HR" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDepartment("HR")}
                    >
                      HR
                    </Button>
                    <Button onClick={loadDepartmentInsights} size="sm" disabled={loading}>
                      Generate Insights
                    </Button>
                  </div>

                  {departmentInsights && (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                {departmentInsights.metrics.avgAttendanceRate}%
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Attendance Rate</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-orange-600">
                                {departmentInsights.metrics.avgLateRate}%
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Late Arrival Rate</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-blue-600">
                                {departmentInsights.metrics.avgOvertimeHours.toFixed(1)}h
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Avg Overtime</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardContent className="pt-6">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            AI-Generated Insights
                          </h4>
                          <p className="text-sm leading-relaxed whitespace-pre-line">{departmentInsights.insights}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
