"use client"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Settings,
  Download,
  Plus,
  Eye,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  Building,
  Target,
  AlertTriangle,
} from "lucide-react"

const leaveRequests = [
  {
    id: 1,
    employeeName: "Ama Osei",
    employeeId: "EMP-002",
    department: "Human Resources",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Annual Leave",
    startDate: "2025-02-15",
    endDate: "2025-02-22",
    days: 6,
    reason: "Family vacation to Cape Coast",
    status: "Pending",
    appliedDate: "2025-01-20",
    manager: "Sarah Johnson",
    coveringEmployee: "Kofi Mensah",
    priority: "Normal",
    comments: [],
  },
  {
    id: 2,
    employeeName: "Kofi Mensah",
    employeeId: "EMP-003",
    department: "Marketing",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Sick Leave",
    startDate: "2025-01-25",
    endDate: "2025-01-27",
    days: 3,
    reason: "Medical treatment",
    status: "Approved",
    appliedDate: "2025-01-24",
    manager: "Sarah Johnson",
    coveringEmployee: "Ama Osei",
    priority: "High",
    comments: [{ author: "Sarah Johnson", message: "Approved. Get well soon!", date: "2025-01-24" }],
  },
  {
    id: 3,
    employeeName: "Akosua Boateng",
    employeeId: "EMP-004",
    department: "Finance",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Maternity Leave",
    startDate: "2025-03-01",
    endDate: "2025-05-30",
    days: 90,
    reason: "Maternity leave for childbirth",
    status: "Approved",
    appliedDate: "2025-01-15",
    manager: "David Wilson",
    coveringEmployee: "Yaw Adjei",
    priority: "High",
    comments: [{ author: "David Wilson", message: "Congratulations! Leave approved.", date: "2025-01-16" }],
  },
  {
    id: 4,
    employeeName: "Yaw Adjei",
    employeeId: "EMP-005",
    department: "Sales",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Personal Leave",
    startDate: "2025-02-10",
    endDate: "2025-02-12",
    days: 3,
    reason: "Personal matters",
    status: "Rejected",
    appliedDate: "2025-01-28",
    manager: "Sarah Johnson",
    coveringEmployee: null,
    priority: "Low",
    comments: [{ author: "Sarah Johnson", message: "Unable to approve due to project deadlines.", date: "2025-01-29" }],
  },
  {
    id: 5,
    employeeName: "Kwame Asante",
    employeeId: "EMP-001",
    department: "Technology",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Annual Leave",
    startDate: "2025-03-15",
    endDate: "2025-03-20",
    days: 5,
    reason: "Spring break vacation",
    status: "Pending",
    appliedDate: "2025-02-01",
    manager: "Tech Lead",
    coveringEmployee: "Senior Dev",
    priority: "Normal",
    comments: [],
  },
]

const leaveTypes = [
  { name: "Annual Leave", maxDays: 21, carryOver: true, color: "bg-emerald-500" },
  { name: "Sick Leave", maxDays: 10, carryOver: false, color: "bg-red-500" },
  { name: "Personal Leave", maxDays: 5, carryOver: false, color: "bg-blue-500" },
  { name: "Maternity Leave", maxDays: 90, carryOver: false, color: "bg-pink-500" },
  { name: "Paternity Leave", maxDays: 14, carryOver: false, color: "bg-purple-500" },
  { name: "Emergency Leave", maxDays: 3, carryOver: false, color: "bg-orange-500" },
]

const teamLeaveCalendar = [
  { date: "2025-02-15", employees: ["Ama Osei"], type: "Annual Leave" },
  { date: "2025-02-16", employees: ["Ama Osei"], type: "Annual Leave" },
  { date: "2025-02-17", employees: ["Ama Osei"], type: "Annual Leave" },
  { date: "2025-03-01", employees: ["Akosua Boateng"], type: "Maternity Leave" },
  { date: "2025-03-15", employees: ["Kwame Asante"], type: "Annual Leave" },
]

