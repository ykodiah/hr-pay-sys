"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  FileText,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Download,
  Star,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Video,
  Monitor,
  MapPin,
  DollarSign,
  Target,
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  category: "technical" | "leadership" | "compliance" | "soft-skills"
  type: "online" | "virtual" | "classroom" | "blended"
  level: "beginner" | "intermediate" | "advanced"
  duration: number // in hours
  instructor: string
  price: number
  rating: number
  enrollments: number
  status: "active" | "draft" | "archived"
  tags: string[]
  prerequisites: string[]
  learningObjectives: string[]
  dateCreated: string
  lastUpdated: string
}

interface LearningPath {
  id: string
  title: string
  description: string
  category: string
  courses: string[]
  totalDuration: number
  difficulty: "beginner" | "intermediate" | "advanced"
  enrollments: number
  completionRate: number
  status: "active" | "draft"
  dateCreated: string
}

interface Enrollment {
  id: string
  courseId: string
  courseName: string
  employeeId: string
  employeeName: string
  enrollmentDate: string
  startDate?: string
  completionDate?: string
  status: "enrolled" | "in-progress" | "completed" | "dropped"
  progress: number
  score?: number
  certificateIssued: boolean
}

interface Certification {
  id: string
  name: string
  description: string
  issuer: string
  validityPeriod: number // in months
  requirements: string[]
  cpdPoints: number
  category: "technical" | "professional" | "safety" | "compliance"
  status: "active" | "expired" | "pending"
  dateIssued: string
  expiryDate: string
  employeeId: string
  employeeName: string
}

interface Instructor {
  id: string
  name: string
  email: string
  expertise: string[]
  rating: number
  coursesCount: number
  studentsCount: number
  bio: string
  qualifications: string[]
}

