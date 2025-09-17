"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, User, FileText, CheckCircle, AlertCircle, Download, Plus, Search, Filter } from "lucide-react"

interface OffboardingCase {
  id: string
  employeeName: string
  employeeId: string
  department: string
  position: string
  lastWorkingDay: string
  reason: string
  status: "initiated" | "in-progress" | "completed"
  exitInterviewCompleted: boolean
  assetsReturned: boolean
  finalSettlement: number
  createdAt: string
}

interface Asset {
  id: string
  name: string
  type: string
  serialNumber: string
  condition: string
  returned: boolean
}

export default function OffboardingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showNewOffboardingDialog, setShowNewOffboardingDialog] = useState(false)

  // Mock data
  const offboardingCases: OffboardingCase[] = [
    {
      id: "OFF001",
      employeeName: "Kwame Asante",
      employeeId: "EMP001",
      department: "Technology",
      position: "Senior Software Engineer",
      lastWorkingDay: "2024-02-15",
      reason: "Resignation",
      status: "in-progress",
      exitInterviewCompleted: true,
      assetsReturned: false,
      finalSettlement: 8500,
      createdAt: "2024-01-15",
    },
    {
      id: "OFF002",
      employeeName: "Ama Osei",
      employeeId: "EMP002",
      department: "Human Resources",
      position: "HR Manager",
      lastWorkingDay: "2024-01-31",
      reason: "Termination",
      status: "completed",
      exitInterviewCompleted: true,
      assetsReturned: true,
      finalSettlement: 12000,
      createdAt: "2024-01-01",
    },
  ]

  const assets: Asset[] = [
    {
      id: "AST001",
      name: "MacBook Pro",
      type: "Laptop",
      serialNumber: "MBP2023001",
      condition: "Good",
      returned: false,
    },
    {
      id: "AST002",
      name: "iPhone 14",
      type: "Mobile Phone",
      serialNumber: "IP14001",
      condition: "Excellent",
      returned: true,
    },
    {
      id: "AST003",
      name: "Office Key",
      type: "Access Card",
      serialNumber: "KEY001",
      condition: "Good",
      returned: false,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "initiated":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredCases = offboardingCases.filter((case_) => {
    const matchesSearch =
      case_.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || case_.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Manage employee departures and exit processes</p>
        </div>
        <Dialog open={showNewOffboardingDialog} onOpenChange={setShowNewOffboardingDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Initiate Offboarding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Initiate Employee Offboarding</DialogTitle>
              <DialogDescription>Start the offboarding process for an employee</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emp1">Kwame Asante - EMP001</SelectItem>
                      <SelectItem value="emp2">Ama Osei - EMP002</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="reason">Reason for Departure</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="contract-end">Contract End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea placeholder="Enter any additional notes..." />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewOffboardingDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Initiate Offboarding</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Awaiting return</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Process Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">-2 days from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exit-interviews">Exit Interviews</TabsTrigger>
          <TabsTrigger value="assets">Asset Management</TabsTrigger>
          <TabsTrigger value="settlements">Final Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Offboarding Cases */}
          <div className="space-y-4">
            {filteredCases.map((case_) => (
              <Card key={case_.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{case_.employeeName}</CardTitle>
                      <CardDescription>
                        {case_.position} • {case_.department} • ID: {case_.employeeId}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(case_.status)}>
                      {case_.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Last Working Day</p>
                      <p>{new Date(case_.lastWorkingDay).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Reason</p>
                      <p>{case_.reason}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Exit Interview</p>
                      <p className={case_.exitInterviewCompleted ? "text-green-600" : "text-red-600"}>
                        {case_.exitInterviewCompleted ? "Completed" : "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Assets Returned</p>
                      <p className={case_.assetsReturned ? "text-green-600" : "text-red-600"}>
                        {case_.assetsReturned ? "Yes" : "Pending"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exit-interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exit Interview Management</CardTitle>
              <CardDescription>Schedule and manage exit interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scheduled Interviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium">Kwame Asante</p>
                            <p className="text-sm text-gray-600">Feb 10, 2024 at 2:00 PM</p>
                          </div>
                          <Button size="sm">Join Interview</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Completed Interviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium">Ama Osei</p>
                            <p className="text-sm text-gray-600">Completed Jan 25, 2024</p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Return Management</CardTitle>
              <CardDescription>Track company assets and their return status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-gray-600">
                        {asset.type} • Serial: {asset.serialNumber} • Condition: {asset.condition}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={asset.returned ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {asset.returned ? "Returned" : "Pending"}
                      </Badge>
                      {!asset.returned && <Button size="sm">Mark as Returned</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Final Settlement Management</CardTitle>
              <CardDescription>Calculate and process final settlements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offboardingCases.map((case_) => (
                  <div key={case_.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{case_.employeeName}</p>
                      <p className="text-sm text-gray-600">
                        Final Settlement: GHS {case_.finalSettlement.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={
                          case_.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {case_.status === "completed" ? "Processed" : "Pending"}
                      </Badge>
                      {case_.status !== "completed" && <Button size="sm">Process Payment</Button>}
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
