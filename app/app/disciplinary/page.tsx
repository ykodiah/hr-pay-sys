"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Gavel,
  MessageSquare,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface DisciplinaryCase {
  id: string
  employeeId: string
  employeeName: string
  department: string
  caseType: "misconduct" | "performance" | "attendance" | "policy-violation" | "grievance"
  severity: "minor" | "major" | "gross"
  status: "open" | "investigation" | "hearing" | "resolved" | "closed"
  dateReported: string
  reportedBy: string
  description: string
  actions: DisciplinaryAction[]
  documents: string[]
  nextHearingDate?: string
  resolution?: string
  ghanaLabourActCompliance: boolean
}

interface DisciplinaryAction {
  id: string
  type: "verbal-warning" | "written-warning" | "final-warning" | "suspension" | "termination" | "counseling"
  date: string
  description: string
  issuedBy: string
  acknowledged: boolean
  expiryDate?: string
}

interface GrievanceCase {
  id: string
  employeeId: string
  employeeName: string
  department: string
  grievanceType:
    | "workplace-harassment"
    | "discrimination"
    | "unfair-treatment"
    | "working-conditions"
    | "pay-dispute"
    | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "submitted" | "acknowledged" | "investigating" | "mediation" | "resolved" | "escalated"
  dateSubmitted: string
  description: string
  desiredOutcome: string
  investigationNotes: string[]
  resolution?: string
  mediationDate?: string
}

