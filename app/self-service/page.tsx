"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  FileText,
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  TrendingUp,
  User,
  Bell,
  Download,
  Upload,
  Edit,
  Eye,
  Plus,
  Target,
  Award,
  Building,
  Phone,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react"

const employeeData = {
  id: "EMP-001",
  name: "Kwame Asante",
  email: "kwame.asante@company.com",
  phone: "+233 24 123 4567",
  position: "Senior Software Engineer",
  department: "Technology",
  location: "Accra",
  startDate: "2022-03-15",
  avatar: "/placeholder.svg?height=100&width=100",
  manager: "Sarah Johnson",
  salary: 8500,
  leaveBalance: {
    annual: { total: 21, used: 3, remaining: 18 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 1, remaining: 4 },
  },
  performance: {
    rating: 4.2,
    goals: 8,
    completed: 6,
  },
  benefits: {
    health: "Premium Health Plan",
    pension: "Tier 2 + Tier 3 (5%)",
    insurance: "Life Insurance - GHS 100,000",
  },
}

const recentPayslips = [
  {
    period: "January 2025",
    gross: 9700,
    paye: 1455,
    ssnit: 873,
    tier3: 485,
    deductions: 500,
    net: 6887,
    status: "Available",
  },
  {
    period: "December 2024",
    gross: 9700,
    paye: 1455,
    ssnit: 873,
    tier3: 485,
    deductions: 500,
    net: 6887,
    status: "Available",
  },
  {
    period: "November 2024",
    gross: 9700,
    paye: 1455,
    ssnit: 873,
    tier3: 485,
    deductions: 300,
    net: 7087,
    status: "Available",
  },
]

const leaveRequests = [
  {
    id: 1,
    type: "Annual Leave",
    startDate: "2025-02-15",
    endDate: "2025-02-22",
    days: 6,
    status: "Pending",
    reason: "Family vacation",
    appliedDate: "2025-01-10",
  },
  {
    id: 2,
    type: "Sick Leave",
    startDate: "2024-12-20",
    endDate: "2024-12-21",
    days: 2,
    status: "Approved",
    reason: "Medical appointment",
    appliedDate: "2024-12-18",
  },
]

const notifications = [
  {
    id: 1,
    title: "Payslip Available",
    message: "Your January 2025 payslip is now available for download",
    type: "info",
    date: "2025-01-31",
    read: false,
  },
  {
    id: 2,
    title: "Leave Request Update",
    message: "Your annual leave request for February has been approved",
    type: "success",
    date: "2025-01-28",
    read: false,
  },
  {
    id: 3,
    title: "Performance Review",
    message: "Your Q4 2024 performance review is ready for your review",
    type: "info",
    date: "2025-01-25",
    read: true,
  },
]

