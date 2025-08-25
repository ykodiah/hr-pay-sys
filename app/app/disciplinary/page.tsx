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
  FileText,
  Calendar,
  Clock,
  User,
  Shield,
  Scale,
  MessageSquare,
  CheckCircle,
  Eye,
  Edit,
  Download,
  TrendingUp,
} from "lucide-react"

// Mock data for demonstration
const mockIncidents = [
  {
    id: "INC001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    incidentType: "misconduct",
    severity: "medium",
    title: "Unauthorized Absence",
    description: "Employee was absent for 3 consecutive days without prior notice or approval",
    reportedBy: "John Manager",
    reportedDate: new Date("2024-02-15"),
    status: "under-investigation",
    actions: [{ type: "verbal-warning", date: new Date("2024-02-16"), notes: "Initial discussion held" }],
    witnesses: ["Jane Doe", "Peter Smith"],
    documents: ["absence_record.pdf", "email_correspondence.pdf"],
  },
  {
    id: "INC002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    incidentType: "grievance",
    severity: "high",
    title: "Workplace Harassment Complaint",
    description: "Employee filed complaint regarding inappropriate behavior from supervisor",
    reportedBy: "Ama Osei",
    reportedDate: new Date("2024-02-10"),
    status: "resolved",
    actions: [
      { type: "investigation", date: new Date("2024-02-11"), notes: "Formal investigation initiated" },
      { type: "hearing", date: new Date("2024-02-18"), notes: "Disciplinary hearing conducted" },
      { type: "written-warning", date: new Date("2024-02-20"), notes: "Written warning issued to supervisor" },
    ],
    witnesses: ["Mary Johnson", "David Wilson"],
    documents: ["complaint_form.pdf", "investigation_report.pdf", "hearing_minutes.pdf"],
  },
  {
    id: "INC003",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    incidentType: "performance",
    severity: "low",
    title: "Consistent Late Arrivals",
    description: "Employee has been consistently arriving late to work over the past month",
    reportedBy: "Sarah Supervisor",
    reportedDate: new Date("2024-02-20"),
    status: "in-progress",
    actions: [{ type: "counseling", date: new Date("2024-02-21"), notes: "Performance counseling session conducted" }],
    witnesses: [],
    documents: ["attendance_record.pdf"],
  },
]

