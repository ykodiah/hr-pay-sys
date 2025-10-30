"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Users,
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap
} from "lucide-react"

interface LearningRecommendation {
  id: string
  employee_id: string
  recommendation_type: string
  title: string
  description: string
  priority_score: number
  estimated_duration_days: number
  difficulty_level: string
  status: string
  progress_percentage: number
  recommended_courses: any[]
  learning_objectives: string[]
  employees: {
    first_name: string
    last_name: string
    position: string
    department: string
  }
}

interface LearningPanelProps {
  companyId?: string
  employeeId?: string
}

export default function LearningRecommendationsPanel({ companyId, employeeId }: LearningPanelProps) {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    fetchRecommendations()
  }, [companyId, employeeId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (employeeId) params.append('employee_id', employeeId)
      if (companyId) params.append('company_id', companyId)

      const response = await fetch(`/api/ml/learning-recommendations?${params}`)
      const data = await response.json()

      if (data.success) {
        setRecommendations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching learning recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'destructive'
    if (score >= 60) return 'secondary'
    return 'default'
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'in_progress': return Play
      case 'pending': return Clock
      case 'paused': return AlertCircle
      default: return Clock
    }
  }

  const filteredRecommendations = selectedCategory === "all" 
    ? recommendations 
    : recommendations.filter(r => r.recommendation_type === selectedCategory)

  const categories = [
    { value: "all", label: "All", count: recommendations.length },
    { value: "skill_development", label: "Skill Development", count: recommendations.filter(r => r.recommendation_type === "skill_development").length },
    { value: "career_advancement", label: "Career Advancement", count: recommendations.filter(r => r.recommendation_type === "career_advancement").length },
    { value: "leadership_development", label: "Leadership", count: recommendations.filter(r => r.recommendation_type === "leadership_development").length },
    { value: "technical_upgrade", label: "Technical", count: recommendations.filter(r => r.recommendation_type === "technical_upgrade").length }
  ]

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
          <h2 className="text-2xl font-bold text-gray-900">AI Learning Recommendations</h2>
          <p className="text-gray-600">Personalized learning paths powered by machine learning</p>
        </div>
        <Button onClick={fetchRecommendations} className="bg-emerald-600 hover:bg-emerald-700">
          <Brain className="w-4 h-4 mr-2" />
          Refresh Recommendations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated learning paths
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {recommendations.filter(r => r.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recommendations.filter(r => r.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Learning completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Star className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {recommendations.filter(r => r.priority_score >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgent recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label} ({category.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid gap-4">
            {filteredRecommendations
              .sort((a, b) => b.priority_score - a.priority_score)
              .map((recommendation) => {
                const StatusIcon = getStatusIcon(recommendation.status)
                
                return (
                  <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-lg">{recommendation.title}</h3>
                            <Badge variant={getPriorityColor(recommendation.priority_score) as any}>
                              Priority: {recommendation.priority_score}%
                            </Badge>
                            <Badge className={getDifficultyColor(recommendation.difficulty_level)}>
                              {recommendation.difficulty_level}
                            </Badge>
                            <Badge className={getStatusColor(recommendation.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {recommendation.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{recommendation.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{recommendation.estimated_duration_days} days</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{recommendation.employees.first_name} {recommendation.employees.last_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{recommendation.employees.position}</span>
                            </div>
                          </div>

                          {recommendation.status === 'in_progress' && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{recommendation.progress_percentage}%</span>
                              </div>
                              <Progress value={recommendation.progress_percentage} className="w-full" />
                            </div>
                          )}

                          {recommendation.learning_objectives && recommendation.learning_objectives.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Learning Objectives:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {recommendation.learning_objectives.map((objective, index) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <span>{objective}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {recommendation.recommended_courses && recommendation.recommended_courses.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Recommended Courses:</h4>
                              <div className="flex flex-wrap gap-2">
                                {recommendation.recommended_courses.map((course, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {course.title || course.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={recommendation.status === 'completed'}
                          >
                            {recommendation.status === 'in_progress' ? 'Continue' : 'Start Learning'}
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
    </div>
  )
}