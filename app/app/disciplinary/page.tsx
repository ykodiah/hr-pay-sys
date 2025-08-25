"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  User,
  Scale,
  MessageSquare,
  Download,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Gavel,
  BookOpen,
} from "lucide-react"

// Mock data for demonstration
const mockCases = [
  {
    id: "DISC-001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    type: "disciplinary",
    category: "attendance",
    severity: "minor",
    status: "investigation",
    title: "Repeated Late Arrivals",
    description: "Employee has been consistently arriving late to work over the past two weeks",
    reportedBy: "John Manager",
    reportedDate: new Date("2024-02-15"),
    dueDate: new Date("2024-02-29"),
    actions: [
      {
        id: 1,
        type: "verbal_warning",
        date: new Date("2024-02-16"),
        description: "Verbal warning issued regarding punctuality",
        actionBy: "John Manager",
        status: "completed",
      },
    ],
    documents: ["warning_letter.pdf", "attendance_record.xlsx"],
    notes: "Employee acknowledged the issue and committed to improvement",
  },
  {
    id: "GRIEV-001",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    type: "grievance",
    category: "workplace_harassment",
    severity: "major",
    status: "hearing_scheduled",
    title: "Workplace Harassment Complaint",
    description: "Employee filed complaint regarding inappropriate behavior from supervisor",
    reportedBy: "Ama Osei",
    reportedDate: new Date("2024-02-10"),
    dueDate: new Date("2024-02-25"),
    hearingDate: new Date("2024-02-22"),
    actions: [
      {
        id: 1,
        type: "investigation",
        date: new Date("2024-02-11"),
        description: "Formal investigation initiated",
        actionBy: "HR Department",
        status: "in_progress",
      },
    ],
    documents: ["complaint_form.pdf", "witness_statements.pdf"],
    notes: "Urgent case requiring immediate attention",
  },
  {
    id: "DISC-002",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    type: "disciplinary",
    category: "misconduct",
    severity: "major",
    status: "resolved",
    title: "Violation of Company Policy",
    description: "Unauthorized use of company resources for personal business",
    reportedBy: "IT Department",
    reportedDate: new Date("2024-01-20"),
    dueDate: new Date("2024-02-05"),
    actions: [
      {
        id: 1,
        type: "written_warning",
        date: new Date("2024-01-25"),
        description: "Written warning issued for policy violation",
        actionBy: "HR Manager",
        status: "completed",
      },
      {
        id: 2,
        type: "training",
        date: new Date("2024-02-01"),
        description: "Mandatory policy training completed",
        actionBy: "Training Department",
        status: "completed",
      },
    ],
    documents: ["policy_violation_report.pdf", "training_certificate.pdf"],
    notes: "Case resolved. Employee completed required training.",
  },
]

const categoryLabels = {
  attendance: "Attendance Issues",
  misconduct: "Misconduct",
  performance: "Performance Issues",
  workplace_harassment: "Workplace Harassment",
  discrimination: "Discrimination",
  policy_violation: "Policy Violation",
  safety_violation: "Safety Violation",
  other: "Other",
}

