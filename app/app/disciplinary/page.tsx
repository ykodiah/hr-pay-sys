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
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Calendar,
  Clock,
  AlertTriangle,
  Shield,
  FileText,
  Users,
  Gavel,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scale,
  BookOpen,
  Download,
  User,
  BarChart3,
} from "lucide-react"

interface DisciplinaryCase {
  id: string
  employeeId: string
  employeeName: string
  employeeAvatar?: string
  caseType: "incident" | "grievance"
  category: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "investigating" | "hearing_scheduled" | "resolved" | "closed" | "escalated"
  title: string
  description: string
  reportedBy: string
  reportedDate: Date
  dueDate?: Date
  assignedTo?: string
  actions: DisciplinaryAction[]
  documents: string[]
  witnesses?: string[]
  hearingDate?: Date
  resolution?: string
  complianceNotes?: string
}

interface DisciplinaryAction {
  id: string
  type:
    | "verbal_warning"
    | "written_warning"
    | "final_warning"
    | "suspension"
    | "termination"
    | "counseling"
    | "training"
  date: Date
  description: string
  issuedBy: string
  acknowledged: boolean
  acknowledgedDate?: Date
  followUpRequired: boolean
  followUpDate?: Date
  ghanaLabourActReference?: string
}

interface GrievanceCase {
  id: string
  employeeId: string
  employeeName: string
  employeeAvatar?: string
  grievanceType: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "submitted" | "acknowledged" | "investigating" | "mediation" | "hearing" | "resolved" | "closed"
  title: string
  description: string
  submittedDate: Date
  desiredOutcome: string
  investigator?: string
  mediator?: string
  hearingDate?: Date
  resolution?: string
  satisfactionRating?: number
}

