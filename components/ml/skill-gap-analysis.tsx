"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Target,
  TrendingUp,
  BookOpen,
  Users,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Award,
  Clock
} from "lucide-react"

interface SkillAssessment {
  id: string
  employee_id: string
  skill_category: string
  skill_name: string
  current_level: number
  target_level: number
  assessment_method: string
  predicted_level?: number
  confidence_score?: number
  improvement_potential?: number
  learning_recommendations: any[]
  employees: {
    first_name: string
    last_name: string
    position: string
    department: string
  }
}

interface SkillGapAnalysisProps {
  companyId?: string
  employeeId?: string
}

export default function SkillGapAnalysis({ companyId, employeeId }: SkillGapAnalysisProps) {
  const [assessments, setAssessments] = useState<SkillAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    fetchSkillAssessments()
  }, [companyId, employeeId])

  const fetchSkillAssessments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (employeeId) params.append('employee_id', employeeId)
      if (companyId) params.append('company_id', companyId)

      const response = await fetch(`/api/ml/skill-assessments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAssessments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching skill assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGapLevel = (current: number, target: number) => {
    const gap = target - current
    if (gap <= 0) return { level: 'No Gap', color: 'bg-green-100 text-green-800' }
    if (gap <= 1) return { level: 'Small Gap', color: 'bg-yellow-100 text-yellow-800' }
    if (gap <= 2) return { level: 'Medium Gap', color: 'bg-orange-100 text-orange-800' }
    return { level: 'Large Gap', color: 'bg-red-100 text-red-800' }
  }

  const getSkillLevel = (level: number) => {
    if (level >= 4.5) return { level: 'Expert', color: 'bg-purple-100 text-purple-800' }
    if (level >= 3.5) return { level: 'Advanced', color: 'bg-blue-100 text-blue-800' }
    if (level >= 2.5) return { level: 'Intermediate', color: 'bg-green-100 text-green-800' }
    if (level >= 1.5) return { level: 'Beginner', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'Novice', color: 'bg-gray-100 text-gray-800' }
  }

  const getAssessmentMethodColor = (method: string) => {
    switch (method) {
      case 'ml_prediction': return 'bg-purple-100 text-purple-800'
      case 'manager_review': return 'bg-blue-100 text-blue-800'
      case 'self_assessment': return 'bg-green-100 text-green-800'
      case 'peer_review': return 'bg-yellow-100 text-yellow-800'
      case 'test': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAssessments = selectedCategory === "all" 
    ? assessments 
    : assessments.filter(a => a.skill_category === selectedCategory)

  const categories = Array.from(new Set(assessments.map(a => a.skill_category)))
  const skillGaps = assessments.filter(a => a.current_level < a.target_level)
  const criticalGaps = skillGaps.filter(a => (a.target_level - a.current_level) >= 2)

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
          <h2 className="text-2xl font-bold text-gray-900">AI-Powered Skill Gap Analysis</h2>
          <p className="text-gray-600">Machine learning insights for skill development and career growth</p>
        </div>
        <Button onClick={fetchSkillAssessments} className="bg-emerald-600 hover:bg-emerald-700">
          <Brain className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground">
              Skills assessed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{skillGaps.length}</div>
            <p className="text-xs text-muted-foreground">
              Skills needing development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalGaps.length}</div>
            <p className="text-xs text-muted-foreground">
              High priority gaps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Predictions</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {assessments.filter(a => a.assessment_method === 'ml_prediction').length}
            </div>
            <p className="text-xs text-muted-foreground">
              AI-generated insights
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Skills</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid gap-4">
            {filteredAssessments
              .sort((a, b) => (b.target_level - b.current_level) - (a.target_level - a.current_level))
              .map((assessment) => {
                const gap = assessment.target_level - assessment.current_level
                const gapInfo = getGapLevel(assessment.current_level, assessment.target_level)
                const currentLevel = getSkillLevel(assessment.current_level)
                const targetLevel = getSkillLevel(assessment.target_level)
                const progressPercentage = (assessment.current_level / assessment.target_level) * 100
                
                return (
                  <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-medium text-lg">{assessment.skill_name}</h3>
                            <Badge className={gapInfo.color}>
                              {gapInfo.level}
                            </Badge>
                            <Badge className={getAssessmentMethodColor(assessment.assessment_method)}>
                              {assessment.assessment_method.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{assessment.employees.first_name} {assessment.employees.last_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{assessment.employees.position}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{assessment.skill_category}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Current Level</span>
                                <span className="text-sm text-gray-600">{assessment.current_level}/5</span>
                              </div>
                              <Progress value={(assessment.current_level / 5) * 100} className="mb-2" />
                              <Badge className={currentLevel.color}>
                                {currentLevel.level}
                              </Badge>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Target Level</span>
                                <span className="text-sm text-gray-600">{assessment.target_level}/5</span>
                              </div>
                              <Progress value={(assessment.target_level / 5) * 100} className="mb-2" />
                              <Badge className={targetLevel.color}>
                                {targetLevel.level}
                              </Badge>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Progress</span>
                                <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
                              </div>
                              <Progress value={progressPercentage} className="mb-2" />
                              <span className="text-xs text-gray-500">
                                {gap > 0 ? `${gap} levels to go` : 'Target achieved'}
                              </span>
                            </div>
                          </div>

                          {assessment.predicted_level && (
                            <div className="p-3 bg-purple-50 rounded-lg mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Brain className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-900">AI Prediction</span>
                              </div>
                              <div className="text-sm text-purple-800">
                                Predicted level: {assessment.predicted_level}/5 
                                {assessment.confidence_score && (
                                  <span className="ml-2">
                                    (Confidence: {Math.round(assessment.confidence_score)}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {assessment.improvement_potential && (
                            <div className="p-3 bg-green-50 rounded-lg mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-900">Improvement Potential</span>
                              </div>
                              <div className="text-sm text-green-800">
                                {Math.round(assessment.improvement_potential)}% potential for growth
                              </div>
                            </div>
                          )}

                          {assessment.learning_recommendations && assessment.learning_recommendations.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">AI Learning Recommendations:</h4>
                              <div className="space-y-1">
                                {assessment.learning_recommendations.map((rec, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={gap <= 0}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Start Learning
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Skill Gap Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Gap Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Critical Gaps</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{criticalGaps.length}</div>
              <p className="text-sm text-red-700">Skills with 2+ level gaps</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">Medium Gaps</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {skillGaps.filter(a => (a.target_level - a.current_level) === 1).length}
              </div>
              <p className="text-sm text-orange-700">Skills with 1 level gap</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">No Gaps</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {assessments.length - skillGaps.length}
              </div>
              <p className="text-sm text-green-700">Skills at target level</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
