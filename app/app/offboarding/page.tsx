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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  UserMinus,
  Clock,
  CheckCircle,
  Download,
  Filter,
  Eye,
  Edit,
  Briefcase,
  Key,
  MessageSquare,
  Calculator,
  TrendingUp,
} from "lucide-react"

// Mock data for offboarding cases
const mockOffboardingCases = [
  {
    id: "OFF-001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    position: "Senior Software Engineer",
    terminationType: "resignation",
    lastWorkingDay: new Date("2024-03-15"),
    submittedDate: new Date("2024-02-15"),
    status: "in_progress",
    progress: 65,
    exitInterviewCompleted: true,
    assetsReturned: false,
    accessRevoked: true,
    finalSettlementCalculated: false,
    clearanceObtained: false,
    reason: "Career advancement opportunity",
    noticePeriod: 30,
    handoverStatus: "in_progress",
    manager: "John Manager",
    hrAssigned: "Sarah HR",
    checklist: [
      { item: "Exit Interview", completed: true, assignedTo: "HR Team", dueDate: new Date("2024-02-20") },
      { item: "Asset Return", completed: false, assignedTo: "IT Team", dueDate: new Date("2024-03-10") },
      { item: "Access Revocation", completed: true, assignedTo: "IT Team", dueDate: new Date("2024-03-15") },
      { item: "Knowledge Transfer", completed: false, assignedTo: "Manager", dueDate: new Date("2024-03-12") },
      { item: "Final Settlement", completed: false, assignedTo: "Payroll Team", dueDate: new Date("2024-03-20") },
      { item: "Clearance Certificate", completed: false, assignedTo: "HR Team", dueDate: new Date("2024-03-22") },
    ],
    assets: [
      { name: "Laptop - Dell XPS 15", serialNumber: "DL123456", returned: false },
      { name: "Mobile Phone - iPhone 13", serialNumber: "IP789012", returned: false },
      { name: "Access Card", serialNumber: "AC345678", returned: true },
      { name: "Office Keys", serialNumber: "OK901234", returned: false },
    ],
    finalSettlement: {
      basicSalary: 8500,
      allowances: 1200,
      overtimePay: 450,
      leaveEncashment: 2800,
      gratuity: 15000,
      deductions: 850,
      netAmount: 27100,
    },
  },
  {
    id: "OFF-002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    position: "HR Manager",
    terminationType: "termination",
    lastWorkingDay: new Date("2024-02-28"),
    submittedDate: new Date("2024-02-15"),
    status: "completed",
    progress: 100,
    exitInterviewCompleted: true,
    assetsReturned: true,
    accessRevoked: true,
    finalSettlementCalculated: true,
    clearanceObtained: true,
    reason: "Performance issues",
    noticePeriod: 0,
    handoverStatus: "completed",
    manager: "CEO",
    hrAssigned: "John HR",
    checklist: [
      { item: "Exit Interview", completed: true, assignedTo: "HR Team", dueDate: new Date("2024-02-20") },
      { item: "Asset Return", completed: true, assignedTo: "IT Team", dueDate: new Date("2024-02-25") },
      { item: "Access Revocation", completed: true, assignedTo: "IT Team", dueDate: new Date("2024-02-28") },
      { item: "Knowledge Transfer", completed: true, assignedTo: "Manager", dueDate: new Date("2024-02-27") },
      { item: "Final Settlement", completed: true, assignedTo: "Payroll Team", dueDate: new Date("2024-03-05") },
      { item: "Clearance Certificate", completed: true, assignedTo: "HR Team", dueDate: new Date("2024-03-07") },
    ],
  },
]

const terminationTypeLabels = {
  resignation: "Resignation",
  termination: "Termination",
  retirement: "Retirement",
  contract_end: "Contract End",
  redundancy: "Redundancy",
  mutual_agreement: "Mutual Agreement",
}

const statusColors = {
  initiated: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-gray-100 text-gray-800",
}

