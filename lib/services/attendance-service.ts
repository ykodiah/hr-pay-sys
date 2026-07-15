import { BaseService } from "./base-service"
import type { AttendanceRecord, ServiceResponse } from "./types"

export class AttendanceService extends BaseService {
  async getAttendanceByDate(companyId: string, date: string): Promise<ServiceResponse<AttendanceRecord[]>> {
    return this.handleRequest<AttendanceRecord[]>(async (client) => {
      const { data: employees } = await client
        .from("employees")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "active")

      if (!employees || employees.length === 0) return []

      const employeeIds = employees.map((e: { id: string }) => e.id)
      const { data, error } = await client
        .from("attendance_records")
        .select("*")
        .in("employee_id", employeeIds)
        .eq("date", date)

      if (error) throw error
      return data || []
    }, "GET_ATTENDANCE_ERROR")
  }

  async getEmployeeAttendance(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<AttendanceRecord[]>> {
    return this.handleRequest<AttendanceRecord[]>(async (client) => {
      const { data, error } = await client
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })

      if (error) throw error
      return data || []
    }, "GET_EMPLOYEE_ATTENDANCE_ERROR")
  }

  async recordClockIn(employeeId: string, date: string, clockInTime: string, method: string): Promise<ServiceResponse<AttendanceRecord>> {
    return this.handleRequest<AttendanceRecord>(async (client) => {
      // Check if record exists for today
      const { data: existing } = await client
        .from("attendance_records")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("date", date)
        .single()

      if (existing) {
        // Update existing record
        const { data, error } = await client
          .from("attendance_records")
          .update({
            clock_in: clockInTime,
            clock_in_method: method,
            status: "present",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      }

      // Create new record
      const { data, error } = await client
        .from("attendance_records")
        .insert([
          {
            employee_id: employeeId,
            date,
            clock_in: clockInTime,
            clock_in_method: method,
            status: "present",
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    }, "CLOCK_IN_ERROR")
  }

  async recordClockOut(employeeId: string, date: string, clockOutTime: string, method: string): Promise<ServiceResponse<AttendanceRecord>> {
    return this.handleRequest<AttendanceRecord>(async (client) => {
      const { data: existing, error: fetchError } = await client
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("date", date)
        .single()

      if (fetchError) throw fetchError

      if (!existing?.clock_in) {
        throw new Error("No clock-in record found for this date")
      }

      // Calculate total hours
      const clockIn = new Date(`${date}T${existing.clock_in}`)
      const clockOut = new Date(`${date}T${clockOutTime}`)
      const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

      const { data, error } = await client
        .from("attendance_records")
        .update({
          clock_out: clockOutTime,
          clock_out_method: method,
          total_hours: totalHours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    }, "CLOCK_OUT_ERROR")
  }

  async getAttendanceSummary(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<
    ServiceResponse<{
      totalDays: number
      presentDays: number
      absentDays: number
      lateDays: number
      onLeaveDays: number
      attendanceRate: number
    }>
  > {
    return this.handleRequest<any>(async (client) => {
      const { data: records, error } = await client
        .from("attendance_records")
        .select("status")
        .in("employee_id", (
          await client
            .from("employees")
            .select("id")
            .eq("company_id", companyId)
            .eq("status", "active")
        ).data?.map((e: any) => e.id) || [])
        .gte("date", startDate)
        .lte("date", endDate)

      if (error) throw error

      const summary = {
        totalDays: records?.length || 0,
        presentDays: records?.filter((r: any) => r.status === "present").length || 0,
        absentDays: records?.filter((r: any) => r.status === "absent").length || 0,
        lateDays: records?.filter((r: any) => r.status === "late").length || 0,
        onLeaveDays: records?.filter((r: any) => r.status === "leave").length || 0,
        attendanceRate: 0,
      }

      summary.attendanceRate =
        summary.totalDays > 0 ? ((summary.presentDays + summary.lateDays) / summary.totalDays) * 100 : 0

      return summary
    }, "GET_ATTENDANCE_SUMMARY_ERROR")
  }

  async markAbsent(employeeId: string, date: string, reason?: string): Promise<ServiceResponse<AttendanceRecord>> {
    return this.handleRequest<AttendanceRecord>(async (client) => {
      const { data: existing } = await client
        .from("attendance_records")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("date", date)
        .single()

      if (existing) {
        const { data, error } = await client
          .from("attendance_records")
          .update({
            status: "absent",
            notes: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      }

      const { data, error } = await client
        .from("attendance_records")
        .insert([
          {
            employee_id: employeeId,
            date,
            status: "absent",
            notes: reason,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    }, "MARK_ABSENT_ERROR")
  }
}
