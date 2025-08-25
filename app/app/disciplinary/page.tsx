"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Building,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  CheckCircle,
  MessageSquare,
  Gavel,
  Scale,
  BookOpen,
  Users,
} from "lucide-react"

interface DisciplinaryCase {
  id: string
  caseNumber: string
  employeeName: string
  employeeId: string
  department: string
  incidentType: "misconduct" | "performance" | "attendance" | "policy-violation" | "harassment" | "insubordination"
  severity: "minor" | "major" | "gross-misconduct"
  status:
    | "reported"
    | "investigating"
    | "hearing-scheduled"
    | "hearing-completed"
    | "action-taken"
    | "closed"
    | "appealed"
  reportedBy: string
  reportedDate: string
  incidentDate: string
  description: string
  witnesses?: string[]
  evidence?: string[]
  actionTaken?: string
  hearingDate?: string
  outcome?: string
  appealDeadline?: string
}

interface Grievance {
  id: string
  grievanceNumber: string
  employeeName: string
  employeeId: string
  department: string
  grievanceType:
    | "workplace-harassment"
    | "discrimination"
    | "unfair-treatment"
    | "working-conditions"
    | "pay-dispute"
    | "management-issues"
  priority: "low" | "medium" | "high" | "urgent"
  status: "submitted" | "acknowledged" | "investigating" | "mediation" | "hearing" | "resolved" | "escalated"
  submittedDate: string
  description: string
  desiredOutcome: string
  assignedTo?: string
  resolutionDate?: string
  resolution?: string
}

interface Warning {
  id: string
  employeeName: string
  employeeId: string
  warningType: "verbal" | "written" | "final-written"
  issueDate: string
  expiryDate: string
  reason: string
  issuedBy: string
  status: "active" | "expired" | "appealed"
  appealStatus?: "pending" | "upheld" | "overturned"
}

