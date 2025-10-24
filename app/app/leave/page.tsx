"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { handleExport } from "@/lib/button-handlers"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Plus,
  Search,
  Eye,
  Download,
  Users,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  FileText,
} from "lucide-react"

const initialLeaveRequests = [
  {
    id: 1,
    employeeName: "Ama Osei",
    employeeId: "EMP002",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    leaveType: "Annual Leave",
    startDate: "2025-02-15",
    endDate: "2025-02-22",
    days: 6,
    reason: "Family vacation to Cape Coast",
    status: "Pending",
    appliedDate: "2025-01-20",
    approver: "John Doe",
    comments: [],
    attachments: [],
    priority: "Normal",
    leaveBalance: { annual: 15, sick: 10, casual: 5, maternity: 90 },
  },
  {
    id: 2,
    employeeName: "Kofi Mensah",
    employeeId: "EMP003",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Marketing",
    leaveType: "Sick Leave",
    startDate: "2025-01-25",
    endDate: "2025-01-27",
    days: 3,
    reason: "Medical treatment for flu symptoms",
    status: "Approved",
    appliedDate: "2025-01-24",
    approver: "Jane Smith",
    approvedDate: "2025-01-24",
    comments: [{ author: "Jane Smith", message: "Approved. Get well soon!", date: "2025-01-24" }],
    attachments: ["medical_certificate.pdf"],
    priority: "High",
    leaveBalance: { annual: 21, sick: 7, casual: 5, maternity: 0 },
  },
  {
    id: 3,
    employeeName: "Akosua Boateng",
    employeeId: "EMP004",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Finance",
    leaveType: "Maternity Leave",
    startDate: "2025-03-01",
    endDate: "2025-05-30",
    days: 90,
    reason: "Maternity leave for childbirth",
    status: "Approved",
    appliedDate: "2025-01-15",
    approver: "John Doe",
    approvedDate: "2025-01-16",
    comments: [
      { author: "John Doe", message: "Congratulations! Approved for full maternity leave.", date: "2025-01-16" },
    ],
    attachments: ["maternity_certificate.pdf"],
    priority: "High",
    leaveBalance: { annual: 21, sick: 10, casual: 5, maternity: 0 },
  },
  {
    id: 4,
    employeeName: "Yaw Adjei",
    employeeId: "EMP005",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Sales",
    leaveType: "Personal Leave",
    startDate: "2025-02-10",
    endDate: "2025-02-12",
    days: 3,
    reason: "Personal family matters",
    status: "Rejected",
    appliedDate: "2025-01-28",
    approver: "Jane Smith",
    rejectedDate: "2025-01-29",
    comments: [
      {
        author: "Jane Smith",
        message: "Unable to approve due to critical project deadline. Please reschedule.",
        date: "2025-01-29",
      },
    ],
    attachments: [],
    priority: "Normal",
    leaveBalance: { annual: 21, sick: 10, casual: 5, maternity: 0 },
  },
  {
    id: 5,
    employeeName: "Kwame Asante",
    employeeId: "EMP001",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    leaveType: "Annual Leave",
    startDate: "2025-03-15",
    endDate: "2025-03-25",
    days: 8,
    reason: "Annual vacation with family",
    status: "Pending",
    appliedDate: "2025-02-01",
    approver: "John Doe",
    comments: [],
    attachments: [],
    priority: "Normal",
    leaveBalance: { annual: 13, sick: 10, casual: 5, maternity: 0 },
  },
]

