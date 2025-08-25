"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  Laptop,
  Download,
  User,
  BarChart3,
  MessageSquare,
  Calculator,
  Building,
  Shield,
  Briefcase,
} from "lucide-react"

interface OffboardingCase {
  id: string
  employeeId: string
  employeeName: string
  employeeAvatar?: string
  department: string
  position: string
  lastWorkingDay: Date
  resignationDate: Date
  resignationType: "voluntary" | "involuntary" | "retirement" | "contract_end"
  reason: string
  status: "initiated" | "in_progress" | "pending_clearance" | "completed" | "cancelled"
  exitInterviewCompleted: boolean
  exitInterviewDate?: Date
  exitInterviewFeedback?: string
  exitInterviewRating?: number
  handoverCompleted: boolean
  handoverAssignee?: string
  assetsReturned: boolean
  finalSettlementCalculated: boolean
  finalSettlementAmount?: number
  clearanceStatus: {
    hr: boolean
    finance: boolean
    it: boolean
    facilities: boolean
    security: boolean
  }
  checklist: OffboardingChecklistItem[]
  documents: string[]
  createdBy: string
  createdDate: Date
  completedDate?: Date
}

interface OffboardingChecklistItem {
  id: string
  category: "hr" | "finance" | "it" | "facilities" | "security" | "handover"
  task: string
  description: string
  assignedTo: string
  completed: boolean
  completedDate?: Date
  completedBy?: string
  required: boolean
  ghanaLabourActCompliance?: string
}

interface ExitInterview {
  id: string
  employeeId: string
  employeeName: string
  interviewDate: Date
  interviewer: string
  overallRating: number
  jobSatisfaction: number
  managementRating: number
  workEnvironmentRating: number
  compensationRating: number
  careerDevelopmentRating: number
  wouldRecommendCompany: boolean
  reasonForLeaving: string
  improvements: string
  feedback: string
  rehireEligible: boolean
}

