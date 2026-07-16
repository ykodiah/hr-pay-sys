"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  clock_in_method: string | null
  clock_out_method: string | null
  clock_in_gps_lat: number | null
  clock_in_gps_lng: number | null
  clock_out_gps_lat: number | null
  clock_out_gps_lng: number | null
  total_hours: number | null
  overtime_hours: number | null
  status: string
  notes: string | null
  employee?: {
    id: string
    full_name: string
    employee_id: string
    department: string | null
    division: string | null
    location: string | null
    position: string | null
    profile_picture_url: string | null
  }
}

export interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  grace_period_minutes: number
  working_days: string[]
  department: string | null
  division: string | null
  location: string | null
  is_active: boolean
  company_id: string
}

export interface BiometricDevice {
  id: string
  name: string
  type: string
  location: string
  ip_address: string | null
  serial_number: string | null
  status: string
  last_sync: string | null
  uptime_percentage: number | null
  is_active: boolean
  company_id: string
}

export interface OvertimeRequest {
  id: string
  employee_id: string
  date: string
  hours_requested: number
  hours_approved: number | null
  reason: string
  status: string
  requested_at: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  employee?: {
    id: string
    full_name: string
    employee_id: string
    department: string | null
  }
}

// Get attendance records with filters
export async function getAttendanceRecords(filters?: {
  dateRange?: string
  department?: string
  division?: string
  location?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()

  // Get user's company
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { data: [], error: "Employee not found" }

  // Build date range filter
  const startDate = new Date()
  let endDate = new Date()

  switch (filters?.dateRange) {
    case "yesterday":
      startDate.setDate(startDate.getDate() - 1)
      endDate = new Date(startDate)
      break
    case "this-week":
      startDate.setDate(startDate.getDate() - startDate.getDay())
      break
    case "this-month":
      startDate.setDate(1)
      break
    case "last-month":
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setDate(1)
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      break
    default: // today
      break
  }

  let query = supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees(
        id,
        full_name,
        employee_id,
        department,
        division,
        location,
        position,
        profile_picture_url
      )
    `)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date", { ascending: false })
    .order("clock_in", { ascending: false })

  // Apply filters
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching attendance:", error)
    return { data: [], error: error.message }
  }

  // Filter by department/division/location on the employee level
  let filteredData = data || []

  if (filters?.department && filters.department !== "all") {
    filteredData = filteredData.filter((r) => r.employee?.department === filters.department)
  }
  if (filters?.division && filters.division !== "all") {
    filteredData = filteredData.filter((r) => r.employee?.division === filters.division)
  }
  if (filters?.location && filters.location !== "all") {
    filteredData = filteredData.filter((r) => r.employee?.location === filters.location)
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase()
    filteredData = filteredData.filter(
      (r) =>
        r.employee?.full_name?.toLowerCase().includes(search) ||
        r.employee?.employee_id?.toLowerCase().includes(search),
    )
  }

  return { data: filteredData, error: null }
}

// Clock In with GPS
export async function clockIn(data: {
  method: string
  latitude?: number
  longitude?: number
  deviceId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const today = new Date().toISOString().split("T")[0]
  const currentTime = new Date().toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Check if already clocked in today
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("id, clock_in, clock_out")
    .eq("employee_id", user.id)
    .eq("date", today)
    .single()

  if (existing?.clock_in && !existing?.clock_out) {
    return { success: false, error: "Already clocked in. Please clock out first." }
  }

  // Get employee's shift to determine if late
  const { data: employee } = await supabase
    .from("employees")
    .select("department, division, location")
    .eq("id", user.id)
    .single()

  const { data: shift } = await supabase
    .from("shifts")
    .select("*")
    .eq("is_active", true)
    .or(`department.eq.${employee?.department},department.is.null`)
    .limit(1)
    .single()

  // Determine status based on shift
  let status = "present"
  if (shift) {
    const shiftStart = shift.start_time
    const gracePeriod = shift.grace_period_minutes || 0
    const [shiftHour, shiftMin] = shiftStart.split(":").map(Number)
    const [currentHour, currentMin] = currentTime.split(":").map(Number)

    const shiftStartMinutes = shiftHour * 60 + shiftMin + gracePeriod
    const currentMinutes = currentHour * 60 + currentMin

    if (currentMinutes > shiftStartMinutes) {
      status = "late"
    }
  }

  if (existing) {
    // Update existing record (re-clock in after clock out)
    const { error } = await supabase
      .from("attendance_records")
      .update({
        clock_in: currentTime,
        clock_in_method: data.method,
        clock_in_gps_lat: data.latitude,
        clock_in_gps_lng: data.longitude,
        clock_in_device_id: data.deviceId,
        clock_out: null,
        clock_out_method: null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (error) return { success: false, error: error.message }
  } else {
    // Create new record
    const { error } = await supabase.from("attendance_records").insert({
      employee_id: user.id,
      date: today,
      clock_in: currentTime,
      clock_in_method: data.method,
      clock_in_gps_lat: data.latitude,
      clock_in_gps_lng: data.longitude,
      clock_in_device_id: data.deviceId,
      status,
    })

    if (error) return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, time: currentTime, status }
}

// Clock Out with GPS
export async function clockOut(data: {
  method: string
  latitude?: number
  longitude?: number
  deviceId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const today = new Date().toISOString().split("T")[0]
  const currentTime = new Date().toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Get today's attendance record
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", user.id)
    .eq("date", today)
    .single()

  if (!existing) {
    return { success: false, error: "No clock-in record found for today" }
  }

  if (existing.clock_out) {
    return { success: false, error: "Already clocked out today" }
  }

  // Calculate total hours and overtime
  const [inHour, inMin] = existing.clock_in.split(":").map(Number)
  const [outHour, outMin] = currentTime.split(":").map(Number)

  const totalMinutes = outHour * 60 + outMin - (inHour * 60 + inMin)
  const totalHours = Math.max(0, totalMinutes / 60)
  const overtimeHours = Math.max(0, totalHours - 8)

  // Determine if early departure
  let status = existing.status
  const { data: shift } = await supabase.from("shifts").select("end_time").eq("is_active", true).limit(1).single()

  if (shift) {
    const [endHour, endMin] = shift.end_time.split(":").map(Number)
    const endMinutes = endHour * 60 + endMin
    const outMinutes = outHour * 60 + outMin

    if (outMinutes < endMinutes - 30) {
      // More than 30 mins early
      status = "early-departure"
    }
  }

  const { error } = await supabase
    .from("attendance_records")
    .update({
      clock_out: currentTime,
      clock_out_method: data.method,
      clock_out_gps_lat: data.latitude,
      clock_out_gps_lng: data.longitude,
      clock_out_device_id: data.deviceId,
      total_hours: Number(totalHours.toFixed(2)),
      overtime_hours: Number(overtimeHours.toFixed(2)),
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return {
    success: true,
    time: currentTime,
    totalHours: totalHours.toFixed(2),
    overtimeHours: overtimeHours.toFixed(2),
  }
}

// Get current clock status
export async function getClockStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isClockedIn: false, record: null }

  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", user.id)
    .eq("date", today)
    .single()

  return {
    isClockedIn: data?.clock_in && !data?.clock_out,
    record: data,
  }
}

// Get shifts
export async function getShifts() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { data: [], error: "Employee not found" }

  const { data, error } = await supabase.from("shifts").select("*").eq("company_id", employee.company_id).order("name")

  if (error) return { data: [], error: error.message }
  return { data: data || [], error: null }
}

// Create shift
export async function createShift(shift: {
  name: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  grace_period_minutes: number
  working_days: string[]
  department?: string
  division?: string
  location?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { success: false, error: "Employee not found" }

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      ...shift,
      company_id: employee.company_id,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

// Update shift
export async function updateShift(id: string, updates: Partial<Shift>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("shifts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true }
}

// Delete shift
export async function deleteShift(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("shifts").delete().eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true }
}

// Get biometric devices
export async function getBiometricDevices() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { data: [], error: "Employee not found" }

  const { data, error } = await supabase
    .from("biometric_devices")
    .select("*")
    .eq("company_id", employee.company_id)
    .order("name")

  if (error) return { data: [], error: error.message }
  return { data: data || [], error: null }
}

// Create biometric device
export async function createBiometricDevice(device: {
  name: string
  type: string
  location: string
  ip_address?: string
  serial_number?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { success: false, error: "Employee not found" }

  const { data, error } = await supabase
    .from("biometric_devices")
    .insert({
      ...device,
      company_id: employee.company_id,
      status: "online",
      is_active: true,
      uptime_percentage: 100,
      last_sync: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

// Sync biometric device
export async function syncBiometricDevice(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("biometric_devices")
    .update({
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true }
}

// Toggle device status
export async function toggleDeviceStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("biometric_devices")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true }
}

// Get overtime requests
export async function getOvertimeRequests(status?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { data: [], error: "Employee not found" }

  let query = supabase
    .from("overtime_requests")
    .select(`
      *,
      employee:employees(id, full_name, employee_id, department)
    `)
    .eq("company_id", employee.company_id)
    .order("created_at", { ascending: false })

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) return { data: [], error: error.message }
  return { data: data || [], error: null }
}

// Create overtime request
export async function createOvertimeRequest(request: {
  date: string
  hours_requested: number
  reason: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { success: false, error: "Employee not found" }

  const { data, error } = await supabase
    .from("overtime_requests")
    .insert({
      employee_id: user.id,
      company_id: employee.company_id,
      date: request.date,
      hours_requested: request.hours_requested,
      reason: request.reason,
      status: "pending",
      requested_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

// Approve/Reject overtime request
export async function updateOvertimeRequest(
  id: string,
  action: "approved" | "rejected",
  data?: {
    hours_approved?: number
    rejection_reason?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const updates: Record<string, unknown> = {
    status: action,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (action === "approved" && data?.hours_approved) {
    updates.hours_approved = data.hours_approved
  }
  if (action === "rejected" && data?.rejection_reason) {
    updates.rejection_reason = data.rejection_reason
  }

  const { error } = await supabase.from("overtime_requests").update(updates).eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/attendance")
  return { success: true }
}

// Get attendance stats
export async function getAttendanceStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return null

  const today = new Date().toISOString().split("T")[0]

  // Get today's attendance
  const { data: todayRecords } = await supabase.from("attendance_records").select("status").eq("date", today)

  // Get total employees
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact" })
    .eq("company_id", employee.company_id)
    .in("status", ["Active", "active", "ACTIVE"])

  // Get devices
  const { data: devices } = await supabase
    .from("biometric_devices")
    .select("status")
    .eq("company_id", employee.company_id)

  // Get pending overtime
  const { data: overtimeRequests } = await supabase
    .from("overtime_requests")
    .select("hours_requested")
    .eq("company_id", employee.company_id)
    .eq("status", "pending")

  const records = todayRecords || []
  const present = records.filter((r) => r.status === "present" || r.status === "late").length
  const late = records.filter((r) => r.status === "late").length
  const absent = (totalEmployees || 0) - present
  const devicesOnline = devices?.filter((d) => d.status === "online").length || 0
  const totalDevices = devices?.length || 0
  const pendingOvertime = overtimeRequests?.reduce((sum, r) => sum + (r.hours_requested || 0), 0) || 0

  return {
    presentToday: present,
    lateArrivals: late,
    absent,
    totalEmployees: totalEmployees || 0,
    devicesOnline,
    totalDevices,
    pendingOvertime,
    attendanceRate: totalEmployees ? Math.round((present / totalEmployees) * 100) : 0,
  }
}

// Generate attendance report
export async function generateAttendanceReport(
  type: string,
  filters?: {
    startDate?: string
    endDate?: string
    department?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { success: false, error: "Employee not found" }

  // Get company info
  const { data: company } = await supabase
    .from("companies")
    .select("name, address, logo_url")
    .eq("id", employee.company_id)
    .single()

  let startDate = new Date()
  let endDate = new Date()

  switch (type) {
    case "daily":
      break
    case "weekly":
      startDate.setDate(startDate.getDate() - 7)
      break
    case "monthly":
      startDate.setMonth(startDate.getMonth() - 1)
      break
    default:
      if (filters?.startDate) startDate = new Date(filters.startDate)
      if (filters?.endDate) endDate = new Date(filters.endDate)
  }

  const { data: records } = await supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees(full_name, employee_id, department, division, location)
    `)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date", { ascending: false })

  return {
    success: true,
    data: {
      company,
      records: records || [],
      period: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      generatedAt: new Date().toISOString(),
    },
  }
}
