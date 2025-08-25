"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  UserX,
  CheckCircle,
  FileText,
  User,
  Building,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  MessageSquare,
  Package,
  BookOpen,
  Send,
  Calculator,
  Key,
  Laptop,
  Shield,
  Star,
  TrendingDown,
} from "lucide-react"

interface OffboardingCase {
  id: string
  employeeName: string
  employeeId: string
  department: string
  position: string
  manager: string
  terminationType: "resignation" | "termination" | "retirement" | "redundancy" | "end-of-contract"
  lastWorkingDay: string
  noticeDate: string
  reason?: string
  status: "initiated" | "in-progress" | "pending-clearance" | "completed"
  progress: number
  exitInterviewCompleted: boolean
  assetsReturned: boolean
  finalSettlementCalculated: boolean
  knowledgeTransferCompleted: boolean
}

interface Asset {
  id: string
  employeeId: string
  assetType: "laptop" | "phone" | "id-card" | "keys" | "uniform" | "equipment" | "documents"
  description: string
  serialNumber?: string
  assignedDate: string
  condition: "excellent" | "good" | "fair" | "poor" | "damaged"
  returnStatus: "pending" | "returned" | "damaged" | "lost"
  returnDate?: string
  notes?: string
}

interface FinalSettlement {
  id: string
  employeeId: string
  basicSalary: number
  outstandingSalary: number
  leaveBalance: number
  leaveEncashment: number
  bonus: number
  allowances: number
  deductions: number
  loans: number
  advances: number
  totalPayable: number
  totalDeductions: number
  netAmount: number
  status: "pending" | "approved" | "paid"
  approvedBy?: string
  paidDate?: string
}

interface ExitInterview {
  id: string
  employeeId: string
  interviewDate: string
  interviewer: string
  overallSatisfaction: number
  workEnvironment: number
  management: number
  compensation: number
  careerDevelopment: number
  workLifeBalance: number
  wouldRecommend: boolean
  reasonForLeaving: string
  improvements: string
  feedback: string
  status: "scheduled" | "completed" | "cancelled"
}

interface KnowledgeTransfer {
  id: string
  employeeId: string
  transferTo: string
  documentationType: "processes" | "contacts" | "passwords" | "projects" | "training"
  description: string
  priority: "high" | "medium" | "low"
  status: "pending" | "in-progress" | "completed"
  dueDate: string
  completedDate?: string
  notes?: string
}

