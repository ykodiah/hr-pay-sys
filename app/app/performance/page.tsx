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
  Target,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Download,
  Clock,
  Star,
  Award,
  BarChart3,
  User,
  Building,
  ArrowUp,
  Lightbulb,
  Crown,
} from "lucide-react"

interface Goal {
  id: string
  title: string
  description: string
  type: "individual" | "team" | "company"
  category: "okr" | "kpi" | "development"
  owner: string
  department: string
  status: "draft" | "active" | "completed" | "overdue"
  progress: number
  target: number
  current: number
  unit: string
  startDate: string
  endDate: string
  parentGoal?: string
  keyResults: KeyResult[]
}

interface KeyResult {
  id: string
  title: string
  progress: number
  target: number
  current: number
  unit: string
}

interface Review {
  id: string
  employeeId: string
  employeeName: string
  reviewerId: string
  reviewerName: string
  type: "annual" | "quarterly" | "probation" | "360"
  period: string
  status: "draft" | "in-progress" | "completed" | "overdue"
  overallRating: number
  competencyScores: CompetencyScore[]
  goals: string[]
  feedback: string
  developmentPlan: string
  dateCreated: string
  dueDate: string
}

interface CompetencyScore {
  competency: string
  score: number
  feedback: string
}

interface Competency {
  id: string
  name: string
  description: string
  category: "technical" | "leadership" | "communication" | "problem-solving"
  level: "beginner" | "intermediate" | "advanced" | "expert"
  roles: string[]
}

interface SuccessionPlan {
  id: string
  position: string
  incumbent: string
  department: string
  criticality: "low" | "medium" | "high"
  successors: Successor[]
  riskLevel: "low" | "medium" | "high"
  developmentNeeds: string[]
}

interface Successor {
  id: string
  name: string
  currentRole: string
  readiness: "ready-now" | "1-2-years" | "2-3-years"
  potential: "high" | "medium" | "low"
  developmentAreas: string[]
}