export default function OffboardingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isNewOffboardingDialogOpen, setIsNewOffboardingDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<OffboardingCase | null>(null)
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false)
  const [isExitInterviewDialogOpen, setIsExitInterviewDialogOpen] = useState(false)

  const [offboardingCases, setOffboardingCases] = useState<OffboardingCase[]>([
    {
      id: "OFF-001",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Technology",
      position: "Senior Software Engineer",
      lastWorkingDay: new Date("2024-02-15"),
      resignationDate: new Date("2024-01-15"),
      resignationType: "voluntary",
      reason: "Career advancement opportunity",
      status: "in_progress",
      exitInterviewCompleted: true,
      exitInterviewDate: new Date("2024-02-10"),
      exitInterviewFeedback: "Positive feedback about company culture",
      exitInterviewRating: 4,
      handoverCompleted: false,
      handoverAssignee: "John Doe",
      assetsReturned: false,
      finalSettlementCalculated: true,
      finalSettlementAmount: 15000,
      clearanceStatus: {
        hr: true,
        finance: false,
        it: false,
        facilities: false,
        security: false,
      },
      checklist: [
        {
          id: "CHK-001",
          category: "hr",
          task: "Exit Interview",
          description: "Conduct comprehensive exit interview",
          assignedTo: "HR Manager",
          completed: true,
          completedDate: new Date("2024-02-10"),
          completedBy: "Jane Smith",
          required: true,
          ghanaLabourActCompliance: "Section 20 - Notice of Termination",
        },
        {
          id: "CHK-002",
          category: "it",
          task: "Return Laptop",
          description: "Return company laptop and accessories",
          assignedTo: "IT Department",
          completed: false,
          required: true,
        },
        {
          id: "CHK-003",
          category: "finance",
          task: "Final Settlement",
          description: "Calculate and process final settlement",
          assignedTo: "Finance Team",
          completed: false,
          required: true,
          ghanaLabourActCompliance: "Section 21 - Payment of Benefits",
        },
      ],
      documents: ["resignation_letter.pdf", "exit_interview_form.pdf"],
      createdBy: "HR Manager",
      createdDate: new Date("2024-01-15"),
    },
    {
      id: "OFF-002",
      employeeId: "EMP005",
      employeeName: "Yaw Adjei",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Sales",
      position: "Sales Representative",
      lastWorkingDay: new Date("2024-02-28"),
      resignationDate: new Date("2024-02-01"),
      resignationType: "involuntary",
      reason: "Performance issues",
      status: "pending_clearance",
      exitInterviewCompleted: false,
      handoverCompleted: true,
      handoverAssignee: "Mary Johnson",
      assetsReturned: true,
      finalSettlementCalculated: false,
      clearanceStatus: {
        hr: false,
        finance: false,
        it: true,
        facilities: true,
        security: false,
      },
      checklist: [
        {
          id: "CHK-004",
          category: "hr",
          task: "Performance Documentation",
          description: "Compile performance improvement records",
          assignedTo: "HR Manager",
          completed: true,
          required: true,
          ghanaLabourActCompliance: "Section 62 - Grounds for Termination",
        },
      ],
      documents: ["termination_letter.pdf", "performance_records.pdf"],
      createdBy: "HR Manager",
      createdDate: new Date("2024-02-01"),
    },
  ])

  const [exitInterviews, setExitInterviews] = useState<ExitInterview[]>([
    {
      id: "EXIT-001",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      interviewDate: new Date("2024-02-10"),
      interviewer: "Jane Smith",
      overallRating: 4,
      jobSatisfaction: 4,
      managementRating: 5,
      workEnvironmentRating: 4,
      compensationRating: 3,
      careerDevelopmentRating: 3,
      wouldRecommendCompany: true,
      reasonForLeaving: "Better career opportunity",
      improvements: "More career development programs",
      feedback: "Great company culture and supportive management",
      rehireEligible: true,
    },
  ])

  const handleNewOffboarding = (offboardingData: any) => {
    const newCase: OffboardingCase = {
      id: `OFF-${String(offboardingCases.length + 1).padStart(3, "0")}`,
      ...offboardingData,
      status: "initiated" as const,
      exitInterviewCompleted: false,
      handoverCompleted: false,
      assetsReturned: false,
      finalSettlementCalculated: false,
      clearanceStatus: {
        hr: false,
        finance: false,
        it: false,
        facilities: false,
        security: false,
      },
      checklist: generateDefaultChecklist(offboardingData.resignationType),
      documents: [],
      createdDate: new Date(),
    }
    setOffboardingCases([...offboardingCases, newCase])
    setIsNewOffboardingDialogOpen(false)
    toast({
      title: "Offboarding Process Initiated",
      description: `Offboarding case ${newCase.id} has been created for ${offboardingData.employeeName}.`,
    })
  }

  const generateDefaultChecklist = (resignationType: string): OffboardingChecklistItem[] => {
    const baseChecklist = [
      {
        id: `CHK-${Date.now()}-1`,
        category: "hr" as const,
        task: "Exit Interview",
        description: "Conduct comprehensive exit interview",
        assignedTo: "HR Manager",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 20 - Notice of Termination",
      },
      {
        id: `CHK-${Date.now()}-2`,
        category: "it" as const,
        task: "Return IT Assets",
        description: "Return laptop, phone, and other IT equipment",
        assignedTo: "IT Department",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-3`,
        category: "finance" as const,
        task: "Final Settlement",
        description: "Calculate final pay, benefits, and deductions",
        assignedTo: "Finance Team",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 21 - Payment of Benefits",
      },
      {
        id: `CHK-${Date.now()}-4`,
        category: "facilities" as const,
        task: "Return Access Cards",
        description: "Return ID card, access cards, and keys",
        assignedTo: "Facilities Team",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-5`,
        category: "security" as const,
        task: "Revoke Access",
        description: "Disable system access and security clearances",
        assignedTo: "Security Team",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-6`,
        category: "handover" as const,
        task: "Knowledge Transfer",
        description: "Complete handover of responsibilities and projects",
        assignedTo: "Direct Manager",
        completed: false,
        required: true,
      },
    ]

    if (resignationType === "involuntary") {
      baseChecklist.push({
        id: `CHK-${Date.now()}-7`,
        category: "hr" as const,
        task: "Documentation Review",
        description: "Review disciplinary records and termination documentation",
        assignedTo: "HR Manager",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 62 - Grounds for Termination",
      })
    }

    return baseChecklist
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "initiated":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending_clearance":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "initiated":
        return <AlertCircle className="w-4 h-4" />
      case "in_progress":
        return <Clock className="w-4 h-4" />
      case "pending_clearance":
        return <FileText className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredCases = offboardingCases.filter((case_) => {
    const matchesSearch =
      case_.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || case_.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getOffboardingStats = () => {
    const total = offboardingCases.length
    const initiated = offboardingCases.filter((c) => c.status === "initiated").length
    const inProgress = offboardingCases.filter((c) => c.status === "in_progress").length
    const completed = offboardingCases.filter((c) => c.status === "completed").length
    const pendingClearance = offboardingCases.filter((c) => c.status === "pending_clearance").length
    return { total, initiated, inProgress, completed, pendingClearance }
  }

  const stats = getOffboardingStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Manage employee departures, exit processes, and final settlements</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isExitInterviewDialogOpen} onOpenChange={setIsExitInterviewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Exit Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Conduct Exit Interview</DialogTitle>
              </DialogHeader>
              <ExitInterviewForm onClose={() => setIsExitInterviewDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isNewOffboardingDialogOpen} onOpenChange={setIsNewOffboardingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Start Offboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Initiate Employee Offboarding</DialogTitle>
              </DialogHeader>
              <NewOffboardingForm
                onSubmit={handleNewOffboarding}
                onClose={() => setIsNewOffboardingDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Offboarding Cases</TabsTrigger>
          <TabsTrigger value="interviews">Exit Interviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Initiated</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.initiated}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Clearance</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingClearance}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ghana Labour Act Compliance */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Ghana Labour Act Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Section 20 - Notice of Termination</h4>
                  <p className="text-sm text-gray-600 mb-2">Proper notice periods and termination procedures</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compliance Rate</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Section 21 - Payment of Benefits</h4>
                  <p className="text-sm text-gray-600 mb-2">Final settlement and benefit calculations</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Settlement Compliance</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Section 62 - Termination Grounds</h4>
                  <p className="text-sm text-gray-600 mb-2">Valid reasons and documentation for termination</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documentation Complete</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Offboarding Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {offboardingCases.filter((c) => c.resignationType === "voluntary").length}
                    </div>
                    <p className="text-sm text-blue-700">Voluntary</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {offboardingCases.filter((c) => c.resignationType === "involuntary").length}
                    </div>
                    <p className="text-sm text-red-700">Involuntary</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {offboardingCases.filter((c) => c.exitInterviewCompleted).length}
                    </div>
                    <p className="text-sm text-green-700">Exit Interviews</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {exitInterviews.reduce((sum, interview) => sum + interview.overallRating, 0) /
                        exitInterviews.length || 0}
                    </div>
                    <p className="text-sm text-purple-700">Avg Rating</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download Offboarding Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Offboarding Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Offboarding Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {offboardingCases.slice(0, 5).map((case_) => (
                  <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={case_.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {case_.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{case_.employeeName}</p>
                        <p className="text-xs text-gray-600">
                          {case_.department} • Last working day: {case_.lastWorkingDay.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(case_.status)}>
                        {case_.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {case_.id}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by employee name, ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_clearance">Pending Clearance</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Offboarding Cases List */}
          <Card>
            <CardHeader>
              <CardTitle>Offboarding Cases ({filteredCases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCase(case_)
                      setIsCaseDetailOpen(true)
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={case_.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {case_.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{case_.employeeName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {case_.id}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {case_.position} • {case_.department}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            Last day: {case_.lastWorkingDay.toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            {case_.resignationType.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {case_.exitInterviewCompleted && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Interview Done</Badge>
                          )}
                          {case_.finalSettlementCalculated && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Settlement Ready</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {case_.checklist.filter((item) => item.completed).length}/{case_.checklist.length} tasks
                        </p>
                      </div>
                      <Badge className={getStatusColor(case_.status)}>
                        {case_.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Exit Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calculator className="w-4 h-4 mr-2" />
                            Final Settlement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          {/* Exit Interviews List */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Interviews ({exitInterviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exitInterviews.map((interview) => (
                  <div key={interview.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{interview.employeeName}</h3>
                        <p className="text-sm text-gray-600">
                          Interview Date: {interview.interviewDate.toLocaleDateString()} • Interviewer:{" "}
                          {interview.interviewer}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-4 h-4 ${
                                star <= interview.overallRating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">Overall Rating</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-semibold">{interview.jobSatisfaction}/5</div>
                        <p className="text-xs text-gray-600">Job Satisfaction</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-semibold">{interview.managementRating}/5</div>
                        <p className="text-xs text-gray-600">Management</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-semibold">{interview.compensationRating}/5</div>
                        <p className="text-xs text-gray-600">Compensation</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Reason for Leaving:</p>
                        <p className="text-sm text-gray-600">{interview.reasonForLeaving}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Feedback:</p>
                        <p className="text-sm text-gray-600">{interview.feedback}</p>
                      </div>
                      <div className="flex items-center space-x-4 pt-2">
                        <Badge
                          className={
                            interview.wouldRecommendCompany ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {interview.wouldRecommendCompany ? "Would Recommend" : "Would Not Recommend"}
                        </Badge>
                        <Badge
                          className={
                            interview.rehireEligible ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {interview.rehireEligible ? "Rehire Eligible" : "Not Eligible for Rehire"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Turnover Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(
                        (offboardingCases.filter((c) => c.resignationType === "voluntary").length /
                          offboardingCases.length) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <p className="text-sm text-blue-700">Voluntary Turnover</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {(
                        (offboardingCases.filter((c) => c.resignationType === "involuntary").length /
                          offboardingCases.length) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <p className="text-sm text-red-700">Involuntary Turnover</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Technology</span>
                    <span>{offboardingCases.filter((c) => c.department === "Technology").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sales</span>
                    <span>{offboardingCases.filter((c) => c.department === "Sales").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>HR</span>
                    <span>{offboardingCases.filter((c) => c.department === "Human Resources").length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exit Interview Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(exitInterviews.reduce((sum, i) => sum + i.overallRating, 0) / exitInterviews.length).toFixed(1)}
                    </div>
                    <p className="text-sm text-green-700">Avg Overall Rating</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {(
                        (exitInterviews.filter((i) => i.wouldRecommendCompany).length / exitInterviews.length) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                    <p className="text-sm text-purple-700">Would Recommend</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Job Satisfaction</span>
                    <span>
                      {(exitInterviews.reduce((sum, i) => sum + i.jobSatisfaction, 0) / exitInterviews.length).toFixed(
                        1,
                      )}
                      /5
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Management Rating</span>
                    <span>
                      {(exitInterviews.reduce((sum, i) => sum + i.managementRating, 0) / exitInterviews.length).toFixed(
                        1,
                      )}
                      /5
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Work Environment</span>
                    <span>
                      {(
                        exitInterviews.reduce((sum, i) => sum + i.workEnvironmentRating, 0) / exitInterviews.length
                      ).toFixed(1)}
                      /5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Case Detail Dialog */}
      <Dialog open={isCaseDetailOpen} onOpenChange={setIsCaseDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offboarding Details - {selectedCase?.id}</DialogTitle>
          </DialogHeader>
          {selectedCase && <OffboardingDetailView case={selectedCase} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewOffboardingForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    position: "",
    lastWorkingDay: "",
    resignationDate: "",
    resignationType: "voluntary",
    reason: "",
    createdBy: "HR Manager",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      lastWorkingDay: new Date(formData.lastWorkingDay),
      resignationDate: new Date(formData.resignationDate),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employee ID *</Label>
          <Input
            value={formData.employeeId}
            onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
            placeholder="EMP001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Employee Name *</Label>
          <Input
            value={formData.employeeName}
            onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))}
            placeholder="John Doe"
            required
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Department *</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Human Resources">Human Resources</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Position *</Label>
          <Input
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            placeholder="Job title"
            required
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Resignation Date *</Label>
          <Input
            type="date"
            value={formData.resignationDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, resignationDate: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Last Working Day *</Label>
          <Input
            type="date"
            value={formData.lastWorkingDay}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastWorkingDay: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Resignation Type *</Label>
        <Select
          value={formData.resignationType}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, resignationType: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="voluntary">Voluntary Resignation</SelectItem>
            <SelectItem value="involuntary">Involuntary Termination</SelectItem>
            <SelectItem value="retirement">Retirement</SelectItem>
            <SelectItem value="contract_end">Contract End</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Reason for Leaving *</Label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Brief description of the reason for leaving"
          rows={3}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Start Offboarding Process</Button>
      </div>
    </form>
  )
}

function ExitInterviewForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    interviewer: "HR Manager",
    overallRating: 3,
    jobSatisfaction: 3,
    managementRating: 3,
    workEnvironmentRating: 3,
    compensationRating: 3,
    careerDevelopmentRating: 3,
    wouldRecommendCompany: true,
    reasonForLeaving: "",
    improvements: "",
    feedback: "",
    rehireEligible: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle exit interview submission
    toast({
      title: "Exit Interview Completed",
      description: "Exit interview has been recorded successfully.",
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employee ID *</Label>
          <Input
            value={formData.employeeId}
            onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
            placeholder="EMP001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Employee Name *</Label>
          <Input
            value={formData.employeeName}
            onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))}
            placeholder="John Doe"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rating Questions (1-5 scale)</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Overall Experience</Label>
            <Select
              value={formData.overallRating.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, overallRating: Number.parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Poor</SelectItem>
                <SelectItem value="2">2 - Poor</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Job Satisfaction</Label>
            <Select
              value={formData.jobSatisfaction.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, jobSatisfaction: Number.parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Dissatisfied</SelectItem>
                <SelectItem value="2">2 - Dissatisfied</SelectItem>
                <SelectItem value="3">3 - Neutral</SelectItem>
                <SelectItem value="4">4 - Satisfied</SelectItem>
                <SelectItem value="5">5 - Very Satisfied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Management Quality</Label>
            <Select
              value={formData.managementRating.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, managementRating: Number.parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Poor</SelectItem>
                <SelectItem value="2">2 - Poor</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Work Environment</Label>
            <Select
              value={formData.workEnvironmentRating.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, workEnvironmentRating: Number.parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Poor</SelectItem>
                <SelectItem value="2">2 - Poor</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Compensation & Benefits</Label>
            <Select
              value={formData.compensationRating.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, compensationRating: Number.parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Poor</SelectItem>
                <SelectItem value="2">2 - Poor</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Career Development</Label>
            <Select
              value={formData.careerDevelopmentRating.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, careerDevelopmentRating: Number.parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Poor</SelectItem>
                <SelectItem value="2">2 - Poor</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Primary Reason for Leaving *</Label>
          <Textarea
            value={formData.reasonForLeaving}
            onChange={(e) => setFormData((prev) => ({ ...prev, reasonForLeaving: e.target.value }))}
            placeholder="What is the main reason you are leaving?"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Suggestions for Improvement</Label>
          <Textarea
            value={formData.improvements}
            onChange={(e) => setFormData((prev) => ({ ...prev, improvements: e.target.value }))}
            placeholder="What could the company do better?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Additional Feedback</Label>
          <Textarea
            value={formData.feedback}
            onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value }))}
            placeholder="Any other comments or feedback?"
            rows={3}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recommend"
            checked={formData.wouldRecommendCompany}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, wouldRecommendCompany: !!checked }))}
          />
          <Label htmlFor="recommend">Would recommend this company to others</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rehire"
            checked={formData.rehireEligible}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rehireEligible: !!checked }))}
          />
          <Label htmlFor="rehire">Eligible for rehire</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Complete Exit Interview</Button>
      </div>
    </form>
  )
}

function OffboardingDetailView({ case: selectedCase }: { case: OffboardingCase }) {
  const [checklist, setChecklist] = useState(selectedCase.checklist)

  const handleChecklistUpdate = (itemId: string, completed: boolean) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed, completedDate: completed ? new Date() : undefined, completedBy: completed ? "Current User" : undefined }
          : item
      )
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hr":
        return <Users className="w-4 h-4" />
      case "finance":
        return <Calculator className="w-4 h-4" />
      case "it":
        return <Laptop className="w-4 h-4" />
      case "facilities":
        return <Building className="w-4 h-4" />
      case "security":
        return <Shield className="w-4 h-4" />
      case "handover":
        return <Briefcase className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hr":
        return "bg-blue-100 text-blue-800"
      case "finance":
        return "bg-green-100 text-green-800"
      case "it":
        return "bg-purple-100 text-purple-800"
      case "facilities":
        return "bg-orange-100 text-orange-800"
      case "security":
        return "bg-red-100 text-red-800"
      case "handover":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={selectedCase.employeeAvatar || "/placeholder.svg"} />
            <AvatarFallback>
              {selectedCase.employeeName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{selectedCase.employeeName}</h2>
            <p className="text-gray-600">
              {selectedCase.position
