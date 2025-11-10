"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Prevent multiple clock-ins/outs for the same employee on the same day
export async function clockIn(employeeId: string, latitude?: number, longitude?: number) {
  const supabase = await createClient()

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", employeeId).single()

  if (!employee) {
    return { success: false, error: "Employee not found" }
  }

  // Check if user already clocked in today without clocking out
  const today = new Date().toISOString().split("T")[0]
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .is("clock_out", null)
    .single()

  if (existing) {
    return {
      success: false,
      error: "You have already clocked in today. Please clock out first.",
    }
  }

  const now = new Date()
  const timeOnly = now.toTimeString().split(" ")[0] // Format: HH:MM:SS

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      employee_id: employeeId,
      date: today,
      clock_in: timeOnly,
      status: "present",
      // Note: GPS columns need to be added to the schema or stored in metadata
    })
    .select()
    .single()

  if (error) {
    console.log("[v0] Clock in error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  revalidatePath("/self-service/attendance")
  return { success: true, data }
}

export async function clockOut(employeeId: string, latitude?: number, longitude?: number) {
  const supabase = await createClient()

  // Find today's clock-in record without clock-out
  const today = new Date().toISOString().split("T")[0]
  const { data: record } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .is("clock_out", null)
    .single()

  if (!record) {
    return {
      success: false,
      error: "No active clock-in found for today. Please clock in first.",
    }
  }

  const now = new Date()
  const timeOnly = now.toTimeString().split(" ")[0]

  const [clockInHours, clockInMinutes, clockInSeconds] = record.clock_in.split(":").map(Number)
  const [clockOutHours, clockOutMinutes, clockOutSeconds] = timeOnly.split(":").map(Number)

  const clockInDate = new Date()
  clockInDate.setHours(clockInHours, clockInMinutes, clockInSeconds)

  const clockOutDate = new Date()
  clockOutDate.setHours(clockOutHours, clockOutMinutes, clockOutSeconds)

  const hoursWorked = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
  const overtimeHours = Math.max(0, hoursWorked - 8)

  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      clock_out: timeOnly,
      total_hours: hoursWorked,
      overtime_hours: overtimeHours,
    })
    .eq("id", record.id)
    .select()
    .single()

  if (error) {
    console.log("[v0] Clock out error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  revalidatePath("/self-service/attendance")
  return { success: true, data }
}

export async function getAttendanceRecords(filters: {
  startDate?: string
  endDate?: string
  department?: string
  division?: string
  location?: string
  employeeId?: string
}) {
  const supabase = await createClient()

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
        subsidiary:subsidiaries(name)
      )
    `)
    .order("date", { ascending: false })

  if (filters.startDate) {
    const startDate = new Date(filters.startDate).toISOString().split("T")[0]
    query = query.gte("date", startDate)
  }
  if (filters.endDate) {
    const endDate = new Date(filters.endDate).toISOString().split("T")[0]
    query = query.lte("date", endDate)
  }
  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  const { data, error } = await query

  if (error) {
    console.log("[v0] Error fetching attendance records:", error)
    return { success: false, error: error.message, data: [] }
  }

  // Filter by department/division/location if provided
  let filtered = data || []
  if (filters.department && filters.department !== "all") {
    filtered = filtered.filter((r) => r.employee?.department === filters.department)
  }
  if (filters.division && filters.division !== "all") {
    filtered = filtered.filter((r) => r.employee?.division === filters.division)
  }
  if (filters.location && filters.location !== "all") {
    filtered = filtered.filter((r) => r.employee?.location === filters.location)
  }

  return { success: true, data: filtered }
}

export async function getEmployeeAttendanceStatus(employeeId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: record } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single()

  if (!record) {
    return { success: true, status: "not_clocked_in", record: null }
  }

  if (record.clock_out) {
    return { success: true, status: "clocked_out", record }
  }

  return { success: true, status: "clocked_in", record }
}

export async function createOvertimeRequest(data: {
  employeeId: string
  date: string
  hours: number
  reason: string
}) {
  const supabase = await createClient()

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", data.employeeId).single()

  if (!employee) {
    return { success: false, error: "Employee not found" }
  }

  const { data: overtime, error } = await supabase
    .from("overtime_requests")
    .insert({
      company_id: employee.company_id,
      employee_id: data.employeeId,
      date: data.date,
      hours_requested: data.hours,
      reason: data.reason,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  revalidatePath("/self-service/attendance")
  return { success: true, data: overtime }
}

export async function approveOvertimeRequest(id: string, approvedHours: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("overtime_requests")
    .update({
      status: "approved",
      hours_approved: approvedHours,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

export async function rejectOvertimeRequest(id: string, reason: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("overtime_requests")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

export async function getCompanyInfo() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id, subsidiary_id")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  const { data: company } = await supabase.from("companies").select("*").eq("id", profile.company_id).single()

  let subsidiary = null
  if (profile.subsidiary_id) {
    const { data } = await supabase.from("subsidiaries").select("*").eq("id", profile.subsidiary_id).single()
    subsidiary = data
  }

  return { company, subsidiary }
}

export async function getOvertimeRequests() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("overtime_requests")
    .select(`
      *,
      employee:employees(
        id,
        full_name,
        employee_id,
        department
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function getBiometricDevices() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("biometric_devices").select("*").order("name")

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function syncBiometricDevice(deviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("biometric_devices")
    .update({
      last_sync: new Date().toISOString(),
    })
    .eq("id", deviceId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

export async function addBiometricDevice(device: {
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

  const { data: profile } = await supabase.from("user_profiles").select("company_id").eq("id", user.id).single()

  if (!profile) return { success: false, error: "User profile not found" }

  const { data, error } = await supabase
    .from("biometric_devices")
    .insert({
      ...device,
      company_id: profile.company_id,
      status: "online",
      last_sync: new Date().toISOString(),
      uptime_percentage: 100,
    })
    .select()
    .single()

  if (error) {
    console.log("[v0] Add device error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

export async function getShifts() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("shifts").select("*").order("name")

  if (error) {
    console.log("[v0] Error fetching shifts:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

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

  const { data: profile } = await supabase.from("user_profiles").select("company_id").eq("id", user.id).single()

  if (!profile) return { success: false, error: "User profile not found" }

  const { data: insertedShift, error } = await supabase
    .from("shifts")
    .insert({
      ...shift,
      department: shift.department === "none" ? undefined : shift.department,
      division: shift.division === "none" ? undefined : shift.division,
      location: shift.location === "none" ? undefined : shift.location,
      company_id: profile.company_id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, data: insertedShift }
}

export async function updateShift(id: string, updates: any) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("shifts").update(updates).eq("id", id).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true, data }
}

export async function deleteShift(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("shifts").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/app/attendance")
  return { success: true }
}
