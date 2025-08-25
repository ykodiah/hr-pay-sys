"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Target, TrendingUp, Calendar, Star, Award, Plus, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react"

const performanceData = {
  currentRating: 4.2,
  goals: [
    {
      id: 1,
      title: "Complete React Training",
      description: "Finish advanced React course and implement learnings",
      progress: 75,
      dueDate: "2025-03-15",
      status: "In Progress",
      category: "Learning & Development",
    },
    {
      id: 2,
      title: "Improve Customer Satisfaction",
      description: "Achieve 95% customer satisfaction rating",
      progress: 90,
      dueDate: "2025-02-28",
      status: "On Track",
      category: "Performance",
    },
    {
      id: 3,
      title: "Lead Team Project",
      description: "Successfully lead the Q1 product launch project",
      progress: 60,
      dueDate: "2025-04-30",
      status: "In Progress",
      category: "Leadership",
    },
  ],
  reviews: [
    {
      id: 1,
      period: "Q4 2024",
      rating: 4.2,
      status: "Completed",
      reviewDate: "2024-12-15",
      reviewer: "John Doe",
      feedback: "Excellent performance with strong technical skills and team collaboration.",
    },
    {
      id: 2,
      period: "Q3 2024",
      rating: 4.0,
      status: "Completed",
      reviewDate: "2024-09-15",
      reviewer: "Jane Smith",
      feedback: "Good progress on goals with room for improvement in leadership skills.",
    },
  ],
  competencies: [
    { name: "Technical Skills", rating: 4.5, target: 4.0 },
    { name: "Communication", rating: 4.0, target: 4.2 },
    { name: "Leadership", rating: 3.8, target: 4.0 },
    { name: "Problem Solving", rating: 4.3, target: 4.0 },
    { name: "Teamwork", rating: 4.6, target: 4.5 },
  ],
}

export default function PerformancePage() {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "On Track":
        return <TrendingUp className="w-4 h-4 text-emerald-600" />
      case "At Risk":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "On Track":
        return <Badge className="bg-emerald-100 text-emerald-800">On Track</Badge>
      case "At Risk":
        return <Badge className="bg-red-100 text-red-800">At Risk</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600">Track your goals, reviews, and professional development</p>
        </div>
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
            </DialogHeader>
            <AddGoalForm onClose={() => setIsGoalDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{performanceData.currentRating}</div>
                <p className="text-sm text-gray-600">Current Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{performanceData.goals.length}</div>
                <p className="text-sm text-gray-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{performanceData.reviews.length}</div>
                <p className="text-sm text-gray-600">Reviews Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    performanceData.goals.reduce((sum, goal) => sum + goal.progress, 0) / performanceData.goals.length,
                  )}
                  %
                </div>
                <p className="text-sm text-gray-600">Avg. Goal Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals">My Goals</TabsTrigger>
          <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
        </TabsList>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Current Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {new Date(goal.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(goal.status)}
                          {getStatusBadge(goal.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{review.period}</h3>
                        {getStatusBadge(review.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{review.feedback}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Reviewed by: {review.reviewer}</span>
                        <span>Date: {new Date(review.reviewDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-lg font-semibold">{review.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedReview(review)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies">
          <Card>
            <CardHeader>
              <CardTitle>Core Competencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceData.competencies.map((competency, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900">{competency.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {competency.rating} / 5.0 (Target: {competency.target})
                        </span>
                        {competency.rating >= competency.target ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={(competency.rating / 5) * 100} className="flex-1 h-2" />
                      <div className="w-16 text-right">
                        <span className="text-sm font-medium">{competency.rating}</span>
                      </div>
                    </div>
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

function AddGoalForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    dueDate: "",
    targetValue: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Goal Added",
      description: "Your new goal has been created successfully.",
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter goal title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your goal and how you plan to achieve it"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Learning & Development"
            required
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Add Goal
        </Button>
      </div>
    </form>
  )
}
