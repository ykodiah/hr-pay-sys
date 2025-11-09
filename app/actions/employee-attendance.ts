"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Get current employee ID
async function getCurrentEmployeeId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  return user.id
}

// Get employee's own attendance records
export async function getMyAttendance(startDate?: string, endDate?: string) {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  let query = supabase
    .from("attendance_records")
    .select(`
      *,
      shift:attendance_shifts(shift_name, shift_code, start_time, end_time, color_code)
    `)
    .eq("employee_id", employeeId)
    .order("date", { ascending: false })

  if (startDate) {
    query = query.gte("date", startDate)
  }

  if (endDate) {
    query = query.lte("date", endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get employee's attendance summary
export async function getMyAttendanceSummary() {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])

  const summary = {
    totalDays: records?.length || 0,
    presentDays: records?.filter((r) => r.status === "present").length || 0,
    absentDays: records?.filter((r) => r.status === "absent").length || 0,
    lateDays: records?.filter((r) => r.is_late).length || 0,
    totalHours: records?.reduce((sum, r) => sum + (r.total_hours || 0), 0) || 0,
    overtimeHours: records?.reduce((sum, r) => sum + (r.overtime_hours || 0), 0) || 0,
    attendanceRate: 0,
  }

  summary.attendanceRate =
    summary.totalDays > 0 ? Number(((summary.presentDays / summary.totalDays) * 100).toFixed(1)) : 0

  return summary
}

// Get employee's overtime requests
export async function getMyOvertimeRequests() {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  const { data, error } = await supabase
    .from("overtime_requests")
    .select(`
      *,
      approved_by_employee:employees!overtime_requests_approved_by_fkey(full_name)
    `)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Submit overtime request
export async function submitOvertimeRequest(request: {
  request_date: string
  start_time: string
  end_time: string
  overtime_type: string
  reason: string
}) {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  // Get employee's company
  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", employeeId).single()

  if (!employee) throw new Error("Employee not found")

  // Calculate hours
  const start = new Date(`1970-01-01T${request.start_time}`)
  const end = new Date(`1970-01-01T${request.end_time}`)
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  const { data, error } = await supabase
    .from("overtime_requests")
    .insert({
      employee_id: employeeId,
      company_id: employee.company_id,
      request_date: request.request_date,
      start_time: request.start_time,
      end_time: request.end_time,
      hours_requested: hours,
      overtime_type: request.overtime_type,
      reason: request.reason,
      status: "pending",
      requested_by: employeeId,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/app/my-attendance")
  return data
}

// Create attendance dispute
export async function createAttendanceDispute(params: {
  attendanceRecordId: string
  employeeId: string
  reason: string
  proposedClockIn: string
  proposedClockOut?: string
  companyId: string
}) {
  const supabase = await createClient()

  // Verify the record belongs to the employee
  const { data: record } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("id", params.attendanceRecordId)
    .eq("employee_id", params.employeeId)
    .single()

  if (!record) throw new Error("Record not found or unauthorized")

  // Create dispute record
  const { data, error } = await supabase
    .from("attendance_disputes")
    .insert({
      attendance_record_id: params.attendanceRecordId,
      employee_id: params.employeeId,
      company_id: params.companyId,
      dispute_reason: params.reason,
      proposed_clock_in: params.proposedClockIn,
      proposed_clock_out: params.proposedClockOut,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/self-service/attendance")
  revalidatePath("/app/my-attendance")
  return data
}

// Get employee's shift schedule
export async function getMyShiftSchedule() {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  const { data, error } = await supabase
    .from("employee_shifts")
    .select(`
      *,
      shift:attendance_shifts(*)
    `)
    .eq("employee_id", employeeId)
    .eq("is_active", true)

  if (error) throw error
  return data
}

// Create overtime request
export async function createOvertimeRequest(params: {
  employeeId: string
  date: string
  hoursRequested: number
  reason: string
  companyId: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("overtime_requests")
    .insert({
      employee_id: params.employeeId,
      company_id: params.companyId,
      request_date: params.date,
      hours_requested: params.hoursRequested,
      overtime_type: "regular",
      reason: params.reason,
      status: "pending",
      requested_by: params.employeeId,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/self-service/attendance")
  revalidatePath("/app/my-attendance")
  return data
}
