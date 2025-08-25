"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  UserMinus,
  FileText,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Download,
  Briefcase,
  Key,
  CreditCard,
  BookOpen,
  MessageSquare,
  Shield,
  Archive,
  TrendingDown,
} from "lucide-react"

// Mock data for demonstration
const mockOffboardingCases = [
  {
    id: "OFF001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    position: "Senior Software Engineer",
    terminationType: "resignation",
    terminationReason: "Career advancement",
    lastWorkingDay: new Date("2024-03-15"),
    initiatedBy: "Employee",
    initiatedDate: new Date("2024-02-15"),
    status: "in-progress",
    progress: 65,
    exitInterviewCompleted: true,
    assetsReturned: false,
    accessRevoked: false,
    finalPayCalculated: true,
    documentsHandedOver: false,
    knowledgeTransferCompleted: false,
    manager: "John Manager",
    hrContact: "Sarah HR",
    assets: [
      { type: "Laptop", model: "MacBook Pro 16", serialNumber: "ABC123", returned: false },
      { type: "Phone", model: "iPhone 13", serialNumber: "XYZ789", returned: false },
      { type: "Access Card", number: "AC001", returned: true },
    ],
    finalPay: {
      basicSalary: 8500,
      allowances: 1200,
      overtime: 450,
      bonus: 2000,
      leaveEncashment: 3200,
      severancePay: 0,
      deductions: 850,
      netPay: 14500,
    },
  },
  {
    id: "OFF002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    position: "HR Manager",
    terminationType: "termination",
    terminationReason: "Redundancy",
    lastWorkingDay: new Date("2024-03-01"),
    initiatedBy: "Company",
    initiatedDate: new Date("2024-02-01"),
    status: "completed",
    progress: 100,
    exitInterviewCompleted: true,
    assetsReturned: true,
    accessRevoked: true,
    finalPayCalculated: true,
    documentsHandedOver: true,
    knowledgeTransferCompleted: true,
    manager: "CEO",
    hrContact: "Sarah HR",
    assets: [
      { type: "Laptop", model: "Dell Latitude", serialNumber: "DEF456", returned: true },
      { type: "Access Card", number: "AC002", returned: true },
    ],
    finalPay: {
      basicSalary: 7200,
      allowances: 800,
      overtime: 0,
      bonus: 0,
      leaveEncashment: 2400,
      severancePay: 14400,
      deductions: 720,
      netPay: 24080,
    },
  },
]

const terminationTypes = {
  resignation: { label: "Resignation", color: "bg-blue-100 text-blue-800", icon: UserMinus },
  termination: { label: "Termination", color: "bg-red-100 text-red-800", icon: AlertCircle },
  retirement: { label: "Retirement", color: "bg-green-100 text-green-800", icon: Clock },
  "end-of-contract": { label: "End of Contract", color: "bg-yellow-100 text-yellow-800", icon: FileText },
  redundancy: { label: "Redundancy", color: "bg-purple-100 text-purple-800", icon: TrendingDown },
}

