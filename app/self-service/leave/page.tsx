"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Plus, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react"

// Mock leave data
const leaveRequests = [
  {
    id: 1,
    type: "Annual Leave",
    startDate: "2025-02-15",
    endDate: "2025-02-22",
    days: 6,
    reason: "Family vacation to Cape Coast",
    status: "Pending",
    appliedDate: "2025-01-20",
  },
  {
    id: 2,
    type: "Sick Leave",
    startDate: "2024-12-10",
    endDate: "2024-12-12",
    days: 3,
    reason: "Medical treatment",
    status: "Approved",
    appliedDate: "2024-12-09",
  },
  {
    id: 3,
    type: "Personal Leave",
    startDate: "2024-11-25",
    endDate: "2024-11-25",
    days: 1,
    reason: "Personal matters",
    status: "Approved",
    appliedDate: "2024-11-20",
  },
]

const leaveBalance = {
  annual: { total: 21, used: 3, remaining: 18 },
  sick: { total: 10, used: 3, remaining: 7 },
  personal: { total: 5, used: 1, remaining: 4 },
}

export default function LeavePage() {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)

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
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-600">Manage your leave applications and view balances</p>
        </div>
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <LeaveRequestForm onClose={() => setIsRequestDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Annual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{leaveBalance.annual.total} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-red-600">{leaveBalance.annual.used} days</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Remaining</span>
                <span className="font-bold text-emerald-600">{leaveBalance.annual.remaining} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{leaveBalance.sick.total} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-red-600">{leaveBalance.sick.used} days</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Remaining</span>
                <span className="font-bold text-emerald-600">{leaveBalance.sick.remaining} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Personal Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{leaveBalance.personal.total} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-red-600">{leaveBalance.personal.used} days</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Remaining</span>
                <span className="font-bold text-emerald-600">{leaveBalance.personal.remaining} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{request.type}</h3>
                    <p className="text-sm text-gray-600">{request.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied on {new Date(request.appliedDate).toLocaleDateString()}
                    </p>
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaveRequestForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="leaveType">Leave Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual Leave</SelectItem>
            <SelectItem value="sick">Sick Leave</SelectItem>
            <SelectItem value="personal">Personal Leave</SelectItem>
            <SelectItem value="emergency">Emergency Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" />
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Reason for Leave</Label>
        <Textarea id="reason" placeholder="Please provide a reason for your leave request..." />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Leave requests require manager approval. You will be notified via email once your
          request is reviewed.
        </p>
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
