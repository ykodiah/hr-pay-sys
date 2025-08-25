"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  LogOut,
  Laptop,
  Key,
  CreditCard,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Shield,
  Building,
  Phone,
} from "lucide-react"

interface OffboardingCase {
  id: string
  employeeId: string
  employeeName: string
  department: string
  position: string
  manager: string
  terminationType: "resignation" | "termination" | "retirement" | "contract-end" | "redundancy"
  terminationReason: string
  lastWorkingDay: string
  noticeDate: string
  noticePeriod: number
  status: "initiated" | "in-progress" | "pending-clearance" | "completed"
  progress: number
  exitInterviewCompleted: boolean
  assetsReturned: boolean
  finalPayCalculated: boolean
  clearanceCertificateIssued: boolean
  accessRevoked: boolean
  knowledgeTransferCompleted: boolean
}

interface Asset {
  id: string
  name: string
  type: "laptop" | "phone" | "id-card" | "keys" | "equipment" | "other"
  serialNumber?: string
  condition: "good" | "fair" | "poor" | "damaged"
  returned: boolean
  returnDate?: string
  notes?: string
}

interface ExitInterview {
  id: string
  employeeId: string
  interviewDate: string
  interviewer: string
  overallSatisfaction: number
  reasonForLeaving: string
  workEnvironmentRating: number
  managementRating: number
  compensationRating: number
  careerDevelopmentRating: number
  workLifeBalanceRating: number
  wouldRecommendCompany: boolean
  suggestions: string
  feedback: string
}