export default function OffboardingPage() {
  const [offboardingCases, setOffboardingCases] = useState(mockOffboardingCases)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isNewOffboardingOpen, setIsNewOffboardingOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  const [newOffboardingForm, setNewOffboardingForm] = useState({
    employeeId: "",
    terminationType: "",
    lastWorkingDay: "",
    reason: "",
    noticePeriod: "",
  })

  const filteredCases = offboardingCases.filter(
    (case_) =>
      case_.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeCases = filteredCases.filter((case_) => case_.status !== "completed")
  const completedCases = filteredCases.filter((case_) => case_.status === "completed")

  const handleNewOffboarding = () => {
    const newCase = {
      id: `OFF-${String(offboardingCases.length + 1).padStart(3, "0")}`,
      employeeId: newOffboardingForm.employeeId,
      employeeName: "Selected Employee", // Would fetch from employee data
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department", // Would fetch from employee data
      position: "Position", // Would fetch from employee data
      terminationType: newOffboardingForm.terminationType,
      lastWorkingDay: new Date(newOffboardingForm.lastWorkingDay),
      submittedDate: new Date(),
      status: "initiated",
      progress: 0,
      exitInterviewCompleted: false,
      assetsReturned: false,
      accessRevoked: false,
      finalSettlementCalculated: false,
      clearanceObtained: false,
      reason: newOffboardingForm.reason,
      noticePeriod: Number.parseInt(newOffboardingForm.noticePeriod),
      handoverStatus: "pending",
      manager: "Current Manager",
      hrAssigned: "Current User",
      checklist: [
        {
          item: "Exit Interview",
          completed: false,
          assignedTo: "HR Team",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          item: "Asset Return",
          completed: false,
          assignedTo: "IT Team",
          dueDate: new Date(newOffboardingForm.lastWorkingDay),
        },
        {
          item: "Access Revocation",
          completed: false,
          assignedTo: "IT Team",
          dueDate: new Date(newOffboardingForm.lastWorkingDay),
        },
        {
          item: "Knowledge Transfer",
          completed: false,
          assignedTo: "Manager",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          item: "Final Settlement",
          completed: false,
          assignedTo: "Payroll Team",
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
        {
          item: "Clearance Certificate",
          completed: false,
          assignedTo: "HR Team",
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        },
      ],
      assets: [],
    }

    setOffboardingCases([...offboardingCases, newCase])
    setIsNewOffboardingOpen(false)
    setNewOffboardingForm({
      employeeId: "",
      terminationType: "",
      lastWorkingDay: "",
      reason: "",
      noticePeriod: "",
    })
    toast({
      title: "Offboarding Process Initiated",
      description: `Offboarding case ${newCase.id} has been created successfully.`,
    })
  }

  const getOffboardingStats = () => {
    const total = offboardingCases.length
    const active = offboardingCases.filter((c) => c.status !== "completed").length
    const completed = offboardingCases.filter((c) => c.status === "completed").length
    const thisMonth = offboardingCases.filter((c) => {
      const caseDate = new Date(c.submittedDate)
      const now = new Date()
      return caseDate.getMonth() === now.getMonth() && caseDate.getFullYear() === now.getFullYear()
    }).length
    return { total, active, completed, thisMonth }
  }

  const stats = getOffboardingStats()

  const updateChecklistItem = (caseId: string, itemIndex: number, completed: boolean) => {
    setOffboardingCases((prev) =>
      prev.map((case_) => {
        if (case_.id === caseId) {
          const updatedChecklist = [...case_.checklist]
          updatedChecklist[itemIndex] = { ...updatedChecklist[itemIndex], completed }
          const completedItems = updatedChecklist.filter((item) => item.completed).length
          const progress = Math.round((completedItems / updatedChecklist.length) * 100)
          const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "initiated"

          return {
            ...case_,
            checklist: updatedChecklist,
            progress,
            status,
          }
        }
        return case_
      }),
    )

    toast({
      title: "Checklist Updated",
      description: "Offboarding checklist item has been updated.",
    })
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
                    <Label htmlFor="employee">Employee</Label>
                    <Select
                      value={newOffboardingForm.employeeId}
                      onValueChange={(value) => setNewOffboardingForm({ ...newOffboardingForm, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante - Technology</SelectItem>
                        <SelectItem value="EMP002">Ama Osei - Human Resources</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah - Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="terminationType">Termination Type</Label>
                    <Select
                      value={newOffboardingForm.terminationType}
                      onValueChange={(value) =>
                        setNewOffboardingForm({ ...newOffboardingForm, terminationType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(terminationTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                    <Input
                      type="date"
                      value={newOffboardingForm.lastWorkingDay}
                      onChange={(e) => setNewOffboardingForm({ ...newOffboardingForm, lastWorkingDay: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="noticePeriod">Notice Period (Days)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={newOffboardingForm.noticePeriod}
                      onChange={(e) => setNewOffboardingForm({ ...newOffboardingForm, noticePeriod: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Leaving</Label>
                  <Textarea
                    placeholder="Provide reason for termination/resignation..."
                    value={newOffboardingForm.reason}
                    onChange={(e) => setNewOffboardingForm({ ...newOffboardingForm, reason: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewOffboardingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleNewOffboarding}>Initiate Offboarding</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
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
              <UserMinus className="w-8 h-8 text-gray-400" />
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
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name, case ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Cases ({stats.active})</TabsTrigger>
          <TabsTrigger value="completed">Completed Cases ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Offboarding Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={case_.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {case_.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{case_.employeeName}</h3>
                          <Badge className={statusColors[case_.status as keyof typeof statusColors]}>
                            {case_.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {terminationTypeLabels[case_.terminationType as keyof typeof terminationTypeLabels]}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {case_.id} • {case_.department}
                          </span>
                          <span className="text-sm text-gray-500">
                            Last Day: {case_.lastWorkingDay.toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-500">Manager: {case_.manager}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Progress value={case_.progress} className="w-32" />
                            <span className="text-sm text-gray-600">{case_.progress}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {case_.exitInterviewCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {case_.assetsReturned && <Briefcase className="w-4 h-4 text-green-500" />}
                            {case_.accessRevoked && <Key className="w-4 h-4 text-green-500" />}
                            {case_.finalSettlementCalculated && <Calculator className="w-4 h-4 text-green-500" />}
                          </div>
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
                          <DropdownMenuItem onClick={() => setSelectedCase(case_)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Exit Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calculator className="w-4 h-4 mr-2" />
                            Calculate Settlement
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Offboarding Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={case_.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {case_.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{case_.employeeName}</h3>
                          <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>
                          <Badge variant="outline">
                            {terminationTypeLabels[case_.terminationType as keyof typeof terminationTypeLabels]}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {case_.id} • {case_.department}
                          </span>
                          <span className="text-sm text-gray-500">
                            Completed: {case_.lastWorkingDay.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCase(case_)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Details Modal */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offboarding Details - {selectedCase?.id}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedCase.employeeAvatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedCase.employeeName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-lg">{selectedCase.employeeName}</p>
                      <p className="text-sm text-gray-600">{selectedCase.employeeId}</p>
                      <p className="text-sm text-gray-600">{selectedCase.position}</p>
                      <p className="text-sm text-gray-600">{selectedCase.department}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Offboarding Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>
                        {terminationTypeLabels[selectedCase.terminationType as keyof typeof terminationTypeLabels]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Working Day:</span>
                      <span>{selectedCase.lastWorkingDay.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notice Period:</span>
                      <span>{selectedCase.noticePeriod} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manager:</span>
                      <span>{selectedCase.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">HR Assigned:</span>
                      <span>{selectedCase.hrAssigned}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Progress Overview</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Overall Progress</span>
                        <span className="text-sm text-gray-600">{selectedCase.progress}%</span>
                      </div>
                      <Progress value={selectedCase.progress} className="w-full" />
                    </div>
                    <Badge className={statusColors[selectedCase.status as keyof typeof statusColors]}>
                      {selectedCase.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reason for Leaving</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedCase.reason}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Offboarding Checklist</h4>
                <div className="space-y-3">
                  {selectedCase.checklist?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={(checked) => updateChecklistItem(selectedCase.id, index, checked as boolean)}
                        />
                        <div>
                          <p
                            className={`font-medium ${item.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                          >
                            {item.item}
                          </p>
                          <p className="text-sm text-gray-600">Assigned to: {item.assignedTo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Due: {item.dueDate.toLocaleDateString()}</p>
                        {item.completed && <CheckCircle className="w-4 h-4 text-green-500 mt-1 ml-auto" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCase.assets && selectedCase.assets.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Asset Return Status</h4>
                  <div className="space-y-2">
                    {selectedCase.assets.map((asset: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-gray-600">Serial: {asset.serialNumber}</p>
                        </div>
                        <Badge className={asset.returned ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {asset.returned ? "Returned" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.finalSettlement && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Final Settlement Calculation</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Earnings</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Basic Salary:</span>
                            <span>GH₵ {selectedCase.finalSettlement.basicSalary.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Allowances:</span>
                            <span>GH₵ {selectedCase.finalSettlement.allowances.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Overtime Pay:</span>
                            <span>GH₵ {selectedCase.finalSettlement.overtimePay.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Leave Encashment:</span>
                            <span>GH₵ {selectedCase.finalSettlement.leaveEncashment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gratuity:</span>
                            <span>GH₵ {selectedCase.finalSettlement.gratuity.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Deductions</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Deductions:</span>
                            <span>GH₵ {selectedCase.finalSettlement.deductions.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="border-t border-gray-300 mt-4 pt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Net Amount:</span>
                            <span className="text-green-600">
                              GH₵ {selectedCase.finalSettlement.netAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedCase(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
