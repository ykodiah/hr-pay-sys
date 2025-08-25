"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  AlertTriangle,
  Calendar,
  Scale,
  Eye,
  Edit,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Users,
  BookOpen,
} from "lucide-react"

// Mock data for disciplinary cases
const mockDisciplinaryCases = [
  {
    id: "DISC-001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    caseType: "misconduct",
    severity: "medium",
    status: "investigation",
    title: "Unauthorized Absence",
    description: "Employee was absent for 3 consecutive days without prior notice or approval",
    reportedBy: "John Manager",
    reportedDate: new Date("2024-02-15"),
    incidentDate: new Date("2024-02-10"),
    witnesses: ["Jane Doe", "Mike Smith"],
    actionsTaken: [
      {
        date: new Date("2024-02-15"),
        action: "Case reported",
        takenBy: "John Manager",
        notes: "Initial report filed",
      },
      {
        date: new Date("2024-02-16"),
        action: "Investigation started",
        takenBy: "HR Team",
        notes: "Gathering evidence and witness statements",
      },
    ],
    nextHearing: new Date("2024-02-25"),
    documents: ["incident_report.pdf", "witness_statement_1.pdf"],
  },
  {
    id: "DISC-002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    caseType: "performance",
    severity: "low",
    status: "resolved",
    title: "Poor Performance Review",
    description: "Consistently missing targets and deadlines over the past quarter",
    reportedBy: "Sarah Director",
    reportedDate: new Date("2024-01-20"),
    incidentDate: new Date("2024-01-15"),
    witnesses: [],
    actionsTaken: [
      {
        date: new Date("2024-01-20"),
        action: "Performance review meeting",
        takenBy: "Sarah Director",
        notes: "Discussed performance issues and improvement plan",
      },
      {
        date: new Date("2024-01-25"),
        action: "Verbal warning issued",
        takenBy: "HR Team",
        notes: "Formal verbal warning with 30-day improvement period",
      },
      {
        date: new Date("2024-02-20"),
        action: "Case closed",
        takenBy: "HR Team",
        notes: "Performance improved significantly, case resolved",
      },
    ],
    resolution: "Employee showed significant improvement after verbal warning",
    documents: ["performance_review.pdf", "improvement_plan.pdf"],
  },
]

// Mock grievance data
const mockGrievances = [
  {
    id: "GRIEV-001",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Finance",
    grievanceType: "workplace_harassment",
    priority: "high",
    status: "under_review",
    title: "Workplace Harassment Complaint",
    description: "Reporting inappropriate behavior and harassment from supervisor",
    submittedDate: new Date("2024-02-18"),
    assignedTo: "HR Investigation Team",
    expectedResolution: new Date("2024-03-05"),
    documents: ["complaint_form.pdf", "evidence_photos.zip"],
  },
]

const caseTypeLabels = {
  misconduct: "Misconduct",
  performance: "Performance Issue",
  attendance: "Attendance Issue",
  policy_violation: "Policy Violation",
  harassment: "Harassment",
  insubordination: "Insubordination",
}

const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

const statusColors = {
  investigation: "bg-blue-100 text-blue-800",
  hearing_scheduled: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
  under_review: "bg-yellow-100 text-yellow-800",
  escalated: "bg-red-100 text-red-800",
}