const leaveTypes = [
  { value: "annual", label: "Annual Leave", maxDays: 21, requiresApproval: true },
  { value: "sick", label: "Sick Leave", maxDays: 10, requiresApproval: false },
  { value: "casual", label: "Casual Leave", maxDays: 5, requiresApproval: true },
  { value: "maternity", label: "Maternity Leave", maxDays: 90, requiresApproval: true },
  { value: "paternity", label: "Paternity Leave", maxDays: 7, requiresApproval: true },
  { value: "emergency", label: "Emergency Leave", maxDays: 3, requiresApproval: false },
  { value: "study", label: "Study Leave", maxDays: 30, requiresApproval: true },
]

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests)
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("requests")

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter
    const matchesDepartment = departmentFilter === "all" || request.department === departmentFilter
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesDepartment && matchesSearch
  })

  const departments = [...new Set(leaveRequests.map((req) => req.department))]

  const handleApproveRequest = (requestId: number, comment = "") => {
    setLeaveRequests((requests) =>
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "Approved",
              approvedDate: new Date().toISOString().split("T")[0],
              comments: [
                ...req.comments,
                {
                  author: "Current User",
                  message: comment || "Leave request approved",
                  date: new Date().toISOString().split("T")[0],
                },
              ],
            }
          : req,
      ),
    )
    toast({
      title: "Leave Approved",
      description: "The leave request has been approved successfully.",
    })
  }

  const handleRejectRequest = (requestId: number, comment: string) => {
    setLeaveRequests((requests) =>
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "Rejected",
              rejectedDate: new Date().toISOString().split("T")[0],
              comments: [
                ...req.comments,
                {
                  author: "Current User",
                  message: comment,
                  date: new Date().toISOString().split("T")[0],
                },
              ],
            }
          : req,
      ),
    )
    toast({
      title: "Leave Rejected",
      description: "The leave request has been rejected.",
      variant: "destructive",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "Pending":
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return (
          <Badge variant="destructive" className="text-xs">
            High
          </Badge>
        )
      case "Normal":
        return (
          <Badge variant="outline" className="text-xs">
            Normal
          </Badge>
        )
      case "Low":
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Review and manage employee leave requests</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => handleExport('leave report')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Leave Request</DialogTitle>
              </DialogHeader>
              <NewLeaveRequestForm onClose={() => setIsNewRequestDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Leave Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveRequests.filter((req) => req.status === "Pending").length}
                    </div>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveRequests.filter((req) => req.status === "Approved").length}
                    </div>
                    <p className="text-sm text-gray-600">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveRequests.filter((req) => req.status === "Rejected").length}
                    </div>
                    <p className="text-sm text-gray-600">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveRequests.reduce((sum, req) => sum + req.days, 0)}
                    </div>
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {new Set(leaveRequests.map((req) => req.employeeId)).size}
                    </div>
                    <p className="text-sm text-gray-600">Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by employee name, ID, or leave type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {request.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{request.employeeName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {request.employeeId}
                          </Badge>
                          {getPriorityBadge(request.priority)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {request.leaveType} • {request.department}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{request.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{request.days} days</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {request.status === "Pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                              onClick={() => handleRejectRequest(request.id, "Request rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-6">
          <LeaveBalancesView employees={leaveRequests} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <LeaveCalendarView requests={leaveRequests} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <LeaveAnalyticsView requests={leaveRequests} />
        </TabsContent>
      </Tabs>

      {/* Leave Request Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <LeaveRequestDetail
              request={selectedRequest}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              onClose={() => setIsDetailDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewLeaveRequestForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    priority: "Normal",
    attachments: [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Calculate days between dates
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    toast({
      title: "Leave Request Submitted",
      description: `Leave request for ${days} days has been submitted for approval.`,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            placeholder="EMP001"
            required
          />
        </div>
        <div>
          <Label htmlFor="leaveType">Leave Type</Label>
          <Select value={formData.leaveType} onValueChange={(value) => setFormData({ ...formData, leaveType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              {leaveTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label} (Max: {type.maxDays} days)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reason">Reason for Leave</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Please provide a reason for your leave request..."
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Submit Request
        </Button>
      </div>
    </form>
  )
}

function LeaveRequestDetail({
  request,
  onApprove,
  onReject,
  onClose,
}: {
  request: any
  onApprove: (id: number, comment: string) => void
  onReject: (id: number, comment: string) => void
  onClose: () => void
}) {
  const [comment, setComment] = useState("")
  const [action, setAction] = useState<"approve" | "reject" | null>(null)

  const handleAction = () => {
    if (action === "approve") {
      onApprove(request.id, comment)
    } else if (action === "reject") {
      onReject(request.id, comment)
    }
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={request.employeeAvatar || "/placeholder.svg"} />
          <AvatarFallback className="text-lg">
            {request.employeeName
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{request.employeeName}</h2>
          <p className="text-gray-600">
            {request.employeeId} • {request.department}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            {getStatusIcon(request.status)}
            {getStatusBadge(request.status)}
            {getPriorityBadge(request.priority)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Leave Type:</span>
              <span className="font-medium">{request.leaveType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span>{new Date(request.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span>{new Date(request.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{request.days} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Applied Date:</span>
              <span>{new Date(request.appliedDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approver:</span>
              <span>{request.approver}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Leave:</span>
              <span className="font-medium">{request.leaveBalance.annual} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sick Leave:</span>
              <span className="font-medium">{request.leaveBalance.sick} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Casual Leave:</span>
              <span className="font-medium">{request.leaveBalance.casual} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maternity Leave:</span>
              <span className="font-medium">{request.leaveBalance.maternity} days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{request.reason}</p>
        </CardContent>
      </Card>

      {request.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.attachments.map((attachment: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{attachment}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {request.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Comments & History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.comments.map((comment: any, index: number) => (
                <div key={index} className="border-l-2 border-emerald-500 pl-4">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-700">{comment.message}</p>
                    <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">— {comment.author}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {request.status === "Pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Take Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment about your decision..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setAction("approve")
                  handleAction()
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Request
              </Button>
              <Button
                onClick={() => {
                  setAction("reject")
                  handleAction()
                }}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LeaveBalancesView({ employees }: { employees: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Leave Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={employee.employeeAvatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {employee.employeeName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{employee.employeeName}</h3>
                  <p className="text-sm text-gray-600">{employee.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-600">{employee.leaveBalance.annual}</div>
                  <div className="text-xs text-gray-500">Annual</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{employee.leaveBalance.sick}</div>
                  <div className="text-xs text-gray-500">Sick</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{employee.leaveBalance.casual}</div>
                  <div className="text-xs text-gray-500">Casual</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-600">{employee.leaveBalance.maternity}</div>
                  <div className="text-xs text-gray-500">Maternity</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LeaveCalendarView({ requests }: { requests: any[] }) {
  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Leave Calendar - {currentMonth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Calendar view will be implemented with a proper calendar component</p>
            <p className="text-sm mt-2">Showing upcoming leave schedules and conflicts</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests
              .filter((req) => req.status === "Approved" && new Date(req.startDate) > new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 5)
              .map((request, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={request.employeeAvatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {request.employeeName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{request.employeeName}</p>
                      <p className="text-xs text-gray-600">{request.leaveType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(request.startDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{request.days} days</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaveAnalyticsView({ requests }: { requests: any[] }) {
  const totalRequests = requests.length
  const approvedRequests = requests.filter((req) => req.status === "Approved").length
  const pendingRequests = requests.filter((req) => req.status === "Pending").length
  const rejectedRequests = requests.filter((req) => req.status === "Rejected").length

  const approvalRate = totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0

  const leaveTypeStats = requests.reduce(
    (acc, req) => {
      acc[req.leaveType] = (acc[req.leaveType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const departmentStats = requests.reduce(
    (acc, req) => {
      acc[req.department] = (acc[req.department] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{approvalRate}%</div>
                <p className="text-sm text-gray-600">Approval Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">2.3</div>
                <p className="text-sm text-gray-600">Avg Days/Request</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(departmentStats).length}</div>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {requests.reduce((sum, req) => sum + req.days, 0)}
                </div>
                <p className="text-sm text-gray-600">Total Leave Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(leaveTypeStats).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${(count / totalRequests) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(departmentStats).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dept}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / totalRequests) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
