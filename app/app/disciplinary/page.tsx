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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Download,
  Upload,
  Calendar,
  User,
  Scale,
  MessageSquare,
  Gavel,
  Archive,
} from "lucide-react"

// Mock data for disciplinary cases
const mockDisciplinaryCases = [
  {
    id: "DISC001",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    caseType: "disciplinary",
    category: "attendance",
    severity: "minor",
    title: "Repeated Late Arrivals",
    description: "Employee has been consistently arriving late to work without prior notice",
    status: "in-progress",
    dateReported: new Date("2024-02-01"),
    reportedBy: "Jane Smith",
    assignedTo: "HR Manager",
    dueDate: new Date("2024-02-15"),
    actions: [
      {
        id: 1,
        type: "verbal-warning",
        date: new Date("2024-02-02"),
        description: "Verbal warning issued regarding punctuality",
        issuedBy: "Jane Smith",
        status: "completed",
      },
    ],
    documents: ["Warning Letter", "Attendance Records"],
    notes: "Employee acknowledged the issue and committed to improvement",
  },
  {
    id: "GRIEV001",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    caseType: "grievance",
    category: "workplace-harassment",
    severity: "major",
    title: "Workplace Harassment Complaint",
    description: "Employee filed complaint regarding inappropriate behavior from supervisor",
    status: "under-investigation",
    dateReported: new Date("2024-01-28"),
    reportedBy: "Ama Osei",
    assignedTo: "HR Director",
    dueDate: new Date("2024-02-28"),
    actions: [
      {
        id: 1,
        type: "investigation-started",
        date: new Date("2024-01-29"),
        description: "Formal investigation initiated",
        issuedBy: "HR Director",
        status: "in-progress",
      },
    ],
    documents: ["Complaint Form", "Witness Statements"],
    notes: "Investigation ongoing, witness interviews scheduled",
  },
  {
    id: "DISC002",
    employeeId: "EMP005",
    employeeName: "Yaw Adjei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    caseType: "disciplinary",
    category: "misconduct",
    severity: "major",
    title: "Policy Violation - Unauthorized Access",
    description: "Employee accessed confidential files without authorization",
    status: "pending-appeal",
    dateReported: new Date("2024-01-15"),
    reportedBy: "IT Security",
    assignedTo: "HR Manager",
    dueDate: new Date("2024-02-01"),
    actions: [
      {
        id: 1,
        type: "suspension",
        date: new Date("2024-01-16"),
        description: "3-day suspension pending investigation",
        issuedBy: "HR Manager",
        status: "completed",
      },
      {
        id: 2,
        type: "written-warning",
        date: new Date("2024-01-20"),
        description: "Final written warning issued",
        issuedBy: "HR Manager",
        status: "appealed",
      },
    ],
    documents: ["IT Security Report", "Suspension Letter", "Appeal Form"],
    notes: "Employee has filed an appeal against the final written warning",
  },
]

const caseTypeLabels = {
  disciplinary: "Disciplinary Action",
  grievance: "Grievance",
  investigation: "Investigation",
}

const categoryLabels = {
  attendance: "Attendance Issues",
  misconduct: "Misconduct",
  "performance-issues": "Performance Issues",
  "workplace-harassment": "Workplace Harassment",
  "policy-violation": "Policy Violation",
  discrimination: "Discrimination",
  "safety-violation": "Safety Violation",
  other: "Other",
}

const severityLabels = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
  critical: "Critical",
}

const statusLabels = {
  draft: "Draft",
  "in-progress": "In Progress",
  "under-investigation": "Under Investigation",
  "pending-appeal": "Pending Appeal",
  resolved: "Resolved",
  closed: "Closed",
  escalated: "Escalated",
}

const actionTypeLabels = {
  "verbal-warning": "Verbal Warning",
  "written-warning": "Written Warning",
  "final-warning": "Final Warning",
  suspension: "Suspension",
  termination: "Termination",
  "investigation-started": "Investigation Started",
  mediation: "Mediation",
  "training-required": "Training Required",
  "policy-review": "Policy Review",
}