export default function OffboardingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showOffboardingDialog, setShowOffboardingDialog] = useState(false)
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const [showSettlementDialog, setShowSettlementDialog] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [selectedCase, setSelectedCase] = useState<OffboardingCase | null>(null)

  const [offboardingCases] = useState<OffboardingCase[]>([
    {
      id: "1",
      employeeName: "John Doe",
      employeeId: "EMP-001",
      department: "Engineering",
      position: "Senior Developer",
      manager: "Jane Smith",
      terminationType: "resignation",
      lastWorkingDay: "2024-04-15",
      noticeDate: "2024-03-15",
      reason: "Better opportunity elsewhere",
      status: "in-progress",
      progress: 65,
      exitInterviewCompleted: true,
      assetsReturned: false,
      finalSettlementCalculated: true,
      knowledgeTransferCompleted: false,
    },
    {
      id: "2",
      employeeName: "Sarah Johnson",
      employeeId: "EMP-023",
      department: "Marketing",
      position: "Marketing Manager",
      manager: "Michael Brown",
      terminationType: "termination",
      lastWorkingDay: "2024-03-30",
      noticeDate: "2024-03-20",
      reason: "Performance issues",
      status: "pending-clearance",
      progress: 85,
      exitInterviewCompleted: true,
      assetsReturned: true,
      finalSettlementCalculated: true,
      knowledgeTransferCompleted: true,
    },
  ])

  const [assets] = useState<Asset[]>([
    {
      id: "1",
      employeeId: "EMP-001",
      assetType: "laptop",
      description: "MacBook Pro 16-inch",
      serialNumber: "MBP2023001",
      assignedDate: "2023-01-15",
      condition: "good",
      returnStatus: "pending",
    },
    {
      id: "2",
      employeeId: "EMP-001",
      assetType: "phone",
      description: "iPhone 14 Pro",
      serialNumber: "IP14P001",
      assignedDate: "2023-01-15",
      condition: "excellent",
      returnStatus: "pending",
    },
    {
      id: "3",
      employeeId: "EMP-023",
      assetType: "id-card",
      description: "Employee ID Card",
      assignedDate: "2022-06-01",
      condition: "good",
      returnStatus: "returned",
      returnDate: "2024-03-25",
    },
  ])

  const [settlements] = useState<FinalSettlement[]>([
    {
      id: "1",
      employeeId: "EMP-001",
      basicSalary: 8000,
      outstandingSalary: 4000,
      leaveBalance: 15,
      leaveEncashment: 4000,
      bonus: 2000,
      allowances: 1500,
      deductions: 500,
      loans: 1000,
      advances: 300,
      totalPayable: 11500,
      totalDeductions: 1800,
      netAmount: 9700,
      status: "approved",
      approvedBy: "HR Manager",
    },
  ])

  const [exitInterviews] = useState<ExitInterview[]>([
    {
      id: "1",
      employeeId: "EMP-001",
      interviewDate: "2024-04-10",
      interviewer: "HR Manager",
      overallSatisfaction: 4,
      workEnvironment: 5,
      management: 3,
      compensation: 4,
      careerDevelopment: 3,
      workLifeBalance: 4,
      wouldRecommend: true,
      reasonForLeaving: "Career advancement opportunity",
      improvements: "Better career development programs",
      feedback: "Great company culture, but limited growth opportunities",
      status: "completed",
    },
  ])

  const [knowledgeTransfers] = useState<KnowledgeTransfer[]>([
    {
      id: "1",
      employeeId: "EMP-001",
      transferTo: "Alice Wilson",
      documentationType: "projects",
      description: "Handover of React Native mobile app project",
      priority: "high",
      status: "in-progress",
      dueDate: "2024-04-12",
    },
    {
      id: "2",
      employeeId: "EMP-001",
      transferTo: "Bob Chen",
      documentationType: "processes",
      description: "Development workflow and deployment procedures",
      priority: "medium",
      status: "completed",
      dueDate: "2024-04-08",
      completedDate: "2024-04-07",
    },
  ])

  const offboardingChecklist = [
    {
      category: "Pre-Departure (1-2 weeks before)",
      tasks: [
        { id: "1", task: "Notify relevant departments of departure", assignee: "HR", status: "completed" },
        { id: "2", task: "Create offboarding timeline", assignee: "HR", status: "completed" },
        { id: "3", task: "Schedule exit interview", assignee: "HR", status: "completed" },
        { id: "4", task: "Identify knowledge transfer requirements", assignee: "Manager", status: "completed" },
        { id: "5", task: "Prepare asset return checklist", assignee: "IT", status: "in-progress" },
      ],
    },
    {
      category: "Final Week",
      tasks: [
        { id: "6", task: "Conduct exit interview", assignee: "HR", status: "completed" },
        { id: "7", task: "Complete knowledge transfer", assignee: "Employee", status: "in-progress" },
        { id: "8", task: "Return company assets", assignee: "Employee", status: "pending" },
        { id: "9", task: "Revoke system access", assignee: "IT", status: "pending" },
        { id: "10", task: "Calculate final settlement", assignee: "Payroll", status: "completed" },
      ],
    },
    {
      category: "Final Day",
      tasks: [
        { id: "11", task: "Final asset verification", assignee: "IT", status: "pending" },
        { id: "12", task: "Disable all access cards", assignee: "Security", status: "pending" },
        { id: "13", task: "Process final payment", assignee: "Finance", status: "pending" },
        { id: "14", task: "Update employee records", assignee: "HR", status: "pending" },
        { id: "15", task: "Send farewell communication", assignee: "Manager", status: "pending" },
      ],
    },
    {
      category: "Post-Departure",
      tasks: [
        { id: "16", task: "Archive employee documents", assignee: "HR", status: "pending" },
        { id: "17", task: "Update organizational chart", assignee: "HR", status: "pending" },
        { id: "18", task: "Conduct post-departure review", assignee: "Manager", status: "pending" },
        { id: "19", task: "Process final expense claims", assignee: "Finance", status: "pending" },
        { id: "20", task: "Send service certificate", assignee: "HR", status: "pending" },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "returned":
      case "paid":
      case "approved":
        return "bg-green-100 text-green-700"
      case "in-progress":
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "initiated":
      case "scheduled":
        return "bg-blue-100 text-blue-700"
      case "pending-clearance":
        return "bg-orange-100 text-orange-700"
      case "damaged":
      case "lost":
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTerminationTypeColor = (type: string) => {
    switch (type) {
      case "resignation":
        return "bg-blue-100 text-blue-700"
      case "retirement":
        return "bg-green-100 text-green-700"
      case "termination":
        return "bg-red-100 text-red-700"
      case "redundancy":
        return "bg-orange-100 text-orange-700"
      case "end-of-contract":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const calculateProgress = (case_: OffboardingCase) => {
    let completed = 0
    const total = 4

    if (case_.exitInterviewCompleted) completed++
    if (case_.assetsReturned) completed++
    if (case_.finalSettlementCalculated) completed++
    if (case_.knowledgeTransferCompleted) completed++

    return Math.round((completed / total) * 100)
  }

  const handleViewDetails = (case_: OffboardingCase) => {
    setSelectedCase(case_)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Comprehensive employee departure management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" onClick={() => setShowOffboardingDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Start Offboarding
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold">{offboardingCases.filter((c) => c.status !== "completed").length}</p>
              </div>
              <UserX className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Assets</p>
                <p className="text-2xl font-bold text-orange-600">
                  {assets.filter((a) => a.returnStatus === "pending").length}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Settlements</p>
                <p className="text-2xl font-bold text-green-600">
                  {settlements.filter((s) => s.status === "pending").length}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Active Cases</TabsTrigger>
          <TabsTrigger value="assets">Asset Recovery</TabsTrigger>
          <TabsTrigger value="settlements">Final Settlements</TabsTrigger>
          <TabsTrigger value="interviews">Exit Interviews</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Transfer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Departures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offboardingCases.slice(0, 5).map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserX className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{case_.employeeName}</p>
                          <p className="text-sm text-gray-600">
                            {case_.position} • {case_.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getTerminationTypeColor(case_.terminationType)}>
                          {case_.terminationType}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{case_.lastWorkingDay}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offboarding Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offboardingCases.map((case_) => (
                    <div key={case_.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{case_.employeeName}</span>
                        <span className="text-sm text-gray-600">{calculateProgress(case_)}%</span>
                      </div>
                      <Progress value={calculateProgress(case_)} className="h-2" />
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className={case_.exitInterviewCompleted ? "text-green-600" : ""}>Exit Interview</span>
                        <span className={case_.assetsReturned ? "text-green-600" : ""}>Assets</span>
                        <span className={case_.finalSettlementCalculated ? "text-green-600" : ""}>Settlement</span>
                        <span className={case_.knowledgeTransferCompleted ? "text-green-600" : ""}>
                          Knowledge Transfer
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Departure Reasons Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">45%</p>
                  <p className="text-sm text-gray-600">Better Opportunity</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">25%</p>
                  <p className="text-sm text-gray-600">Career Growth</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">20%</p>
                  <p className="text-sm text-gray-600">Compensation</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">10%</p>
                  <p className="text-sm text-gray-600">Work-Life Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search cases..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending-clearance">Pending Clearance</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {offboardingCases.map((case_) => (
              <Card key={case_.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserX className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{case_.employeeName}</h3>
                          <Badge className={getStatusColor(case_.status)}>{case_.status}</Badge>
                          <Badge className={getTerminationTypeColor(case_.terminationType)}>
                            {case_.terminationType}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {case_.employeeId}
                            </span>
                            <span className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
                              {case_.department}
                            </span>
                            <span>{case_.position}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <span>Notice: {case_.noticeDate}</span>
                            <span>Last Day: {case_.lastWorkingDay}</span>
                            <span>Manager: {case_.manager}</span>
                          </div>
                          {case_.reason && <p className="text-gray-700 mt-2">Reason: {case_.reason}</p>}
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-gray-600">{calculateProgress(case_)}%</span>
                          </div>
                          <Progress value={calculateProgress(case_)} className="h-2" />
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(case_)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Asset Recovery Tracking</h2>
            <Button onClick={() => setShowAssetDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>

          <div className="grid gap-4">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        {asset.assetType === "laptop" && <Laptop className="w-6 h-6 text-orange-600" />}
                        {asset.assetType === "phone" && <Package className="w-6 h-6 text-orange-600" />}
                        {asset.assetType === "id-card" && <Shield className="w-6 h-6 text-orange-600" />}
                        {asset.assetType === "keys" && <Key className="w-6 h-6 text-orange-600" />}
                        {!["laptop", "phone", "id-card", "keys"].includes(asset.assetType) && (
                          <Package className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{asset.description}</h3>
                        <p className="text-sm text-gray-600">
                          Employee: {offboardingCases.find((c) => c.employeeId === asset.employeeId)?.employeeName}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          {asset.serialNumber && <span>S/N: {asset.serialNumber}</span>}
                          <span>Assigned: {asset.assignedDate}</span>
                          <span className="capitalize">Condition: {asset.condition}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(asset.returnStatus)}>{asset.returnStatus}</Badge>
                      {asset.returnDate && <span className="text-sm text-gray-500">Returned: {asset.returnDate}</span>}
                    </div>
                  </div>
                  {asset.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{asset.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Final Settlement Calculations</h2>
            <Button onClick={() => setShowSettlementDialog(true)}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Settlement
            </Button>
          </div>

          <div className="grid gap-4">
            {settlements.map((settlement) => (
              <Card key={settlement.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {offboardingCases.find((c) => c.employeeId === settlement.employeeId)?.employeeName}
                      </h3>
                      <p className="text-sm text-gray-600">Employee ID: {settlement.employeeId}</p>
                    </div>
                    <Badge className={getStatusColor(settlement.status)}>{settlement.status}</Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Payables</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Outstanding Salary:</span>
                          <span>GHS {settlement.outstandingSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leave Encashment:</span>
                          <span>GHS {settlement.leaveEncashment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonus:</span>
                          <span>GHS {settlement.bonus.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allowances:</span>
                          <span>GHS {settlement.allowances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Payable:</span>
                          <span>GHS {settlement.totalPayable.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Deductions</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Tax Deductions:</span>
                          <span>GHS {settlement.deductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outstanding Loans:</span>
                          <span>GHS {settlement.loans.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Advances:</span>
                          <span>GHS {settlement.advances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Deductions:</span>
                          <span>GHS {settlement.totalDeductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Net Settlement</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Leave Balance:</span>
                          <span>{settlement.leaveBalance} days</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-4">
                          <span>Net Amount:</span>
                          <span className="text-green-600">GHS {settlement.netAmount.toLocaleString()}</span>
                        </div>
                        {settlement.approvedBy && (
                          <p className="text-xs text-gray-500 mt-2">Approved by: {settlement.approvedBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exit Interviews</h2>
            <Button onClick={() => setShowInterviewDialog(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>

          <div className="grid gap-4">
            {exitInterviews.map((interview) => (
              <Card key={interview.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {offboardingCases.find((c) => c.employeeId === interview.employeeId)?.employeeName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Interview Date: {interview.interviewDate} • Interviewer: {interview.interviewer}
                      </p>
                    </div>
                    <Badge className={getStatusColor(interview.status)}>{interview.status}</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Satisfaction Ratings</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Overall Satisfaction:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < interview.overallSatisfaction ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Work Environment:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < interview.workEnvironment ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Management:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < interview.management ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Compensation:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < interview.compensation ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Feedback</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Reason for Leaving:</p>
                          <p className="text-sm text-gray-600">{interview.reasonForLeaving}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Suggested Improvements:</p>
                          <p className="text-sm text-gray-600">{interview.improvements}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Would Recommend Company:</p>
                          <Badge
                            className={
                              interview.wouldRecommend ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }
                          >
                            {interview.wouldRecommend ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {interview.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Additional Feedback:</p>
                      <p className="text-sm text-gray-600">{interview.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Knowledge Transfer Management</h2>
            <Button>
              <BookOpen className="w-4 h-4 mr-2" />
              Add Transfer Item
            </Button>
          </div>

          <div className="grid gap-4">
            {knowledgeTransfers.map((transfer) => (
              <Card key={transfer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{transfer.description}</h3>
                          <Badge className={getStatusColor(transfer.status)}>{transfer.status}</Badge>
                          <Badge className={getPriorityColor(transfer.priority)}>{transfer.priority}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span>
                              From: {offboardingCases.find((c) => c.employeeId === transfer.employeeId)?.employeeName}
                            </span>
                            <span>To: {transfer.transferTo}</span>
                            <span className="capitalize">Type: {transfer.documentationType}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>Due: {transfer.dueDate}</span>
                            {transfer.completedDate && <span>Completed: {transfer.completedDate}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {transfer.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{transfer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Turnover Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">8 departures</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Month</span>
                    <span className="font-medium">5 departures</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Turnover Rate</span>
                    <span className="font-medium text-orange-600">12.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Tenure</span>
                    <span className="font-medium">2.3 years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exit Interview Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Satisfaction</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Would Recommend</span>
                    <span className="font-medium text-green-600">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Interview Completion</span>
                    <span className="font-medium">90%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Process Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Process Time</span>
                    <span className="font-medium">12 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Asset Recovery Rate</span>
                    <span className="font-medium text-green-600">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Settlement Accuracy</span>
                    <span className="font-medium">98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge Transfer</span>
                    <span className="font-medium">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Offboarding Checklist Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {offboardingChecklist.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="font-medium mb-3">{category.category}</h3>
                    <div className="space-y-2">
                      {category.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={task.status === "completed"}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                            <span className="text-sm">{task.task}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {task.assignee}
                            </Badge>
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Start Offboarding Dialog */}
      <Dialog open={showOffboardingDialog} onOpenChange={setShowOffboardingDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Employee Offboarding</DialogTitle>
            <DialogDescription>Initiate the offboarding process for a departing employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emp1">John Doe (EMP-001)</SelectItem>
                    <SelectItem value="emp2">Jane Smith (EMP-002)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Termination Type *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="redundancy">Redundancy</SelectItem>
                    <SelectItem value="end-of-contract">End of Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notice Date *</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Last Working Day *</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Departure</Label>
              <Textarea placeholder="Provide reason for departure..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Manager/Supervisor</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager1">Jane Smith</SelectItem>
                  <SelectItem value="manager2">Michael Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowOffboardingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowOffboardingDialog(false)}>Start Offboarding Process</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
