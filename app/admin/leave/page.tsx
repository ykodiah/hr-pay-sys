"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, CheckCircle, XCircle, Search, Users, CalendarDays } from "lucide-react"

// Mock leave requests data
const leaveRequests = [
  {
    id: "leave_001",
    employeeName: "Akosua Mensah",
    employeeId: "emp_001",
    type: "ANNUAL",
    startDate: "2025-01-15",
    endDate: "2025-01-19",
    days: 5,
    reason: "Family vacation",
    status: "PENDING",
    appliedDate: "2025-01-02",
    department: "Human Resources",
  },
  {
    id: "leave_002",
    employeeName: "Kwame Asante",
    employeeId: "emp_002",
    type: "SICK",
    startDate: "2025-01-08",
    endDate: "2025-01-10",
    days: 3,
    reason: "Medical appointment and recovery",
    status: "APPROVED",
    appliedDate: "2025-01-07",
    approvedDate: "2025-01-07",
    department: "Information Technology",
  },
  {
    id: "leave_003",
    employeeName: "Ama Osei",
    employeeId: "emp_003",
    type: "MATERNITY",
    startDate: "2025-02-01",
    endDate: "2025-04-25",
    days: 84,
    reason: "Maternity leave",
    status: "APPROVED",
    appliedDate: "2024-12-15",
    approvedDate: "2024-12-16",
    department: "Finance",
  },
  {
    id: "leave_004",
    employeeName: "Kofi Boateng",
    employeeId: "emp_004",
    type: "ANNUAL",
    startDate: "2025-01-20",
    endDate: "2025-01-24",
    days: 5,
    reason: "Personal matters",
    status: "REJECTED",
    appliedDate: "2025-01-01",
    rejectedDate: "2025-01-03",
    department: "Operations",
  },
]

const leaveTypes = {
  ANNUAL: { label: "Annual Leave", color: "bg-blue-100 text-blue-800" },
  SICK: { label: "Sick Leave", color: "bg-red-100 text-red-800" },
  MATERNITY: { label: "Maternity", color: "bg-pink-100 text-pink-800" },
  PATERNITY: { label: "Paternity", color: "bg-green-100 text-green-800" },
  COMPASSIONATE: { label: "Compassionate", color: "bg-purple-100 text-purple-800" },
  STUDY: { label: "Study Leave", color: "bg-orange-100 text-orange-800" },
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

export default function LeavePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesType = typeFilter === "all" || request.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const pendingCount = leaveRequests.filter((r) => r.status === "PENDING").length
  const approvedCount = leaveRequests.filter((r) => r.status === "APPROVED").length
  const totalDaysRequested = leaveRequests.reduce((sum, r) => sum + r.days, 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-2">Review and manage employee leave requests</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Calendar className="mr-2 h-4 w-4" />
          Leave Calendar
        </Button>
      </div>

      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Leave requests approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysRequested}</div>
            <p className="text-xs text-muted-foreground">Days requested this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Needed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">3</div>
            <p className="text-xs text-muted-foreground">Positions need coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="MATERNITY">Maternity</option>
              <option value="PATERNITY">Paternity</option>
              <option value="COMPASSIONATE">Compassionate</option>
              <option value="STUDY">Study Leave</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {request.employeeName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-serif font-semibold text-lg">{request.employeeName}</h3>
                      <Badge className={leaveTypes[request.type as keyof typeof leaveTypes].color}>
                        {leaveTypes[request.type as keyof typeof leaveTypes].label}
                      </Badge>
                      <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{request.department}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">Duration</p>
                        <p>
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{request.days} days</p>
                      </div>
                      <div>
                        <p className="font-medium">Applied</p>
                        <p>{new Date(request.appliedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Reason</p>
                        <p>{request.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {request.status === "PENDING" && (
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No leave requests found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