export default function LearningPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [showPathDialog, setShowPathDialog] = useState(false)
  const [showInstructorDialog, setShowInstructorDialog] = useState(false)

  useEffect(() => {
    const tab = searchParams.get("tab")
    const action = searchParams.get("action")
    const allowed = new Set([
      "overview",
      "courses",
      "paths",
      "enrollments",
      "certifications",
      "instructors",
      "analytics",
    ])
    if (tab && allowed.has(tab)) setActiveTab(tab)
    if (action === "add") {
      if (tab === "courses") setShowCourseDialog(true)
      if (tab === "paths") setShowPathDialog(true)
      if (tab === "instructors") setShowInstructorDialog(true)
    }
  }, [searchParams])

  const [courses] = useState<Course[]>([
    {
      id: "1",
      title: "Advanced React Development",
      description: "Master advanced React concepts including hooks, context, and performance optimization",
      category: "technical",
      type: "online",
      level: "advanced",
      duration: 40,
      instructor: "John Smith",
      price: 299,
      rating: 4.8,
      enrollments: 156,
      status: "active",
      tags: ["React", "JavaScript", "Frontend"],
      prerequisites: ["Basic React knowledge", "JavaScript ES6+"],
      learningObjectives: ["Master React hooks", "Implement performance optimization", "Build complex applications"],
      dateCreated: "2024-01-15",
      lastUpdated: "2024-01-20",
    },
    {
      id: "2",
      title: "Leadership Fundamentals",
      description: "Essential leadership skills for new and aspiring managers",
      category: "leadership",
      type: "blended",
      level: "intermediate",
      duration: 24,
      instructor: "Sarah Johnson",
      price: 199,
      rating: 4.6,
      enrollments: 89,
      status: "active",
      tags: ["Leadership", "Management", "Communication"],
      prerequisites: ["2+ years work experience"],
      learningObjectives: ["Develop leadership mindset", "Improve team communication", "Learn delegation skills"],
      dateCreated: "2024-01-10",
      lastUpdated: "2024-01-18",
    },
    {
      id: "3",
      title: "Data Protection & GDPR Compliance",
      description: "Understanding data protection laws and implementing GDPR compliance",
      category: "compliance",
      type: "virtual",
      level: "intermediate",
      duration: 16,
      instructor: "Mike Wilson",
      price: 149,
      rating: 4.4,
      enrollments: 234,
      status: "active",
      tags: ["GDPR", "Compliance", "Data Protection"],
      prerequisites: ["Basic understanding of data handling"],
      learningObjectives: ["Understand GDPR requirements", "Implement compliance measures", "Handle data breaches"],
      dateCreated: "2024-01-05",
      lastUpdated: "2024-01-12",
    },
  ])

  const [learningPaths] = useState<LearningPath[]>([
    {
      id: "1",
      title: "Full-Stack Developer Path",
      description: "Complete journey from frontend to backend development",
      category: "Technical",
      courses: ["1", "4", "5", "6"],
      totalDuration: 120,
      difficulty: "intermediate",
      enrollments: 45,
      completionRate: 78,
      status: "active",
      dateCreated: "2024-01-01",
    },
    {
      id: "2",
      title: "Management Excellence Program",
      description: "Comprehensive leadership development for managers",
      category: "Leadership",
      courses: ["2", "7", "8"],
      totalDuration: 80,
      difficulty: "advanced",
      enrollments: 28,
      completionRate: 85,
      status: "active",
      dateCreated: "2024-01-08",
    },
  ])

  const [enrollments] = useState<Enrollment[]>([
    {
      id: "1",
      courseId: "1",
      courseName: "Advanced React Development",
      employeeId: "emp1",
      employeeName: "Alice Johnson",
      enrollmentDate: "2024-01-20",
      startDate: "2024-01-22",
      status: "in-progress",
      progress: 65,
      certificateIssued: false,
    },
    {
      id: "2",
      courseId: "2",
      courseName: "Leadership Fundamentals",
      employeeId: "emp2",
      employeeName: "Bob Smith",
      enrollmentDate: "2024-01-15",
      startDate: "2024-01-17",
      completionDate: "2024-02-10",
      status: "completed",
      progress: 100,
      score: 92,
      certificateIssued: true,
    },
    {
      id: "3",
      courseId: "3",
      courseName: "Data Protection & GDPR Compliance",
      employeeId: "emp3",
      employeeName: "Carol Davis",
      enrollmentDate: "2024-01-25",
      status: "enrolled",
      progress: 0,
      certificateIssued: false,
    },
  ])

  const [certifications] = useState<Certification[]>([
    {
      id: "1",
      name: "React Developer Certification",
      description: "Advanced React development skills certification",
      issuer: "Tech Academy",
      validityPeriod: 24,
      requirements: ["Complete Advanced React course", "Pass final exam with 80%+"],
      cpdPoints: 40,
      category: "technical",
      status: "active",
      dateIssued: "2024-02-10",
      expiryDate: "2026-02-10",
      employeeId: "emp1",
      employeeName: "Alice Johnson",
    },
    {
      id: "2",
      name: "Leadership Excellence Certificate",
      description: "Comprehensive leadership skills certification",
      issuer: "Management Institute",
      validityPeriod: 36,
      requirements: ["Complete Leadership Fundamentals", "Complete team project"],
      cpdPoints: 60,
      category: "professional",
      status: "active",
      dateIssued: "2024-02-15",
      expiryDate: "2027-02-15",
      employeeId: "emp2",
      employeeName: "Bob Smith",
    },
  ])

  const [instructors] = useState<Instructor[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@academy.com",
      expertise: ["React", "JavaScript", "Frontend Development"],
      rating: 4.8,
      coursesCount: 12,
      studentsCount: 1250,
      bio: "Senior Frontend Developer with 10+ years experience in React and modern web technologies",
      qualifications: ["M.S. Computer Science", "React Certified Developer", "AWS Solutions Architect"],
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@leadership.com",
      expertise: ["Leadership", "Management", "Team Building"],
      rating: 4.6,
      coursesCount: 8,
      studentsCount: 890,
      bio: "Executive coach and leadership consultant with 15+ years in organizational development",
      qualifications: ["MBA", "Certified Executive Coach", "PMP Certified"],
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return "bg-green-100 text-green-700"
      case "in-progress":
        return "bg-blue-100 text-blue-700"
      case "enrolled":
      case "draft":
        return "bg-gray-100 text-gray-700"
      case "dropped":
      case "expired":
        return "bg-red-100 text-red-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-700"
      case "leadership":
        return "bg-purple-100 text-purple-700"
      case "compliance":
        return "bg-orange-100 text-orange-700"
      case "soft-skills":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "online":
        return <Monitor className="w-4 h-4" />
      case "virtual":
        return <Video className="w-4 h-4" />
      case "classroom":
        return <MapPin className="w-4 h-4" />
      case "blended":
        return <BookOpen className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning & Development</h1>
          <p className="text-gray-600 mt-1">Manage courses, learning paths, and employee development</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Title *</Label>
                    <Input placeholder="Enter course title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="soft-skills">Soft Skills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea placeholder="Describe the course content and objectives..." rows={3} />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Delivery Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="classroom">Classroom</SelectItem>
                        <SelectItem value="blended">Blended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (hours)</Label>
                    <Input type="number" placeholder="Enter duration" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instructor</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (GHS)</Label>
                    <Input type="number" placeholder="Enter price" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Learning Objectives</Label>
                  <Textarea placeholder="List the key learning objectives..." rows={3} />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
                  Save as Draft
                </Button>
                <Button>Create Course</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Courses</p>
                    <p className="text-2xl font-bold text-gray-900">48</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+6 this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+89 this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">82%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Target className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-600">Above target</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Certifications</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <GraduationCap className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-purple-600">12 this month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-gray-600">
                            {course.instructor} • {course.duration}h
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{course.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">{course.enrollments} enrolled</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments
                    .filter((e) => e.status === "completed")
                    .slice(0, 5)
                    .map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{enrollment.employeeName}</p>
                            <p className="text-sm text-gray-600">{enrollment.courseName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Score: {enrollment.score}%</p>
                          <p className="text-xs text-gray-500">{enrollment.completionDate}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search courses..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(course.category)}>{course.category}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {course.level}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          View Enrollments
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        {getTypeIcon(course.type)}
                        <span className="ml-1 capitalize">{course.type}</span>
                      </span>
                      <span className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration}h
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Instructor: {course.instructor}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{course.enrollments} enrolled</span>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">GHS {course.price}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search learning paths..." className="pl-10 w-64" />
              </div>
            </div>
            <Dialog open={showPathDialog} onOpenChange={setShowPathDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Learning Path
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Learning Path</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Path Title *</Label>
                      <Input placeholder="Enter learning path title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Input placeholder="Enter category" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea placeholder="Describe the learning path and its objectives..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Courses</Label>
                    <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-2 py-1">
                          <input type="checkbox" id={`course-${course.id}`} className="rounded" />
                          <label htmlFor={`course-${course.id}`} className="text-sm">
                            {course.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowPathDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create Path</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {learningPaths.map((path) => (
              <Card key={path.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">{path.title}</h3>
                        <p className="text-gray-600">{path.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {path.category}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {path.totalDuration}h total
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {path.enrollments} enrolled
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="capitalize">
                        {path.difficulty}
                      </Badge>
                      <Badge className={getStatusColor(path.status)}>{path.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Path
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="w-4 h-4 mr-2" />
                            View Enrollments
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="font-medium">{path.completionRate}%</span>
                    </div>
                    <Progress value={path.completionRate} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Courses in this path:</span> {path.courses.length} courses
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search enrollments..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{enrollment.employeeName}</h3>
                        <p className="text-gray-600">{enrollment.courseName}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>Enrolled: {enrollment.enrollmentDate}</span>
                          {enrollment.startDate && <span>Started: {enrollment.startDate}</span>}
                          {enrollment.completionDate && <span>Completed: {enrollment.completionDate}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <Progress value={enrollment.progress} className="w-24 h-2" />
                          <span className="text-sm font-medium">{enrollment.progress}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(enrollment.status)}>{enrollment.status}</Badge>
                          {enrollment.certificateIssued && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Award className="w-3 h-3 mr-1" />
                              Certified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                          </DropdownMenuItem>
                          {enrollment.certificateIssued && (
                            <DropdownMenuItem>
                              <Award className="w-4 h-4 mr-2" />
                              Download Certificate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {enrollment.score && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Final Score:</strong> {enrollment.score}% • Certificate issued
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search certifications..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6">
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cert.name}</h3>
                        <p className="text-gray-600">{cert.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                          <span>Issued by: {cert.issuer}</span>
                          <span>Employee: {cert.employeeName}</span>
                          <span>CPD Points: {cert.cpdPoints}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getCategoryColor(cert.category)}>{cert.category}</Badge>
                      <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Certificate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="w-4 h-4 mr-2" />
                            Set Renewal Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {cert.requirements.map((req, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Certification Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Issued:</strong> {cert.dateIssued}
                        </p>
                        <p>
                          <strong>Expires:</strong> {cert.expiryDate}
                        </p>
                        <p>
                          <strong>Valid for:</strong> {cert.validityPeriod} months
                        </p>
                        {cert.status === "expired" && (
                          <div className="flex items-center text-red-600 mt-2">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span>Renewal required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search instructors..." className="pl-10 w-64" />
              </div>
            </div>
            <Dialog open={showInstructorDialog} onOpenChange={setShowInstructorDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Instructor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Instructor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Enter instructor name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input type="email" placeholder="Enter email address" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea placeholder="Brief biography and background..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Areas of Expertise</Label>
                    <Input placeholder="e.g., React, Leadership, Data Science (comma-separated)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualifications</Label>
                    <Textarea placeholder="List relevant qualifications and certifications..." rows={2} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowInstructorDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Add Instructor</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {instructors.map((instructor) => (
              <Card key={instructor.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{instructor.name}</h3>
                        <p className="text-gray-600">{instructor.email}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{instructor.rating}</span>
                          <span className="text-sm text-gray-500">
                            • {instructor.coursesCount} courses • {instructor.studentsCount} students
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Instructor
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BookOpen className="w-4 h-4 mr-2" />
                          View Courses
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{instructor.bio}</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-1">
                        {instructor.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Qualifications</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {instructor.qualifications.map((qual, index) => (
                          <li key={index} className="flex items-center">
                            <GraduationCap className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Course Completion</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Score</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />

                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>87% Complete</span>
                    <span>13 of 15 courses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
