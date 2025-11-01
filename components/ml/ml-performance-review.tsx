"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  BarChart3,
  Lightbulb,
  Users,
  Award,
  BookOpen
} from "lucide-react"

interface PerformanceData {
  employee_id: string
  performance_trend_score: number
  performance_potential_score: number
  performance_ml_insights: any
  employees: {
    first_name: string
    last_name: string
    position: string
    department: string
  }
}

interface MLPerformanceReviewProps {
  employeeId: string
  onSave?: (data: any) => void
}

export default function MLPerformanceReview({ employeeId, onSave }: MLPerformanceReviewProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewData, setReviewData] = useState({
    goals_achieved: '',
    strengths: '',
    areas_for_improvement: '',
    manager_feedback: '',
    employee_self_assessment: '',
    next_quarter_goals: ''
  })
  const [mlInsights, setMLInsights] = useState<any>(null)

  useEffect(() => {
    fetchPerformanceData()
  }, [employeeId])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ml/performance-prediction?employee_id=${employeeId}`)
      const data = await response.json()

      if (data.success && data.data && data.data.length > 0) {
        setPerformanceData(data.data[0])
        setMLInsights(data.data[0].performance_ml_insights)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'bg-green-100 text-green-800', icon: TrendingUp }
    if (score >= 65) return { level: 'Good', color: 'bg-blue-100 text-blue-800', icon: TrendingUp }
    if (score >= 50) return { level: 'Satisfactory', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp }
    return { level: 'Needs Improvement', color: 'bg-red-100 text-red-800', icon: TrendingDown }
  }

  const getPotentialLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'bg-purple-100 text-purple-800' }
    if (score >= 60) return { level: 'Medium-High', color: 'bg-blue-100 text-blue-800' }
    if (score >= 40) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'Low', color: 'bg-gray-100 text-gray-800' }
  }

  const generateMLRecommendations = () => {
    if (!performanceData) return []

    const recommendations = []
    const performance = getPerformanceLevel(performanceData.performance_trend_score)
    const potential = getPotentialLevel(performanceData.performance_potential_score)

    if (performance.level === 'Needs Improvement') {
      recommendations.push({
        type: 'improvement',
        title: 'Performance Improvement Plan',
        description: 'Focus on core competencies and regular feedback sessions',
        priority: 'high',
        icon: AlertTriangle
      })
    }

    if (potential.level === 'High') {
      recommendations.push({
        type: 'development',
        title: 'Leadership Development',
        description: 'High potential identified - consider leadership training',
        priority: 'medium',
        icon: Award
      })
    }

    if (performanceData.performance_trend_score >= 70) {
      recommendations.push({
        type: 'recognition',
        title: 'Performance Recognition',
        description: 'Consider recognition and advancement opportunities',
        priority: 'low',
        icon: Star
      })
    }

    return recommendations
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...reviewData,
        ml_insights: mlInsights,
        performance_scores: {
          trend: performanceData?.performance_trend_score,
          potential: performanceData?.performance_potential_score
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Performance Data Available</h3>
          <p className="text-gray-600">Unable to load ML-powered performance insights for this employee.</p>
        </CardContent>
      </Card>
    )
  }

  const performance = getPerformanceLevel(performanceData.performance_trend_score)
  const potential = getPotentialLevel(performanceData.performance_potential_score)
  const recommendations = generateMLRecommendations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML-Enhanced Performance Review</h2>
          <p className="text-gray-600">
            {performanceData.employees.first_name} {performanceData.employees.last_name} • 
            {performanceData.employees.position} • {performanceData.employees.department}
          </p>
        </div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Save Review
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Insights Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-emerald-600" />
                <span>AI Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Performance Score</span>
                  <span className="text-sm text-gray-600">{performanceData.performance_trend_score}%</span>
                </div>
                <Progress value={performanceData.performance_trend_score} className="mb-2" />
                <Badge className={performance.color}>
                  <performance.icon className="w-3 h-3 mr-1" />
                  {performance.level}
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Growth Potential</span>
                  <span className="text-sm text-gray-600">{performanceData.performance_potential_score}%</span>
                </div>
                <Progress value={performanceData.performance_potential_score} className="mb-2" />
                <Badge className={potential.color}>
                  {potential.level} Potential
                </Badge>
              </div>

              {mlInsights && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">AI Insights</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {mlInsights.key_strengths?.map((strength: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{strength}</span>
                      </div>
                    ))}
                    {mlInsights.improvement_areas?.map((area: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <span>AI Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => {
                  const Icon = rec.icon
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Icon className="w-4 h-4 mt-0.5 text-emerald-600" />
                        <div>
                          <h4 className="text-sm font-medium">{rec.title}</h4>
                          <p className="text-xs text-gray-600">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="goals" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="goals">Goals & Achievements</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
              <TabsTrigger value="future">Future Planning</TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Goals & Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="goals_achieved">Goals Achieved This Quarter</Label>
                    <Textarea
                      id="goals_achieved"
                      placeholder="Describe the goals that were achieved..."
                      value={reviewData.goals_achieved}
                      onChange={(e) => setReviewData({...reviewData, goals_achieved: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="strengths">Key Strengths Demonstrated</Label>
                    <Textarea
                      id="strengths"
                      placeholder="Highlight the employee's key strengths..."
                      value={reviewData.strengths}
                      onChange={(e) => setReviewData({...reviewData, strengths: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
                    <Textarea
                      id="areas_for_improvement"
                      placeholder="Identify specific areas where the employee can improve..."
                      value={reviewData.areas_for_improvement}
                      onChange={(e) => setReviewData({...reviewData, areas_for_improvement: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager_feedback">Manager's Overall Feedback</Label>
                    <Textarea
                      id="manager_feedback"
                      placeholder="Provide comprehensive feedback on performance..."
                      value={reviewData.manager_feedback}
                      onChange={(e) => setReviewData({...reviewData, manager_feedback: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="development" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Development & Growth</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="employee_self_assessment">Employee Self-Assessment</Label>
                    <Textarea
                      id="employee_self_assessment"
                      placeholder="Employee's self-assessment of their performance..."
                      value={reviewData.employee_self_assessment}
                      onChange={(e) => setReviewData({...reviewData, employee_self_assessment: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">AI Development Suggestions</h4>
                    <div className="text-sm text-blue-800">
                      {performanceData.performance_potential_score >= 70 ? (
                        <p>High potential detected. Consider leadership development programs and stretch assignments.</p>
                      ) : performanceData.performance_trend_score < 60 ? (
                        <p>Focus on core competency development and regular coaching sessions.</p>
                      ) : (
                        <p>Continue current development path with additional skill-building opportunities.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="future" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Future Planning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="next_quarter_goals">Next Quarter Goals</Label>
                    <Textarea
                      id="next_quarter_goals"
                      placeholder="Set specific, measurable goals for the next quarter..."
                      value={reviewData.next_quarter_goals}
                      onChange={(e) => setReviewData({...reviewData, next_quarter_goals: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">AI Career Path Suggestions</h4>
                    <div className="text-sm text-green-800">
                      {performanceData.performance_potential_score >= 80 ? (
                        <p>Ready for advancement opportunities. Consider promotion or lateral moves to gain new experience.</p>
                      ) : (
                        <p>Focus on skill development and gaining more experience in current role before advancement.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
