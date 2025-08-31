"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Eye,
  Download,
  DollarSign,
} from "lucide-react"

const initialPromotions = [
  {
    id: 1,
    employeeName: "Ama Osei",
    employeeId: "EMP002",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    currentGrade: "Grade 7",
    currentStep: "Step 3",
    currentSalary: 4500,
    proposedGrade: "Grade 8",
    proposedStep: "Step 1",
    proposedSalary: 5200,
    effectiveDate: "2025-03-01",
    reason: "Excellent performance and completion of leadership training",
    status: "Pending",
    initiatedBy: "John Doe",
    initiatedDate: "2025-01-20",
    approvalStage: "Line Manager",
    attachments: ["performance_appraisal_2024.pdf", "leadership_certificate.pdf"],
    comments: [],
    eligibilityChecks: {
      tenure: { passed: true, details: "2.5 years in current grade" },
      appraisal: { passed: true, details: "Exceeds expectations (4.2/5.0)" },
      training: { passed: true, details: "Leadership training completed" },
      disciplinary: { passed: true, details: "No disciplinary issues" },
      budget: { passed: true, details: "Within budget allocation" },
    },
  },
  {
    id: 2,
    employeeName: "Kofi Mensah",
    employeeId: "EMP003",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Marketing",
    currentGrade: "Grade 6",
    currentStep: "Step 5",
    currentSalary: 3800,
    proposedGrade: "Grade 7",
    proposedStep: "Step 1",
    proposedSalary: 4200,
    effectiveDate: "2025-02-15",
    reason: "Outstanding sales performance and team leadership",
    status: "Approved",
    initiatedBy: "Jane Smith",
    initiatedDate: "2025-01-10",
    approvedDate: "2025-01-25",
    approvalStage: "Completed",
    attachments: ["sales_report_2024.pdf", "team_feedback.pdf"],
    comments: [
      { author: "Jane Smith", message: "Exceptional performance this year", date: "2025-01-10" },
      { author: "HR Director", message: "Approved for promotion", date: "2025-01-25" },
    ],
    eligibilityChecks: {
      tenure: { passed: true, details: "3 years in current grade" },
      appraisal: { passed: true, details: "Outstanding performance (4.8/5.0)" },
      training: { passed: true, details: "All required training completed" },
      disciplinary: { passed: true, details: "No disciplinary issues" },
      budget: { passed: true, details: "Within budget allocation" },
    },
  },
]

const salaryGrades = [
  { grade: "Grade 1", steps: [1800, 1950, 2100, 2250, 2400] },
  { grade: "Grade 2", steps: [2200, 2380, 2560, 2740, 2920] },
  { grade: "Grade 3", steps: [2600, 2810, 3020, 3230, 3440] },
  { grade: "Grade 4", steps: [3000, 3240, 3480, 3720, 3960] },
  { grade: "Grade 5", steps: [3400, 3670, 3940, 4210, 4480] },
  { grade: "Grade 6", steps: [3800, 4100, 4400, 4700, 5000] },
  { grade: "Grade 7", steps: [4200, 4530, 4860, 5190, 5520] },
  { grade: "Grade 8", steps: [4600, 4960, 5320, 5680, 6040] },
  { grade: "Grade 9", steps: [5000, 5390, 5780, 6170, 6560] },
  { grade: "Grade 10", steps: [5400, 5820, 6240, 6660, 7080] },
]

const approvalWorkflow = [
  { stage: "Line Manager", role: "Direct Supervisor" },
  { stage: "HOD", role: "Head of Department" },
  { stage: "HR", role: "HR Director" },
  { stage: "Finance", role: "Finance Director" },
  { stage: "CEO", role: "Chief Executive Officer" },
]

