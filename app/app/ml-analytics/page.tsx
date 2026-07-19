"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import EmployeeAnalyticsDashboard from "@/components/ml/employee-analytics-dashboard"
import LearningRecommendationsPanel from "@/components/ml/learning-recommendations-panel"
import MLPerformanceReview from "@/components/ml/ml-performance-review"
import SkillGapAnalysis from "@/components/ml/skill-gap-analysis"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import { toast } from "@/hooks/use-toast"
import {
  Brain,
  TrendingUp,
  Users,
  Target,
  BookOpen,
  BarChart3,
  Lightbulb,
  Zap
} from "lucide-react"

export default function MLAnalyticsPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState("")
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    void resolveClientCompanyId()
      .then(async (cid) => {
        setCompanyId(cid)
        const res = await fetch(
          `/api/employees?company_id=${encodeURIComponent(cid)}&status=active&options=true&limit=200`,
          { credentials: "include", cache: "no-store" },
        )
        const json = await res.json().catch(() => ({}))
        if (res.ok) {
          const list = (json.employees || json.data || []).map((e: any) => ({
            id: e.id,
            name: e.name || e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim(),
          }))
          setEmployees(list)
        }
      })
      .catch((err) => {
        toast({
          title: "Company required",
          description: err instanceof Error ? err.message : "Unable to resolve company",
          variant: "destructive",
        })
      })
  }, [])

  const mlFeatures = [
    {
      id: "retention",
      title: "Retention Risk Analysis",
      description: "AI-powered prediction of employee retention risk",
      icon: Users,
      color: "bg-red-100 text-red-800",
      status: "active"
    },
    {
      id: "performance",
      title: "Performance Prediction",
      description: "Machine learning insights for performance reviews",
      icon: TrendingUp,
      color: "bg-green-100 text-green-800",
      status: "active"
    },
    {
      id: "promotion",
      title: "Promotion Readiness",
      description: "ML-driven promotion recommendation system",
      icon: Target,
      color: "bg-blue-100 text-blue-800",
      status: "active"
    },
    {
      id: "learning",
      title: "Learning Recommendations",
      description: "Personalized learning paths using AI",
      icon: BookOpen,
      color: "bg-purple-100 text-purple-800",
      status: "active"
    },
    {
      id: "sentiment",
      title: "Sentiment Analysis",
      description: "AI analysis of employee feedback and sentiment",
      icon: Lightbulb,
      color: "bg-yellow-100 text-yellow-800",
      status: "beta"
    },
    {
      id: "career",
      title: "Career Progression",
      description: "ML-powered career path predictions",
      icon: Zap,
      color: "bg-orange-100 text-orange-800",
      status: "beta"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ML-Powered HR Analytics</h1>
          <p className="text-gray-600">AI-driven insights for employee retention, performance, and development</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-emerald-100 text-emerald-800">
            <Brain className="w-3 h-3 mr-1" />
            AI Active
          </Badge>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* ML Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mlFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                  <Badge className={feature.color}>
                    {feature.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      feature.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium capitalize">{feature.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Analytics Dashboard */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="retention">Retention Risk</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EmployeeAnalyticsDashboard companyId={companyId || undefined} />
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeAnalyticsDashboard companyId={companyId || undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeAnalyticsDashboard companyId={companyId || undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <LearningRecommendationsPanel companyId={companyId || undefined} />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillGapAnalysis companyId={companyId || undefined} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ML-Enhanced Performance Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <MLPerformanceReview 
                  employeeId={selectedEmployee}
                  onSave={(data) => {
                    console.log('Review saved:', data)
                    // Handle save logic
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Employee</h3>
                  <p className="text-gray-600 mb-4">Choose an employee to start an ML-enhanced performance review</p>
                  <div className="space-y-3 max-w-sm mx-auto">
                    <select
                      className="w-full border rounded-md h-10 px-3 text-sm"
                      value={selectedEmployee || ""}
                      onChange={(e) => setSelectedEmployee(e.target.value || null)}
                    >
                      <option value="">Select employee…</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <Button
                      disabled={!selectedEmployee}
                      onClick={() => selectedEmployee && setSelectedEmployee(selectedEmployee)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Start Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setSelectedTab("retention")}
            >
              <Users className="w-6 h-6" />
              <span>Run Retention Analysis</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setSelectedTab("learning")}
            >
              <BookOpen className="w-6 h-6" />
              <span>Generate Learning Paths</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setSelectedTab("performance")}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Performance Insights</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setSelectedTab("reviews")}
            >
              <Target className="w-6 h-6" />
              <span>Start ML Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