export default function PerformancePage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showSuccessionDialog, setShowSuccessionDialog] = useState(false)

  useEffect(() => {
    const tab = searchParams.get("tab")
    const action = searchParams.get("action")
    const allowed = new Set(["overview", "goals", "reviews", "competencies", "succession", "analytics"])
    if (tab && allowed.has(tab)) setActiveTab(tab)
    if (action === "add") {
      if (tab === "goals") setShowGoalDialog(true)
      if (tab === "reviews") setShowReviewDialog(true)
      if (tab === "succession") setShowSuccessionDialog(true)
    }
  }, [searchParams])

  const [goals] = useState<Goal[]>([
    {
      id: "1",
      title: "Increase Revenue by 25%",
      description: "Drive company revenue growth through improved sales and customer retention",
      type: "company",
      category: "okr",
      owner: "CEO",
      department: "Executive",
      status: "active",
      progress: 68,
      target: 25,
      current: 17,
      unit: "%",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      keyResults: [
        { id: "1a", title: "Acquire 100 new customers", progress: 75, target: 100, current: 75, unit: "customers" },
        { id: "1b", title: "Improve retention rate to 95%", progress: 60, target: 95, current: 92, unit: "%" },
      ],
    },
    {
      id: "2",
      title: "Complete React Certification",
      description: "Obtain advanced React certification to improve technical skills",
      type: "individual",
      category: "development",
      owner: "John Doe",
      department: "Engineering",
      status: "active",
      progress: 40,
      target: 1,
      current: 0.4,
      unit: "certification",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      keyResults: [
        { id: "2a", title: "Complete online course", progress: 80, target: 1, current: 0.8, unit: "course" },
        { id: "2b", title: "Pass certification exam", progress: 0, target: 1, current: 0, unit: "exam" },
      ],
    },
  ])

  const [reviews] = useState<Review[]>([
    {
      id: "1",
      employeeId: "emp1",
      employeeName: "John Doe",
      reviewerId: "mgr1",
      reviewerName: "Jane Smith",
      type: "annual",
      period: "2024",
      status: "in-progress",
      overallRating: 4.2,
      competencyScores: [
        { competency: "Technical Skills", score: 4.5, feedback: "Excellent technical knowledge and problem-solving" },
        {
          competency: "Communication",
          score: 4.0,
          feedback: "Good communication with room for improvement in presentations",
        },
        { competency: "Leadership", score: 3.8, feedback: "Shows potential for leadership roles" },
      ],
      goals: ["Complete React Certification", "Lead 2 major projects"],
      feedback: "John has shown excellent growth this year...",
      developmentPlan: "Focus on presentation skills and team leadership opportunities",
      dateCreated: "2024-01-10",
      dueDate: "2024-02-15",
    },
    {
      id: "2",
      employeeId: "emp2",
      employeeName: "Sarah Wilson",
      reviewerId: "mgr2",
      reviewerName: "Mike Johnson",
      type: "quarterly",
      period: "Q1 2024",
      status: "completed",
      overallRating: 4.6,
      competencyScores: [
        {
          competency: "Project Management",
          score: 4.8,
          feedback: "Outstanding project delivery and team coordination",
        },
        { competency: "Strategic Thinking", score: 4.5, feedback: "Excellent strategic planning and execution" },
        { competency: "Team Building", score: 4.4, feedback: "Great at building and motivating teams" },
      ],
      goals: ["Deliver Q1 projects on time", "Improve team productivity by 15%"],
      feedback: "Sarah consistently exceeds expectations...",
      developmentPlan: "Prepare for senior management role with executive coaching",
      dateCreated: "2024-03-01",
      dueDate: "2024-03-31",
    },
  ])

  const [competencies] = useState<Competency[]>([
    {
      id: "1",
      name: "Technical Skills",
      description: "Proficiency in relevant technical tools and technologies",
      category: "technical",
      level: "intermediate",
      roles: ["Developer", "Engineer", "Analyst"],
    },
    {
      id: "2",
      name: "Leadership",
      description: "Ability to guide, motivate, and develop team members",
      category: "leadership",
      level: "advanced",
      roles: ["Manager", "Team Lead", "Director"],
    },
    {
      id: "3",
      name: "Communication",
      description: "Effective verbal and written communication skills",
      category: "communication",
      level: "intermediate",
      roles: ["All Roles"],
    },
  ])

  const [successionPlans] = useState<SuccessionPlan[]>([
    {
      id: "1",
      position: "Engineering Manager",
      incumbent: "Jane Smith",
      department: "Engineering",
      criticality: "high",
      riskLevel: "medium",
      developmentNeeds: ["Leadership training", "Strategic planning"],
      successors: [
        {
          id: "s1",
          name: "John Doe",
          currentRole: "Senior Developer",
          readiness: "1-2-years",
          potential: "high",
          developmentAreas: ["Team management", "Budget planning"],
        },
        {
          id: "s2",
          name: "Mike Wilson",
          currentRole: "Tech Lead",
          readiness: "ready-now",
          potential: "medium",
          developmentAreas: ["Strategic thinking"],
        },
      ],
    },
    {
      id: "2",
      position: "HR Director",
      incumbent: "Sarah Johnson",
      department: "Human Resources",
      criticality: "high",
      riskLevel: "low",
      developmentNeeds: ["Digital HR transformation"],
      successors: [
        {
          id: "s3",
          name: "Lisa Brown",
          currentRole: "HR Manager",
          readiness: "1-2-years",
          potential: "high",
          developmentAreas: ["Executive presence", "Change management"],
        },
      ],
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "active":
      case "in-progress":
        return "bg-blue-100 text-blue-700"
      case "draft":
        return "bg-gray-100 text-gray-700"
      case "overdue":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 3.5) return "text-blue-600"
    if (rating >= 2.5) return "text-yellow-600"
    return "text-red-600"
  }

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case "ready-now":
        return "bg-green-100 text-green-700"
      case "1-2-years":
        return "bg-yellow-100 text-yellow-700"
      case "2-3-years":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Handler functions for buttons
  const handleCreateGoal = () => {
    // Add logic to create goal
    console.log("Creating new goal...")
    setShowGoalDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600 mt-1">Manage goals, reviews, competencies, and succession planning</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Goal Title *</Label>
                    <Input placeholder="Enter goal title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Goal Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the goal and its importance..." rows={3} />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input type="number" placeholder="Enter target" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input placeholder="e.g., %, customers, projects" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="okr">OKR</SelectItem>
                        <SelectItem value="kpi">KPI</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGoal}>Create Goal</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals & OKRs</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="succession">Succession</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Goals</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                  <Target className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">68% avg progress</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-orange-600">3 overdue</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                    <p className="text-2xl font-bold text-gray-900">4.2</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+0.3 from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Performers</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Crown className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-purple-600">Top 20% performers</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-sm text-gray-600">
                            {goal.owner} • {goal.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Progress value={goal.progress} className="w-16 h-2" />
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Performance Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.slice(0, 4).map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{review.employeeName}</p>
                          <p className="text-sm text-gray-600">
                            {review.type} • {review.period}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(review.overallRating) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm font-medium ml-1">{review.overallRating}</span>
                        </div>
                        <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search goals..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-xl">{goal.title}</h3>
                        <Badge variant="outline" className="capitalize">
                          {goal.type}
                        </Badge>
                        <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{goal.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {goal.owner}
                        </span>
                        <span className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {goal.department}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {goal.startDate} - {goal.endDate}
                        </span>
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Goal
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Update Progress
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-600">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span className="font-medium">{goal.progress}%</span>
                      <span>
                        {goal.target} {goal.unit}
                      </span>
                    </div>
                  </div>

                  {goal.keyResults.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Key Results</h4>
                      <div className="space-y-3">
                        {goal.keyResults.map((kr) => (
                          <div key={kr.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{kr.title}</span>
                              <span className="text-sm text-gray-600">
                                {kr.current} / {kr.target} {kr.unit}
                              </span>
                            </div>
                            <Progress value={kr.progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search reviews..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="360">360 Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Performance Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">John Doe</SelectItem>
                          <SelectItem value="emp2">Sarah Wilson</SelectItem>
                          <SelectItem value="emp3">Mike Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Review Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">Annual Review</SelectItem>
                          <SelectItem value="quarterly">Quarterly Review</SelectItem>
                          <SelectItem value="probation">Probation Review</SelectItem>
                          <SelectItem value="360">360 Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Review Period</Label>
                      <Input placeholder="e.g., 2024, Q1 2024" />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Goals & Objectives</Label>
                    <Textarea placeholder="List the key goals and objectives for this review period..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Review Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Review</SelectItem>
                        <SelectItem value="leadership">Leadership Review</SelectItem>
                        <SelectItem value="technical">Technical Review</SelectItem>
                        <SelectItem value="sales">Sales Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                    Save as Draft
                  </Button>
                  <Button>Create Review</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{review.employeeName}</h3>
                        <p className="text-gray-600">
                          {review.type} Review • {review.period}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>Reviewer: {review.reviewerName}</span>
                          <span>Due: {review.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(review.overallRating) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className={`text-lg font-bold ml-2 ${getRatingColor(review.overallRating)}`}>
                            {review.overallRating}
                          </span>
                        </div>
                        <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
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
                            View Review
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Review
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Competency Scores</h4>
                      <div className="space-y-3">
                        {review.competencyScores.map((comp, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{comp.competency}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={comp.score * 20} className="w-16 h-2" />
                              <span className="text-sm font-medium w-8">{comp.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Key Highlights</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Goals:</strong> {review.goals.join(", ")}
                        </p>
                        <p>
                          <strong>Development Plan:</strong> {review.developmentPlan}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search competencies..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Competency
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competencies.map((competency) => (
              <Card key={competency.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{competency.name}</h3>
                        <Badge variant="outline" className="capitalize mt-1">
                          {competency.category}
                        </Badge>
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
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Competency
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          View Assessments
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{competency.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Level:</span>
                      <Badge variant="secondary" className="capitalize">
                        {competency.level}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Applicable Roles:</span>
                      <p className="mt-1">{competency.roles.join(", ")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="succession" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search positions..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Criticality</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showSuccessionDialog} onOpenChange={setShowSuccessionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Succession Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Succession Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Position Title *</Label>
                      <Input placeholder="Enter position title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Incumbent *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">Jane Smith</SelectItem>
                          <SelectItem value="emp2">John Doe</SelectItem>
                          <SelectItem value="emp3">Sarah Wilson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Criticality</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select criticality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Development Needs</Label>
                    <Textarea placeholder="List key development areas and requirements..." rows={3} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowSuccessionDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create Plan</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {successionPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{plan.position}</h3>
                        <p className="text-gray-600">
                          Current: {plan.incumbent} • {plan.department}
                        </p>
                        <div className="flex items-center space-x-4 text-sm mt-1">
                          <Badge variant="outline" className="capitalize">
                            {plan.criticality} criticality
                          </Badge>
                          <Badge
                            className={`${plan.riskLevel === "high" ? "bg-red-100 text-red-700" : plan.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                          >
                            {plan.riskLevel} risk
                          </Badge>
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Successors
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Potential Successors</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {plan.successors.map((successor) => (
                          <div key={successor.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{successor.name}</h5>
                              <Badge className={getReadinessColor(successor.readiness)}>{successor.readiness}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{successor.currentRole}</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs text-gray-500">Potential:</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {successor.potential}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Development Areas:</span>
                              <p className="mt-1">{successor.developmentAreas.join(", ")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Development Needs</h4>
                      <div className="flex flex-wrap gap-2">
                        {plan.developmentNeeds.map((need, index) => (
                          <Badge key={index} variant="secondary">
                            {need}
                          </Badge>
                        ))}
                      </div>
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
                <CardTitle className="text-lg">Goal Achievement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Company Goals</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team Goals</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Individual Goals</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Exceeds (4.5-5.0)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={20} className="w-16 h-2" />
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Meets (3.5-4.4)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={65} className="w-16 h-2" />
                      <span className="text-sm font-medium">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Below (2.5-3.4)</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={12} className="w-16 h-2" />
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Needs Improvement</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={3} className="w-16 h-2" />
                      <span className="text-sm font-medium">3%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Review Completion Rate</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Review Score</span>
                    <span className="font-medium">4.2/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Goal Alignment</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Succession Coverage</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Potential Talent</span>
                    <span className="font-medium">18%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Performance analytics chart would be displayed here</p>
                  <p className="text-sm">Showing trends for goals, reviews, and competency development</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