export default function DisciplinaryPage() {
  const [activeTab, setActiveTab] = useState("cases")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [isNewGrievanceOpen, setIsNewGrievanceOpen] = useState(false)

  // Sample data
  const [disciplinaryCases, setDisciplinaryCases] = useState<DisciplinaryCase[]>([
    {
      id: "DC001",
      employeeId: "EMP001",
      employeeName: "John Doe",
      department: "Sales",
      caseType: "misconduct",
      severity: "major",
      status: "investigation",
      dateReported: "2024-03-15",
      reportedBy: "Jane Smith",
      description: "Inappropriate behavior towards colleagues during team meeting",
      actions: [
        {
          id: "A001",
          type: "verbal-warning",
          date: "2024-03-16",
          description: "Initial verbal warning issued for inappropriate conduct",
          issuedBy: "HR Manager",
          acknowledged: true,
        },
      ],
      documents: ["incident-report.pdf", "witness-statements.pdf"],
      nextHearingDate: "2024-03-25",
      ghanaLabourActCompliance: true,
    },
    {
      id: "DC002",
      employeeId: "EMP002",
      employeeName: "Mary Johnson",
      department: "Finance",
      caseType: "attendance",
      severity: "minor",
      status: "resolved",
      dateReported: "2024-03-10",
      reportedBy: "Finance Manager",
      description: "Consistent late arrivals without prior notification",
      actions: [
        {
          id: "A002",
          type: "written-warning",
          date: "2024-03-12",
          description: "Written warning for attendance issues with improvement plan",
          issuedBy: "HR Manager",
          acknowledged: true,
          expiryDate: "2024-09-12",
        },
      ],
      documents: ["attendance-record.pdf"],
      resolution: "Employee acknowledged issue and showed improvement",
      ghanaLabourActCompliance: true,
    },
  ])

  const [grievanceCases, setGrievanceCases] = useState<GrievanceCase[]>([
    {
      id: "GR001",
      employeeId: "EMP003",
      employeeName: "Samuel Osei",
      department: "IT",
      grievanceType: "unfair-treatment",
      priority: "high",
      status: "investigating",
      dateSubmitted: "2024-03-18",
      description: "Alleges unfair treatment in promotion decisions despite meeting all criteria",
      desiredOutcome: "Fair review of promotion decision and transparent promotion process",
      investigationNotes: [
        "Initial meeting with employee conducted",
        "Reviewing promotion criteria and decision process",
        "Interviewing relevant managers",
      ],
      mediationDate: "2024-03-28",
    },
  ])

  const [newCase, setNewCase] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    caseType: "",
    severity: "",
    description: "",
    reportedBy: "",
  })

  const [newGrievance, setNewGrievance] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    grievanceType: "",
    priority: "",
    description: "",
    desiredOutcome: "",
  })

  const handleCreateCase = () => {
    const caseId = `DC${String(disciplinaryCases.length + 1).padStart(3, "0")}`
    const newDisciplinaryCase: DisciplinaryCase = {
      id: caseId,
      ...newCase,
      status: "open",
      dateReported: new Date().toISOString().split("T")[0],
      actions: [],
      documents: [],
      ghanaLabourActCompliance: true,
    } as DisciplinaryCase

    setDisciplinaryCases([...disciplinaryCases, newDisciplinaryCase])
    setIsNewCaseOpen(false)
    setNewCase({
      employeeId: "",
      employeeName: "",
      department: "",
      caseType: "",
      severity: "",
      description: "",
      reportedBy: "",
    })
    toast({
      title: "Disciplinary Case Created",
      description: `Case ${caseId} has been created successfully.`,
    })
  }

  const handleCreateGrievance = () => {
    const grievanceId = `GR${String(grievanceCases.length + 1).padStart(3, "0")}`
    const newGrievanceCase: GrievanceCase = {
      id: grievanceId,
      ...newGrievance,
      status: "submitted",
      dateSubmitted: new Date().toISOString().split("T")[0],
      investigationNotes: [],
    } as GrievanceCase

    setGrievanceCases([...grievanceCases, newGrievanceCase])
    setIsNewGrievanceOpen(false)
    setNewGrievance({
      employeeId: "",
      employeeName: "",
      department: "",
      grievanceType: "",
      priority: "",
      description: "",
      desiredOutcome: "",
    })
    toast({
      title: "Grievance Submitted",
      description: `Grievance ${grievanceId} has been submitted successfully.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "investigation":
      case "investigating":
        return "bg-yellow-100 text-yellow-800"
      case "hearing":
      case "mediation":
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-green-100 text-green-800"
      case "major":
        return "bg-orange-100 text-orange-800"
      case "gross":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary & Grievance Management</h1>
          <p className="text-gray-600">
            Manage disciplinary actions and grievances in compliance with Ghana Labour Act
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isNewGrievanceOpen} onOpenChange={setIsNewGrievanceOpen}>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grievance-employee-id">Employee ID</Label>
                    <Input
                      id="grievance-employee-id"
                      value={newGrievance.employeeId}
                      onChange={(e) => setNewGrievance({ ...newGrievance, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grievance-employee-name">Employee Name</Label>
                    <Input
                      id="grievance-employee-name"
                      value={newGrievance.employeeName}
                      onChange={(e) => setNewGrievance({ ...newGrievance, employeeName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grievance-department">Department</Label>
                    <Input
                      id="grievance-department"
                      value={newGrievance.department}
                      onChange={(e) => setNewGrievance({ ...newGrievance, department: e.target.value })}
                      placeholder="Sales"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grievance-type">Grievance Type</Label>
                    <Select
                      value={newGrievance.grievanceType}
                      onValueChange={(value) => setNewGrievance({ ...newGrievance, grievanceType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workplace-harassment">Workplace Harassment</SelectItem>
                        <SelectItem value="discrimination">Discrimination</SelectItem>
                        <SelectItem value="unfair-treatment">Unfair Treatment</SelectItem>
                        <SelectItem value="working-conditions">Working Conditions</SelectItem>
                        <SelectItem value="pay-dispute">Pay Dispute</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="grievance-priority">Priority</Label>
                  <Select
                    value={newGrievance.priority}
                    onValueChange={(value) => setNewGrievance({ ...newGrievance, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="grievance-description">Description</Label>
                  <Textarea
                    id="grievance-description"
                    value={newGrievance.description}
                    onChange={(e) => setNewGrievance({ ...newGrievance, description: e.target.value })}
                    placeholder="Describe the grievance in detail..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="grievance-outcome">Desired Outcome</Label>
                  <Textarea
                    id="grievance-outcome"
                    value={newGrievance.desiredOutcome}
                    onChange={(e) => setNewGrievance({ ...newGrievance, desiredOutcome: e.target.value })}
                    placeholder="What outcome are you seeking?"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewGrievanceOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGrievance}>Submit Grievance</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Disciplinary Case</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee-id">Employee ID</Label>
                    <Input
                      id="employee-id"
                      value={newCase.employeeId}
                      onChange={(e) => setNewCase({ ...newCase, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employee-name">Employee Name</Label>
                    <Input
                      id="employee-name"
                      value={newCase.employeeName}
                      onChange={(e) => setNewCase({ ...newCase, employeeName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newCase.department}
                      onChange={(e) => setNewCase({ ...newCase, department: e.target.value })}
                      placeholder="Sales"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reported-by">Reported By</Label>
                    <Input
                      id="reported-by"
                      value={newCase.reportedBy}
                      onChange={(e) => setNewCase({ ...newCase, reportedBy: e.target.value })}
                      placeholder="Manager Name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="case-type">Case Type</Label>
                    <Select
                      value={newCase.caseType}
                      onValueChange={(value) => setNewCase({ ...newCase, caseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="misconduct">Misconduct</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="policy-violation">Policy Violation</SelectItem>
                        <SelectItem value="grievance">Grievance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={newCase.severity}
                      onValueChange={(value) => setNewCase({ ...newCase, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="gross">Gross Misconduct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    placeholder="Describe the incident or issue in detail..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewCaseOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCase}>Create Case</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {disciplinaryCases.filter((c) => c.status !== "closed" && c.status !== "resolved").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Grievances</p>
                <p className="text-2xl font-bold text-gray-900">
                  {grievanceCases.filter((g) => g.status !== "resolved").length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Hearings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {disciplinaryCases.filter((c) => c.nextHearingDate).length}
                </p>
              </div>
              <Gavel className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-gray-900">100%</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cases">Disciplinary Cases</TabsTrigger>
          <TabsTrigger value="grievances">Grievances</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search cases by employee name, case ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigation">Investigation</SelectItem>
                <SelectItem value="hearing">Hearing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Cases List */}
          <div className="space-y-4">
            {disciplinaryCases.map((case_) => (
              <Card key={case_.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{case_.id}</h3>
                        <Badge className={getStatusColor(case_.status)}>{case_.status.replace("-", " ")}</Badge>
                        <Badge className={getSeverityColor(case_.severity)}>{case_.severity}</Badge>
                        {case_.ghanaLabourActCompliance && (
                          <Badge className="bg-green-100 text-green-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Compliant
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Employee:</span> {case_.employeeName}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {case_.department}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {case_.caseType.replace("-", " ")}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(case_.dateReported).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{case_.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Reported by {case_.reportedBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{case_.documents.length} documents</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{case_.actions.length} actions taken</span>
                        </div>
                        {case_.nextHearingDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Hearing: {new Date(case_.nextHearingDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grievances" className="space-y-6">
          {/* Grievances List */}
          <div className="space-y-4">
            {grievanceCases.map((grievance) => (
              <Card key={grievance.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{grievance.id}</h3>
                        <Badge className={getStatusColor(grievance.status)}>{grievance.status.replace("-", " ")}</Badge>
                        <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Employee:</span> {grievance.employeeName}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {grievance.department}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {grievance.grievanceType.replace("-", " ")}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span>{" "}
                          {new Date(grievance.dateSubmitted).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        <span className="font-medium">Issue:</span> {grievance.description}
                      </p>
                      <p className="text-gray-700 mb-3">
                        <span className="font-medium">Desired Outcome:</span> {grievance.desiredOutcome}
                      </p>
                      {grievance.investigationNotes.length > 0 && (
                        <div className="mb-3">
                          <span className="font-medium text-sm text-gray-600">Investigation Notes:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {grievance.investigationNotes.map((note, index) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {grievance.mediationDate && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Mediation scheduled: {new Date(grievance.mediationDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Ghana Labour Act Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Disciplinary Procedures</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Progressive discipline policy implemented</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Fair hearing procedures established</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Right to representation ensured</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Appeal process documented</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Grievance Handling</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Grievance procedure communicated</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Timely response mechanisms</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Mediation services available</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Documentation requirements met</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Key Compliance Requirements</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Section 62: Disciplinary procedures must be fair and reasonable</li>
                    <li>• Section 63: Employee right to be heard before disciplinary action</li>
                    <li>• Section 64: Progressive discipline approach required</li>
                    <li>• Section 65: Grievance procedures must be established</li>
                    <li>• Section 66: Right to representation in disciplinary hearings</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
