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
import {
  Clock,
  Users,
  CalendarIcon,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Shift {
  id: string
  shift_name: string
  shift_code: string
  department: string | null
  start_time: string
  end_time: string
  duration_hours: number
  color_code: string
  required_staff: number
  is_active: boolean
}

interface ShiftAssignment {
  id: string
  employee_id: string
  shift_id: string
  assignment_date: string
  status: string
  notes: string | null
}

interface Employee {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
}

interface CalendarDay {
  date: Date
  assignments: Array<{
    shift: Shift
    employees: Employee[]
    count: number
  }>
}

export default function ShiftsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")

  // Data
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<"week" | "month">("week")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Shift Modal
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [shiftFormData, setShiftFormData] = useState({
    shift_name: "",
    shift_code: "",
    department: "",
    start_time: "09:00",
    end_time: "17:00",
    color_code: "#3B82F6",
    required_staff: 1,
  })

  // Assignment Modal
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<string>("")
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalShifts: 0,
    activeShifts: 0,
    assignedToday: 0,
    coverageRate: 0,
    understaffed: 0,
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
      // Load shifts
      const { data: shiftsData, error: shiftsError } = await supabase.from("shifts").select("*").order("start_time")

      if (shiftsError) throw shiftsError
      setShifts(shiftsData || [])

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      // Load assignments for current week
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("shift_assignments")
        .select("*")
        .gte("assignment_date", startOfWeek.toISOString().split("T")[0])
        .lte("assignment_date", endOfWeek.toISOString().split("T")[0])

      if (assignmentsError) throw assignmentsError
      setAssignments(assignmentsData || [])

      // Calculate stats
      const activeShifts = shiftsData?.filter((s) => s.is_active).length || 0
      const today = new Date().toISOString().split("T")[0]
      const todayAssignments = assignmentsData?.filter((a) => a.assignment_date === today).length || 0

      setStats({
        totalShifts: shiftsData?.length || 0,
        activeShifts,
        assignedToday: todayAssignments,
        coverageRate: 0,
        understaffed: 0,
      })
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load shift data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShift = async () => {
    if (!shiftFormData.shift_name || !shiftFormData.shift_code) {
      toast({
        title: "Error",
        description: "Please fill in shift name and code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const startTime = new Date(`2000-01-01T${shiftFormData.start_time}`)
      const endTime = new Date(`2000-01-01T${shiftFormData.end_time}`)
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

      if (editingShift) {
        const { error } = await supabase
          .from("shifts")
          .update({
            ...shiftFormData,
            duration_hours: Math.abs(duration),
          })
          .eq("id", editingShift.id)

        if (error) throw error
        toast({ title: "Success", description: "Shift updated successfully" })
      } else {
        const { error } = await supabase.from("shifts").insert({
          ...shiftFormData,
          duration_hours: Math.abs(duration),
        })

        if (error) throw error
        toast({ title: "Success", description: "Shift created successfully" })
      }

      setShiftModalOpen(false)
      setEditingShift(null)
      resetShiftForm()
      loadData()
    } catch (error) {
      console.error("[v0] Error saving shift:", error)
      toast({
        title: "Error",
        description: "Failed to save shift",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignShift = async () => {
    if (!selectedShift || selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select a shift and at least one employee",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const assignmentsToCreate = selectedEmployees.map((empId) => ({
        employee_id: empId,
        shift_id: selectedShift,
        assignment_date: assignmentDate,
        status: "scheduled",
      }))

      const { error } = await supabase.from("shift_assignments").insert(assignmentsToCreate)

      if (error) throw error

      toast({
        title: "Success",
        description: `${selectedEmployees.length} employee(s) assigned to shift`,
      })

      setAssignmentModalOpen(false)
      setSelectedEmployees([])
      setSelectedShift("")
      loadData()
    } catch (error) {
      console.error("[v0] Error assigning shift:", error)
      toast({
        title: "Error",
        description: "Failed to assign shift",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("shifts").delete().eq("id", shiftId)

      if (error) throw error

      toast({ title: "Success", description: "Shift deleted successfully" })
      loadData()
    } catch (error) {
      console.error("[v0] Error deleting shift:", error)
      toast({
        title: "Error",
        description: "Failed to delete shift",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetShiftForm = () => {
    setShiftFormData({
      shift_name: "",
      shift_code: "",
      department: "",
      start_time: "09:00",
      end_time: "17:00",
      color_code: "#3B82F6",
      required_staff: 1,
    })
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const getAssignmentsForDate = (date: Date, shiftId: string) => {
    const dateStr = date.toISOString().split("T")[0]
    return assignments.filter((a) => a.assignment_date === dateStr && a.shift_id === shiftId)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
    setCurrentDate(newDate)
  }

  const filteredShifts = shifts.filter((shift) => {
    const matchesDepartment = departmentFilter === "all" || shift.department === departmentFilter
    const matchesSearch =
      shift.shift_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.shift_code.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesDepartment && matchesSearch
  })

  const weekDays = getWeekDays()

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">Manage shifts, schedules, and employee assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Shift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingShift ? "Edit Shift" : "Create New Shift"}</DialogTitle>
                <DialogDescription>Define shift details and timing</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Shift Name *</Label>
                    <Input
                      placeholder="e.g., Morning Shift"
                      value={shiftFormData.shift_name}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, shift_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Code *</Label>
                    <Input
                      placeholder="e.g., MOR"
                      value={shiftFormData.shift_code}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, shift_code: e.target.value.toUpperCase() })}
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    placeholder="e.g., Operations"
                    value={shiftFormData.department}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, department: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Time *</Label>
                    <Input
                      type="time"
                      value={shiftFormData.start_time}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time *</Label>
                    <Input
                      type="time"
                      value={shiftFormData.end_time}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Required Staff</Label>
                    <Input
                      type="number"
                      min="1"
                      value={shiftFormData.required_staff}
                      onChange={(e) =>
                        setShiftFormData({ ...shiftFormData, required_staff: Number.parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color Code</Label>
                    <Input
                      type="color"
                      value={shiftFormData.color_code}
                      onChange={(e) => setShiftFormData({ ...shiftFormData, color_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShiftModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateShift} disabled={loading}>
                  {loading ? "Saving..." : editingShift ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Assign Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Assign Employees to Shift</DialogTitle>
                <DialogDescription>Select employees and shift for assignment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Shift *</Label>
                  <Select value={selectedShift} onValueChange={setSelectedShift}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts
                        .filter((s) => s.is_active)
                        .map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.shift_name} ({shift.start_time} - {shift.end_time})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={assignmentDate} onChange={(e) => setAssignmentDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Employees * (Select multiple)</Label>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, emp.id])
                            } else {
                              setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">
                          {emp.full_name} - {emp.department}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedEmployees.length} employee(s) selected</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignShift} disabled={loading}>
                  {loading ? "Assigning..." : "Assign"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShifts}</div>
            <p className="text-xs text-muted-foreground">{stats.activeShifts} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Today</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedToday}</div>
            <p className="text-xs text-muted-foreground">Employee shifts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coverageRate}%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Understaffed</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.understaffed}</div>
            <p className="text-xs text-muted-foreground">Shifts needing staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Swap Requests</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Week Schedule</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Week of {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="font-medium text-sm">Shift</div>
                    {weekDays.map((day) => (
                      <div key={day.toISOString()} className="text-center">
                        <div className="font-medium text-sm">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="text-xs text-muted-foreground">{day.getDate()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Shift Rows */}
                  {filteredShifts.map((shift) => (
                    <div key={shift.id} className="grid grid-cols-8 gap-2 mb-2">
                      <div
                        className="flex items-center gap-2 p-2 rounded border"
                        style={{ borderLeftColor: shift.color_code, borderLeftWidth: "4px" }}
                      >
                        <div>
                          <p className="font-medium text-sm">{shift.shift_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {shift.start_time} - {shift.end_time}
                          </p>
                        </div>
                      </div>
                      {weekDays.map((day) => {
                        const dayAssignments = getAssignmentsForDate(day, shift.id)
                        const isUnderstaffed = dayAssignments.length < shift.required_staff
                        const isToday = day.toDateString() === new Date().toDateString()

                        return (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              "p-2 rounded border min-h-[60px]",
                              isToday && "bg-primary/5 border-primary",
                              isUnderstaffed && dayAssignments.length > 0 && "bg-amber-50 border-amber-300",
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant={isUnderstaffed ? "destructive" : "default"} className="text-xs">
                                  {dayAssignments.length}/{shift.required_staff}
                                </Badge>
                              </div>
                              {dayAssignments.map((assignment) => {
                                const emp = employees.find((e) => e.id === assignment.employee_id)
                                return (
                                  <div
                                    key={assignment.id}
                                    className="text-xs truncate p-1 bg-background rounded"
                                    title={emp?.full_name}
                                  >
                                    {emp?.full_name}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shifts..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-[150px]">
                  <Label>Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Shifts</CardTitle>
              <CardDescription>Manage shift definitions and templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Required Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: shift.color_code }} />
                          <span className="font-medium">{shift.shift_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shift.shift_code}</Badge>
                      </TableCell>
                      <TableCell>{shift.department || "-"}</TableCell>
                      <TableCell>
                        {shift.start_time} - {shift.end_time}
                      </TableCell>
                      <TableCell>{shift.duration_hours.toFixed(1)}h</TableCell>
                      <TableCell>{shift.required_staff}</TableCell>
                      <TableCell>
                        <Badge variant={shift.is_active ? "default" : "secondary"}>
                          {shift.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingShift(shift)
                              setShiftFormData({
                                shift_name: shift.shift_name,
                                shift_code: shift.shift_code,
                                department: shift.department || "",
                                start_time: shift.start_time,
                                end_time: shift.end_time,
                                color_code: shift.color_code,
                                required_staff: shift.required_staff,
                              })
                              setShiftModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteShift(shift.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>View and manage employee shift assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.slice(0, 20).map((assignment) => {
                  const shift = shifts.find((s) => s.id === assignment.shift_id)
                  const employee = employees.find((e) => e.id === assignment.employee_id)
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {shift && <div className="h-3 w-3 rounded" style={{ backgroundColor: shift.color_code }} />}
                          <p className="font-medium">{employee?.full_name || "Unknown"}</p>
                          <Badge variant="outline">{shift?.shift_code || "N/A"}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(assignment.assignment_date).toLocaleDateString()}</span>
                          <span>
                            {shift?.start_time} - {shift?.end_time}
                          </span>
                          <span>{employee?.department}</span>
                        </div>
                      </div>
                      <Badge
                        variant={assignment.status === "confirmed" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                  )
                })}

                {assignments.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No assignments</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start assigning employees to shifts</p>
                    <Button onClick={() => setAssignmentModalOpen(true)}>
                      <Users className="mr-2 h-4 w-4" />
                      Assign Shift
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Tab */}
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shift Coverage Analysis</CardTitle>
              <CardDescription>Monitor staffing levels and coverage gaps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredShifts.map((shift) => {
                  const todayAssignments = getAssignmentsForDate(new Date(), shift.id)
                  const coveragePercentage = (todayAssignments.length / shift.required_staff) * 100

                  return (
                    <div key={shift.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: shift.color_code }} />
                          <p className="font-medium">{shift.shift_name}</p>
                          <Badge variant="outline">{shift.shift_code}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {todayAssignments.length} / {shift.required_staff}
                          </span>
                          <Badge
                            variant={
                              coveragePercentage >= 100
                                ? "default"
                                : coveragePercentage >= 75
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {coveragePercentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            coveragePercentage >= 100
                              ? "bg-green-500"
                              : coveragePercentage >= 75
                                ? "bg-blue-500"
                                : "bg-amber-500",
                          )}
                          style={{ width: `${Math.min(coveragePercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {shift.start_time} - {shift.end_time} • {shift.duration_hours}h
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
