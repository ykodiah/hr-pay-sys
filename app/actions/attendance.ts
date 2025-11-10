"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export interface AttendanceRecord {
  id?: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  break_start?: string
  break_end?: string
  total_hours?: number
  overtime_hours?: number
  status: string
  shift_id?: string
  device_id?: string
  is_late?: boolean
  late_minutes?: number
  notes?: string
  company_id: string
  gps_clock_in?: string
  gps_clock_out?: string
}

export interface Shift {
  id?: string
  company_id: string
  shift_name: string
  shift_code: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  grace_period_minutes: number
  days_of_week: string[]
  color_code?: string
  is_active: boolean
}

export interface OvertimeRequest {
  id?: string
  employee_id: string
  company_id: string
  request_date: string
  start_time: string
  end_time: string
  hours_requested: number
  overtime_type: string
  reason?: string
  status: string
}

// Get current company ID helper
async function getCurrentCompanyId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) throw new Error("Employee not found")

  return employee.company_id
}

// ===== Attendance Records Actions =====

export async function getAttendanceRecords(filters?: {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: string
  limit?: number
}) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  let query = supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees(id, full_name, employee_id, department, position),
      shift:attendance_shifts(shift_name, shift_code, color_code)
    `)
    .eq("company_id", companyId)
    .order("date", { ascending: false })

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte("date", filters.endDate)
  }

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createAttendanceRecord(record: AttendanceRecord) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      ...record,
      company_id: companyId,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("attendance_records").update(updates).eq("id", id).select().single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function deleteAttendanceRecord(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("attendance_records").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/app/attendance")
  return { success: true }
}

export async function bulkUpdateAttendanceStatus(ids: string[], status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("attendance_records").update({ status }).in("id", ids)

  if (error) throw error

  revalidatePath("/app/attendance")
  return { success: true, count: ids.length }
}

export async function clockIn(employeeId: string, geolocation?: { latitude: number; longitude: number }) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()
  const today = new Date().toISOString().split("T")[0]

  // Check if employee already clocked in today
  const { data: existingRecord } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single()

  if (existingRecord && existingRecord.clock_in && !existingRecord.clock_out) {
    throw new Error("Employee has already clocked in and not clocked out yet")
  }

  if (existingRecord && existingRecord.clock_in && existingRecord.clock_out) {
    throw new Error("Employee has already completed attendance for today")
  }

  const currentTime = new Date().toISOString()

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      employee_id: employeeId,
      company_id: companyId,
      date: today,
      clock_in: currentTime,
      gps_clock_in: geolocation ? `POINT(${geolocation.longitude} ${geolocation.latitude})` : null,
      status: "present",
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  revalidatePath("/self-service/attendance")
  return data
}

export async function clockOut(employeeId: string, geolocation?: { latitude: number; longitude: number }) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Find today's attendance record
  const { data: existingRecord } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single()

  if (!existingRecord) {
    throw new Error("No clock-in record found for today. Please clock in first.")
  }

  if (existingRecord.clock_out) {
    throw new Error("Employee has already clocked out today")
  }

  const currentTime = new Date().toISOString()

  // Calculate total hours
  const clockInTime = new Date(existingRecord.clock_in)
  const clockOutTime = new Date(currentTime)
  const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      clock_out: currentTime,
      gps_clock_out: geolocation ? `POINT(${geolocation.longitude} ${geolocation.latitude})` : null,
      total_hours: totalHours,
    })
    .eq("id", existingRecord.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  revalidatePath("/self-service/attendance")
  return data
}

// ===== Shifts Actions =====

export async function getShifts() {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data, error } = await supabase
    .from("attendance_shifts")
    .select("*")
    .eq("company_id", companyId)
    .order("shift_name")

  if (error) throw error
  return data
}

export async function createShift(shift: Shift) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("attendance_shifts")
    .insert({
      ...shift,
      company_id: companyId,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function updateShift(id: string, updates: Partial<Shift>) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("attendance_shifts").update(updates).eq("id", id).select().single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function deleteShift(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("attendance_shifts").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/app/attendance")
  return { success: true }
}

// ===== Overtime Requests Actions =====

export async function getOvertimeRequests(filters?: {
  status?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  let query = supabase
    .from("overtime_requests")
    .select(`
      *,
      employee:employees(id, full_name, employee_id, department),
      approved_by_employee:employees!overtime_requests_approved_by_fkey(full_name)
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  if (filters?.startDate) {
    query = query.gte("request_date", filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte("request_date", filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createOvertimeRequest(request: OvertimeRequest) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("overtime_requests")
    .insert({
      ...request,
      company_id: companyId,
      requested_by: user?.id,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function approveOvertimeRequest(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("overtime_requests")
    .update({
      status: "approved",
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function rejectOvertimeRequest(id: string, reason: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("overtime_requests")
    .update({
      status: "rejected",
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

// ===== Biometric Devices Actions =====

export async function getBiometricDevices() {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data, error } = await supabase
    .from("biometric_devices")
    .select("*")
    .eq("company_id", companyId)
    .order("device_name")

  if (error) throw error
  return data
}

export async function syncBiometricDevice(deviceId: string) {
  const supabase = await createClient()

  // Update last sync timestamp
  const { data, error } = await supabase
    .from("biometric_devices")
    .update({
      last_sync: new Date().toISOString(),
      is_online: true,
    })
    .eq("id", deviceId)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

export async function updateDeviceStatus(deviceId: string, status: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("biometric_devices")
    .update({
      status,
      is_online: status === "active",
    })
    .eq("id", deviceId)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/attendance")
  return data
}

// ===== Analytics Actions =====

export async function getAttendanceStats(startDate: string, endDate: string) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data, error } = await supabase
    .from("attendance_records")
    .select("status, total_hours, overtime_hours, is_late")
    .eq("company_id", companyId)
    .gte("date", startDate)
    .lte("date", endDate)

  if (error) throw error

  // Calculate statistics
  const stats = {
    totalRecords: data.length,
    present: data.filter((r) => r.status === "present").length,
    absent: data.filter((r) => r.status === "absent").length,
    late: data.filter((r) => r.is_late).length,
    totalHours: data.reduce((sum, r) => sum + (r.total_hours || 0), 0),
    overtimeHours: data.reduce((sum, r) => sum + (r.overtime_hours || 0), 0),
  }

  return stats
}

export async function getAttendanceTrends(days = 30) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from("attendance_records")
    .select("date, status, total_hours")
    .eq("company_id", companyId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date")

  if (error) throw error

  // Group by date
  const trends = data.reduce((acc: any, record) => {
    const date = record.date
    if (!acc[date]) {
      acc[date] = { date, present: 0, absent: 0, totalHours: 0 }
    }
    if (record.status === "present") acc[date].present++
    if (record.status === "absent") acc[date].absent++
    acc[date].totalHours += record.total_hours || 0
    return acc
  }, {})

  return Object.values(trends)
}

export async function getFilteredAttendance(filters?: {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: string
  department?: string
  division?: string
  location?: string
  limit?: number
}) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  let query = supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees!inner(
        id, 
        full_name, 
        employee_id, 
        department, 
        division,
        position,
        subsidiary_id,
        subsidiaries(id, name, location)
      ),
      shift:attendance_shifts(shift_name, shift_code, color_code)
    `)
    .eq("company_id", companyId)
    .order("date", { ascending: false })

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte("date", filters.endDate)
  }

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.department) {
    query = query.eq("employee.department", filters.department)
  }

  if (filters?.division) {
    query = query.eq("employee.division", filters.division)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getCompanyDetails() {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(`
      *,
      subsidiaries(id, name, location, subsidiary_code)
    `)
    .eq("id", companyId)
    .single()

  if (companyError) throw companyError
  return company
}