export default function DisciplinaryGrievancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false)
  const [isNewGrievanceDialogOpen, setIsNewGrievanceDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null)
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false)

  const [disciplinaryCases, setDisciplinaryCases] = useState<DisciplinaryCase[]>([
    {
      id: "DISC-001",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      caseType: "incident",
      category: "Misconduct",
      severity: "medium",
      status: "investigating",
      title: "Unauthorized Absence",
      description: "Employee was absent for 3 consecutive days without prior notice or approval",
      reportedBy: "Jane Smith (HR Manager)",
      reportedDate: new Date("2024-01-15"),
      dueDate: new Date("2024-01-25"),
      assignedTo: "HR Department",
      actions: [
        {
          id: "ACT-001",
          type: "verbal_warning",
          date: new Date("2024-01-16"),
          description: "Initial verbal warning issued regarding attendance policy",
          issuedBy: "Jane Smith",
          acknowledged: true,
          acknowledgedDate: new Date("2024-01-16"),
          followUpRequired: true,
          followUpDate: new Date("2024-02-16"),
          ghanaLabourActReference: "Section 62 - Grounds for Termination",
        },
      ],
      documents: ["attendance_record.pdf", "policy_handbook.pdf"],
      witnesses: ["John Doe", "Mary Johnson"],
      complianceNotes: "Case handled in accordance with Ghana Labour Act 2003, Section 62",
    },
    {
      id: "DISC-002",
      employeeId: "EMP003",
      employeeName: "Kofi Mensah",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      caseType: "incident",
      category: "Performance",
      severity: "high",
      status: "hearing_scheduled",
      title: "Repeated Performance Issues",
      description: "Consistent failure to meet sales targets despite multiple coaching sessions",
      reportedBy: "Sales Manager",
      reportedDate: new Date("2024-01-10"),
      dueDate: new Date("2024-01-30"),
      assignedTo: "HR Department",
      hearingDate: new Date("2024-01-28"),
      actions: [
        {
          id: "ACT-002",
          type: "written_warning",
          date: new Date("2024-01-12"),
          description: "Formal written warning for performance deficiencies",
          issuedBy: "HR Manager",
          acknowledged: false,
          followUpRequired: true,
          followUpDate: new Date("2024-02-12"),
          ghanaLabourActReference: "Section 61 - Progressive Discipline",
        },
      ],
      documents: ["performance_review.pdf", "coaching_records.pdf"],
      complianceNotes: "Progressive discipline approach as per Ghana Labour Act requirements",
    },
  ])

  const [grievanceCases, setGrievanceCases] = useState<GrievanceCase[]>([
    {
      id: "GRIEV-001",
      employeeId: "EMP002",
      employeeName: "Ama Osei",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      grievanceType: "Workplace Harassment",
      priority: "high",
      status: "investigating",
      title: "Harassment by Supervisor",
      description: "Reporting inappropriate comments and behavior from direct supervisor",
      submittedDate: new Date("2024-01-20"),
      desiredOutcome: "Investigation and appropriate disciplinary action against supervisor",
      investigator: "External HR Consultant",
      resolution: undefined,
    },
    {
      id: "GRIEV-002",
      employeeId: "EMP004",
      employeeName: "Akosua Boateng",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      grievanceType: "Compensation Dispute",
      priority: "medium",
      status: "mediation",
      title: "Overtime Payment Dispute",
      description: "Claiming unpaid overtime hours for the past 3 months",
      submittedDate: new Date("2024-01-18"),
      desiredOutcome: "Payment of outstanding overtime compensation",
      mediator: "HR Manager",
      resolution: undefined,
    },
  ])

  const handleNewDisciplinaryCase = (caseData: any) => {
    const newCase: DisciplinaryCase = {
      id: `DISC-${String(disciplinaryCases.length + 1).padStart(3, "0")}`,
      ...caseData,
      reportedDate: new Date(),
      status: "open" as const,
      actions: [],
      documents: [],
    }
    setDisciplinaryCases([...disciplinaryCases, newCase])
    setIsNewCaseDialogOpen(false)
    toast({
      title: "Disciplinary Case Created",
      description: `Case ${newCase.id} has been created and assigned for investigation.`,
    })
  }

  const handleNewGrievance = (grievanceData: any) => {
    const newGrievance: GrievanceCase = {
      id: `GRIEV-${String(grievanceCases.length + 1).padStart(3, "0")}`,
      ...grievanceData,
      submittedDate: new Date(),
      status: "submitted" as const,
    }
    setGrievanceCases([...grievanceCases, newGrievance])
    setIsNewGrievanceDialogOpen(false)
    toast({
      title: "Grievance Submitted",
      description: `Grievance ${newGrievance.id} has been submitted and will be reviewed.`,
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "investigating":
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800"
      case "hearing_scheduled":
      case "hearing":
        return "bg-purple-100 text-purple-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "escalated":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
      case "submitted":
        return <AlertCircle className="w-4 h-4" />
      case "investigating":
      case "acknowledged":
        return <Search className="w-4 h-4" />
      case "hearing_scheduled":
      case "hearing":
        return <Gavel className="w-4 h-4" />
      case "resolved":
        return <CheckCircle className="w-4 h-4" />
      case "closed":
        return <XCircle className="w-4 h-4" />
      case "escalated":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredDisciplinaryCases = disciplinaryCases.filter((case_) => {
    const matchesSearch =
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || case_.status === selectedStatus
    const matchesSeverity = selectedSeverity === "all" || case_.severity === selectedSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const filteredGrievanceCases = grievanceCases.filter((case_) => {
    const matchesSearch =
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getDisciplinaryStats = () => {
    const total = disciplinaryCases.length
    const open = disciplinaryCases.filter((c) => c.status === "open").length
    const investigating = disciplinaryCases.filter((c) => c.status === "investigating").length
    const resolved = disciplinaryCases.filter((c) => c.status === "resolved").length
    const critical = disciplinaryCases.filter((c) => c.severity === "critical").length
    return { total, open, investigating, resolved, critical }
  }

  const getGrievanceStats = () => {
    const total = grievanceCases.length
    const submitted = grievanceCases.filter((c) => c.status === "submitted").length
    const investigating = grievanceCases.filter((c) => c.status === "investigating").length
    const resolved = grievanceCases.filter((c) => c.status === "resolved").length
    const urgent = grievanceCases.filter((c) => c.priority === "urgent").length
    return { total, submitted, investigating, resolved, urgent }
  }

  const disciplinaryStats = getDisciplinaryStats()
  const grievanceStats = getGrievanceStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary & Grievance Management</h1>
          <p className="text-gray-600">Manage workplace incidents, disciplinary actions, and employee grievances</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewGrievanceDialogOpen} onOpenChange={setIsNewGrievanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                New Grievance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit New Grievance</DialogTitle>
              </DialogHeader>
              <NewGrievanceForm onSubmit={handleNewGrievance} onClose={() => setIsNewGrievanceDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Disciplinary Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Disciplinary Case</DialogTitle>
              </DialogHeader>
              <NewDisciplinaryCaseForm
                onSubmit={handleNewDisciplinaryCase}
                onClose={() => setIsNewCaseDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="disciplinary">Disciplinary Cases</TabsTrigger>
          <TabsTrigger value="grievances">Grievances</TabsTrigger>
          <TabsTrigger value="compliance">Compliance & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{disciplinaryStats.total}</div>
                    <p className="text-sm text-gray-600">Total Disciplinary Cases</p>
                  </div>
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{disciplinaryStats.investigating}</div>
                    <p className="text-sm text-gray-600">Under Investigation</p>
                  </div>
                  <Search className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{grievanceStats.total}</div>
                    <p className="text-sm text-gray-600">Total Grievances</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {disciplinaryStats.resolved + grievanceStats.resolved}
                    </div>
                    <p className="text-sm text-gray-600">Cases Resolved</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Cases */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Recent Disciplinary Cases</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disciplinaryCases.slice(0, 3).map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={case_.employeeAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {case_.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{case_.title}</p>
                          <p className="text-xs text-gray-600">
                            {case_.employeeName} • {case_.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(case_.severity)}>{case_.severity}</Badge>
                        <Badge className={getStatusColor(case_.status)}>{case_.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Recent Grievances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grievanceCases.slice(0, 3).map((grievance) => (
                    <div key={grievance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={grievance.employeeAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {grievance.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{grievance.title}</p>
                          <p className="text-xs text-gray-600">
                            {grievance.employeeName} • {grievance.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(grievance.priority)}>{grievance.priority}</Badge>
                        <Badge className={getStatusColor(grievance.status)}>{grievance.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ghana Labour Act Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-purple-600" />
                <span>Ghana Labour Act 2003 Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Progressive Discipline</span>
                  </div>
                  <p className="text-sm text-green-700">
                    All cases follow progressive discipline procedures as required by Section 61
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Due Process</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Fair hearing procedures implemented in accordance with natural justice principles
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Documentation</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Comprehensive record keeping for all disciplinary actions and grievances
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disciplinary" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search cases by title, employee name, or case ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Disciplinary Cases List */}
          <Card>
            <CardHeader>
              <CardTitle>Disciplinary Cases ({filteredDisciplinaryCases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDisciplinaryCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                          <Badge className={getSeverityColor(case_.severity)}>{case_.severity}</Badge>
                          <Badge className={getStatusColor(case_.status)}>
                            {getStatusIcon(case_.status)}
                            <span className="ml-1">{case_.status.replace("_", " ")}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-1" />
                            {case_.employeeName} ({case_.employeeId})
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            Reported: {case_.reportedDate.toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FileText className="w-4 h-4 mr-1" />
                            {case_.category}
                          </div>
                          {case_.dueDate && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              Due: {case_.dueDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{case_.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCase(case_)
                              setIsCaseDetailOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Case
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Gavel className="w-4 h-4 mr-2" />
                            Schedule Hearing
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Add Action
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

        <TabsContent value="grievances" className="space-y-6">
          {/* Grievances List */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Grievances ({filteredGrievanceCases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredGrievanceCases.map((grievance) => (
                  <div
                    key={grievance.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={grievance.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {grievance.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{grievance.title}</h3>
                          <Badge className={getSeverityColor(grievance.priority)}>{grievance.priority}</Badge>
                          <Badge className={getStatusColor(grievance.status)}>
                            {getStatusIcon(grievance.status)}
                            <span className="ml-1">{grievance.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-1" />
                            {grievance.employeeName} ({grievance.employeeId})
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            Submitted: {grievance.submittedDate.toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FileText className="w-4 h-4 mr-1" />
                            {grievance.grievanceType}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{grievance.description}</p>
                        <p className="text-sm text-blue-600 mt-1">
                          <strong>Desired Outcome:</strong> {grievance.desiredOutcome}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
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
                            <Users className="w-4 h-4 mr-2" />
                            Assign Investigator
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Schedule Mediation
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Resolved
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

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Dashboard */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  <span>Ghana Labour Act Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Section 61 - Progressive Discipline</h4>
                  <p className="text-sm text-gray-600 mb-2">Ensures fair and progressive disciplinary procedures</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compliance Rate</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Section 62 - Grounds for Termination</h4>
                  <p className="text-sm text-gray-600 mb-2">Valid reasons and procedures for employment termination</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cases Following Guidelines</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Section 63 - Notice Requirements</h4>
                  <p className="text-sm text-gray-600 mb-2">Proper notice periods for disciplinary actions</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notice Compliance</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Case Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{disciplinaryStats.total}</div>
                    <p className="text-sm text-red-700">Disciplinary Cases</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{grievanceStats.total}</div>
                    <p className="text-sm text-blue-700">Grievances Filed</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{disciplinaryStats.resolved}</div>
                    <p className="text-sm text-green-700">Cases Resolved</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{disciplinaryStats.investigating}</div>
                    <p className="text-sm text-yellow-700">Under Investigation</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download Compliance Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Actions Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Disciplinary Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disciplinaryCases
                  .flatMap((case_) => case_.actions)
                  .slice(0, 5)
                  .map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{action.type.replace("_", " ").toUpperCase()}</p>
                          <p className="text-xs text-gray-600">{action.description}</p>
                          <p className="text-xs text-gray-500">
                            Issued by {action.issuedBy} on {action.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={
                            action.acknowledged ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {action.acknowledged ? "Acknowledged" : "Pending"}
                        </Badge>
                        {action.ghanaLabourActReference && (
                          <Badge variant="outline" className="text-xs">
                            {action.ghanaLabourActReference}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Detail Dialog */}
      <Dialog open={isCaseDetailOpen} onOpenChange={setIsCaseDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.id}</DialogTitle>
          </DialogHeader>
          {selectedCase && <CaseDetailView case={selectedCase} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewDisciplinaryCaseForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    category: "",
    severity: "medium",
    title: "",
    description: "",
    reportedBy: "",
    assignedTo: "",
    witnesses: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      witnesses: formData.witnesses
        .split(",")
        .map((w) => w.trim())
        .filter((w) => w),
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
          <Label>Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Misconduct">Misconduct</SelectItem>
              <SelectItem value="Performance">Performance Issues</SelectItem>
              <SelectItem value="Attendance">Attendance Problems</SelectItem>
              <SelectItem value="Policy Violation">Policy Violation</SelectItem>
              <SelectItem value="Harassment">Harassment</SelectItem>
              <SelectItem value="Safety Violation">Safety Violation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Severity *</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, severity: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Case Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Brief description of the incident"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the incident or issue"
          rows={4}
          required
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reported By *</Label>
          <Input
            value={formData.reportedBy}
            onChange={(e) => setFormData((prev) => ({ ...prev, reportedBy: e.target.value }))}
            placeholder="Name and title of reporter"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Assigned To</Label>
          <Input
            value={formData.assignedTo}
            onChange={(e) => setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))}
            placeholder="Department or person handling the case"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Witnesses</Label>
        <Input
          value={formData.witnesses}
          onChange={(e) => setFormData((prev) => ({ ...prev, witnesses: e.target.value }))}
          placeholder="Comma-separated list of witness names"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Case</Button>
      </div>
    </form>
  )
}

function NewGrievanceForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    grievanceType: "",
    priority: "medium",
    title: "",
    description: "",
    desiredOutcome: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
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
          <Label>Grievance Type *</Label>
          <Select
            value={formData.grievanceType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, grievanceType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Workplace Harassment">Workplace Harassment</SelectItem>
              <SelectItem value="Discrimination">Discrimination</SelectItem>
              <SelectItem value="Compensation Dispute">Compensation Dispute</SelectItem>
              <SelectItem value="Working Conditions">Working Conditions</SelectItem>
              <SelectItem value="Management Issues">Management Issues</SelectItem>
              <SelectItem value="Policy Concerns">Policy Concerns</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Grievance Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Brief summary of the grievance"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the grievance"
          rows={4}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Desired Outcome *</Label>
        <Textarea
          value={formData.desiredOutcome}
          onChange={(e) => setFormData((prev) => ({ ...prev, desiredOutcome: e.target.value }))}
          placeholder="What resolution are you seeking?"
          rows={3}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Submit Grievance</Button>
      </div>
    </form>
  )
}

function CaseDetailView({ case: selectedCase }: { case: DisciplinaryCase }) {
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
            <h2 className="text-xl font-semibold">{selectedCase.title}</h2>
            <p className="text-gray-600">
              {selectedCase.employeeName} ({selectedCase.employeeId})
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                className={
                  selectedCase.severity === "critical"
                    ? "bg-red-100 text-red-800"
                    : selectedCase.severity === "high"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                }
              >
                {selectedCase.severity}
              </Badge>
              <Badge
                className={
                  selectedCase.status === "resolved" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }
              >
                {selectedCase.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Case Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Case ID:</span>
              <span className="font-medium">{selectedCase.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span>{selectedCase.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reported By:</span>
              <span>{selectedCase.reportedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reported Date:</span>
              <span>{selectedCase.reportedDate.toLocaleDateString()}</span>
            </div>
            {selectedCase.dueDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span>{selectedCase.dueDate.toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Assigned To:</span>
              <span>{selectedCase.assignedTo}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance & Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900">Ghana Labour Act Compliance</p>
              <p className="text-xs text-purple-700 mt-1">{selectedCase.complianceNotes}</p>
            </div>
            {selectedCase.witnesses && selectedCase.witnesses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Witnesses:</p>
                <div className="space-y-1">
                  {selectedCase.witnesses.map((witness, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {witness}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Case Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{selectedCase.description}</p>
        </CardContent>
      </Card>

      {/* Actions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Disciplinary Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedCase.actions.map((action) => (
              <div key={action.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{action.type.replace("_", " ").toUpperCase()}</h4>
                    <Badge
                      className={action.acknowledged ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {action.acknowledged ? "Acknowledged" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Issued by {action.issuedBy}</span>
                    <span>Date: {action.date.toLocaleDateString()}</span>
                    {action.ghanaLabourActReference && (
                      <Badge variant="outline" className="text-xs">
                        {action.ghanaLabourActReference}
                      </Badge>
                    )}
                  </div>
                  {action.followUpRequired && action.followUpDate && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                      <strong>Follow-up Required:</strong> {action.followUpDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {selectedCase.actions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No disciplinary actions recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