export default function DisciplinaryPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showCaseDialog, setShowCaseDialog] = useState(false)
  const [showGrievanceDialog, setShowGrievanceDialog] = useState(false)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [showHearingDialog, setShowHearingDialog] = useState(false)
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null)

  const [disciplinaryCases] = useState<DisciplinaryCase[]>([
    {
      id: "1",
      caseNumber: "DC-2024-001",
      employeeName: "John Doe",
      employeeId: "EMP-001",
      department: "Sales",
      incidentType: "misconduct",
      severity: "major",
      status: "investigating",
      reportedBy: "Jane Smith (Manager)",
      reportedDate: "2024-03-15",
      incidentDate: "2024-03-14",
      description:
        "Employee was found to be misrepresenting company policies to clients, potentially damaging company reputation.",
      witnesses: ["Michael Brown", "Sarah Johnson"],
      evidence: ["Email correspondence", "Client complaint", "CCTV footage"],
    },
    {
      id: "2",
      caseNumber: "DC-2024-002",
      employeeName: "Alice Wilson",
      employeeId: "EMP-045",
      department: "Finance",
      incidentType: "attendance",
      severity: "minor",
      status: "action-taken",
      reportedBy: "David Chen (Supervisor)",
      reportedDate: "2024-03-10",
      incidentDate: "2024-03-08",
      description: "Repeated tardiness over the past month without valid reasons.",
      actionTaken: "Verbal warning issued",
      outcome: "Employee counseled on punctuality expectations",
    },
  ])

  const [grievances] = useState<Grievance[]>([
    {
      id: "1",
      grievanceNumber: "GR-2024-001",
      employeeName: "Sarah Johnson",
      employeeId: "EMP-023",
      department: "Marketing",
      grievanceType: "unfair-treatment",
      priority: "high",
      status: "investigating",
      submittedDate: "2024-03-12",
      description:
        "Employee alleges unfair treatment in promotion decisions and claims discrimination based on gender.",
      desiredOutcome: "Fair review of promotion criteria and equal treatment",
      assignedTo: "HR Manager",
    },
    {
      id: "2",
      grievanceNumber: "GR-2024-002",
      employeeName: "Michael Brown",
      employeeId: "EMP-067",
      department: "Operations",
      grievanceType: "working-conditions",
      priority: "medium",
      status: "resolved",
      submittedDate: "2024-03-05",
      description: "Concerns about workplace safety and inadequate protective equipment.",
      desiredOutcome: "Improved safety measures and proper equipment",
      resolutionDate: "2024-03-18",
      resolution: "Safety equipment upgraded and additional training provided",
    },
  ])

  const [warnings] = useState<Warning[]>([
    {
      id: "1",
      employeeName: "Robert Taylor",
      employeeId: "EMP-089",
      warningType: "written",
      issueDate: "2024-03-01",
      expiryDate: "2024-09-01",
      reason: "Failure to meet performance targets for three consecutive months",
      issuedBy: "Department Manager",
      status: "active",
    },
    {
      id: "2",
      employeeName: "Lisa Anderson",
      employeeId: "EMP-034",
      warningType: "verbal",
      issueDate: "2024-02-15",
      expiryDate: "2024-05-15",
      reason: "Inappropriate conduct during team meeting",
      issuedBy: "HR Manager",
      status: "active",
    },
  ])

  const ghanaLabourActGuidelines = {
    disciplinaryProcedure: [
      "Investigation must be conducted fairly and impartially",
      "Employee has right to be heard and present their case",
      "Employee may be accompanied by a colleague or union representative",
      "Disciplinary action must be proportionate to the offense",
      "Progressive discipline should be followed (verbal → written → final written → dismissal)",
      "Right of appeal must be provided",
      "All proceedings must be documented",
    ],
    grievanceProcedure: [
      "Grievance must be acknowledged within 5 working days",
      "Investigation should be completed within reasonable time",
      "Employee has right to be accompanied during hearings",
      "Attempt informal resolution before formal procedures",
      "Right of appeal to higher authority",
      "Confidentiality must be maintained",
      "No victimization of complainant",
    ],
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
      case "action-taken":
        return "bg-green-100 text-green-700"
      case "investigating":
      case "hearing-scheduled":
        return "bg-blue-100 text-blue-700"
      case "reported":
      case "submitted":
      case "acknowledged":
        return "bg-yellow-100 text-yellow-700"
      case "appealed":
      case "escalated":
        return "bg-purple-100 text-purple-700"
      case "urgent":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "gross-misconduct":
        return "bg-red-100 text-red-700"
      case "major":
        return "bg-orange-100 text-orange-700"
      case "minor":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700"
      case "high":
        return "bg-orange-100 text-orange-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleScheduleHearing = (caseItem: DisciplinaryCase) => {
    setSelectedCase(caseItem)
    setShowHearingDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary & Grievance Management</h1>
          <p className="text-gray-600">Ghana Labour Act 2003 compliant case management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4 mr-2" />
            Labour Act Guide
          </Button>
          <Button size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold">
                  {disciplinaryCases.filter((c) => !["closed", "action-taken"].includes(c.status)).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Grievances</p>
                <p className="text-2xl font-bold text-orange-600">
                  {grievances.filter((g) => g.status !== "resolved").length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {warnings.filter((w) => w.status === "active").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hearings This Week</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Gavel className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="disciplinary">Disciplinary Cases</TabsTrigger>
          <TabsTrigger value="grievances">Grievances</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="hearings">Hearings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Disciplinary Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disciplinaryCases.slice(0, 5).map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{case_.caseNumber}</p>
                          <p className="text-sm text-gray-600">
                            {case_.employeeName} • {case_.incidentType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(case_.status)}>{case_.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{case_.reportedDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Grievances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grievances.slice(0, 5).map((grievance) => (
                    <div key={grievance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{grievance.grievanceNumber}</p>
                          <p className="text-sm text-gray-600">
                            {grievance.employeeName} • {grievance.grievanceType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{grievance.submittedDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Case Resolution Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Resolution Time</span>
                  <span className="font-medium">18 days</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium">14 days</p>
                    <p className="text-gray-600">Disciplinary</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">21 days</p>
                    <p className="text-gray-600">Grievances</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">7 days</p>
                    <p className="text-gray-600">Warnings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disciplinary" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search cases..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="hearing-scheduled">Hearing Scheduled</SelectItem>
                  <SelectItem value="action-taken">Action Taken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Disciplinary Case</DialogTitle>
                  <DialogDescription>
                    Record a new disciplinary incident following Ghana Labour Act procedures
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">John Doe (EMP-001)</SelectItem>
                          <SelectItem value="emp2">Jane Smith (EMP-002)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Incident Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="misconduct">Misconduct</SelectItem>
                          <SelectItem value="performance">Performance Issues</SelectItem>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="policy-violation">Policy Violation</SelectItem>
                          <SelectItem value="harassment">Harassment</SelectItem>
                          <SelectItem value="insubordination">Insubordination</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="gross-misconduct">Gross Misconduct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Incident Date *</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea placeholder="Provide detailed description of the incident..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Witnesses</Label>
                    <Input placeholder="List any witnesses (comma separated)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Evidence</Label>
                    <Input placeholder="List evidence available (comma separated)" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCaseDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowCaseDialog(false)}>Create Case</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {disciplinaryCases.map((case_) => (
              <Card key={case_.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{case_.caseNumber}</h3>
                          <Badge className={getStatusColor(case_.status)}>{case_.status}</Badge>
                          <Badge className={getSeverityColor(case_.severity)}>{case_.severity}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {case_.employeeName} ({case_.employeeId})
                            </span>
                            <span className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
                              {case_.department}
                            </span>
                            <span className="capitalize">{case_.incidentType}</span>
                          </div>
                          <p className="text-gray-700 mt-2">{case_.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span>Reported: {case_.reportedDate}</span>
                            <span>Incident: {case_.incidentDate}</span>
                            <span>By: {case_.reportedBy}</span>
                          </div>
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
                          Update Case
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleScheduleHearing(case_)}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Hearing
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {case_.witnesses && case_.witnesses.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Witnesses:</p>
                      <p className="text-sm text-gray-600">{case_.witnesses.join(", ")}</p>
                    </div>
                  )}
                  {case_.evidence && case_.evidence.length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Evidence:</p>
                      <p className="text-sm text-gray-600">{case_.evidence.join(", ")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grievances" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search grievances..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showGrievanceDialog} onOpenChange={setShowGrievanceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Grievance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Employee Grievance</DialogTitle>
                  <DialogDescription>
                    Document employee grievance following Ghana Labour Act procedures
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">Sarah Johnson (EMP-023)</SelectItem>
                          <SelectItem value="emp2">Michael Brown (EMP-067)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grievance Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workplace-harassment">Workplace Harassment</SelectItem>
                          <SelectItem value="discrimination">Discrimination</SelectItem>
                          <SelectItem value="unfair-treatment">Unfair Treatment</SelectItem>
                          <SelectItem value="working-conditions">Working Conditions</SelectItem>
                          <SelectItem value="pay-dispute">Pay Dispute</SelectItem>
                          <SelectItem value="management-issues">Management Issues</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority *</Label>
                      <Select>
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
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investigator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr-manager">HR Manager</SelectItem>
                          <SelectItem value="senior-manager">Senior Manager</SelectItem>
                          <SelectItem value="external">External Mediator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea placeholder="Provide detailed description of the grievance..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Desired Outcome</Label>
                    <Textarea placeholder="What outcome is the employee seeking?" rows={3} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowGrievanceDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowGrievanceDialog(false)}>Record Grievance</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {grievances.map((grievance) => (
              <Card key={grievance.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{grievance.grievanceNumber}</h3>
                          <Badge className={getStatusColor(grievance.status)}>{grievance.status}</Badge>
                          <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {grievance.employeeName} ({grievance.employeeId})
                            </span>
                            <span className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
                              {grievance.department}
                            </span>
                            <span className="capitalize">{grievance.grievanceType.replace("-", " ")}</span>
                          </div>
                          <p className="text-gray-700 mt-2">{grievance.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span>Submitted: {grievance.submittedDate}</span>
                            {grievance.assignedTo && <span>Assigned to: {grievance.assignedTo}</span>}
                          </div>
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
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Schedule Mediation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {grievance.desiredOutcome && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Desired Outcome:</p>
                      <p className="text-sm text-gray-600">{grievance.desiredOutcome}</p>
                    </div>
                  )}
                  {grievance.resolution && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Resolution:</p>
                      <p className="text-sm text-gray-600">{grievance.resolution}</p>
                      <p className="text-xs text-gray-500 mt-1">Resolved: {grievance.resolutionDate}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search warnings..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="appealed">Appealed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Issue Warning
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Issue Employee Warning</DialogTitle>
                  <DialogDescription>Issue formal warning following progressive discipline policy</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">Robert Taylor (EMP-089)</SelectItem>
                          <SelectItem value="emp2">Lisa Anderson (EMP-034)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Warning Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verbal">Verbal Warning</SelectItem>
                          <SelectItem value="written">Written Warning</SelectItem>
                          <SelectItem value="final-written">Final Written Warning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Issue Date *</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date *</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason *</Label>
                    <Textarea placeholder="Describe the reason for this warning..." rows={4} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowWarningDialog(false)}>Issue Warning</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {warnings.map((warning) => (
              <Card key={warning.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{warning.employeeName}</h3>
                          <Badge
                            className={
                              warning.warningType === "final-written"
                                ? "bg-red-100 text-red-700"
                                : warning.warningType === "written"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {warning.warningType.replace("-", " ")}
                          </Badge>
                          <Badge className={getStatusColor(warning.status)}>{warning.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span>Employee ID: {warning.employeeId}</span>
                            <span>Issued: {warning.issueDate}</span>
                            <span>Expires: {warning.expiryDate}</span>
                          </div>
                          <p className="text-gray-700 mt-2">{warning.reason}</p>
                          <p className="text-sm">Issued by: {warning.issuedBy}</p>
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
                          <FileText className="w-4 h-4 mr-2" />
                          Print Warning Letter
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Scale className="w-4 h-4 mr-2" />
                          Process Appeal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hearings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Hearings</CardTitle>
              <CardDescription>Disciplinary and grievance hearings calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Gavel className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Disciplinary Hearing - DC-2024-001</h3>
                      <p className="text-sm text-gray-600">John Doe • Misconduct Case</p>
                      <p className="text-sm text-gray-500">March 25, 2024 at 2:00 PM • Conference Room A</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Grievance Mediation - GR-2024-001</h3>
                      <p className="text-sm text-gray-600">Sarah Johnson • Unfair Treatment</p>
                      <p className="text-sm text-gray-500">March 27, 2024 at 10:00 AM • HR Office</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Add Participants
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ghana Labour Act 2003 - Disciplinary Procedures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ghanaLabourActGuidelines.disciplinaryProcedure.map((guideline, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{guideline}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="w-5 h-5 mr-2" />
                  Ghana Labour Act 2003 - Grievance Procedures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ghanaLabourActGuidelines.grievanceProcedure.map((guideline, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{guideline}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Checklist</CardTitle>
              <CardDescription>Ensure all procedures follow Ghana Labour Act requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox checked className="data-[state=checked]:bg-emerald-600" />
                  <span className="text-sm">All disciplinary cases have proper documentation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked className="data-[state=checked]:bg-emerald-600" />
                  <span className="text-sm">Employees informed of right to representation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked className="data-[state=checked]:bg-emerald-600" />
                  <span className="text-sm">Progressive discipline policy followed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox className="data-[state=checked]:bg-emerald-600" />
                  <span className="text-sm">Appeal procedures communicated to all employees</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox className="data-[state=checked]:bg-emerald-600" />
                  <span className="text-sm">Grievance acknowledgment within 5 working days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hearing Scheduling Dialog */}
      <Dialog open={showHearingDialog} onOpenChange={setShowHearingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Disciplinary Hearing</DialogTitle>
            <DialogDescription>Schedule hearing for case: {selectedCase?.caseNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hearing Date *</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Hearing Time *</Label>
                <Input type="time" />
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference-a">Conference Room A</SelectItem>
                    <SelectItem value="conference-b">Conference Room B</SelectItem>
                    <SelectItem value="hr-office">HR Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chairperson *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chairperson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr-manager">HR Manager</SelectItem>
                    <SelectItem value="senior-manager">Senior Manager</SelectItem>
                    <SelectItem value="external">External Chairperson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Panel Members</Label>
              <Input placeholder="Enter panel member names (comma separated)" />
            </div>
            <div className="space-y-2">
              <Label>Agenda Items</Label>
              <Textarea placeholder="List the key items to be discussed during the hearing..." rows={3} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="notify-employee" />
                <Label htmlFor="notify-employee">Send notification to employee (minimum 48 hours notice)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="notify-representative" />
                <Label htmlFor="notify-representative">Inform employee of right to representation</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowHearingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowHearingDialog(false)}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Hearing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
