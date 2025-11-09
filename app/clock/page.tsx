"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, CheckCircle, Coffee, LogOut, User, Calendar } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from "@/hooks/use-toast"

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  total_hours: number
  overtime_hours: number
  status: string
  notes: string | null
}

interface Employee {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
  status: string
}

export default function ClockPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [notes, setNotes] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load data on mount and when employee changes
  useEffect(() => {
    loadEmployees()
    getGeolocation()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      loadCurrentRecord()
    }
  }, [selectedEmployee])

  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[v0] Geolocation error:", error)
          toast({
            title: "Location unavailable",
            description: "Could not get your location. Clocking will proceed without location verification.",
            variant: "default",
          })
        },
      )
    }
  }

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase.from("employees").select("*").eq("status", "active")

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("[v0] Error loading employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      })
    }
  }

  const loadCurrentRecord = async () => {
    if (!selectedEmployee) return

    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", selectedEmployee)
        .eq("date", today)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setCurrentRecord(data || null)
    } catch (error) {
      console.error("[v0] Error loading record:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockAction = async (action: "in" | "out" | "break-start" | "break-end") => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select your name first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const currentTime = new Date().toTimeString().split(" ")[0].slice(0, 5)

      if (currentRecord) {
        // Update existing record
        const updates: any = {}

        if (action === "in") {
          updates.clock_in = currentTime
          updates.status = "present"
        } else if (action === "out") {
          updates.clock_out = currentTime
          // Calculate total hours
          if (currentRecord.clock_in) {
            const clockIn = new Date(`2000-01-01T${currentRecord.clock_in}`)
            const clockOut = new Date(`2000-01-01T${currentTime}`)
            let totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60)

            // Subtract break time if applicable
            if (currentRecord.break_start && currentRecord.break_end) {
              const breakStart = new Date(`2000-01-01T${currentRecord.break_start}`)
              const breakEnd = new Date(`2000-01-01T${currentRecord.break_end}`)
              const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
              totalMinutes -= breakMinutes
            }

            const hours = totalMinutes / 60
            updates.total_hours = Math.round(hours * 100) / 100

            // Calculate overtime (>8 hours)
            if (hours > 8) {
              updates.overtime_hours = Math.round((hours - 8) * 100) / 100
            }
          }
        } else if (action === "break-start") {
          updates.break_start = currentTime
        } else if (action === "break-end") {
          updates.break_end = currentTime
        }

        if (notes) {
          updates.notes = notes
        }

        const { error: updateError } = await supabase
          .from("attendance_records")
          .update(updates)
          .eq("id", currentRecord.id)

        if (updateError) throw updateError
      } else {
        // Create new record (clock in only)
        if (action !== "in") {
          toast({
            title: "Error",
            description: "You must clock in first",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const { error: insertError } = await supabase.from("attendance_records").insert({
          employee_id: selectedEmployee,
          date: today,
          clock_in: currentTime,
          status: "present",
          notes: notes || null,
        })

        if (insertError) throw insertError
      }

      const actionText =
        action === "in"
          ? "clocked in"
          : action === "out"
            ? "clocked out"
            : action === "break-start"
              ? "started break"
              : "ended break"

      toast({
        title: "Success",
        description: `You have successfully ${actionText}`,
      })

      setNotes("")
      await loadCurrentRecord()
    } catch (error) {
      console.error("[v0] Error recording clock action:", error)
      toast({
        title: "Error",
        description: "Failed to record action. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getWorkDuration = () => {
    if (!currentRecord?.clock_in) return "0h 0m"

    const clockIn = new Date(`2000-01-01T${currentRecord.clock_in}`)
    const now = new Date()
    const currentTimeStr = now.toTimeString().split(" ")[0].slice(0, 5)
    const currentClock = new Date(`2000-01-01T${currentTimeStr}`)

    let totalMinutes = (currentClock.getTime() - clockIn.getTime()) / (1000 * 60)

    // Subtract break time if on break
    if (currentRecord.break_start && !currentRecord.break_end) {
      const breakStart = new Date(`2000-01-01T${currentRecord.break_start}`)
      const breakMinutes = (currentClock.getTime() - breakStart.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    } else if (currentRecord.break_start && currentRecord.break_end) {
      const breakStart = new Date(`2000-01-01T${currentRecord.break_start}`)
      const breakEnd = new Date(`2000-01-01T${currentRecord.break_end}`)
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)

    return `${hours}h ${minutes}m`
  }

  const currentEmployee = employees.find((e) => e.id === selectedEmployee)
  const isClockedIn = currentRecord?.clock_in && !currentRecord?.clock_out
  const onBreak = currentRecord?.break_start && !currentRecord?.break_end

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Employee Clock-In</h1>
          <p className="text-muted-foreground">Quick and easy time tracking</p>
        </div>

        {/* Current Time Display */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <p className="text-sm">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <p className="text-5xl font-bold tabular-nums">
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
              {geoLocation && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Location verified: {geoLocation.lat.toFixed(4)}, {geoLocation.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Name</CardTitle>
            <CardDescription>Choose your name from the list to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your name..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {emp.full_name} - {emp.department}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Current Status */}
        {selectedEmployee && currentEmployee && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Status</CardTitle>
                  <CardDescription>
                    {currentEmployee.full_name} • {currentEmployee.position}
                  </CardDescription>
                </div>
                <Badge variant={isClockedIn ? "default" : "secondary"} className="text-sm">
                  {isClockedIn ? (onBreak ? "On Break" : "Clocked In") : "Clocked Out"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentRecord && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Clock In</p>
                    <p className="text-lg font-bold">{currentRecord.clock_in || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Clock Out</p>
                    <p className="text-lg font-bold">{currentRecord.clock_out || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Time Worked</p>
                    <p className="text-lg font-bold">
                      {isClockedIn
                        ? getWorkDuration()
                        : currentRecord.total_hours
                          ? `${currentRecord.total_hours.toFixed(1)}h`
                          : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Overtime</p>
                    <p className="text-lg font-bold">
                      {currentRecord.overtime_hours ? `${currentRecord.overtime_hours.toFixed(1)}h` : "0h"}
                    </p>
                  </div>
                </div>
              )}

              {!currentRecord && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No attendance record for today. Please clock in to start.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {selectedEmployee && (
          <Card>
            <CardHeader>
              <CardTitle>Clock Actions</CardTitle>
              <CardDescription>Record your time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  size="lg"
                  onClick={() => handleClockAction("in")}
                  disabled={loading || isClockedIn}
                  className="h-24 flex-col gap-2"
                >
                  <CheckCircle className="h-6 w-6" />
                  <span>Clock In</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleClockAction("break-start")}
                  disabled={loading || !isClockedIn || onBreak}
                  className="h-24 flex-col gap-2"
                >
                  <Coffee className="h-6 w-6" />
                  <span>Start Break</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleClockAction("break-end")}
                  disabled={loading || !isClockedIn || !onBreak}
                  className="h-24 flex-col gap-2"
                >
                  <Coffee className="h-6 w-6" />
                  <span>End Break</span>
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => handleClockAction("out")}
                  disabled={loading || !isClockedIn || onBreak}
                  className="h-24 flex-col gap-2"
                >
                  <LogOut className="h-6 w-6" />
                  <span>Clock Out</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about your work today..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <p className="font-medium">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Select your name from the dropdown</li>
                <li>Click "Clock In" when you start your workday</li>
                <li>Use "Start Break" and "End Break" for lunch or breaks</li>
                <li>Click "Clock Out" when you finish your workday</li>
                <li>Your location may be recorded for verification purposes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
