"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Prevent multiple clock-ins/outs for the same employee on the same day
export async function clockIn(employeeId: string, latitude?: number, longitude?: number) {
  const supabase = await createClient()

  // Check if user already clocked in today without clocking out
  const today = new Date().toISOString().split("T")[0]
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("clock_in", `${today}T00:00:00`)
    .lt("clock_in", `${today}T23:59:59`)
    .is("clock_out", null)
    .single()

  if (existing) {
    return {
      success: false,
      error: "You have already clocked in today. Please clock out first.",
    }
  }

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      employee_id: employeeId,
      clock_in: new Date().toISOString(),
      clock_in_latitude: latitude,
      clock_in_longitude: longitude,
      status: "present",
    })
    .select()
    .single()

  if (error) {
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
    .gte("clock_in", `${today}T00:00:00`)
    .lt("clock_in", `${today}T23:59:59`)
    .is("clock_out", null)
    .single()

  if (!record) {
    return {
      success: false,
      error: "No active clock-in found for today. Please clock in first.",
    }
  }

  const clockOut = new Date()
  const clockIn = new Date(record.clock_in)
  const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      clock_out: clockOut.toISOString(),
      clock_out_latitude: latitude,
      clock_out_longitude: longitude,
      total_hours: hoursWorked,
    })
    .eq("id", record.id)
    .select()
    .single()

  if (error) {
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
    .order("clock_in", { ascending: false })

  if (filters.startDate) {
    query = query.gte("clock_in", filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte("clock_in", filters.endDate)
  }
  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  // Filter by department/division/location if provided
  let filtered = data || []
  if (filters.department) {
    filtered = filtered.filter((r) => r.employee?.department === filters.department)
  }
  if (filters.division) {
    filtered = filtered.filter((r) => r.employee?.division === filters.division)
  }
  if (filters.location) {
    filtered = filtered.filter((r) => r.employee?.location === filters.location)
  }

  return { success: true, data: filtered }
}

export async function createOvertimeRequest(data: {
  employeeId: string
  date: string
  hours: number
  reason: string
}) {
  const supabase = await createClient()

  const { data: overtime, error } = await supabase
    .from("overtime_requests")
    .insert({
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