const departmentStats = [
  { department: "Technology", totalEmployees: 45, onLeave: 1, pendingRequests: 2, utilizationRate: 78 },
  { department: "Sales", totalEmployees: 62, onLeave: 3, pendingRequests: 1, utilizationRate: 85 },
  { department: "Marketing", totalEmployees: 28, onLeave: 0, pendingRequests: 1, utilizationRate: 72 },
  { department: "Finance", totalEmployees: 18, onLeave: 1, pendingRequests: 0, utilizationRate: 68 },
  { department: "HR", totalEmployees: 12, onLeave: 0, pendingRequests: 1, utilizationRate: 82 },
  { department: "Operations", totalEmployees: 82, onLeave: 4, pendingRequests: 3, utilizationRate: 91 },
]

export default function LeavePage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("requests")
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [approvalComment, setApprovalComment] = useState("")

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const statusMatch = statusFilter === "all" || request.status.toLowerCase() === statusFilter
      const departmentMatch = departmentFilter === "all" || request.department === departmentFilter
      return statusMatch && departmentMatch
    })
  }, [statusFilter, departmentFilter])

  const leaveStats = useMemo(() => {
    return {
      pending: leaveRequests.filter((req) => req.status === "Pending").length,
      approved: leaveRequests.filter((req) => req.status === "Approved").length,
      rejected: leaveRequests.filter((req) => req.status === "Rejected").length,
      totalDays: leaveRequests.reduce((sum, req) => sum + req.days, 0),
      avgProcessingTime: 2.3, // days
      approvalRate: (leaveRequests.filter((req) => req.status === "Approved").length / leaveRequests.length) * 100,
    }
  }, [])

  const handleApproval = (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setApprovalAction(action)
    setIsApprovalDialogOpen(true)
  }

  const submitApproval = () => {
    toast({
      title: `Leave Request ${approvalAction === "approve" ? "Approved" : "Rejected"}`,
      description: `${selectedRequest.employeeName}'s leave request has been ${approvalAction === "approve" ? "approved" : "rejected"}.`,
    })
    setIsApprovalDialogOpen(false)
    setApprovalComment("")
    setSelectedRequest(null)
    setApprovalAction(null)
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
        return <Badge variant="destructive">High</Badge>
      case "Normal":
        return <Badge variant="secondary">Normal</Badge>
      case "Low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Comprehensive leave tracking and approval system</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Leave Policies
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Enhanced Leave Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{leaveStats.pending}</div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-xs text-orange-600 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{leaveStats.approved}</div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-xs text-green-600 mt-1">{leaveStats.approvalRate.toFixed(1)}% approval rate</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{leaveStats.totalDays}</div>
                <p className="text-sm text-gray-600">Total Leave Days</p>
                <p className="text-xs text-blue-600 mt-1">This period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{leaveStats.avgProcessingTime}</div>
                <p className="text-sm text-gray-600">Avg Processing Time</p>
                <p className="text-xs text-purple-600 mt-1">Days</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Enhanced Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
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
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Leave Requests */}
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
                        <p className="text-xs text-gray-500 mt-1 max-w-md truncate">{request.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{request.days} days</p>
                        {request.coveringEmployee && (
                          <p className="text-xs text-blue-600">Cover: {request.coveringEmployee}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
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
                              onClick={() => handleApproval(request, "approve")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                              onClick={() => handleApproval(request, "reject")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
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

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Team Leave Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5" />
                  <span>Team Leave Calendar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = new Date(2025, 1, i - 6) // February 2025
                      const dateStr = date.toISOString().split("T")[0]
                      const leaveData = teamLeaveCalendar.find((leave) => leave.date === dateStr)

                      return (
                        <div
                          key={i}
                          className={`h-12 p-1 border rounded text-xs ${
                            date.getMonth() !== 1
                              ? "bg-gray-50 text-gray-400"
                              : leaveData
                                ? "bg-orange-100 border-orange-200"
                                : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium">{date.getDate()}</div>
                          {leaveData && <div className="text-orange-600 truncate">{leaveData.employees[0]}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Department Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentStats.map((dept, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{dept.department}</h4>
                        <Badge variant="outline">{dept.totalEmployees} employees</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">On Leave:</span>
                          <span className="font-medium ml-1">{dept.onLeave}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium ml-1">{dept.pendingRequests}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Leave Utilization</span>
                          <span>{dept.utilizationRate}%</span>
                        </div>
                        <Progress value={dept.utilizationRate} className="h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Leave Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Leave Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">78%</div>
                      <div className="text-sm text-gray-600">Approval Rate</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">2.3</div>
                      <div className="text-sm text-gray-600">Avg Days to Process</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Peak Leave Period:</span>
                      <span className="font-medium">December - January</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Most Common Type:</span>
                      <span className="font-medium">Annual Leave (65%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Leave Duration:</span>
                      <span className="font-medium">4.2 days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveTypes.map((type, index) => {
                    const count = leaveRequests.filter((req) => req.leaveType === type.name).length
                    const percentage = (count / leaveRequests.length) * 100

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                          <span className="text-sm font-medium">{type.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${type.color}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Leave Policies</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveTypes.map((policy, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${policy.color}`}></div>
                        <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                      </div>
                      <Button size="sm" variant="outline">
                        Edit Policy
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Maximum Days:</span>
                        <span className="font-medium ml-2">{policy.maxDays} days/year</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Carry Over:</span>
                        <span className="font-medium ml-2">{policy.carryOver ? "Allowed" : "Not Allowed"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Notice Period:</span>
                        <span className="font-medium ml-2">
                          {policy.name === "Sick Leave" ? "Same day" : "2 weeks"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Monthly Leave Summary
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Department Leave Analysis
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Employee Leave Balance
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Leave Compliance Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">High Leave Period Approaching</p>
                      <p className="text-sm text-yellow-800">
                        March shows 15% more leave requests than average. Plan coverage accordingly.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Improved Processing Time</p>
                      <p className="text-sm text-blue-800">
                        Average approval time reduced by 30% compared to last quarter.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-900">Policy Compliance</p>
                      <p className="text-sm text-emerald-800">98% of leave requests comply with company policies.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Leave Request Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && <LeaveRequestDetail request={selectedRequest} />}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === "approve" ? "Approve" : "Reject"} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedRequest?.employeeName}</p>
              <p className="text-sm text-gray-600">
                {selectedRequest?.leaveType} • {selectedRequest?.days} days
              </p>
              <p className="text-sm text-gray-600">
                {selectedRequest?.startDate} to {selectedRequest?.endDate}
              </p>
            </div>
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder={`Add a comment for ${approvalAction === "approve" ? "approval" : "rejection"}...`}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitApproval}
                className={
                  approvalAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }
              >
                {approvalAction === "approve" ? "Approve Request" : "Reject Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LeaveRequestDetail({ request }: { request: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={request.employeeAvatar || "/placeholder.svg"} />
          <AvatarFallback>
            {request.employeeName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.employeeName}</h3>
          <p className="text-gray-600">
            {request.employeeId} • {request.department}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            {request.status === "Approved" && <Badge className="bg-green-100 text-green-800">Approved</Badge>}
            {request.status === "Rejected" && <Badge className="bg-red-100 text-red-800">Rejected</Badge>}
            {request.status === "Pending" && <Badge className="bg-orange-100 text-orange-800">Pending</Badge>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Leave Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{request.leaveType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{request.days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{new Date(request.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">{new Date(request.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applied:</span>
                <span className="font-medium">{new Date(request.appliedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reason</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Management</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Manager:</span>
                <span className="font-medium">{request.manager}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium">{request.priority}</span>
              </div>
              {request.coveringEmployee && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-medium">{request.coveringEmployee}</span>
                </div>
              )}
            </div>
          </div>

          {request.comments.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
              <div className="space-y-2">
                {request.comments.map((comment: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-500">{comment.date}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