const statusTypes = {
  initiated: { label: "Initiated", color: "bg-gray-100 text-gray-800" },
  "in-progress": { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  "pending-approval": { label: "Pending Approval", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
}

const offboardingChecklist = [
  { id: "exit-interview", label: "Exit Interview", icon: MessageSquare, required: true },
  { id: "asset-return", label: "Asset Return", icon: Briefcase, required: true },
  { id: "access-revocation", label: "Access Revocation", icon: Key, required: true },
  { id: "final-pay", label: "Final Pay Calculation", icon: CreditCard, required: true },
  { id: "document-handover", label: "Document Handover", icon: FileText, required: true },
  { id: "knowledge-transfer", label: "Knowledge Transfer", icon: BookOpen, required: false },
  { id: "clearance-certificate", label: "Clearance Certificate", icon: Shield, required: true },
]

export default function OffboardingPage() {
  const [offboardingCases, setOffboardingCases] = useState(mockOffboardingCases)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTerminationType, setSelectedTerminationType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isNewOffboardingOpen, setIsNewOffboardingOpen] = useState(false)
  const [isExitInterviewOpen, setIsExitInterviewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("cases")

  const [newOffboarding, setNewOffboarding] = useState({
    employeeId: "",
    terminationType: "",
    terminationReason: "",
    lastWorkingDay: "",
    noticePeriod: "",
    notes: "",
  })

  const [exitInterview, setExitInterview] = useState({
    overallExperience: "",
    reasonForLeaving: "",
    managerFeedback: "",
    workEnvironment: "",
    careerDevelopment: "",
    compensation: "",
    recommendations: "",
    wouldRecommend: "",
    wouldRehire: "",
  })

  const filteredCases = offboardingCases.filter((offboardingCase) => {
    const matchesSearch =
      offboardingCase.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offboardingCase.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offboardingCase.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedTerminationType === "all" || offboardingCase.terminationType === selectedTerminationType
    const matchesStatus = selectedStatus === "all" || offboardingCase.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getOffboardingStats = () => {
    const total = offboardingCases.length
    const active = offboardingCases.filter((c) =>
      ["initiated", "in-progress", "pending-approval"].includes(c.status),
    ).length
    const completed = offboardingCases.filter((c) => c.status === "completed").length
    const thisMonth = offboardingCases.filter((c) => {
      const lastWorkingDay = new Date(c.lastWorkingDay)
      const now = new Date()
      return lastWorkingDay.getMonth() === now.getMonth() && lastWorkingDay.getFullYear() === now.getFullYear()
    }).length
    return { total, active, completed, thisMonth }
  }

  const stats = getOffboardingStats()

  const handleCreateOffboarding = () => {
    if (!newOffboarding.employeeId || !newOffboarding.terminationType || !newOffboarding.lastWorkingDay) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const offboardingCase = {
      id: `OFF${String(offboardingCases.length + 1).padStart(3, "0")}`,
      employeeId: newOffboarding.employeeId,
      employeeName: "Employee Name", // Would fetch from employee data
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department",
      position: "Position",
      terminationType: newOffboarding.terminationType,
      terminationReason: newOffboarding.terminationReason,
      lastWorkingDay: new Date(newOffboarding.lastWorkingDay),
      initiatedBy: "HR",
      initiatedDate: new Date(),
      status: "initiated",
      progress: 0,
      exitInterviewCompleted: false,
      assetsReturned: false,
      accessRevoked: false,
      finalPayCalculated: false,
      documentsHandedOver: false,
      knowledgeTransferCompleted: false,
      manager: "Manager Name",
      hrContact: "Current User",
      assets: [],
      finalPay: {
        basicSalary: 0,
        allowances: 0,
        overtime: 0,
        bonus: 0,
        leaveEncashment: 0,
        severancePay: 0,
        deductions: 0,
        netPay: 0,
      },
    }

    setOffboardingCases([...offboardingCases, offboardingCase])
    setNewOffboarding({
      employeeId: "",
      terminationType: "",
      terminationReason: "",
      lastWorkingDay: "",
      noticePeriod: "",
      notes: "",
    })
    setIsNewOffboardingOpen(false)

    toast({
      title: "Offboarding Initiated",
      description: `Offboarding process ${offboardingCase.id} has been created successfully.`,
    })
  }

  const handleStatusUpdate = (caseId: string, newStatus: string) => {
    setOffboardingCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c)))

    toast({
      title: "Status Updated",
      description: `Offboarding status changed to ${statusTypes[newStatus as keyof typeof statusTypes].label}.`,
    })
  }

  const calculateProgress = (offboardingCase: any) => {
    const checklist = [
      offboardingCase.exitInterviewCompleted,
      offboardingCase.assetsReturned,
      offboardingCase.accessRevoked,
      offboardingCase.finalPayCalculated,
      offboardingCase.documentsHandedOver,
      offboardingCase.knowledgeTransferCompleted,
    ]
    const completed = checklist.filter(Boolean).length
    return Math.round((completed / checklist.length) * 100)
  }

  const handleExitInterviewSubmit = () => {
    if (selectedCase) {
      setOffboardingCases((prev) =>
        prev.map((c) =>
          c.id === selectedCase.id
            ? {
                ...c,
                exitInterviewCompleted: true,
                progress: calculateProgress({ ...c, exitInterviewCompleted: true }),
              }
            : c,
        ),
      )
      setIsExitInterviewOpen(false)
      toast({
        title: "Exit Interview Completed",
        description: "Exit interview has been recorded successfully.",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-gray-600">Manage employee departures and ensure smooth transitions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewOffboardingOpen} onOpenChange={setIsNewOffboardingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Initiate Offboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Initiate Employee Offboarding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee *</Label>
                    <Select
                      value={newOffboarding.employeeId}
                      onValueChange={(value) => setNewOffboarding({ ...newOffboarding, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante</SelectItem>
                        <SelectItem value="EMP002">Ama Osei</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="terminationType">Termination Type *</Label>
                    <Select
                      value={newOffboarding.terminationType}
                      onValueChange={(value) => setNewOffboarding({ ...newOffboarding, terminationType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(terminationTypes).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastWorkingDay">Last Working Day *</Label>
                    <Input
                      id="lastWorkingDay"
                      type="date"
                      value={newOffboarding.lastWorkingDay}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, lastWorkingDay: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="noticePeriod">Notice Period (days)</Label>
                    <Input
                      id="noticePeriod"
                      type="number"
                      value={newOffboarding.noticePeriod}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, noticePeriod: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="terminationReason">Reason for Termination</Label>
                  <Input
                    id="terminationReason"
                    value={newOffboarding.terminationReason}
                    onChange={(e) => setNewOffboarding({ ...newOffboarding, terminationReason: e.target.value })}
                    placeholder="Brief reason for departure"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={newOffboarding.notes}
                    onChange={(e) => setNewOffboarding({ ...newOffboarding, notes: e.target.value })}
                    placeholder="Any additional information..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewOffboardingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOffboarding}>Initiate Offboarding</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-600">Total Cases</p>
              </div>
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
                <p className="text-sm text-gray-600">Active Cases</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
                <p className="text-sm text-gray-600">This Month</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name, ID, or case number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTerminationType} onValueChange={setSelectedTerminationType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Termination type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(terminationTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusTypes).map(([key, status]) => (
                  <SelectItem key={key} value={key}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cases">Offboarding Cases ({filteredCases.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="compliance">Ghana Labour Act Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Offboarding Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCases.length > 0 ? (
                  filteredCases.map((offboardingCase) => {
                    const TerminationIcon =
                      terminationTypes[offboardingCase.terminationType as keyof typeof terminationTypes].icon
                    const progress = calculateProgress(offboardingCase)
                    return (
                      <div
                        key={offboardingCase.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                            <TerminationIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{offboardingCase.employeeName}</h3>
                              <Badge
                                className={
                                  terminationTypes[offboardingCase.terminationType as keyof typeof terminationTypes]
                                    .color
                                }
                              >
                                {
                                  terminationTypes[offboardingCase.terminationType as keyof typeof terminationTypes]
                                    .label
                                }
                              </Badge>
                              <Badge className={statusTypes[offboardingCase.status as keyof typeof statusTypes].color}>
                                {statusTypes[offboardingCase.status as keyof typeof statusTypes].label}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <Avatar className="w-5 h-5 mr-2">
                                  <AvatarImage src={offboardingCase.employeeAvatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {offboardingCase.employeeName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {offboardingCase.employeeId} • {offboardingCase.department}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Last day: {offboardingCase.lastWorkingDay.toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {offboardingCase.manager}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Progress value={progress} className="flex-1 max-w-xs" />
                              <span className="text-sm text-gray-600">{progress}% complete</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCase(offboardingCase)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCase(offboardingCase)
                                  setIsExitInterviewOpen(true)
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Exit Interview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Case
                              </DropdownMenuItem>
                              {offboardingCase.status !== "completed" && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(offboardingCase.id, "completed")}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Export Case File
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <Archive className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No offboarding cases found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Termination Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resignation</span>
                    <span className="font-semibold">60%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Termination</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Retirement</span>
                    <span className="font-semibold">10%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">End of Contract</span>
                    <span className="font-semibold">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Offboarding Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Completion Time</span>
                    <span className="font-semibold">8 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fastest Completion</span>
                    <span className="font-semibold">3 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Longest Completion</span>
                    <span className="font-semibold">21 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Ghana Labour Act 2003 (Act 651) Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Termination Procedures</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Notice period requirements met
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Severance pay calculations accurate
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Final pay includes all entitlements
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Proper documentation maintained
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Employee Rights</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Right to appeal termination
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Access to employment records
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Timely payment of final dues
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Certificate of service provided
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Legal Requirements Checklist</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 65: Notice of termination
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 66: Payment in lieu of notice
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 67: Severance pay entitlement
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 68: Final payment timeline
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 69: Certificate of service
                      </div>
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Section 70: Record retention requirements
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exit Interview Dialog */}
      <Dialog open={isExitInterviewOpen} onOpenChange={setIsExitInterviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exit Interview - {selectedCase?.employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="overallExperience">Overall Experience (1-10)</Label>
                <Select
                  value={exitInterview.overallExperience}
                  onValueChange={(value) => setExitInterview({ ...exitInterview, overallExperience: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate overall experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1} - {i < 3 ? "Poor" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="wouldRecommend">Would Recommend Company</Label>
                <Select
                  value={exitInterview.wouldRecommend}
                  onValueChange={(value) => setExitInterview({ ...exitInterview, wouldRecommend: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Would you recommend?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reasonForLeaving">Primary Reason for Leaving</Label>
              <Textarea
                id="reasonForLeaving"
                value={exitInterview.reasonForLeaving}
                onChange={(e) => setExitInterview({ ...exitInterview, reasonForLeaving: e.target.value })}
                placeholder="Please describe your primary reason for leaving..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="managerFeedback">Manager/Supervisor Feedback</Label>
              <Textarea
                id="managerFeedback"
                value={exitInterview.managerFeedback}
                onChange={(e) => setExitInterview({ ...exitInterview, managerFeedback: e.target.value })}
                placeholder="How would you rate your relationship with your manager?"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="workEnvironment">Work Environment & Culture</Label>
              <Textarea
                id="workEnvironment"
                value={exitInterview.workEnvironment}
                onChange={(e) => setExitInterview({ ...exitInterview, workEnvironment: e.target.value })}
                placeholder="How would you describe the work environment and company culture?"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="recommendations">Recommendations for Improvement</Label>
              <Textarea
                id="recommendations"
                value={exitInterview.recommendations}
                onChange={(e) => setExitInterview({ ...exitInterview, recommendations: e.target.value })}
                placeholder="What recommendations do you have for improving the company?"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExitInterviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExitInterviewSubmit}>Complete Interview</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