function getStatusIcon(status: string) {
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

function getStatusBadge(status: string) {
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

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isNewPromotionDialogOpen, setIsNewPromotionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("promotions")

  const filteredPromotions = promotions.filter((promotion) => {
    const matchesStatus = statusFilter === "all" || promotion.status.toLowerCase() === statusFilter
    const matchesDepartment = departmentFilter === "all" || promotion.department === departmentFilter
    const matchesSearch =
      promotion.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.currentGrade.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesDepartment && matchesSearch
  })

  const departments = [...new Set(promotions.map((promo) => promo.department))]

  const handleApprovePromotion = async (promotionId: number, comment = "") => {
    setPromotions((promotions) =>
      promotions.map((promo) =>
        promo.id === promotionId
          ? {
              ...promo,
              status: "Approved",
              approvedDate: new Date().toISOString().split("T")[0],
              comments: [
                ...promo.comments,
                {
                  author: "Current User",
                  message: comment || "Promotion approved",
                  date: new Date().toISOString().split("T")[0],
                },
              ],
            }
          : promo,
      ),
    )
    toast({
      title: "Promotion Approved",
      description: "The promotion has been approved and will be processed.",
    })
  }

  const handleRejectPromotion = (promotionId: number, comment: string) => {
    setPromotions((promotions) =>
      promotions.map((promo) =>
        promo.id === promotionId
          ? {
              ...promo,
              status: "Rejected",
              rejectedDate: new Date().toISOString().split("T")[0],
              comments: [
                ...promo.comments,
                {
                  author: "Current User",
                  message: comment,
                  date: new Date().toISOString().split("T")[0],
                },
              ],
            }
          : promo,
      ),
    )
    toast({
      title: "Promotion Rejected",
      description: "The promotion request has been rejected.",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions Management</h1>
          <p className="text-gray-600">Manage employee promotions, grades, and salary progressions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewPromotionDialogOpen} onOpenChange={setIsNewPromotionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                New Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Promotion Case</DialogTitle>
              </DialogHeader>
              <NewPromotionForm onClose={() => setIsNewPromotionDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="promotions">Promotion Cases</TabsTrigger>
          <TabsTrigger value="grades">Salary Grades</TabsTrigger>
          <TabsTrigger value="workflow">Approval Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-6">
          {/* Promotion Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {promotions.filter((promo) => promo.status === "Pending").length}
                    </div>
                    <p className="text-sm text-gray-600">Pending</p>
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
                      {promotions.filter((promo) => promo.status === "Approved").length}
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
                      {promotions.filter((promo) => promo.status === "Rejected").length}
                    </div>
                    <p className="text-sm text-gray-600">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      GH¢
                      {promotions
                        .reduce((sum, promo) => sum + (promo.proposedSalary - promo.currentSalary), 0)
                        .toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Salary Impact</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{promotions.length}</div>
                    <p className="text-sm text-gray-600">Total Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by employee name, ID, or grade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Promotion Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Promotion Cases ({filteredPromotions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPromotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={promotion.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {promotion.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{promotion.employeeName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {promotion.employeeId}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{promotion.department}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {promotion.currentGrade} → {promotion.proposedGrade} | GH¢
                          {promotion.currentSalary.toLocaleString()} → GH¢{promotion.proposedSalary.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(promotion.effectiveDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">Effective Date</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium text-emerald-600">
                          +GH¢{(promotion.proposedSalary - promotion.currentSalary).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Salary Increase</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusIcon(promotion.status)}
                        {getStatusBadge(promotion.status)}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPromotion(promotion)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {promotion.status === "Pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleApprovePromotion(promotion.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                              onClick={() => handleRejectPromotion(promotion.id, "Promotion rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <SalaryGradesView grades={salaryGrades} />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <ApprovalWorkflowView workflow={approvalWorkflow} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PromotionAnalyticsView promotions={promotions} />
        </TabsContent>
      </Tabs>

      {/* Promotion Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promotion Case Details</DialogTitle>
          </DialogHeader>
          {selectedPromotion && (
            <PromotionDetail
              promotion={selectedPromotion}
              onApprove={handleApprovePromotion}
              onReject={handleRejectPromotion}
              onClose={() => setIsDetailDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewPromotionForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    currentGrade: "",
    currentStep: "",
    proposedGrade: "",
    proposedStep: "",
    effectiveDate: "",
    reason: "",
    attachments: [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Promotion Case Created",
      description: "The promotion case has been submitted for approval.",
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            placeholder="EMP001"
            required
          />
        </div>
        <div>
          <Label htmlFor="effectiveDate">Effective Date</Label>
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label htmlFor="currentGrade">Current Grade</Label>
          <Select
            value={formData.currentGrade}
            onValueChange={(value) => setFormData({ ...formData, currentGrade: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {salaryGrades.map((grade) => (
                <SelectItem key={grade.grade} value={grade.grade}>
                  {grade.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="currentStep">Current Step</Label>
          <Select
            value={formData.currentStep}
            onValueChange={(value) => setFormData({ ...formData, currentStep: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select step" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((step) => (
                <SelectItem key={step} value={`Step ${step}`}>
                  Step {step}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="proposedGrade">Proposed Grade</Label>
          <Select
            value={formData.proposedGrade}
            onValueChange={(value) => setFormData({ ...formData, proposedGrade: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {salaryGrades.map((grade) => (
                <SelectItem key={grade.grade} value={grade.grade}>
                  {grade.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="proposedStep">Proposed Step</Label>
          <Select
            value={formData.proposedStep}
            onValueChange={(value) => setFormData({ ...formData, proposedStep: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select step" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((step) => (
                <SelectItem key={step} value={`Step ${step}`}>
                  Step {step}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Reason for Promotion</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Provide detailed justification for the promotion..."
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Create Promotion Case
        </Button>
      </div>
    </form>
  )
}

function PromotionDetail({
  promotion,
  onApprove,
  onReject,
  onClose,
}: {
  promotion: any
  onApprove: (id: number, comment: string) => void
  onReject: (id: number, comment: string) => void
  onClose: () => void
}) {
  const [comment, setComment] = useState("")
  const [action, setAction] = useState<"approve" | "reject" | null>(null)

  const handleAction = () => {
    if (action === "approve") {
      onApprove(promotion.id, comment)
    } else if (action === "reject") {
      onReject(promotion.id, comment)
    }
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={promotion.employeeAvatar || "/placeholder.svg"} />
          <AvatarFallback className="text-lg">
            {promotion.employeeName
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{promotion.employeeName}</h2>
          <p className="text-gray-600">
            {promotion.employeeId} • {promotion.department}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            {getStatusIcon(promotion.status)}
            {getStatusBadge(promotion.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Grade:</span>
              <span className="font-medium">{promotion.currentGrade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Step:</span>
              <span>{promotion.currentStep}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Salary:</span>
              <span className="font-medium">GH¢{promotion.currentSalary.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proposed Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Grade:</span>
              <span className="font-medium text-emerald-600">{promotion.proposedGrade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Step:</span>
              <span className="text-emerald-600">{promotion.proposedStep}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Proposed Salary:</span>
              <span className="font-medium text-emerald-600">GH¢{promotion.proposedSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Salary Increase:</span>
              <span className="font-medium text-emerald-600">
                +GH¢{(promotion.proposedSalary - promotion.currentSalary).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eligibility Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(promotion.eligibilityChecks).map(([key, check]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium capitalize">{key}</p>
                  <p className="text-sm text-gray-600">{check.details}</p>
                </div>
                {check.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Justification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{promotion.reason}</p>
        </CardContent>
      </Card>

      {promotion.status === "Pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Take Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comments about this promotion..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setAction("approve")
                  handleAction()
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Promotion
              </Button>
              <Button
                onClick={() => {
                  setAction("reject")
                  handleAction()
                }}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Promotion
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SalaryGradesView({ grades }: { grades: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary Grades & Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {grades.map((grade, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">{grade.grade}</h3>
              <div className="grid grid-cols-5 gap-4">
                {grade.steps.map((salary: number, stepIndex: number) => (
                  <div key={stepIndex} className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Step {stepIndex + 1}</div>
                    <div className="font-semibold text-emerald-600">GH¢{salary.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ApprovalWorkflowView({ workflow }: { workflow: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotion Approval Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflow.map((stage, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold">{stage.stage}</h3>
                <p className="text-sm text-gray-600">{stage.role}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PromotionAnalyticsView({ promotions }: { promotions: any[] }) {
  const totalPromotions = promotions.length
  const approvedPromotions = promotions.filter((promo) => promo.status === "Approved").length
  const pendingPromotions = promotions.filter((promo) => promo.status === "Pending").length
  const rejectedPromotions = promotions.filter((promo) => promo.status === "Rejected").length

  const approvalRate = totalPromotions > 0 ? ((approvedPromotions / totalPromotions) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{approvalRate}%</div>
                <p className="text-sm text-gray-600">Approval Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">14</div>
                <p className="text-sm text-gray-600">Avg. Days to Approve</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  GH¢
                  {(
                    promotions.reduce((sum, promo) => sum + (promo.proposedSalary - promo.currentSalary), 0) /
                    promotions.length
                  ).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">Avg. Salary Increase</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalPromotions}</div>
                <p className="text-sm text-gray-600">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Promotion analytics and trends will be displayed here</p>
            <p className="text-sm mt-2">Charts showing promotion patterns, department-wise analysis, and more</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
