import { BaseService } from "./base-service"
import { EmployeeService } from "./employee-service"
import { PayrollService } from "./payroll-service"
import { AttendanceService } from "./attendance-service"
import type { DashboardStats, ServiceResponse, Activity } from "./types"

export class DashboardService extends BaseService {
  private employeeService: EmployeeService
  private payrollService: PayrollService
  private attendanceService: AttendanceService

  constructor(isServer: boolean = true) {
    super(isServer)
    this.employeeService = new EmployeeService(isServer)
    this.payrollService = new PayrollService(isServer)
    this.attendanceService = new AttendanceService(isServer)
  }

  async getDashboardStats(companyId: string): Promise<ServiceResponse<DashboardStats>> {
    try {
      const client = await this.getClient()

      // Get employee counts
      const { data: employees } = await client.from("employees").select("status").eq("company_id", companyId)

      const totalEmployees = employees?.length || 0
      const activeEmployees = employees?.filter((e: any) => e.status === "active").length || 0
      const onLeaveEmployees = employees?.filter((e: any) => e.status === "on_leave").length || 0
      const inactiveEmployees = employees?.filter((e: any) => e.status === "inactive").length || 0

      // Get latest payroll
      const { data: payrollRuns } = await client
        .from("payroll_runs")
        .select("total_net_pay")
        .eq("company_id", companyId)
        .eq("status", "paid")
        .order("pay_date", { ascending: false })
        .limit(1)

      const totalPayroll = payrollRuns?.[0]?.total_net_pay || 0

      // Get today's attendance rate
      const today = new Date().toISOString().split("T")[0]
      const { data: todayAttendance } = await client
        .from("attendance_records")
        .select("status")
        .eq("date", today)
        .in("employee_id", employees?.map((e: any) => e.id) || [])

      const presentCount = todayAttendance?.filter((a: any) => a.status === "present").length || 0
      const attendanceRate = totalEmployees > 0 ? (presentCount / totalEmployees) * 100 : 0

      // Get pending approvals
      const { data: pendingPayrolls } = await client
        .from("payroll_runs")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "draft")

      const { data: pendingLeaves } = await client
        .from("leave_requests")
        .select("id")
        .eq("status", "pending")
        .in("employee_id", employees?.map((e: any) => e.id) || [])

      const pendingApprovals = (pendingPayrolls?.length || 0) + (pendingLeaves?.length || 0)

      // Get recent activities
      const { data: recentActivities } = await client
        .from("access_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10)

      const activities: Activity[] = (recentActivities || []).map((log: any) => ({
        id: log.id,
        type: log.action,
        actor: log.employee_id || "System",
        action: `${log.action} - ${log.resource}`,
        timestamp: log.created_at,
      }))

      return this.createSuccessResponse({
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        inactiveEmployees,
        totalPayroll,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        pendingApprovals,
        recentActivities: activities,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get dashboard stats"
      return this.createErrorResponse(this.createError("DASHBOARD_ERROR", message))
    }
  }

  async getHRDashboardStats(companyId: string): Promise<
    ServiceResponse<{
      payrollMetrics: any
      attendanceMetrics: any
      employeeMetrics: any
    }>
  > {
    try {
      const client = await this.getClient()

      // Payroll metrics
      const { data: recentPayrolls } = await client
        .from("payroll_runs")
        .select("*")
        .eq("company_id", companyId)
        .order("pay_date", { ascending: false })
        .limit(12)

      const payrollMetrics = {
        lastPayDate: recentPayrolls?.[0]?.pay_date,
        monthlyAverage: 0,
        totalProcessed: recentPayrolls?.filter((p: any) => p.status === "paid").length || 0,
      }

      if (recentPayrolls && recentPayrolls.length > 0) {
        const totalPayroll = recentPayrolls.reduce((sum: number, p: any) => sum + (p.total_net_pay || 0), 0)
        payrollMetrics.monthlyAverage = totalPayroll / recentPayrolls.length
      }

      // Attendance metrics
      const { data: employees } = await client.from("employees").select("id").eq("company_id", companyId)
      const employeeIds = employees?.map((e: any) => e.id) || []

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const { data: attendanceData } = await client
        .from("attendance_records")
        .select("status")
        .in("employee_id", employeeIds)
        .gte("date", thirtyDaysAgo)

      const attendanceMetrics = {
        presentDays: attendanceData?.filter((a: any) => a.status === "present").length || 0,
        absentDays: attendanceData?.filter((a: any) => a.status === "absent").length || 0,
        lateDays: attendanceData?.filter((a: any) => a.status === "late").length || 0,
        totalRecords: attendanceData?.length || 0,
      }

      // Employee metrics
      const { data: allEmployees } = await client.from("employees").select("status").eq("company_id", companyId)

      const employeeMetrics = {
        total: allEmployees?.length || 0,
        active: allEmployees?.filter((e: any) => e.status === "active").length || 0,
        inactive: allEmployees?.filter((e: any) => e.status === "inactive").length || 0,
        onLeave: allEmployees?.filter((e: any) => e.status === "on_leave").length || 0,
      }

      return this.createSuccessResponse({
        payrollMetrics,
        attendanceMetrics,
        employeeMetrics,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get HR dashboard stats"
      return this.createErrorResponse(this.createError("HR_DASHBOARD_ERROR", message))
    }
  }

  async getEmployeeDashboardStats(employeeId: string): Promise<
    ServiceResponse<{
      recentPayslips: any[]
      attendanceSummary: any
      leaveBalance: any
    }>
  > {
    try {
      const client = await this.getClient()

      // Recent payslips
      const { data: payslips } = await client
        .from("payroll_items")
        .select(
          `
          *,
          payroll_run:payroll_runs(*)
        `
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(6)

      // Attendance summary (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const { data: attendance } = await client
        .from("attendance_records")
        .select("status")
        .eq("employee_id", employeeId)
        .gte("date", thirtyDaysAgo)

      const attendanceSummary = {
        present: attendance?.filter((a: any) => a.status === "present").length || 0,
        absent: attendance?.filter((a: any) => a.status === "absent").length || 0,
        late: attendance?.filter((a: any) => a.status === "late").length || 0,
        onLeave: attendance?.filter((a: any) => a.status === "leave").length || 0,
      }

      // Leave balance
      const { data: leaveRequests } = await client
        .from("leave_requests")
        .select("days_requested,status")
        .eq("employee_id", employeeId)
        .in("status", ["approved", "pending"])

      const totalRequested = leaveRequests?.reduce((sum: number, r: any) => sum + (r.days_requested || 0), 0) || 0

      return this.createSuccessResponse({
        recentPayslips: payslips || [],
        attendanceSummary,
        leaveBalance: {
          used: totalRequested,
          remaining: 21 - totalRequested, // Assuming 21 days annual leave
          total: 21,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get employee dashboard stats"
      return this.createErrorResponse(this.createError("EMPLOYEE_DASHBOARD_ERROR", message))
    }
  }
}