const incidentTypes = {
  misconduct: { label: "Misconduct", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  grievance: { label: "Grievance", color: "bg-blue-100 text-blue-800", icon: MessageSquare },
  performance: { label: "Performance", color: "bg-yellow-100 text-yellow-800", icon: TrendingUp },
  policy: { label: "Policy Violation", color: "bg-purple-100 text-purple-800", icon: Shield },
}

const severityLevels = {
  low: { label: "Low", color: "bg-green-100 text-green-800" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "High", color: "bg-red-100 text-red-800" },
  critical: { label: "Critical", color: "bg-red-200 text-red-900" },
}

const statusTypes = {
  reported: { label: "Reported", color: "bg-gray-100 text-gray-800" },
  "under-investigation": { label: "Under Investigation", color: "bg-blue-100 text-blue-800" },
  "in-progress": { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800" },
}

const actionTypes = {
  "verbal-warning": "Verbal Warning",
  "written-warning": "Written Warning",
  "final-warning": "Final Warning",
  suspension: "Suspension",
  termination: "Termination",
  counseling: "Counseling",
  investigation: "Investigation",
  hearing: "Disciplinary Hearing",
  mediation: "Mediation",
  training: "Additional Training",
}

export default function DisciplinaryPage() {
  const [incidents, setIncidents] = useState(mockIncidents)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIncidentType, setSelectedIncidentType] = useState("all")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("incidents")

  const [newIncident, setNewIncident] = useState({
    employeeId: "",
    incidentType: "",
    severity: "",
    title: "",
    description: "",
    witnesses: "",
    documents: [] as File[],
  })

  const [newAction, setNewAction] = useState({
    type: "",
    notes: "",
    scheduledDate: "",
  })

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedIncidentType === "all" || incident.incidentType === selectedIncidentType
    const matchesSeverity = selectedSeverity === "all" || incident.severity === selectedSeverity
    const matchesStatus = selectedStatus === "all" || incident.status === selectedStatus

    return matchesSearch && matchesType && matchesSeverity && matchesStatus
  })

  const getIncidentStats = () => {
    const total = incidents.length
    const open = incidents.filter((inc) => !["resolved", "closed"].includes(inc.status)).length
    const resolved = incidents.filter((inc) => inc.status === "resolved").length
    const highSeverity = incidents.filter((inc) => ["high", "critical"].includes(inc.severity)).length
    return { total, open, resolved, highSeverity }
  }

  const stats = getIncidentStats()

  const handleCreateIncident = () => {
    if (!newIncident.employeeId || !newIncident.incidentType || !newIncident.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const incident = {
      id: `INC${String(incidents.length + 1).padStart(3, "0")}`,
      employeeId: newIncident.employeeId,
      employeeName: "Employee Name", // Would fetch from employee data
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      incidentType: newIncident.incidentType,
      severity: newIncident.severity,
      title: newIncident.title,
      description: newIncident.description,
      reportedBy: "Current User", // Would get from auth context
      reportedDate: new Date(),
      status: "reported",
      actions: [],
      witnesses: newIncident.witnesses
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean),
      documents: newIncident.documents.map((f) => f.name),
    }

    setIncidents([...incidents, incident])
    setNewIncident({
      employeeId: "",
      incidentType: "",
      severity: "",
      title: "",
      description: "",
      witnesses: "",
      documents: [],
    })
    setIsNewIncidentOpen(false)

    toast({
      title: "Incident Created",
      description: `Incident ${incident.id} has been created successfully.`,
    })
  }

  const handleAddAction = () => {
    if (!selectedIncident || !newAction.type) {
      toast({
        title: "Error",
        description: "Please select an action type.",
        variant: "destructive",
      })
      return
    }

    const action = {
      type: newAction.type,
      date: newAction.scheduledDate ? new Date(newAction.scheduledDate) : new Date(),
      notes: newAction.notes,
    }

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident.id ? { ...inc, actions: [...inc.actions, action], status: "in-progress" } : inc,
      ),
    )

    setNewAction({ type: "", notes: "", scheduledDate: "" })
    setIsActionDialogOpen(false)

    toast({
      title: "Action Added",
      description: `${actionTypes[newAction.type as keyof typeof actionTypes]} has been recorded.`,
    })
  }

  const handleStatusUpdate = (incidentId: string, newStatus: string) => {
    setIncidents((prev) => prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc)))

    toast({
      title: "Status Updated",
      description: `Incident status changed to ${statusTypes[newStatus as keyof typeof statusTypes].label}.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary & Grievance Management</h1>
          <p className="text-gray-600">Manage workplace incidents and ensure Ghana Labour Act compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Report New Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee *</Label>
                    <Select
                      value={newIncident.employeeId}
                      onValueChange={(value) => setNewIncident({ ...newIncident, employeeId: value })}
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
                    <Label htmlFor="type">Incident Type *</Label>
                    <Select
                      value={newIncident.incidentType}
                      onValueChange={(value) => setNewIncident({ ...newIncident, incidentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(incidentTypes).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="severity">Severity Level *</Label>
                    <Select
                      value={newIncident.severity}
                      onValueChange={(value) => setNewIncident({ ...newIncident, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(severityLevels).map(([key, level]) => (
                          <SelectItem key={key} value={key}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Incident Title *</Label>
                    <Input
                      id="title"
                      value={newIncident.title}
                      onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                      placeholder="Brief description of incident"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    placeholder="Provide detailed description of the incident..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="witnesses">Witnesses (comma-separated)</Label>
                  <Input
                    id="witnesses"
                    value={newIncident.witnesses}
                    onChange={(e) => setNewIncident({ ...newIncident, witnesses: e.target.value })}
                    placeholder="John Doe, Jane Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="documents">Supporting Documents</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    onChange={(e) => setNewIncident({ ...newIncident, documents: Array.from(e.target.files || []) })}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewIncidentOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateIncident}>Create Incident</Button>
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
                <p className="text-sm text-gray-600">Total Incidents</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
                <p className="text-sm text-gray-600">Open Cases</p>
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
                <div className="text-2xl font-bold text-red-600">{stats.highSeverity}</div>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
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
                placeholder="Search by employee name, incident title, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedIncidentType} onValueChange={setSelectedIncidentType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(incidentTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.entries(severityLevels).map(([key, level]) => (
                  <SelectItem key={key} value={key}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusTypes).map(([key, status]) => (
                  <SelectItem key={key} value={key}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incidents">All Incidents ({filteredIncidents.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="compliance">Ghana Labour Act Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => {
                    const IncidentIcon = incidentTypes[incident.incidentType as keyof typeof incidentTypes].icon
                    return (
                      <div
                        key={incident.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                            <IncidentIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                              <Badge
                                className={incidentTypes[incident.incidentType as keyof typeof incidentTypes].color}
                              >
                                {incidentTypes[incident.incidentType as keyof typeof incidentTypes].label}
                              </Badge>
                              <Badge className={severityLevels[incident.severity as keyof typeof severityLevels].color}>
                                {severityLevels[incident.severity as keyof typeof severityLevels].label}
                              </Badge>
                              <Badge className={statusTypes[incident.status as keyof typeof statusTypes].color}>
                                {statusTypes[incident.status as keyof typeof statusTypes].label}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Avatar className="w-5 h-5 mr-2">
                                  <AvatarImage src={incident.employeeAvatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {incident.employeeName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {incident.employeeName} ({incident.employeeId})
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {incident.reportedDate.toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                Reported by {incident.reportedBy}
                              </div>
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-1" />
                                {incident.actions.length} action(s)
                              </div>
                            </div>
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
                              <DropdownMenuItem onClick={() => setSelectedIncident(incident)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedIncident(incident)
                                  setIsActionDialogOpen(true)
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Action
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Incident
                              </DropdownMenuItem>
                              {incident.status !== "resolved" && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(incident.id, "resolved")}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Export Case File
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Misconduct Cases</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Grievances</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Performance Issues</span>
                    <span className="font-semibold">25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Resolution Time</span>
                    <span className="font-semibold">12 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fastest Resolution</span>
                    <span className="font-semibold">2 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Longest Resolution</span>
                    <span className="font-semibold">45 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-5 h-5 mr-2" />
                Ghana Labour Act 2003 (Act 651) Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Disciplinary Procedures</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Progressive discipline system implemented
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Right to representation ensured
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Fair hearing procedures followed
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Documentation requirements met
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Grievance Handling</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Internal grievance procedure established
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Timely response mechanisms in place
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Appeal process available
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Confidentiality maintained
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Legal Requirements Checklist</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 59: Disciplinary procedures
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 60: Grounds for termination
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 61: Notice requirements
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 62: Severance pay calculations
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 63: Appeal procedures
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 64: Record keeping requirements
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Disciplinary Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="actionType">Action Type *</Label>
              <Select value={newAction.type} onValueChange={(value) => setNewAction({ ...newAction, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(actionTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={newAction.scheduledDate}
                onChange={(e) => setNewAction({ ...newAction, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="actionNotes">Notes</Label>
              <Textarea
                id="actionNotes"
                value={newAction.notes}
                onChange={(e) => setNewAction({ ...newAction, notes: e.target.value })}
                placeholder="Additional notes about this action..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAction}>Add Action</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
