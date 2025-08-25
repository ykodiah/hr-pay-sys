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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Laptop,
  MessageSquare,
  Download,
  Eye,
  Edit,
  UserMinus,
  Shield,
  DollarSign,
  BookOpen,
} from "lucide-react"

// Mock data for demonstration
const mockOffboardings = [
  {
    id: "OFF-001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    position: "Senior Software Engineer",
    manager: "John Manager",
    terminationType: "resignation",
    terminationReason: "Career advancement",
    lastWorkingDay: new Date("2024-03-15"),
    initiatedDate: new Date("2024-02-15"),
    status: "in_progress",
    progress: 65,
    exitInterviewCompleted: true,
    assetsReturned: false,
    accessRevoked: true,
    finalSettlementCalculated: false,
    knowledgeTransferCompleted: false,
    checklist: [
      { id: 1, task: "Exit Interview", completed: true, assignedTo: "HR Manager", dueDate: new Date("2024-02-20") },
      { id: 2, task: "Asset Return", completed: false, assignedTo: "IT Department", dueDate: new Date("2024-03-10") },
      { id: 3, task: "Access Revocation", completed: true, assignedTo: "IT Security", dueDate: new Date("2024-03-15") },
      { id: 4, task: "Final Settlement", completed: false, assignedTo: "Payroll", dueDate: new Date("2024-03-20") },
      { id: 5, task: "Knowledge Transfer", completed: false, assignedTo: "Team Lead", dueDate: new Date("2024-03-12") },
    ],
    assets: [
      { id: 1, name: "MacBook Pro", serialNumber: "MBP-2023-001", status: "pending_return" },
      { id: 2, name: "iPhone 14", serialNumber: "IP14-2023-001", status: "pending_return" },
      { id: 3, name: "Office Keys", serialNumber: "KEY-001", status: "pending_return" },
    ],
    finalSettlement: {
      basicSalary: 8500,
      outstandingLeave: 5,
      leaveEncashment: 1416.67,
      gratuity: 4250,
      deductions: 0,
      totalAmount: 14166.67,
    },
  },
  {
    id: "OFF-002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    position: "HR Manager",
    manager: "CEO",
    terminationType: "termination",
    terminationReason: "Performance issues",
    lastWorkingDay: new Date("2024-02-28"),
    initiatedDate: new Date("2024-02-01"),
    status: "completed",
    progress: 100,
    exitInterviewCompleted: true,
    assetsReturned: true,
    accessRevoked: true,
    finalSettlementCalculated: true,
    knowledgeTransferCompleted: true,
    checklist: [
      { id: 1, task: "Exit Interview", completed: true, assignedTo: "CEO", dueDate: new Date("2024-02-05") },
      { id: 2, task: "Asset Return", completed: true, assignedTo: "IT Department", dueDate: new Date("2024-02-25") },
      { id: 3, task: "Access Revocation", completed: true, assignedTo: "IT Security", dueDate: new Date("2024-02-28") },
      { id: 4, task: "Final Settlement", completed: true, assignedTo: "Payroll", dueDate: new Date("2024-03-05") },
      { id: 5, task: "Knowledge Transfer", completed: true, assignedTo: "HR Team", dueDate: new Date("2024-02-26") },
    ],
    assets: [
      { id: 1, name: "Dell Laptop", serialNumber: "DL-2022-002", status: "returned" },
      { id: 2, name: "Office Phone", serialNumber: "OP-2022-002", status: "returned" },
    ],
    finalSettlement: {
      basicSalary: 7200,
      outstandingLeave: 0,
      leaveEncashment: 0,
      gratuity: 0,
      deductions: 500,
      totalAmount: 6700,
    },
  },
]

const terminationTypeLabels = {
  resignation: "Resignation",
  termination: "Termination",
  retirement: "Retirement",
  contract_end: "Contract End",
  redundancy: "Redundancy",
}

