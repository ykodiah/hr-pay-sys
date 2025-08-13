"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react"

// Mock leave data
const leaveRequests = [
  {
    id: 1,
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Annual Leave",
    startDate: "2025-02-15",
    endDate: "2025-02-22",
    days: 6,
    reason: "Family vacation to Cape Coast",
    status: "Pending",
    appliedDate: "2025-01-20",
  },
  {
    id: 2,
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Sick Leave",
    startDate: "2025-01-25",
    endDate: "2025-01-27",
    days: 3,
    reason: "Medical treatment",
    status: "Approved",
    appliedDate: "2025-01-24",
  },
  {
    id: 3,
    employeeName: "Akosua Boateng",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Maternity Leave",
    startDate: "2025-03-01",
    endDate: "2025-05-30",
    days: 90,
    reason: "Maternity leave for childbirth",
    status: "Approved",
    appliedDate: "2025-01-15",
  },
  {
    id: 4,
    employeeName: "Yaw Adjei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    leaveType: "Personal Leave",
    startDate: "2025-02-10",
    endDate: "2025-02-12",
    days: 3,
    reason: "Personal matters",
    status: "Rejected",
    appliedDate: "2025-01-28",
  },
]

export default function LeavePage() {
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredRequests = leaveRequests.filter(
    (request) => statusFilter === "all" || request.status.toLowerCase() === statusFilter,
  )

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Review and manage employee leave requests</p>
        </div>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter((req) => req.status === "Pending").length}
                </div>
                <p className="text-sm text-gray-600">Pending Approval</p>
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
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
                    <h3 className="font-semibold text-gray-900">{request.employeeName}</h3>
                    <p className="text-sm text-gray-600">{request.leaveType}</p>
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

                  {request.status === "Pending" && (
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