export default function DisciplinaryPage() {
  const [disciplinaryCases, setDisciplinaryCases] = useState(mockDisciplinaryCases)
  const [grievances, setGrievances] = useState(mockGrievances)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [isNewGrievanceOpen, setIsNewGrievanceOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("disciplinary")

  const [newCaseForm, setNewCaseForm] = useState({
    employeeId: "",
    caseType: "",
    severity: "",
    title: "",
    description: "",
    incidentDate: "",
    witnesses: "",
  })

  const filteredCases = disciplinaryCases.filter(
    (case_) =>
      case_.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredGrievances = grievances.filter(
    (grievance) =>
      grievance.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleNewCase = () => {
    const newCase = {
      id: `DISC-${String(disciplinaryCases.length + 1).padStart(3, "0")}`,
      employeeId: newCaseForm.employeeId,
      employeeName: "Selected Employee", // Would fetch from employee data
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department", // Would fetch from employee data
      caseType: newCaseForm.caseType,
      severity: newCaseForm.severity,
      status: "investigation",
      title: newCaseForm.title,
      description: newCaseForm.description,
      reportedBy: "Current User",
      reportedDate: new Date(),
      incidentDate: new Date(newCaseForm.incidentDate),
      witnesses: newCaseForm.witnesses
        .split(",")
        .map((w) => w.trim())
        .filter((w) => w),
      actionsTaken: [
        {
          date: new Date(),
          action: "Case created",
          takenBy: "Current User",
          notes: "Initial case creation",
        },
      ],
      documents: [],
    }

    setDisciplinaryCases([...disciplinaryCases, newCase])
    setIsNewCaseOpen(false)
    setNewCaseForm({
      employeeId: "",
      caseType: "",
      severity: "",
      title: "",
      description: "",
      incidentDate: "",
      witnesses: "",
    })
    toast({
      title: "Disciplinary Case Created",
      description: `Case ${newCase.id} has been created successfully.`,
    })
  }

  const getCaseStats = () => {
    const total = disciplinaryCases.length
    const investigation = disciplinaryCases.filter((c) => c.status === "investigation").length
    const resolved = disciplinaryCases.filter((c) => c.status === "resolved").length
    const highSeverity = disciplinaryCases.filter((c) => c.severity === "high").length
    return { total, investigation, resolved, highSeverity }
  }

  const getGrievanceStats = () => {
    const total = grievances.length
    const underReview = grievances.filter((g) => g.status === "under_review").length
    const highPriority = grievances.filter((g) => g.priority === "high").length
    return { total, underReview, highPriority }
  }

  const disciplinaryStats = getCaseStats()
  const grievanceStats = getGrievanceStats()

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
        <div className="flex gap-2">
          <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select
                      value={newCaseForm.employeeId}
                      onValueChange={(value) => setNewCaseForm({ ...newCaseForm, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante</SelectItem>
                        <SelectItem value="EMP002">Ama Osei</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="caseType">Case Type</Label>
                    <Select
                      value={newCaseForm.caseType}
                      onValueChange={(value) => setNewCaseForm({ ...newCaseForm, caseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(caseTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={newCaseForm.severity}
                      onValueChange={(value) => setNewCaseForm({ ...newCaseForm, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="incidentDate">Incident Date</Label>
                    <Input
                      type="date"
                      value={newCaseForm.incidentDate}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, incidentDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Case Title</Label>
                  <Input
                    placeholder="Brief description of the case"
                    value={newCaseForm.title}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    placeholder="Provide detailed description of the incident..."
                    value={newCaseForm.description}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="witnesses">Witnesses (comma-separated)</Label>
                  <Input
                    placeholder="John Doe, Jane Smith"
                    value={newCaseForm.witnesses}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, witnesses: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewCaseOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleNewCase}>Create Case</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{disciplinaryStats.total}</div>
                <p className="text-sm text-gray-600">Total Cases</p>
              </div>
              <Scale className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{disciplinaryStats.investigation}</div>
                <p className="text-sm text-gray-600">Under Investigation</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{disciplinaryStats.resolved}</div>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{grievanceStats.total}</div>
                <p className="text-sm text-gray-600">Active Grievances</p>
              </div>
              <MessageSquare className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search cases, employees, or case IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disciplinary">Disciplinary Cases ({disciplinaryStats.total})</TabsTrigger>
          <TabsTrigger value="grievances">Grievances ({grievanceStats.total})</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="disciplinary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disciplinary Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                          <Badge className={severityColors[case_.severity as keyof typeof severityColors]}>
                            {case_.severity.toUpperCase()}
                          </Badge>
                          <Badge className={statusColors[case_.status as keyof typeof statusColors]}>
                            {case_.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {case_.employeeName} ({case_.id})
                          </span>
                          <span className="text-sm text-gray-500">{case_.department}</span>
                          <span className="text-sm text-gray-500">
                            {caseTypeLabels[case_.caseType as keyof typeof caseTypeLabels]}
                          </span>
                          <span className="text-sm text-gray-500">
                            Reported: {case_.reportedDate.toLocaleDateString()}
                          </span>
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
                          <DropdownMenuItem onClick={() => setSelectedCase(case_)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Case
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Hearing
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
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

        <TabsContent value="grievances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Grievances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredGrievances.map((grievance) => (
                  <div
                    key={grievance.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                          <Badge className={severityColors[grievance.priority as keyof typeof severityColors]}>
                            {grievance.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <Badge className={statusColors[grievance.status as keyof typeof statusColors]}>
                            {grievance.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {grievance.employeeName} ({grievance.id})
                          </span>
                          <span className="text-sm text-gray-500">{grievance.department}</span>
                          <span className="text-sm text-gray-500">
                            Submitted: {grievance.submittedDate.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{grievance.description}</p>
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
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Respond
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="w-4 h-4 mr-2" />
                            Assign Investigator
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
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

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Ghana Labour Act Compliance Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Disciplinary Procedures</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Investigation</p>
                        <p className="text-sm text-gray-600">Conduct thorough investigation before taking action</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Right to be Heard</p>
                        <p className="text-sm text-gray-600">Employee must be given opportunity to respond</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Progressive Discipline</p>
                        <p className="text-sm text-gray-600">
                          Follow progressive steps: verbal → written → suspension → termination
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Documentation</p>
                        <p className="text-sm text-gray-600">Maintain detailed records of all proceedings</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Grievance Handling</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Immediate Acknowledgment</p>
                        <p className="text-sm text-gray-600">Acknowledge receipt within 48 hours</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Fair Investigation</p>
                        <p className="text-sm text-gray-600">Conduct impartial investigation within 14 days</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Resolution Timeline</p>
                        <p className="text-sm text-gray-600">Resolve within 30 days or provide status update</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Appeal Rights</p>
                        <p className="text-sm text-gray-600">Inform employee of appeal process</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Compliance Note</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      All disciplinary and grievance procedures must comply with Ghana Labour Act, 2003 (Act 651) and
                      Labour Regulations, 2007 (L.I. 1833). Failure to follow proper procedures may result in unfair
                      dismissal claims or legal challenges.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Details Modal */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.id}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Case Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Case ID:</span>
                      <span>{selectedCase.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{caseTypeLabels[selectedCase.caseType as keyof typeof caseTypeLabels]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <Badge className={severityColors[selectedCase.severity as keyof typeof severityColors]}>
                        {selectedCase.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={statusColors[selectedCase.status as keyof typeof statusColors]}>
                        {selectedCase.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedCase.employeeAvatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedCase.employeeName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedCase.employeeName}</p>
                      <p className="text-sm text-gray-600">
                        {selectedCase.employeeId} • {selectedCase.department}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Case Description</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedCase.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Actions Taken</h4>
                <div className="space-y-3">
                  {selectedCase.actionsTaken?.map((action: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{action.action}</p>
                          <span className="text-sm text-gray-500">{action.date.toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">By: {action.takenBy}</p>
                        {action.notes && <p className="text-sm text-gray-600 mt-1">{action.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedCase(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
