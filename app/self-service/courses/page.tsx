"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Award, Play, CheckCircle } from "lucide-react"

export default function CoursesPage() {
  const [courses] = useState([
    {
      id: 1,
      title: "Advanced React Development",
      description: "Master advanced React concepts including hooks, context, and performance optimization",
      instructor: "Sarah Johnson",
      duration: "8 hours",
      progress: 75,
      status: "In Progress",
      category: "Technical Skills",
      completedLessons: 6,
      totalLessons: 8,
    },
    {
      id: 2,
      title: "Leadership Fundamentals",
      description: "Essential leadership skills for emerging managers and team leads",
      instructor: "Michael Chen",
      duration: "6 hours",
      progress: 100,
      status: "Completed",
      category: "Leadership",
      completedLessons: 6,
      totalLessons: 6,
    },
    {
      id: 3,
      title: "Data Analysis with Python",
      description: "Learn data analysis techniques using Python and popular libraries",
      instructor: "Dr. Amina Osei",
      duration: "12 hours",
      progress: 0,
      status: "Not Started",
      category: "Data Science",
      completedLessons: 0,
      totalLessons: 10,
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Not Started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">Continue your learning journey</p>
        </div>
      </div>

      {/* Learning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-600">Enrolled Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">26</p>
                <p className="text-sm text-gray-600">Hours Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Certificates Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(course.status)}>{course.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {course.completedLessons}/{course.totalLessons} lessons
                </span>
              </div>
              <Progress value={course.progress} className="w-full" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <span>by {course.instructor}</span>
                  <Badge variant="outline">{course.category}</Badge>
                </div>

                <Button size="sm" className={course.status === "Completed" ? "bg-green-600 hover:bg-green-700" : ""}>
                  {course.status === "Completed" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      View Certificate
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {course.status === "Not Started" ? "Start Course" : "Continue"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
