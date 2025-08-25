"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Laptop,
  Download,
  MessageSquare,
  Calculator,
  Building,
  Shield,
  Briefcase,
  Filter,
  Star,
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
    const baseChecklist: OffboardingChecklistItem[] = [
      {
        id: `CHK-${Date.now()}-1`,
        category: "hr",
        task: "Exit Interview",
        description: "Conduct comprehensive exit interview",
        assignedTo: "HR Manager",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 20 - Notice of Termination",
      },
      {
        id: `CHK-${Date.now()}-2`,
        category: "hr",
        task: "Final Settlement Calculation",
        description: "Calculate final pay, benefits, and deductions",
        assignedTo: "HR Manager",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 21 - Payment of Benefits",
      },
      {
        id: `CHK-${Date.now()}-3`,
        category: "it",
        task: "Return IT Equipment",
        description: "Return laptop, phone, and other IT assets",
        assignedTo: "IT Department",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-4`,
        category: "it",
        task: "Disable System Access",
        description: "Revoke all system and application access",
        assignedTo: "IT Department",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-5`,
        category: "finance",
        task: "Process Final Payment",
        description: "Process final salary and benefit payments",
        assignedTo: "Finance Team",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 21 - Payment of Benefits",
      },
      {
        id: `CHK-${Date.now()}-6`,
        category: "facilities",
        task: "Return Office Keys",
        description: "Return office keys and access cards",
        assignedTo: "Facilities Team",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-7`,
        category: "security",
        task: "Security Clearance",
        description: "Complete security clearance procedures",
        assignedTo: "Security Team",
        completed: false,
        required: true,
      },
      {
        id: `CHK-${Date.now()}-8`,
        category: "handover",
        task: "Knowledge Transfer",
        description: "Complete handover of responsibilities",
        assignedTo: "Direct Manager",
        completed: false,
        required: true,
      },
    ]

    // Add specific items based on resignation type
    if (resignationType === "involuntary") {
      baseChecklist.push({
        id: `CHK-${Date.now()}-9`,
        category: "hr",
        task: "Performance Documentation",
        description: "Compile performance improvement records",
        assignedTo: "HR Manager",
        completed: false,
        required: true,
        ghanaLabourActCompliance: "Section 62 - Grounds for Termination",
      })
    }

    return baseChecklist
  }

  const filteredCases = offboardingCases.filter((offboardingCase) => {
    const matchesSearch =
      offboardingCase.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offboardingCase.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offboardingCase.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || offboardingCase.status === selectedStatus
    return matchesSearch && matchesStatus
  })

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
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getResignationTypeColor = (type: string) => {
    switch (type) {
      case "voluntary":
        return "bg-green-100 text-green-800"
      case "involuntary":
        return "bg-red-100 text-red-800"
      case "retirement":
        return "bg-purple-100 text-purple-800"
      case "contract_end":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Manage employee departures and exit processes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isExitInterviewDialogOpen} onOpenChange={setIsExitInterviewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Exit Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Conduct Exit Interview</DialogTitle>
              </DialogHeader>
              <ExitInterviewForm onClose={() => setIsExitInterviewDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isNewOffboardingDialogOpen} onOpenChange={setIsNewOffboardingDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="text-white hover:opacity-90"
                style={{
                  backgroundColor: "var(--theme-primary-600)",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Offboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Start Employee Offboarding</DialogTitle>
              </DialogHeader>
              <NewOffboardingForm
                onSubmit={handleNewOffboarding}
                onClose={() => setIsNewOffboardingDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{offboardingCases.length}</div>
            <p className="text-sm text-gray-600">Total Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {offboardingCases.filter((c) => c.status === "initiated").length}
            </div>
            <p className="text-sm text-gray-600">Initiated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {offboardingCases.filter((c) => c.status === "in_progress").length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {offboardingCases.filter((c) => c.status === "pending_clearance").length}
            </div>
            <p className="text-sm text-gray-600">Pending Clearance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {offboardingCases.filter((c) => c.status === "completed").length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Active Cases</TabsTrigger>
          <TabsTrigger value="interviews">Exit Interviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
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
                    <Filter className="w-4 h-4 mr-2" />
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
                {filteredCases.map((offboardingCase) => (
                  <div
                    key={offboardingCase.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCase(offboardingCase)
                      setIsCaseDetailOpen(true)
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={offboardingCase.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {offboardingCase.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{offboardingCase.employeeName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {offboardingCase.id}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{offboardingCase.position}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Building className="w-3 h-3 mr-1" />
                            {offboardingCase.department}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            Last Day: {offboardingCase.lastWorkingDay.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge className={getResignationTypeColor(offboardingCase.resignationType)}>
                          {offboardingCase.resignationType.replace("_", " ").toUpperCase()}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">{offboardingCase.reason}</p>
                      </div>
                      <Badge className={getStatusColor(offboardingCase.status)}>
                        {offboardingCase.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        {offboardingCase.exitInterviewCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {offboardingCase.handoverCompleted && <Briefcase className="w-4 h-4 text-blue-600" />}
                        {offboardingCase.assetsReturned && <Laptop className="w-4 h-4 text-purple-600" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Offboarding Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offboardingCases
                  .filter((c) => c.status !== "completed" && c.status !== "cancelled")
                  .map((offboardingCase) => (
                    <div key={offboardingCase.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{offboardingCase.employeeName}</h3>
                          <p className="text-sm text-gray-600">
                            {offboardingCase.position} - {offboardingCase.department}
                          </p>
                        </div>
                        <Badge className={getStatusColor(offboardingCase.status)}>
                          {offboardingCase.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div
                            className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              offboardingCase.exitInterviewCompleted
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <p className="text-xs">Exit Interview</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              offboardingCase.handoverCompleted
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <p className="text-xs">Handover</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              offboardingCase.assetsReturned
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Laptop className="w-4 h-4" />
                          </div>
                          <p className="text-xs">Assets</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                              offboardingCase.finalSettlementCalculated
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Calculator className="w-4 h-4" />
                          </div>
                          <p className="text-xs">Settlement</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Last Working Day: {offboardingCase.lastWorkingDay.toLocaleDateString()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCase(offboardingCase)
                            setIsCaseDetailOpen(true)
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exit Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exitInterviews.map((interview) => (
                  <div key={interview.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{interview.employeeName}</h3>
                        <p className="text-sm text-gray-600">
                          Interviewed by {interview.interviewer} on {interview.interviewDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">{interview.overallRating}/5</div>
                        <p className="text-xs text-gray-500">Overall Rating</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{interview.jobSatisfaction}/5</div>
                        <p className="text-xs text-gray-600">Job Satisfaction</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{interview.managementRating}/5</div>
                        <p className="text-xs text-gray-600">Management</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{interview.workEnvironmentRating}/5</div>
                        <p className="text-xs text-gray-600">Environment</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{interview.compensationRating}/5</div>
                        <p className="text-xs text-gray-600">Compensation</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{interview.careerDevelopmentRating}/5</div>
                        <p className="text-xs text-gray-600">Career Dev</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Reason for Leaving:</p>
                        <p className="text-sm text-gray-600">{interview.reasonForLeaving}</p>
                      </div>
                      {interview.improvements && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                          <p className="text-sm text-gray-600">{interview.improvements}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm">
                        <div
                          className={`flex items-center ${interview.wouldRecommendCompany ? "text-green-600" : "text-red-600"}`}
                        >
                          {interview.wouldRecommendCompany ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          Would Recommend
                        </div>
                        <div
                          className={`flex items-center ${interview.rehireEligible ? "text-green-600" : "text-red-600"}`}
                        >
                          {interview.rehireEligible ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          Rehire Eligible
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resignation Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Career advancement</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                      <span className="text-sm text-gray-600">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Better compensation</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                      <span className="text-sm text-gray-600">25%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Work-life balance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                      <span className="text-sm text-gray-600">15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Experience</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">4.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Management Quality</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">5.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Work Environment</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">4.0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offboarding Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedCase?.documents?.length > 0 ? (
                  selectedCase.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>{doc}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Final Settlement Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCase?.finalSettlementCalculated ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Payments Due</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Outstanding Salary:</span>
                          <span>GHS 8,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accrued Leave:</span>
                          <span>GHS 3,200</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonus/Allowances:</span>
                          <span>GHS 1,800</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Notice Pay:</span>
                          <span>GHS 2,500</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Deductions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Outstanding Loans:</span>
                          <span>GHS 1,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Equipment Damage:</span>
                          <span>GHS 0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Deductions:</span>
                          <span>GHS 0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Net Final Settlement:</span>
                      <span className="text-emerald-600">
                        GHS {selectedCase.finalSettlementAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Final settlement calculation pending</p>
                  <Button className="mt-4">Calculate Settlement</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offboarding Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedCase?.checklist?.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => handleChecklistUpdate(item.id, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getCategoryColor(item.category)} variant="outline">
                          {getCategoryIcon(item.category)}
                          <span className="ml-1 capitalize">{item.category}</span>
                        </Badge>
                        {item.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium">{item.task}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Assigned to: {item.assignedTo}</span>
                        {item.completed && item.completedDate && (
                          <span>Completed: {item.completedDate.toLocaleDateString()}</span>
                        )}
                      </div>
                      {item.ghanaLabourActCompliance && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                          <strong>Ghana Labour Act Compliance:</strong> {item.ghanaLabourActCompliance}
                        </div>
                      )}
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

  function OffboardingDetailView({ case: selectedCase, onClose }: { case: OffboardingCase; onClose: () => void }) {
    const [checklist, setChecklist] = useState(selectedCase.checklist)

    const handleChecklistUpdate = (itemId: string, completed: boolean) => {
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed,
                completedDate: completed ? new Date() : undefined,
                completedBy: completed ? "Current User" : undefined,
              }
            : item,
        ),
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
      <Dialog open={!!selectedCase} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCase && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedCase.employeeAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {selectedCase.employeeName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCase.employeeName}</h2>
                  <p className="text-gray-600">
                    {selectedCase.position} - {selectedCase.department}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{selectedCase.id}</Badge>
                    <Badge className={getCategoryColor(selectedCase.resignationType)}>
                      {selectedCase.resignationType.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="settlement">Settlement</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Offboarding Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Resignation Date:</span>
                          <span>{selectedCase.resignationDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Working Day:</span>
                          <span>{selectedCase.lastWorkingDay.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reason:</span>
                          <span className="text-right">{selectedCase.reason}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={getCategoryColor(selectedCase.status)}>
                            {selectedCase.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created By:</span>
                          <span>{selectedCase.createdBy}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Progress Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Exit Interview</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedCase.exitInterviewCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {selectedCase.exitInterviewCompleted ? "Completed" : "Pending"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-sm">Handover</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedCase.handoverCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">{selectedCase.handoverCompleted ? "Completed" : "Pending"}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Laptop className="w-4 h-4" />
                            <span className="text-sm">Assets Returned</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedCase.assetsReturned ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">{selectedCase.assetsReturned ? "Returned" : "Pending"}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calculator className="w-4 h-4" />
                            <span className="text-sm">Final Settlement</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedCase.finalSettlementCalculated ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {selectedCase.finalSettlementCalculated ? "Calculated" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Department Clearance Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(selectedCase.clearanceStatus).map(([dept, cleared]) => (
                          <div key={dept} className="text-center">
                            <div
                              className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                                cleared ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              }`}
                            >
                              {getCategoryIcon(dept)}
                            </div>
                            <p className="text-sm font-medium capitalize">{dept}</p>
                            <p className="text-xs text-gray-500">{cleared ? "Cleared" : "Pending"}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="checklist" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Offboarding Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {checklist.map((item) => (
                          <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => handleChecklistUpdate(item.id, !!checked)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={getCategoryColor(item.category)} variant="outline">
                                  {getCategoryIcon(item.category)}
                                  <span className="ml-1 capitalize">{item.category}</span>
                                </Badge>
                                {item.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium">{item.task}</h4>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Assigned to: {item.assignedTo}</span>
                                {item.completed && item.completedDate && (
                                  <span>Completed: {item.completedDate.toLocaleDateString()}</span>
                                )}
                              </div>
                              {item.ghanaLabourActCompliance && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                  <strong>Ghana Labour Act Compliance:</strong> {item.ghanaLabourActCompliance}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settlement" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Final Settlement Calculation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCase.finalSettlementCalculated ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-green-600 mb-2">Payments Due</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Outstanding Salary:</span>
                                  <span>GHS 8,500</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Accrued Leave:</span>
                                  <span>GHS 3,200</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Bonus/Allowances:</span>
                                  <span>GHS 1,800</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Notice Pay:</span>
                                  <span>GHS 2,500</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-red-600 mb-2">Deductions</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Outstanding Loans:</span>
                                  <span>GHS 1,000</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Equipment Damage:</span>
                                  <span>GHS 0</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Other Deductions:</span>
                                  <span>GHS 0</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-lg font-semibold">
                              <span>Net Final Settlement:</span>
                              <span className="text-emerald-600">
                                GHS {selectedCase.finalSettlementAmount?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calculator className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">Final settlement calculation pending</p>
                          <Button className="mt-4">Calculate Settlement</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Offboarding Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedCase.documents.length > 0 ? (
                          selectedCase.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                <span>{doc}</span>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }
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
\