const statusColors = {
  initiated: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function OffboardingPage() {
  const [offboardings, setOffboardings] = useState(mockOffboardings)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedOffboarding, setSelectedOffboarding] = useState<any>(null)
  const [isNewOffboardingOpen, setIsNewOffboardingOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const [newOffboarding, setNewOffboarding] = useState({
    employeeId: "",
    terminationType: "resignation",
    terminationReason: "",
    lastWorkingDay: "",
    manager: "",
  })

  const filteredOffboardings = offboardings.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
    const matchesTab = activeTab === "all" || item.status === activeTab

    return matchesSearch && matchesStatus && matchesTab
  })

  const getOffboardingStats = () => {
    const total = offboardings.length
    const inProgress = offboardings.filter((o) => o.status === "in_progress").length
    const completed = offboardings.filter((o) => o.status === "completed").length
    const pending = offboardings.filter((o) => o.status === "initiated").length
    return { total, inProgress, completed, pending }
  }

  const stats = getOffboardingStats()

  const handleCreateOffboarding = () => {
    const offboardingId = `OFF-${String(offboardings.length + 1).padStart(3, "0")}`
    const newOffboardingData = {
      ...newOffboarding,
      id: offboardingId,
      employeeName: "Selected Employee", // In real app, would fetch from employee ID
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department",
      position: "Position",
      status: "initiated",
      progress: 0,
      initiatedDate: new Date(),
      lastWorkingDay: new Date(newOffboarding.lastWorkingDay),
      exitInterviewCompleted: false,
      assetsReturned: false,
      accessRevoked: false,
      finalSettlementCalculated: false,
      knowledgeTransferCompleted: false,
      checklist: [
        { id: 1, task: "Exit Interview", completed: false, assignedTo: "HR Manager", dueDate: new Date() },
        { id: 2, task: "Asset Return", completed: false, assignedTo: "IT Department", dueDate: new Date() },
        { id: 3, task: "Access Revocation", completed: false, assignedTo: "IT Security", dueDate: new Date() },
        { id: 4, task: "Final Settlement", completed: false, assignedTo: "Payroll", dueDate: new Date() },
        { id: 5, task: "Knowledge Transfer", completed: false, assignedTo: "Team Lead", dueDate: new Date() },
      ],
      assets: [],
      finalSettlement: {
        basicSalary: 0,
        outstandingLeave: 0,
        leaveEncashment: 0,
        gratuity: 0,
        deductions: 0,
        totalAmount: 0,
      },
    }

    setOffboardings([newOffboardingData, ...offboardings])
    setNewOffboarding({
      employeeId: "",
      terminationType: "resignation",
      terminationReason: "",
      lastWorkingDay: "",
      manager: "",
    })
    setIsNewOffboardingOpen(false)
    toast({
      title: "Offboarding Initiated",
      description: `Offboarding process ${offboardingId} has been created.`,
    })
  }

  const handleStatusUpdate = (offboardingId: string, newStatus: string) => {
    setOffboardings((prev) =>
      prev.map((o) =>
        o.id === offboardingId
          ? { ...o, status: newStatus, progress: newStatus === "completed" ? 100 : o.progress }
          : o,
      ),
    )
    toast({
      title: "Status Updated",
      description: `Offboarding status changed to ${newStatus.replace("_", " ")}.`,
    })
  }

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500"
    if (progress < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Manage employee departures with comprehensive offboarding workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Offboarding Guide
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewOffboardingOpen} onOpenChange={setIsNewOffboardingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Initiate Offboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Initiate Employee Offboarding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={newOffboarding.employeeId}
                    onValueChange={(value) => setNewOffboarding({ ...newOffboarding, employeeId: value })}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="terminationType">Termination Type</Label>
                    <Select
                      value={newOffboarding.terminationType}
                      onValueChange={(value) => setNewOffboarding({ ...newOffboarding, terminationType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(terminationTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                    <Input
                      type="date"
                      value={newOffboarding.lastWorkingDay}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, lastWorkingDay: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="terminationReason">Reason for Termination</Label>
                  <Textarea
                    value={newOffboarding.terminationReason}
                    onChange={(e) => setNewOffboarding({ ...newOffboarding, terminationReason: e.target.value })}
                    placeholder="Provide reason for employee departure"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="manager">Reporting Manager</Label>
                  <Input
                    value={newOffboarding.manager}
                    onChange={(e) => setNewOffboarding({ ...newOffboarding, manager: e.target.value })}
                    placeholder="Name of reporting manager"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewOffboardingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOffboarding}>Initiate Offboarding</Button>
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
                <p className="text-sm text-gray-600">Total Offboardings</p>
              </div>
              <UserMinus className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
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
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
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
                placeholder="Search by employee name, ID, or offboarding ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offboarding Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="initiated">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all"
                  ? "All Offboardings"
                  : activeTab === "initiated"
                    ? "Pending Offboardings"
                    : activeTab === "in_progress"
                      ? "In Progress Offboardings"
                      : "Completed Offboardings"}{" "}
                ({filteredOffboardings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOffboardings.length > 0 ? (
                  filteredOffboardings.map((offboarding) => (
                    <div
                      key={offboarding.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                          <UserMinus className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{offboarding.employeeName}</h3>
                            <Badge className={statusColors[offboarding.status as keyof typeof statusColors]}>
                              {offboarding.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {terminationTypeLabels[offboarding.terminationType as keyof typeof terminationTypeLabels]}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Avatar className="w-5 h-5 mr-2">
                                <AvatarImage src={offboarding.employeeAvatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {offboarding.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {offboarding.employeeId} • {offboarding.department}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              Last Day: {offboarding.lastWorkingDay.toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="w-4 h-4 mr-1" />
                              Manager: {offboarding.manager}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{offboarding.progress}%</span>
                              </div>
                              <Progress value={offboarding.progress} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {offboarding.exitInterviewCompleted && (
                            <MessageSquare className="w-4 h-4 text-green-600" title="Exit Interview Completed" />
                          )}
                          {offboarding.assetsReturned && (
                            <Laptop className="w-4 h-4 text-green-600" title="Assets Returned" />
                          )}
                          {offboarding.accessRevoked && (
                            <Shield className="w-4 h-4 text-green-600" title="Access Revoked" />
                          )}
                          {offboarding.finalSettlementCalculated && (
                            <DollarSign className="w-4 h-4 text-green-600" title="Final Settlement Calculated" />
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedOffboarding(offboarding)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Offboarding
                            </DropdownMenuItem>
                            {offboarding.status === "in_progress" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(offboarding.id, "completed")}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <UserMinus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No offboardings found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or initiate a new offboarding.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Offboarding Details Dialog */}
      <Dialog open={!!selectedOffboarding} onOpenChange={() => setSelectedOffboarding(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offboarding Details - {selectedOffboarding?.id}</DialogTitle>
          </DialogHeader>
          {selectedOffboarding && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedOffboarding.employeeAvatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedOffboarding.employeeName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedOffboarding.employeeName}</p>
                      <p className="text-sm text-gray-600">{selectedOffboarding.employeeId}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span>{selectedOffboarding.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span>{selectedOffboarding.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manager:</span>
                      <span>{selectedOffboarding.manager}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Termination Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">
                        {
                          terminationTypeLabels[
                            selectedOffboarding.terminationType as keyof typeof terminationTypeLabels
                          ]
                        }
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={statusColors[selectedOffboarding.status as keyof typeof statusColors]}>
                        {selectedOffboarding.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Initiated:</span>
                      <span>{selectedOffboarding.initiatedDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Day:</span>
                      <span>{selectedOffboarding.lastWorkingDay.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Progress Overview</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Overall Progress</span>
                        <span className="font-medium">{selectedOffboarding.progress}%</span>
                      </div>
                      <Progress value={selectedOffboarding.progress} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle
                          className={`w-4 h-4 ${selectedOffboarding.exitInterviewCompleted ? "text-green-600" : "text-gray-300"}`}
                        />
                        <span>Exit Interview</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Laptop
                          className={`w-4 h-4 ${selectedOffboarding.assetsReturned ? "text-green-600" : "text-gray-300"}`}
                        />
                        <span>Assets Returned</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield
                          className={`w-4 h-4 ${selectedOffboarding.accessRevoked ? "text-green-600" : "text-gray-300"}`}
                        />
                        <span>Access Revoked</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign
                          className={`w-4 h-4 ${selectedOffboarding.finalSettlementCalculated ? "text-green-600" : "text-gray-300"}`}
                        />
                        <span>Final Settlement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Termination Reason</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOffboarding.terminationReason}</p>
              </div>

              <Tabs defaultValue="checklist" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="settlement">Final Settlement</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="checklist" className="space-y-4">
                  <div className="space-y-3">
                    {selectedOffboarding.checklist.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox checked={item.completed} />
                          <div>
                            <p className="font-medium">{item.task}</p>
                            <p className="text-sm text-gray-600">Assigned to: {item.assignedTo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Due: {item.dueDate.toLocaleDateString()}</p>
                          <Badge
                            className={item.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                          >
                            {item.completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4">
                  <div className="space-y-3">
                    {selectedOffboarding.assets.map((asset: any) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Laptop className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-gray-600">Serial: {asset.serialNumber}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            asset.status === "returned"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {asset.status === "returned" ? "Returned" : "Pending Return"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settlement" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Final Settlement Calculation</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Basic Salary (Last Month):</span>
                        <span>GH₵ {selectedOffboarding.finalSettlement.basicSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding Leave ({selectedOffboarding.finalSettlement.outstandingLeave} days):</span>
                        <span>GH₵ {selectedOffboarding.finalSettlement.leaveEncashment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gratuity:</span>
                        <span>GH₵ {selectedOffboarding.finalSettlement.gratuity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Deductions:</span>
                        <span>-GH₵ {selectedOffboarding.finalSettlement.deductions.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>GH₵ {selectedOffboarding.finalSettlement.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                    <Button variant="outline" className="mt-2 bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedOffboarding(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Details
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Offboarding
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