export default function SelfServiceDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
  })

  const handleLeaveRequest = () => {
    // Simulate leave request submission
    toast({
      title: "Leave Request Submitted",
      description: "Your leave request has been submitted for approval.",
    })
    setIsLeaveDialogOpen(false)
    setLeaveForm({ type: "", startDate: "", endDate: "", reason: "" })
  }

  const handlePayslipDownload = (period: string) => {
    // Simulate payslip download
    toast({
      title: "Payslip Downloaded",
      description: `${period} payslip has been downloaded successfully.`,
    })
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={employeeData.avatar || "/placeholder.svg"} />
            <AvatarFallback>
              {employeeData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {employeeData.name.split(" ")[0]}!</h1>
            <p className="text-gray-600">
              {employeeData.position} • {employeeData.department}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="relative bg-transparent">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-red-500">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            January 2025
          </Badge>
        </div>
      </div>

      {/* Enhanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">GHS {recentPayslips[0].net.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Last Net Pay</p>
                    <p className="text-xs text-emerald-600 mt-1">+2.3% from last month</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{employeeData.leaveBalance.annual.remaining}</div>
                    <p className="text-sm text-gray-600">Leave Days Left</p>
                    <p className="text-xs text-blue-600 mt-1">{employeeData.leaveBalance.annual.used} used this year</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveRequests.filter((r) => r.status === "Pending").length}
                    </div>
                    <p className="text-sm text-gray-600">Pending Requests</p>
                    <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{employeeData.performance.rating}</div>
                    <p className="text-sm text-gray-600">Performance Rating</p>
                    <p className="text-xs text-purple-600 mt-1">Above average</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-20 flex-col space-y-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                      <Calendar className="w-6 h-6" />
                      <span>Request Leave</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Leave</DialogTitle>
                    </DialogHeader>
                    <LeaveRequestForm
                      formData={leaveForm}
                      setFormData={setLeaveForm}
                      onSubmit={handleLeaveRequest}
                      onCancel={() => setIsLeaveDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 bg-transparent"
                  onClick={() => setActiveTab("payslips")}
                >
                  <FileText className="w-6 h-6" />
                  <span>View Payslips</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                  <CreditCard className="w-6 h-6" />
                  <span>Apply for Loan</span>
                </Button>

                <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                      <User className="w-6 h-6" />
                      <span>Update Profile</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Update Profile</DialogTitle>
                    </DialogHeader>
                    <ProfileUpdateForm onClose={() => setIsProfileDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Content */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${
                        notification.read ? "bg-gray-50" : "bg-blue-50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === "success"
                            ? "bg-emerald-500"
                            : notification.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Performance Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Goals Completed</span>
                    <span className="text-sm text-gray-600">
                      {employeeData.performance.completed}/{employeeData.performance.goals}
                    </span>
                  </div>
                  <Progress
                    value={(employeeData.performance.completed / employeeData.performance.goals) * 100}
                    className="h-2"
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">{employeeData.performance.rating}</div>
                      <div className="text-sm text-gray-600">Overall Rating</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((employeeData.performance.completed / employeeData.performance.goals) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Goal Progress</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Payslip History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayslips.map((payslip, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{payslip.period}</h3>
                        <p className="text-sm text-gray-600">Net Pay: GHS {payslip.net.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-emerald-100 text-emerald-800">{payslip.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => handlePayslipDownload(payslip.period)}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Gross Pay:</span>
                        <p className="font-medium">GHS {payslip.gross.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">PAYE:</span>
                        <p className="font-medium text-red-600">-GHS {payslip.paye.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">SSNIT:</span>
                        <p className="font-medium text-blue-600">-GHS {payslip.ssnit.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tier 3:</span>
                        <p className="font-medium text-purple-600">-GHS {payslip.tier3.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Net Pay:</span>
                        <p className="font-medium text-emerald-600">GHS {payslip.net.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Leave Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Leave Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(employeeData.leaveBalance).map(([type, balance]) => (
                    <div key={type} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{type} Leave</h4>
                        <span className="text-sm text-gray-600">
                          {balance.remaining}/{balance.total} days
                        </span>
                      </div>
                      <Progress value={(balance.remaining / balance.total) * 100} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{balance.used} days used this year</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leave Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Leave Requests</span>
                  </CardTitle>
                  <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-1" />
                        New Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Leave</DialogTitle>
                      </DialogHeader>
                      <LeaveRequestForm
                        formData={leaveForm}
                        setFormData={setLeaveForm}
                        onSubmit={handleLeaveRequest}
                        onCancel={() => setIsLeaveDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{request.type}</h4>
                        <Badge
                          variant={
                            request.status === "Approved"
                              ? "default"
                              : request.status === "Pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            request.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : request.status === "Pending"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.startDate} to {request.endDate} ({request.days} days)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Applied: {request.appliedDate}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setIsProfileDialogOpen(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={employeeData.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {employeeData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{employeeData.name}</h3>
                      <p className="text-gray-600">{employeeData.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{employeeData.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{employeeData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{employeeData.location}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{employeeData.position}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{employeeData.department}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Benefits & Compensation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <h4 className="font-medium text-emerald-900">Monthly Salary</h4>
                    <p className="text-2xl font-bold text-emerald-600">GHS {employeeData.salary.toLocaleString()}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Health Insurance</h4>
                      <p className="text-sm text-gray-600">{employeeData.benefits.health}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Pension Plan</h4>
                      <p className="text-sm text-gray-600">{employeeData.benefits.pension}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Life Insurance</h4>
                      <p className="text-sm text-gray-600">{employeeData.benefits.insurance}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Performance Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-emerald-50 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{employeeData.performance.rating}</div>
                  <div className="text-sm text-gray-600">Overall Rating</div>
                  <div className="text-xs text-emerald-600 mt-1">Exceeds Expectations</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {employeeData.performance.completed}/{employeeData.performance.goals}
                  </div>
                  <div className="text-sm text-gray-600">Goals Completed</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {Math.round((employeeData.performance.completed / employeeData.performance.goals) * 100)}% Progress
                  </div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">Q1</div>
                  <div className="text-sm text-gray-600">Next Review</div>
                  <div className="text-xs text-purple-600 mt-1">March 2025</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>My Documents</span>
                </CardTitle>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Employment Contract", type: "PDF", size: "2.4 MB", date: "2022-03-15" },
                  { name: "ID Copy", type: "PDF", size: "1.2 MB", date: "2022-03-15" },
                  { name: "CV/Resume", type: "PDF", size: "856 KB", date: "2022-03-10" },
                  { name: "Bank Details", type: "PDF", size: "445 KB", date: "2022-03-15" },
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-600">
                          {doc.type} • {doc.size} • {doc.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LeaveRequestForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: {
  formData: any
  setFormData: any
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="leaveType">Leave Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual Leave</SelectItem>
            <SelectItem value="sick">Sick Leave</SelectItem>
            <SelectItem value="personal">Personal Leave</SelectItem>
            <SelectItem value="emergency">Emergency Leave</SelectItem>
            <SelectItem value="maternity">Maternity Leave</SelectItem>
            <SelectItem value="paternity">Paternity Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Please provide a reason for your leave request..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} className="bg-emerald-600 hover:bg-emerald-700">
          Submit Request
        </Button>
      </div>
    </div>
  )
}

function ProfileUpdateForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    phone: employeeData.phone,
    email: employeeData.email,
    address: "123 Liberation Road, Accra",
    emergencyContact: "Akosua Asante - +233 20 111 2222",
  })

  const handleSubmit = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          value={formData.emergencyContact}
          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
          Update Profile
        </Button>
      </div>
    </div>
  )
}
