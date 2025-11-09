"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { format } from "date-fns"
import { Clock, CalendarIcon, CheckCircle, XCircle, Download, MessageSquare, Clock3, Plus, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { AttendancePermissions } from "@/lib/attendance/permissions"
import { createOvertimeRequest, createAttendanceDispute } from "@/app/actions/employee-attendance"

type AttendanceRecord = {
  id: string
  date: string
  clock_in: string
  clock_out: string | null
  total_hours: number
  late_minutes: number
  overtime_hours: number
  status: string
  anomaly_score: number
  location_in: string
  location_out: string | null
}

type OvertimeRequest = {
  id: string
  date: string
  hours_requested: number
  reason: string
  status: string
  created_at: string
}

type Shift = {
  id: string
  name: string
  start_time: string
  end_time: string
  days: string[]
}

export default function AttendancePortalClient({
  employee,
  company,
  permissions,
}: {
  employee: any
  company: any
  permissions: AttendancePermissions
}) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([])
  const [myShift, setMyShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    totalHours: 0,
    overtimeHours: 0,
    attendanceRate: 0,
  })

  // Overtime request form state
  const [overtimeDate, setOvertimeDate] = useState<Date>()
  const [overtimeHours, setOvertimeHours] = useState("")
  const [overtimeReason, setOvertimeReason] = useState("")
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false)

  // Dispute form state
  const [disputeRecord, setDisputeRecord] = useState<AttendanceRecord | null>(null)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeClockIn, setDisputeClockIn] = useState("")
  const [disputeClockOut, setDisputeClockOut] = useState("")
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load attendance records (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: records } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employee.id)
        .gte("date", format(thirtyDaysAgo, "yyyy-MM-dd"))
        .order("date", { ascending: false })

      if (records) {
        setAttendanceRecords(records)
        calculateStats(records)
      }

      // Load overtime requests
      const { data: overtime } = await supabase
        .from("overtime_requests")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (overtime) {
        setOvertimeRequests(overtime)
      }

      // Load assigned shift
      const { data: shiftAssignment } = await supabase
        .from("employee_shifts")
        .select(`
          shift:shifts(*)
        `)
        .eq("employee_id", employee.id)
        .eq("is_active", true)
        .single()

      if (shiftAssignment?.shift) {
        setMyShift(shiftAssignment.shift)
      }
    } catch (error) {
      console.error("Error loading attendance data:", error)
      toast.error("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(records: AttendanceRecord[]) {
    const totalDays = records.length
    const presentDays = records.filter((r) => r.status === "present" || r.status === "late").length
    const lateDays = records.filter((r) => r.late_minutes > 0).length
    const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0)
    const overtimeHours = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0)
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

    setStats({
      totalDays,
      presentDays,
      lateDays,
      totalHours,
      overtimeHours,
      attendanceRate,
    })
  }

  async function handleOvertimeRequest() {
    if (!overtimeDate || !overtimeHours || !overtimeReason) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      await createOvertimeRequest({
        employeeId: employee.id,
        date: format(overtimeDate, "yyyy-MM-dd"),
        hoursRequested: Number.parseFloat(overtimeHours),
        reason: overtimeReason,
        companyId: company.id,
      })

      toast.success("Overtime request submitted successfully")
      setOvertimeDialogOpen(false)
      setOvertimeDate(undefined)
      setOvertimeHours("")
      setOvertimeReason("")
      loadData()
    } catch (error) {
      console.error("Error creating overtime request:", error)
      toast.error("Failed to submit overtime request")
    }
  }

  async function handleDispute() {
    if (!disputeRecord || !disputeReason) {
      toast.error("Please provide a reason for the dispute")
      return
    }

    try {
      await createAttendanceDispute({
        attendanceRecordId: disputeRecord.id,
        employeeId: employee.id,
        reason: disputeReason,
        proposedClockIn: disputeClockIn || disputeRecord.clock_in,
        proposedClockOut: disputeClockOut || disputeRecord.clock_out || undefined,
        companyId: company.id,
      })

      toast.success("Dispute submitted successfully. HR will review your request.")
      setDisputeDialogOpen(false)
      setDisputeRecord(null)
      setDisputeReason("")
      setDisputeClockIn("")
      setDisputeClockOut("")
    } catch (error) {
      console.error("Error creating dispute:", error)
      toast.error("Failed to submit dispute")
    }
  }

  async function exportAttendance() {
    try {
      const response = await fetch(`/api/attendance/export?employeeId=${employee.id}&format=csv`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance_${employee.name}_${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      toast.success("Attendance report downloaded")
    } catch (error) {
      console.error("Error exporting attendance:", error)
      toast.error("Failed to export attendance")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500 mt-1">Track your attendance, overtime, and work hours</p>
        </div>
        <Button onClick={exportAttendance} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-gray-500 mt-1">{stats.presentDays} working days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Late Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lateDays}</div>
            <p className="text-xs text-gray-500 mt-1">In last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overtime Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overtimeHours.toFixed(1)}h</div>
            <p className="text-xs text-gray-500 mt-1">Extra hours worked</p>
          </CardContent>
        </Card>
      </div>

      {/* My Shift */}
      {myShift && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="w-5 h-5" />
              My Current Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-600">Shift Name</p>
                <p className="text-lg font-semibold">{myShift.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Working Hours</p>
                <p className="text-lg font-semibold">
                  {myShift.start_time} - {myShift.end_time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Working Days</p>
                <p className="text-lg font-semibold">{myShift.days.join(", ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="overtime">Overtime Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Your attendance records for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{record.clock_in}</TableCell>
                      <TableCell>{record.clock_out || "-"}</TableCell>
                      <TableCell>{record.total_hours ? `${record.total_hours.toFixed(1)}h` : "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "late"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {record.status}
                          {record.late_minutes > 0 && ` (${record.late_minutes}m late)`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {record.location_in.slice(0, 20)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.anomaly_score > 70 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDisputeRecord(record)
                              setDisputeClockIn(record.clock_in)
                              setDisputeClockOut(record.clock_out || "")
                              setDisputeDialogOpen(true)
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Dispute
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Overtime Requests</CardTitle>
                <CardDescription>Request and track overtime approval</CardDescription>
              </div>
              <Dialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Request Overtime
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Overtime</DialogTitle>
                    <DialogDescription>Submit a request for overtime hours approval</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {overtimeDate ? format(overtimeDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={overtimeDate} onSelect={setOvertimeDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Hours Requested</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., 2.5"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Explain why overtime is needed..."
                        value={overtimeReason}
                        onChange={(e) => setOvertimeReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOvertimeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleOvertimeRequest}>Submit Request</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{format(new Date(request.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{request.hours_requested}h</TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
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
                          {request.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {request.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                          {request.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(request.created_at), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Attendance Record</DialogTitle>
            <DialogDescription>
              If you believe this attendance record is incorrect, provide details for HR review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {disputeRecord && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Current Record</p>
                <p className="text-sm text-gray-600">Date: {format(new Date(disputeRecord.date), "MMM dd, yyyy")}</p>
                <p className="text-sm text-gray-600">Clock In: {disputeRecord.clock_in}</p>
                <p className="text-sm text-gray-600">Clock Out: {disputeRecord.clock_out || "Not clocked out"}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Proposed Clock In Time</Label>
              <Input type="time" value={disputeClockIn} onChange={(e) => setDisputeClockIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Proposed Clock Out Time (optional)</Label>
              <Input type="time" value={disputeClockOut} onChange={(e) => setDisputeClockOut(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason for Dispute</Label>
              <Textarea
                placeholder="Explain why this record is incorrect..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDisputeDialogOpen(false)
                setDisputeRecord(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleDispute}>Submit Dispute</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
