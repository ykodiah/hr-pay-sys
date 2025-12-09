"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Brain,
  Zap
} from "lucide-react"

interface EmployeeAnalytics {
  id: string
  employee_id: string
  retention_risk_score: number
  performance_trend_score: number
  promotion_readiness_score: number
  overall_sentiment_score: number
  employees: {
    first_name: string
    last_name: string
    position: string
    department: string
  }
}

interface MLDashboardProps {
  companyId?: string
  employeeId?: string
}

export default function EmployeeAnalyticsDashboard({ companyId, employeeId }: MLDashboardProps) {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    fetchAnalytics()
  }, [companyId, employeeId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (employeeId) params.append('employee_id', employeeId)
      if (companyId) params.append('company_id', companyId)

      const response = await fetch(`/api/ml/retention-analysis?${params}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'High', color: 'destructive', icon: AlertTriangle }
    if (score >= 40) return { level: 'Medium', color: 'secondary', icon: Clock }
    return { level: 'Low', color: 'default', icon: CheckCircle }
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'default', icon: TrendingUp }
    if (score >= 65) return { level: 'Good', color: 'default', icon: TrendingUp }
    if (score >= 50) return { level: 'Satisfactory', color: 'secondary', icon: TrendingUp }
    return { level: 'Needs Improvement', color: 'destructive', icon: TrendingDown }
  }

  const getSentimentColor = (score: number) => {
    if (score >= 0.3) return 'text-green-600'
    if (score >= -0.2) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML-Powered Employee Analytics</h2>
          <p className="text-gray-600">AI-driven insights for retention, performance, and development</p>
        </div>
        <Button onClick={fetchAnalytics} className="bg-emerald-600 hover:bg-emerald-700">
          <Brain className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="retention">Retention Risk</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="promotion">Promotion Ready</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees analyzed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.filter(a => a.retention_risk_score >= 70).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Retention risk
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Performers</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.filter(a => a.performance_trend_score >= 80).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Excellent performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promotion Ready</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.filter(a => a.promotion_readiness_score >= 80).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for promotion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retention Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['High', 'Medium', 'Low'].map((level) => {
                    const count = analytics.filter(a => {
                      const risk = getRiskLevel(a.retention_risk_score)
                      return risk.level === level
                    }).length
                    const percentage = analytics.length > 0 ? (count / analytics.length) * 100 : 0
                    
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{level} Risk</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={percentage} className="w-24" />
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'].map((level) => {
                    const count = analytics.filter(a => {
                      const perf = getPerformanceLevel(a.performance_trend_score)
                      return perf.level === level
                    }).length
                    const percentage = analytics.length > 0 ? (count / analytics.length) * 100 : 0
                    
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{level}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={percentage} className="w-24" />
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <div className="grid gap-4">
            {analytics
              .sort((a, b) => b.retention_risk_score - a.retention_risk_score)
              .map((analytic) => {
                const risk = getRiskLevel(analytic.retention_risk_score)
                const RiskIcon = risk.icon
                
                return (
                  <Card key={analytic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {analytic.employees.first_name[0]}{analytic.employees.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {analytic.employees.first_name} {analytic.employees.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {analytic.employees.position} • {analytic.employees.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{analytic.retention_risk_score}%</div>
                            <Badge variant={risk.color as any}>
                              <RiskIcon className="w-3 h-3 mr-1" />
                              {risk.level} Risk
                            </Badge>
                          </div>
                          <div className="w-24">
                            <Progress value={analytic.retention_risk_score} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4">
            {analytics
              .sort((a, b) => b.performance_trend_score - a.performance_trend_score)
              .map((analytic) => {
                const performance = getPerformanceLevel(analytic.performance_trend_score)
                const PerformanceIcon = performance.icon
                
                return (
                  <Card key={analytic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {analytic.employees.first_name[0]}{analytic.employees.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {analytic.employees.first_name} {analytic.employees.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {analytic.employees.position} • {analytic.employees.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{analytic.performance_trend_score}%</div>
                            <Badge variant={performance.color as any}>
                              <PerformanceIcon className="w-3 h-3 mr-1" />
                              {performance.level}
                            </Badge>
                          </div>
                          <div className="w-24">
                            <Progress value={analytic.performance_trend_score} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="promotion" className="space-y-4">
          <div className="grid gap-4">
            {analytics
              .sort((a, b) => b.promotion_readiness_score - a.promotion_readiness_score)
              .map((analytic) => {
                const readinessLevel = analytic.promotion_readiness_score >= 80 ? 'Ready' : 
                                     analytic.promotion_readiness_score >= 60 ? 'Almost Ready' : 
                                     analytic.promotion_readiness_score >= 40 ? 'Developing' : 'Not Ready'
                
                return (
                  <Card key={analytic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {analytic.employees.first_name[0]}{analytic.employees.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {analytic.employees.first_name} {analytic.employees.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {analytic.employees.position} • {analytic.employees.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{analytic.promotion_readiness_score}%</div>
                            <Badge variant={readinessLevel === 'Ready' ? 'default' : 'secondary'}>
                              <Zap className="w-3 h-3 mr-1" />
                              {readinessLevel}
                            </Badge>
                          </div>
                          <div className="w-24">
                            <Progress value={analytic.promotion_readiness_score} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