const severityColors = {
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

const statusColors = {
  reported: "bg-blue-100 text-blue-800",
  investigation: "bg-purple-100 text-purple-800",
  hearing_scheduled: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
}

export default function DisciplinaryGrievancePage() {
  const [cases, setCases] = useState(mockCases)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const [newCase, setNewCase] = useState({
    employeeId: "",
    type: "disciplinary",
    category: "",
    severity: "minor",
    title: "",
    description: "",
    reportedBy: "",
  })

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || caseItem.type === selectedType
    const matchesStatus = selectedStatus === "all" || caseItem.status === selectedStatus
    const matchesTab = activeTab === "all" || caseItem.type === activeTab

    return matchesSearch && matchesType && matchesStatus && matchesTab
  })

  const getCaseStats = () => {
    const total = cases.length
    const disciplinary = cases.filter((c) => c.type === "disciplinary").length
    const grievance = cases.filter((c) => c.type === "grievance").length
    const pending = cases.filter((c) => !["resolved", "closed"].includes(c.status)).length
    return { total, disciplinary, grievance, pending }
  }

  const stats = getCaseStats()

  const handleCreateCase = () => {
    const caseId = `${newCase.type.toUpperCase().slice(0, 4)}-${String(cases.length + 1).padStart(3, "0")}`
    const newCaseData = {
      ...newCase,
      id: caseId,
      employeeName: "Selected Employee", // In real app, would fetch from employee ID
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      status: "reported",
      reportedDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      actions: [],
      documents: [],
      notes: "",
    }

    setCases([newCaseData, ...cases])
    setNewCase({
      employeeId: "",
      type: "disciplinary",
      category: "",
      severity: "minor",
      title: "",
      description: "",
      reportedBy: "",
    })
    setIsNewCaseOpen(false)
    toast({
      title: "Case Created",
      description: `${newCase.type === "disciplinary" ? "Disciplinary" : "Grievance"} case ${caseId} has been created.`,
    })
  }

  const handleStatusUpdate = (caseId: string, newStatus: string) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c)))
    toast({
      title: "Status Updated",
      description: `Case status changed to ${newStatus.replace("_", " ")}.`,
    })
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "major":
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case "minor":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary & Grievance Management</h1>
          <p className="text-gray-600">
            Manage disciplinary actions and grievance procedures in compliance with Ghana Labour Act
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Labour Act Guide
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Case</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select
                      value={newCase.employeeId}
                      onValueChange={(value) => setNewCase({ ...newCase, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante (EMP001)</SelectItem>
                        <SelectItem value="EMP002">Ama Osei (EMP002)</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah (EMP003)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Case Type</Label>
                    <Select value={newCase.type} onValueChange={(value) => setNewCase({ ...newCase, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
                        <SelectItem value="grievance">Grievance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newCase.category}
                      onValueChange={(value) => setNewCase({ ...newCase, category: value })}
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
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={newCase.severity}
                      onValueChange={(value) => setNewCase({ ...newCase, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Case Title</Label>
                  <Input
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="Brief description of the case"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    placeholder="Provide detailed information about the incident or grievance"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="reportedBy">Reported By</Label>
                  <Input
                    value={newCase.reportedBy}
                    onChange={(e) => setNewCase({ ...newCase, reportedBy: e.target.value })}
                    placeholder="Name of person reporting the case"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Gavel className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.grievance}</div>
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
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
            <Select value={selectedType} onValueChange={setSelectedType}>
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
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="investigation">Investigation</SelectItem>
                <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Cases ({stats.total})</TabsTrigger>
          <TabsTrigger value="disciplinary">Disciplinary ({stats.disciplinary})</TabsTrigger>
          <TabsTrigger value="grievance">Grievances ({stats.grievance})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all"
                  ? "All Cases"
                  : activeTab === "disciplinary"
                    ? "Disciplinary Cases"
                    : "Grievance Cases"}{" "}
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
                          {caseItem.type === "disciplinary" ? (
                            <Gavel className="w-6 h-6 text-red-600" />
                          ) : (
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{caseItem.title}</h3>
                            <Badge className={statusColors[caseItem.status as keyof typeof statusColors]}>
                              {caseItem.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <Badge className={severityColors[caseItem.severity as keyof typeof severityColors]}>
                              {caseItem.severity.toUpperCase()}
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
                              {caseItem.reportedDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="w-4 h-4 mr-1" />
                              {caseItem.reportedBy}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{caseItem.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(caseItem.severity)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCase(caseItem)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Case
                            </DropdownMenuItem>
                            {caseItem.status === "investigation" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(caseItem.id, "hearing_scheduled")}>
                                <Gavel className="w-4 h-4 mr-2" />
                                Schedule Hearing
                              </DropdownMenuItem>
                            )}
                            {!["resolved", "closed"].includes(caseItem.status) && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(caseItem.id, "resolved")}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Mark Resolved
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export Case
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
                      <span className="text-gray-600">Type:</span>
                      <span className="capitalize">{selectedCase.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{categoryLabels[selectedCase.category as keyof typeof categoryLabels]}</span>
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
                      <p className="text-sm text-gray-600">{selectedCase.employeeId}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedCase.description}</p>
              </div>

              {selectedCase.actions && selectedCase.actions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Actions Taken</h4>
                  <div className="space-y-3">
                    {selectedCase.actions.map((action: any) => (
                      <div key={action.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{action.type.replace("_", " ").toUpperCase()}</Badge>
                            <span className="text-sm text-gray-600">{action.date.toLocaleDateString()}</span>
                          </div>
                          <Badge
                            className={
                              action.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {action.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{action.description}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {action.actionBy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.documents && selectedCase.documents.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.documents.map((doc: string, index: number) => (
                      <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                        <FileText className="w-3 h-3 mr-1" />
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedCase.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedCase(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Case
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