export default function OffboardingPage() {
  const [activeTab, setActiveTab] = useState("cases")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<OffboardingCase | null>(null)

  // Sample data
  const [offboardingCases, setOffboardingCases] = useState<OffboardingCase[]>([
    {
      id: "OFF001",
      employeeId: "EMP001",
      employeeName: "John Doe",
      department: "Sales",
      position: "Sales Manager",
      manager: "Jane Smith",
      terminationType: "resignation",
      terminationReason: "Career advancement opportunity",
      lastWorkingDay: "2024-04-15",
      noticeDate: "2024-03-15",
      noticePeriod: 30,
      status: "in-progress",
      progress: 65,
      exitInterviewCompleted: true,
      assetsReturned: false,
      finalPayCalculated: true,
      clearanceCertificateIssued: false,
      accessRevoked: false,
      knowledgeTransferCompleted: true,
    },
    {
      id: "OFF002",
      employeeId: "EMP002",
      employeeName: "Mary Johnson",
      department: "Finance",
      position: "Accountant",
      manager: "Robert Brown",
      terminationType: "retirement",
      terminationReason: "Reached retirement age",
      lastWorkingDay: "2024-03-30",
      noticeDate: "2024-01-30",
      noticePeriod: 60,
      status: "completed",
      progress: 100,
      exitInterviewCompleted: true,
      assetsReturned: true,
      finalPayCalculated: true,
      clearanceCertificateIssued: true,
      accessRevoked: true,
      knowledgeTransferCompleted: true,
    },
  ])

  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "AST001",
      name: "MacBook Pro",
      type: "laptop",
      serialNumber: "MBP2023001",
      condition: "good",
      returned: false,
    },
    {
      id: "AST002",
      name: "iPhone 14",
      type: "phone",
      serialNumber: "IP14001",
      condition: "good",
      returned: false,
    },
    {
      id: "AST003",
      name: "Employee ID Card",
      type: "id-card",
      condition: "good",
      returned: false,
    },
    {
      id: "AST004",
      name: "Office Keys",
      type: "keys",
      condition: "good",
      returned: false,
    },
  ])

  const [exitInterviews, setExitInterviews] = useState<ExitInterview[]>([
    {
      id: "EI001",
      employeeId: "EMP001",
      interviewDate: "2024-03-20",
      interviewer: "HR Manager",
      overallSatisfaction: 4,
      reasonForLeaving: "Career advancement opportunity",
      workEnvironmentRating: 4,
      managementRating: 4,
      compensationRating: 3,
      careerDevelopmentRating: 3,
      workLifeBalanceRating: 4,
      wouldRecommendCompany: true,
      suggestions: "Improve career development programs",
      feedback: "Great company culture and supportive team environment",
    },
  ])

  const [newCase, setNewCase] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    position: "",
    manager: "",
    terminationType: "",
    terminationReason: "",
    lastWorkingDay: "",
    noticeDate: "",
    noticePeriod: 30,
  })

  const handleCreateCase = () => {
    const caseId = `OFF${String(offboardingCases.length + 1).padStart(3, "0")}`
    const newOffboardingCase: OffboardingCase = {
      id: caseId,
      ...newCase,
      status: "initiated",
      progress: 0,
      exitInterviewCompleted: false,
      assetsReturned: false,
      finalPayCalculated: false,
      clearanceCertificateIssued: false,
      accessRevoked: false,
      knowledgeTransferCompleted: false,
    } as OffboardingCase

    setOffboardingCases([...offboardingCases, newOffboardingCase])
    setIsNewCaseOpen(false)
    setNewCase({
      employeeId: "",
      employeeName: "",
      department: "",
      position: "",
      manager: "",
      terminationType: "",
      terminationReason: "",
      lastWorkingDay: "",
      noticeDate: "",
      noticePeriod: 30,
    })
    toast({
      title: "Offboarding Case Created",
      description: `Case ${caseId} has been created successfully.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "initiated":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending-clearance":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTerminationTypeColor = (type: string) => {
    switch (type) {
      case "resignation":
        return "bg-blue-100 text-blue-800"
      case "termination":
        return "bg-red-100 text-red-800"
      case "retirement":
        return "bg-purple-100 text-purple-800"
      case "contract-end":
        return "bg-gray-100 text-gray-800"
      case "redundancy":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateDaysRemaining = (lastWorkingDay: string) => {
    const today = new Date()
    const lastDay = new Date(lastWorkingDay)
    const diffTime = lastDay.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Manage employee departures with comprehensive offboarding workflows</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Offboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Initiate Employee Offboarding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee-id">Employee ID</Label>
                    <Input
                      id="employee-id"
                      value={newCase.employeeId}
                      onChange={(e) => setNewCase({ ...newCase, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employee-name">Employee Name</Label>
                    <Input
                      id="employee-name"
                      value={newCase.employeeName}
                      onChange={(e) => setNewCase({ ...newCase, employeeName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newCase.department}
                      onChange={(e) => setNewCase({ ...newCase, department: e.target.value })}
                      placeholder="Sales"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={newCase.position}
                      onChange={(e) => setNewCase({ ...newCase, position: e.target.value })}
                      placeholder="Sales Manager"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manager">Manager</Label>
                    <Input
                      id="manager"
                      value={newCase.manager}
                      onChange={(e) => setNewCase({ ...newCase, manager: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="termination-type">Termination Type</Label>
                    <Select
                      value={newCase.terminationType}
                      onValueChange={(value) => setNewCase({ ...newCase, terminationType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resignation">Resignation</SelectItem>
                        <SelectItem value="termination">Termination</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="contract-end">Contract End</SelectItem>
                        <SelectItem value="redundancy">Redundancy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notice-date">Notice Date</Label>
                    <Input
                      id="notice-date"
                      type="date"
                      value={newCase.noticeDate}
                      onChange={(e) => setNewCase({ ...newCase, noticeDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-working-day">Last Working Day</Label>
                    <Input
                      id="last-working-day"
                      type="date"
                      value={newCase.lastWorkingDay}
                      onChange={(e) => setNewCase({ ...newCase, lastWorkingDay: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notice-period">Notice Period (Days)</Label>
                    <Input
                      id="notice-period"
                      type="number"
                      value={newCase.noticePeriod}
                      onChange={(e) => setNewCase({ ...newCase, noticePeriod: Number.parseInt(e.target.value) })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="termination-reason">Reason for Leaving</Label>
                  <Textarea
                    id="termination-reason"
                    value={newCase.terminationReason}
                    onChange={(e) => setNewCase({ ...newCase, terminationReason: e.target.value })}
                    placeholder="Describe the reason for leaving..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewCaseOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCase}>Create Offboarding Case</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {offboardingCases.filter((c) => c.status !== "completed").length}
                </p>
              </div>
              <LogOut className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Clearances</p>
                <p className="text-2xl font-bold text-gray-900">
                  {offboardingCases.filter((c) => c.status === "pending-clearance").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {offboardingCases.filter((c) => c.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assets Pending Return</p>
                <p className="text-2xl font-bold text-gray-900">{assets.filter((a) => !a.returned).length}</p>
              </div>
              <Laptop className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases">Offboarding Cases</TabsTrigger>
          <TabsTrigger value="exit-interviews">Exit Interviews</TabsTrigger>
          <TabsTrigger value="assets">Asset Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search cases by employee name, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending-clearance">Pending Clearance</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Cases List */}
          <div className="space-y-4">
            {offboardingCases.map((case_) => (
              <Card key={case_.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{case_.id}</h3>
                        <Badge className={getStatusColor(case_.status)}>{case_.status.replace("-", " ")}</Badge>
                        <Badge className={getTerminationTypeColor(case_.terminationType)}>
                          {case_.terminationType.replace("-", " ")}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Employee:</span> {case_.employeeName}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {case_.department}
                        </div>
                        <div>
                          <span className="font-medium">Position:</span> {case_.position}
                        </div>
                        <div>
                          <span className="font-medium">Manager:</span> {case_.manager}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Last Working Day:</span>{" "}
                          {new Date(case_.lastWorkingDay).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Days Remaining:</span>{" "}
                          <span
                            className={
                              calculateDaysRemaining(case_.lastWorkingDay) <= 7
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }
                          >
                            {calculateDaysRemaining(case_.lastWorkingDay)} days
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Notice Period:</span> {case_.noticePeriod} days
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{case_.terminationReason}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Offboarding Progress</span>
                          <span className="text-sm text-gray-500">{case_.progress}%</span>
                        </div>
                        <Progress value={case_.progress} className="w-full" />
                      </div>

                      {/* Checklist */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          {case_.exitInterviewCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={case_.exitInterviewCompleted ? "text-green-700" : "text-gray-600"}>
                            Exit Interview
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {case_.assetsReturned ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={case_.assetsReturned ? "text-green-700" : "text-gray-600"}>
                            Assets Returned
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {case_.finalPayCalculated ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={case_.finalPayCalculated ? "text-green-700" : "text-gray-600"}>
                            Final Pay Calculated
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {case_.accessRevoked ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={case_.accessRevoked ? "text-green-700" : "text-gray-600"}>
                            Access Revoked
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {case_.knowledgeTransferCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={case_.knowledgeTransferCompleted ? "text-green-700" : "text-gray-600"}>
                            Knowledge Transfer
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {case_.clearanceCertificateIssued ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={case_.clearanceCertificateIssued ? "text-green-700" : "text-gray-600"}>
                            Clearance Certificate
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exit-interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Exit Interviews</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exitInterviews.map((interview) => (
                  <div key={interview.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Employee: {interview.employeeId}</h4>
                        <p className="text-sm text-gray-600">
                          Interview Date: {new Date(interview.interviewDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Interviewer: {interview.interviewer}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Overall Satisfaction</div>
                        <div className="text-2xl font-bold text-gray-900">{interview.overallSatisfaction}/5</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Work Environment:</span> {interview.workEnvironmentRating}/5
                      </div>
                      <div>
                        <span className="font-medium">Management:</span> {interview.managementRating}/5
                      </div>
                      <div>
                        <span className="font-medium">Compensation:</span> {interview.compensationRating}/5
                      </div>
                      <div>
                        <span className="font-medium">Career Development:</span> {interview.careerDevelopmentRating}/5
                      </div>
                      <div>
                        <span className="font-medium">Work-Life Balance:</span> {interview.workLifeBalanceRating}/5
                      </div>
                      <div>
                        <span className="font-medium">Would Recommend:</span>{" "}
                        {interview.wouldRecommendCompany ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-sm">Reason for Leaving:</span>
                        <p className="text-sm text-gray-700">{interview.reasonForLeaving}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Suggestions:</span>
                        <p className="text-sm text-gray-700">{interview.suggestions}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Additional Feedback:</span>
                        <p className="text-sm text-gray-700">{interview.feedback}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Laptop className="w-5 h-5" />
                <span>Asset Return Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {asset.type === "laptop" && <Laptop className="w-5 h-5 text-gray-600" />}
                        {asset.type === "phone" && <Phone className="w-5 h-5 text-gray-600" />}
                        {asset.type === "id-card" && <CreditCard className="w-5 h-5 text-gray-600" />}
                        {asset.type === "keys" && <Key className="w-5 h-5 text-gray-600" />}
                        {asset.type === "equipment" && <Building className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{asset.name}</h4>
                        {asset.serialNumber && <p className="text-sm text-gray-600">Serial: {asset.serialNumber}</p>}
                        <p className="text-sm text-gray-600">Condition: {asset.condition}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={asset.returned ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {asset.returned ? "Returned" : "Pending"}
                      </Badge>
                      {!asset.returned && (
                        <Button size="sm" variant="outline">
                          Mark Returned
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Ghana Labour Act Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Termination Procedures</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Notice period requirements met</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Final pay calculations compliant</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Severance pay calculated (if applicable)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Proper documentation maintained</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Employee Rights</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Outstanding leave days calculated</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Provident fund contributions settled</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">SSNIT contributions up to date</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Clearance certificate issued</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Key Compliance Requirements</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Section 20: Minimum notice periods (1 week to 1 month based on service length)</li>
                    <li>• Section 21: Payment in lieu of notice permitted</li>
                    <li>• Section 22: Final pay must include all outstanding entitlements</li>
                    <li>• Section 23: Severance pay for redundancy situations</li>
                    <li>• Section 24: Proper documentation and clearance procedures</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
