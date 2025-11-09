"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Clock, CalendarIcon, TrendingUp, AlertCircle, Plus, MessageSquare, CheckCircle, Timer } from "lucide-react"
import {
  getMyAttendance,
  getMyAttendanceSummary,
  getMyOvertimeRequests,
  submitOvertimeRequest,
  createAttendanceDispute,
  getMyShiftSchedule,
} from "@/app/actions/employee-attendance"

export default function MyAttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([])
  const [shiftSchedule, setShiftSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchData()
  }, [dateRange])

  async function fetchData() {
    setLoading(true)
    try {
      const [recordsData, summaryData, overtimeData, scheduleData] = await Promise.all([
        getMyAttendance(dateRange.start, dateRange.end),
        getMyAttendanceSummary(),
        getMyOvertimeRequests(),
        getMyShiftSchedule(),
      ])
      setRecords(recordsData)
      setSummary(summaryData)
      setOvertimeRequests(overtimeData)
      setShiftSchedule(scheduleData)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOvertimeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      await submitOvertimeRequest({
        request_date: formData.get("request_date") as string,
        start_time: formData.get("start_time") as string,
        end_time: formData.get("end_time") as string,
        overtime_type: formData.get("overtime_type") as string,
        reason: formData.get("reason") as string,
      })

      toast({ title: "Overtime request submitted successfully" })
      setOvertimeDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit request",
        variant: "destructive",
      })
    }
  }

  const handleDisputeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRecord) return

    const formData = new FormData(e.currentTarget)

    try {
      await createAttendanceDispute(selectedRecord.id, formData.get("reason") as string, {
        clock_in: formData.get("clock_in"),
        clock_out: formData.get("clock_out"),
      })

      toast({ title: "Dispute submitted successfully" })
      setDisputeDialogOpen(false)
      setSelectedRecord(null)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit dispute",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your attendance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">Track your attendance and request overtime</p>
        </div>
        <Dialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Overtime
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Overtime Request</DialogTitle>
              <DialogDescription>Request approval for overtime work</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleOvertimeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="request_date">Date</Label>
                <Input id="request_date" name="request_date" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input id="start_time" name="start_time" type="time" required />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input id="end_time" name="end_time" type="time" required />
                </div>
              </div>
              <div>
                <Label htmlFor="overtime_type">Type</Label>
                <Select name="overtime_type" defaultValue="weekday" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">Weekday</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" placeholder="Explain why overtime is needed..." required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOvertimeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.attendanceRate}%</div>
            <Progress value={summary?.attendanceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.presentDays}</div>
            <p className="text-xs text-muted-foreground">Out of {summary?.totalDays} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Hours worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.overtimeHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Extra hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">My Records</TabsTrigger>
          <TabsTrigger value="overtime">Overtime Requests</TabsTrigger>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Records</CardTitle>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-auto"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-auto"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.shift ? (
                          <Badge style={{ backgroundColor: record.shift.color_code }}>{record.shift.shift_name}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{record.clock_in || "-"}</TableCell>
                      <TableCell>
                        {record.clock_out || (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{record.total_hours?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "absent"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {record.status}
                        </Badge>
                        {record.is_late && (
                          <span className="ml-2 text-xs text-orange-600">+{record.late_minutes}min late</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog
                          open={disputeDialogOpen && selectedRecord?.id === record.id}
                          onOpenChange={(open) => {
                            setDisputeDialogOpen(open)
                            if (!open) setSelectedRecord(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedRecord(record)}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Dispute
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Dispute Attendance Record</DialogTitle>
                              <DialogDescription>Explain the issue and provide correct information</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleDisputeSubmit} className="space-y-4">
                              <div>
                                <Label>Record Date</Label>
                                <Input value={new Date(record.date).toLocaleDateString()} disabled />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="clock_in">Correct Clock In</Label>
                                  <Input id="clock_in" name="clock_in" type="time" defaultValue={record.clock_in} />
                                </div>
                                <div>
                                  <Label htmlFor="clock_out">Correct Clock Out</Label>
                                  <Input id="clock_out" name="clock_out" type="time" defaultValue={record.clock_out} />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="reason">Reason for Dispute</Label>
                                <Textarea
                                  id="reason"
                                  name="reason"
                                  placeholder="Explain what was incorrect and why..."
                                  required
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setDisputeDialogOpen(false)
                                    setSelectedRecord(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit">Submit Dispute</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
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
            <CardHeader>
              <CardTitle>My Overtime Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{new Date(request.request_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {request.start_time} - {request.end_time}
                      </TableCell>
                      <TableCell>{request.hours_requested}h</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.overtime_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.approved_by_employee?.full_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {overtimeRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No overtime requests yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Shift Schedule</CardTitle>
              <CardDescription>Your assigned shifts and working hours</CardDescription>
            </CardHeader>
            <CardContent>
              {shiftSchedule.length > 0 ? (
                <div className="space-y-4">
                  {shiftSchedule.map((schedule) => (
                    <Card
                      key={schedule.id}
                      className="border-l-4"
                      style={{ borderLeftColor: schedule.shift?.color_code }}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{schedule.shift?.shift_name}</CardTitle>
                          <Badge>{schedule.shift?.shift_code}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {schedule.shift?.start_time} - {schedule.shift?.end_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Effective from {new Date(schedule.effective_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Break Duration</p>
                            <p className="font-semibold">{schedule.shift?.break_duration_minutes} minutes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Grace Period</p>
                            <p className="font-semibold">{schedule.shift?.grace_period_minutes} minutes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No shift assigned yet</p>
                  <p className="text-sm">Contact HR to get your shift schedule</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
