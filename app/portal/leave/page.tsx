"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

// Mock leave data
const leaveRequests = [
  {
    id: "leave_001",
    type: "ANNUAL",
    startDate: "2024-12-23",
    endDate: "2024-12-27",
    days: 5,
    reason: "Christmas holiday with family",
    status: "APPROVED",
    appliedDate: "2024-12-01",
    approvedDate: "2024-12-02",
  },
  {
    id: "leave_002",
    type: "SICK",
    startDate: "2024-11-15",
    endDate: "2024-11-17",
    days: 3,
    reason: "Medical treatment",
    status: "APPROVED",
    appliedDate: "2024-11-14",
    approvedDate: "2024-11-14",
  },
  {
    id: "leave_003",
    type: "ANNUAL",
    startDate: "2025-01-15",
    endDate: "2025-01-19",
    days: 5,
    reason: "Personal vacation",
    status: "PENDING",
    appliedDate: "2025-01-02",
  },
]

const leaveBalance = {
  annual: { total: 21, used: 8, remaining: 13 },
  sick: { total: 10, used: 3, remaining: 7 },
  maternity: { total: 84, used: 0, remaining: 84 },
  paternity: { total: 7, used: 0, remaining: 7 },
  study: { total: 5, used: 0, remaining: 5 },
  compassionate: { total: 3, used: 0, remaining: 3 },
}

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
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    type: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Leave request submitted:", formData)
    setShowRequestForm(false)
    setFormData({ type: "ANNUAL", startDate: "", endDate: "", reason: "" })
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-gray-900">Leave & Time Off</h1>
          <p className="text-gray-600 mt-2">Manage your leave requests and view balances</p>
        </div>
        <Button onClick={() => setShowRequestForm(true)} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>

      {/* Leave Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Leave Balance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <div key={type} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold capitalize">{type.replace("_", " ")} Leave</h3>
                  <Badge variant="outline">{balance.remaining} days</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span>{balance.total} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span>{balance.used} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-cyan-600 h-2 rounded-full"
                      style={{ width: `${(balance.remaining / balance.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Form Modal */}
      {showRequestForm && (
        <Card className="border-cyan-200 bg-cyan-50">
          <CardHeader>
            <CardTitle className="font-serif">Request Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Leave Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="PATERNITY">Paternity Leave</option>
                    <option value="COMPASSIONATE">Compassionate Leave</option>
                    <option value="STUDY">Study Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Available Days</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    {leaveBalance[formData.type.toLowerCase() as keyof typeof leaveBalance]?.remaining || 0} days
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave request..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={leaveTypes[request.type as keyof typeof leaveTypes].color}>
                        {leaveTypes[request.type as keyof typeof leaveTypes].label}
                      </Badge>
                      <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="font-semibold">
                      {new Date(request.startDate).toLocaleDateString()} -{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.days} days • {request.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied on {new Date(request.appliedDate).toLocaleDateString()}
                      {request.approvedDate && ` • Approved on ${new Date(request.approvedDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {request.status === "PENDING" && (
                    <div className="flex items-center space-x-2 text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Awaiting approval</span>
                    </div>
                  )}
                  {request.status === "APPROVED" && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Approved</span>
                    </div>
                  )}
                  {request.status === "REJECTED" && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Leave */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Upcoming Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Annual Leave - January 15-19, 2025</p>
                <p className="text-sm text-blue-700">5 days • Personal vacation</p>
                <p className="text-xs text-blue-600">Status: Pending approval</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
