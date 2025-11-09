"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  History,
  Settings,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  User,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface OvertimeRequest {
  id: string
  employee_id: string
  date: string
  overtime_hours: number
  reason: string
  justification: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
  approval_level: number
  current_approver_role: string | null
  manager_approved_by: string | null
  manager_approved_at: string | null
  manager_comments: string | null
  hr_approved_by: string | null
  hr_approved_at: string | null
  hr_comments: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  submitted_at: string
}

interface Employee {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
}

interface AuditLog {
  id: string
  action: string
  actor_name: string
  actor_role: string
  previous_status: string | null
  new_status: string | null
  comments: string | null
  created_at: string
}

export default function OvertimePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("requests")

  // Data
  const [requests, setRequests] = useState<OvertimeRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  // New Request Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split("T")[0])
  const [overtimeHours, setOvertimeHours] = useState("")
  const [requestReason, setRequestReason] = useState("")
  const [requestJustification, setRequestJustification] = useState("")

  // Approval Modal
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [approvalComments, setApprovalComments] = useState("")
  const [approverRole, setApproverRole] = useState<"manager" | "hr" | "payroll">("manager")

  // Stats
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalHoursRequested: 0,
    totalHoursApproved: 0,
    averageProcessingTime: 0,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      // Load overtime requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("overtime_requests")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (requestsError) throw requestsError
      setRequests(requestsData || [])

      // Calculate stats
      const pending = requestsData?.filter((r) => r.status === "pending").length || 0
      const approved = requestsData?.filter((r) => r.status === "approved").length || 0
      const rejected = requestsData?.filter((r) => r.status === "rejected").length || 0
      const totalHours = requestsData?.reduce((sum, r) => sum + (r.overtime_hours || 0), 0) || 0
      const approvedHours =
        requestsData?.filter((r) => r.status === "approved").reduce((sum, r) => sum + (r.overtime_hours || 0), 0) || 0

      setStats({
        totalPending: pending,
        totalApproved: approved,
        totalRejected: rejected,
        totalHoursRequested: totalHours,
        totalHoursApproved: approvedHours,
        averageProcessingTime: 0,
      })
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load overtime data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!selectedEmployee || !overtimeHours || !requestReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const hours = Number.parseFloat(overtimeHours)
    if (isNaN(hours) || hours <= 0 || hours > 12) {
      toast({
        title: "Error",
        description: "Please enter valid overtime hours (0-12)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Insert overtime request
      const { data: requestData, error: requestError } = await supabase
        .from("overtime_requests")
        .insert({
          employee_id: selectedEmployee,
          date: requestDate,
          overtime_hours: hours,
          reason: requestReason,
          justification: requestJustification || null,
          status: "pending",
          approval_level: 1,
          current_approver_role: "manager",
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Create audit log entry
      const employee = employees.find((e) => e.id === selectedEmployee)
      await supabase.from("overtime_audit_log").insert({
        overtime_request_id: requestData.id,
        action: "submitted",
        actor_id: selectedEmployee,
        actor_name: employee?.full_name || "Unknown",
        actor_role: employee?.position || "Employee",
        previous_status: null,
        new_status: "pending",
        comments: requestReason,
      })

      toast({
        title: "Success",
        description: "Overtime request submitted successfully",
      })

      // Reset form
      setRequestModalOpen(false)
      setSelectedEmployee("")
      setOvertimeHours("")
      setRequestReason("")
      setRequestJustification("")
      loadData()
    } catch (error) {
      console.error("[v0] Error submitting request:", error)
      toast({
        title: "Error",
        description: "Failed to submit overtime request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async () => {
    if (!selectedRequest || !approvalAction) return

    setLoading(true)
    try {
      const updates: any = {}
      const currentTime = new Date().toISOString()

      if (approvalAction === "approve") {
        // Determine next approval level
        if (approverRole === "manager") {
          updates.manager_approved_at = currentTime
          updates.manager_comments = approvalComments
          updates.approval_level = 2
          updates.current_approver_role = "hr"
        } else if (approverRole === "hr") {
          updates.hr_approved_at = currentTime
          updates.hr_comments = approvalComments
          updates.status = "approved"
          updates.approval_level = 3
          updates.current_approver_role = null
        }
      } else {
        // Rejection
        updates.status = "rejected"
        updates.rejected_at = currentTime
        updates.rejection_reason = approvalComments
      }

      const { error: updateError } = await supabase
        .from("overtime_requests")
        .update(updates)
        .eq("id", selectedRequest.id)

      if (updateError) throw updateError

      // Create audit log entry
      await supabase.from("overtime_audit_log").insert({
        overtime_request_id: selectedRequest.id,
        action: approvalAction === "approve" ? "approved" : "rejected",
        actor_name: "Current User",
        actor_role: approverRole,
        previous_status: selectedRequest.status,
        new_status: approvalAction === "approve" ? (approverRole === "hr" ? "approved" : "pending") : "rejected",
        comments: approvalComments,
      })

      toast({
        title: "Success",
        description: `Overtime request ${approvalAction}d successfully`,
      })

      setApprovalModalOpen(false)
      setSelectedRequest(null)
      setApprovalAction(null)
      setApprovalComments("")
      loadData()
    } catch (error) {
      console.error("[v0] Error processing approval:", error)
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAuditLogs = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("overtime_audit_log")
        .select("*")
        .eq("overtime_request_id", requestId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAuditLogs(data || [])
    } catch (error) {
      console.error("[v0] Error loading audit logs:", error)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const employee = employees.find((e) => e.id === request.employee_id)
    if (!employee) return false

    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = !dateFilter || request.date === dateFilter

    return matchesStatus && matchesSearch && matchesDate
  })

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overtime Management</h1>
          <p className="text-muted-foreground">Request, track, and approve overtime hours</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit Overtime Request</DialogTitle>
                <DialogDescription>Request approval for overtime hours worked</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Overtime Hours *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="12"
                    placeholder="e.g., 2.5"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter hours exceeding standard work hours (max 12)</p>
                </div>
                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea
                    placeholder="Brief reason for overtime..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Justification (Optional)</Label>
                  <Textarea
                    placeholder="Detailed justification, project details, or context..."
                    value={requestJustification}
                    onChange={(e) => setRequestJustification(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitRequest} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApproved}</div>
            <p className="text-xs text-muted-foreground">Completed approvals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRejected}</div>
            <p className="text-xs text-muted-foreground">Declined requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursRequested.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Requested this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursApproved.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHoursRequested > 0
                ? `${Math.round((stats.totalHoursApproved / stats.totalHoursRequested) * 100)}% approval rate`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <History className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Processing time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* All Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee name..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-[150px]">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[150px]">
                  <Label>Date</Label>
                  <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overtime Requests</CardTitle>
              <CardDescription>
                Showing {filteredRequests.length} of {requests.length} requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval Stage</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const employee = employees.find((e) => e.id === request.employee_id)
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{employee?.department || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{request.overtime_hours.toFixed(1)}h</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {request.approval_level >= 1 && (
                                  <div
                                    className={cn(
                                      "h-2 w-2 rounded-full",
                                      request.manager_approved_at ? "bg-green-500" : "bg-amber-500",
                                    )}
                                  />
                                )}
                                {request.approval_level >= 2 && (
                                  <div
                                    className={cn(
                                      "h-2 w-2 rounded-full",
                                      request.hr_approved_at ? "bg-green-500" : "bg-gray-300",
                                    )}
                                  />
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground capitalize">
                                {request.current_approver_role || "Manager"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                loadAuditLogs(request.id)
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setApprovalAction("approve")
                                    setApprovalModalOpen(true)
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setApprovalAction("reject")
                                    setApprovalModalOpen(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approval Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Requests awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests
                  .filter((r) => r.status === "pending")
                  .map((request) => {
                    const employee = employees.find((e) => e.id === request.employee_id)
                    return (
                      <Card key={request.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <p className="font-semibold">{employee?.full_name || "Unknown"}</p>
                                  <Badge variant="outline">{employee?.department}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(request.date).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {request.overtime_hours.toFixed(1)} hours
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-sm">
                                {request.current_approver_role || "Manager"} Review
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-medium">Reason:</p>
                              <p className="text-sm text-muted-foreground">{request.reason}</p>
                            </div>

                            {request.justification && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Justification:</p>
                                <p className="text-sm text-muted-foreground">{request.justification}</p>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                className="flex-1"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setApprovalAction("approve")
                                  setApprovalModalOpen(true)
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 bg-transparent"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setApprovalAction("reject")
                                  setApprovalModalOpen(true)
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                {filteredRequests.filter((r) => r.status === "pending").length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending approvals</h3>
                    <p className="text-sm text-muted-foreground">All overtime requests have been processed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>View all completed overtime requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests
                  .filter((r) => r.status !== "pending")
                  .slice(0, 20)
                  .map((request) => {
                    const employee = employees.find((e) => e.id === request.employee_id)
                    return (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{employee?.full_name || "Unknown"}</p>
                            <Badge variant="outline" className="text-xs">
                              {employee?.department}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{new Date(request.date).toLocaleDateString()}</span>
                            <span>{request.overtime_hours.toFixed(1)}h</span>
                            <span className="truncate max-w-[200px]">{request.reason}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={request.status === "approved" ? "default" : "destructive"}
                            className="capitalize"
                          >
                            {request.status}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => loadAuditLogs(request.id)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Policies</CardTitle>
              <CardDescription>Configure overtime rules and approval workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Daily Overtime Threshold</Label>
                    <Input type="number" defaultValue="8" />
                    <p className="text-xs text-muted-foreground">Hours after which overtime begins</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Daily Overtime</Label>
                    <Input type="number" defaultValue="4" />
                    <p className="text-xs text-muted-foreground">Maximum overtime hours per day</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Overtime Rate Multiplier</Label>
                    <Input type="number" step="0.1" defaultValue="1.5" />
                    <p className="text-xs text-muted-foreground">Pay rate multiplier for overtime</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Weekend Rate Multiplier</Label>
                    <Input type="number" step="0.1" defaultValue="2.0" />
                    <p className="text-xs text-muted-foreground">Pay rate for weekend work</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium">Approval Workflow</h3>
                  <div className="space-y-2">
                    <Label>Approval Levels Required</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                        <span className="text-sm">Manager Approval</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                        <span className="text-sm">HR Approval</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-sm">Payroll Approval</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium">Fatigue & Wellness</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Max Consecutive OT Days</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    <div className="space-y-2">
                      <Label>Wellness Check Trigger (hours)</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Reset to Default</Button>
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === "approve" ? "Approve" : "Reject"} Overtime Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="mt-2 space-y-1">
                  <p>Employee: {employees.find((e) => e.id === selectedRequest.employee_id)?.full_name || "Unknown"}</p>
                  <p>
                    Hours: {selectedRequest.overtime_hours.toFixed(1)}h on{" "}
                    {new Date(selectedRequest.date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Role</Label>
              <Select value={approverRole} onValueChange={(val: any) => setApproverRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                placeholder={
                  approvalAction === "approve"
                    ? "Add any comments or conditions..."
                    : "Please provide reason for rejection..."
                }
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprovalAction}
              disabled={loading}
              variant={approvalAction === "approve" ? "default" : "destructive"}
            >
              {loading ? "Processing..." : approvalAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
