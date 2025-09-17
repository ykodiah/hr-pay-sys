"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react"

export default function GoalsPage() {
  const [goals] = useState([
    {
      id: 1,
      title: "Complete React Certification",
      description: "Obtain React Developer certification to enhance frontend skills",
      category: "Learning & Development",
      progress: 75,
      status: "In Progress",
      dueDate: "2024-03-15",
      keyResults: [
        { title: "Complete online course modules", completed: true },
        { title: "Build 3 practice projects", completed: true },
        { title: "Pass certification exam", completed: false },
      ],
    },
    {
      id: 2,
      title: "Improve Code Review Quality",
      description: "Enhance code review skills and provide more constructive feedback",
      category: "Professional Development",
      progress: 60,
      status: "In Progress",
      dueDate: "2024-04-30",
      keyResults: [
        { title: "Review 50 pull requests", completed: true },
        { title: "Attend code review workshop", completed: false },
        { title: "Mentor junior developer", completed: false },
      ],
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
          <p className="text-gray-600 mt-1">Track your performance goals and key results</p>
        </div>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">67%</p>
                <p className="text-sm text-gray-600">Average Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-600">Completed This Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{goal.title}</CardTitle>
                  <CardDescription>{goal.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="w-full" />

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                </div>
                <Badge variant="outline">{goal.category}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Key Results:</p>
                {goal.keyResults.map((result, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {result.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={result.completed ? "text-gray-900" : "text-gray-600"}>{result.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