export default function DisciplinaryGrievancePage() {
  const [cases, setCases] = useState(mockDisciplinaryCases)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCaseType, setSelectedCaseType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCaseType = selectedCaseType === "all" || caseItem.caseType === selectedCaseType
    const matchesStatus = selectedStatus === "all" || caseItem.status === selectedStatus
    const matchesSeverity = selectedSeverity === "all" || caseItem.severity === selectedSeverity
    const matchesTab = activeTab === "all" || caseItem.caseType === activeTab

    return matchesSearch && matchesCaseType && matchesStatus && matchesSeverity && matchesTab
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "in-progress":
      case "under-investigation":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "pending-appeal":
      case "escalated":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "bg-gray-100 text-gray-800",
      "in-progress": "bg-blue-100 text-blue-800",
      "under-investigation": "bg-yellow-100 text-yellow-800",
      "pending-appeal": "bg-orange-100 text-orange-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      escalated: "bg-red-100 text-red-800",
    }
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      minor: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      major: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }
    return variants[severity as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  const handleViewCase = (caseItem: any) => {
    setSelectedCase(caseItem)
    setIsViewDialogOpen(true)
  }

  const handleCreateCase = (caseData: any) => {
    const newCase = {
      ...caseData,
      id: `${caseData.caseType.toUpperCase()}${String(cases.length + 1).padStart(3, "0")}`,
      dateReported: new Date(),
      status: "draft",
      actions: [],
      documents: [],
      notes: "",
    }
    setCases([...cases, newCase])
    setIsCreateDialogOpen(false)
    toast({
      title: "Case Created",
      description: `${caseTypeLabels[caseData.caseType as keyof typeof caseTypeLabels]} case has been created successfully.`,
    })
  }

  const handleStatusUpdate = (caseId: string, newStatus: string) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c)))
    toast({
      title: "Status Updated",
      description: `Case status changed to ${statusLabels[newStatus as keyof typeof statusLabels]}.`,
    })
  }

  const getCaseStats = () => {
    const total = cases.length
    const disciplinary = cases.filter((c) => c.caseType === "disciplinary").length
    const grievances = cases.filter((c) => c.caseType === "grievance").length
    const inProgress = cases.filter((c) => c.status === "in-progress" || c.status === "under-investigation").length
    const resolved = cases.filter((c) => c.status === "resolved" || c.status === "closed").length
    const pending = cases.filter((c) => c.status === "pending-appeal").length
    const critical = cases.filter((c) => c.severity === "critical").length

    return { total, disciplinary, grievances, inProgress, resolved, pending, critical }
  }

  const stats = getCaseStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary & Grievance Management</h1>
          <p className="text-gray-600">Manage employee disciplinary actions and grievance procedures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Case</DialogTitle>
              </DialogHeader>
              <CreateCaseForm onSubmit={handleCreateCase} onClose={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Case Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
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
                <div className="text-2xl font-bold text-red-600">{stats.disciplinary}</div>
                <p className="text-sm text-gray-600">Disciplinary</p>
              </div>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.grievances}</div>
                <p className="text-sm text-gray-600">Grievances</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
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
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <p className="text-sm text-gray-600">Pending Appeal</p>
              </div>
              <Gavel className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name, case title, or case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCaseType} onValueChange={setSelectedCaseType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Case type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="disciplinary">Disciplinary</SelectItem>
                <SelectItem value="grievance">Grievance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {Object.entries(severityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Case Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Cases ({stats.total})</TabsTrigger>
          <TabsTrigger value="disciplinary">Disciplinary ({stats.disciplinary})</TabsTrigger>
          <TabsTrigger value="grievance">Grievances ({stats.grievances})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all"
                  ? "All Cases"
                  : activeTab === "disciplinary"
                    ? "Disciplinary Cases"
                    : "Grievance Cases"}
                ({filteredCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCases.length > 0 ? (
                  filteredCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                          {caseItem.caseType === "disciplinary" ? (
                            <Shield className="w-6 h-6 text-red-600" />
                          ) : (
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{caseItem.title}</h3>
                            <Badge className={getStatusBadge(caseItem.status)}>
                              {statusLabels[caseItem.status as keyof typeof statusLabels]}
                            </Badge>
                            <Badge className={getSeverityBadge(caseItem.severity)}>
                              {severityLabels[caseItem.severity as keyof typeof severityLabels]}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Avatar className="w-5 h-5 mr-2">
                                <AvatarImage src={caseItem.employeeAvatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {caseItem.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {caseItem.employeeName} ({caseItem.employeeId})
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FileText className="w-4 h-4 mr-1" />
                              {categoryLabels[caseItem.category as keyof typeof categoryLabels]}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {caseItem.dateReported.toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="w-4 h-4 mr-1" />
                              {caseItem.assignedTo}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{caseItem.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(caseItem.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCase(caseItem)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Case
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Add Action
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Document
                            </DropdownMenuItem>
                            {caseItem.status === "in-progress" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(caseItem.id, "resolved")}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Mark Resolved
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive Case
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Scale className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or create a new case.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
          </DialogHeader>
          {selectedCase && <CaseDetailsView case={selectedCase} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateCaseForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    caseType: "",
    employeeId: "",
    employeeName: "",
    category: "",
    severity: "minor",
    title: "",
    description: "",
    reportedBy: "HR Manager",
    assignedTo: "HR Manager",
    dueDate: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Case Type *</Label>
          <Select
            value={formData.caseType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, caseType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select case type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
              <SelectItem value="grievance">Grievance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Employee *</Label>
          <Select
            value={formData.employeeId}
            onValueChange={(value) => {
              const employee = mockEmployees.find((emp) => emp.id === value)
              setFormData((prev) => ({
                ...prev,
                employeeId: value,
                employeeName: employee?.name || "",
              }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {mockEmployees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
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
              {Object.entries(severityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Case Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Brief description of the case"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the incident or complaint"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reported By</Label>
          <Input
            value={formData.reportedBy}
            onChange={(e) => setFormData((prev) => ({ ...prev, reportedBy: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Assigned To</Label>
          <Select
            value={formData.assignedTo}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedTo: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HR Manager">HR Manager</SelectItem>
              <SelectItem value="HR Director">HR Director</SelectItem>
              <SelectItem value="Department Head">Department Head</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Create Case
        </Button>
      </div>
    </form>
  )
}

function CaseDetailsView({ case: caseItem }: { case: any }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Case ID:</span>
                <span className="font-medium">{caseItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{caseTypeLabels[caseItem.caseType as keyof typeof caseTypeLabels]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span>{categoryLabels[caseItem.category as keyof typeof categoryLabels]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <Badge className={getSeverityBadge(caseItem.severity)}>
                  {severityLabels[caseItem.severity as keyof typeof severityLabels]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusBadge(caseItem.status)}>
                  {statusLabels[caseItem.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={caseItem.employeeAvatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {caseItem.employeeName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{caseItem.employeeName}</p>
                  <p className="text-sm text-gray-600">{caseItem.employeeId}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reported By:</span>
                <span>{caseItem.reportedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assigned To:</span>
                <span>{caseItem.assignedTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Reported:</span>
                <span>{caseItem.dateReported.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Case Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{caseItem.description}</p>
            {caseItem.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-gray-600">{caseItem.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Disciplinary Actions</h3>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </div>

        <div className="space-y-4">
          {caseItem.actions.map((action: any) => (
            <Card key={action.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <Gavel className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{actionTypeLabels[action.type as keyof typeof actionTypeLabels]}</h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {action.date.toLocaleDateString()} • Issued by {action.issuedBy}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      action.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : action.status === "appealed"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                    }
                  >
                    {action.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Case Documents</h3>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <div className="space-y-3">
          {caseItem.documents.map((doc: string, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{doc}</span>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4">
        <h3 className="text-lg font-semibold">Case Timeline</h3>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">Case Created</h4>
              <p className="text-sm text-gray-600">Case was reported and created in the system</p>
              <p className="text-xs text-gray-500">{caseItem.dateReported.toLocaleDateString()}</p>
            </div>
          </div>

          {caseItem.actions.map((action: any) => (
            <div key={action.id} className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                <Gavel className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">{actionTypeLabels[action.type as keyof typeof actionTypeLabels]}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
                <p className="text-xs text-gray-500">
                  {action.date.toLocaleDateString()} • {action.issuedBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Mock employees data for the form
const mockEmployees = [
  { id: "EMP001", name: "Kwame Asante" },
  { id: "EMP002", name: "Ama Osei" },
  { id: "EMP003", name: "Kofi Mensah" },
  { id: "EMP004", name: "Akosua Boateng" },
  { id: "EMP005", name: "Yaw Adjei" },
]

// Helper functions for badge styling
function getSeverityBadge(severity: string) {
  const variants = {
    minor: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    major: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }
  return variants[severity as keyof typeof variants] || "bg-gray-100 text-gray-800"
}

function getStatusBadge(status: string) {
  const variants = {
    draft: "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    "under-investigation": "bg-yellow-100 text-yellow-800",
    "pending-appeal": "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    escalated: "bg-red-100 text-red-800",
  }
  return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
}
