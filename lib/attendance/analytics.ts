"use server"

import { createClient } from "@/lib/supabase/server"

export interface AttendanceAnalytics {
  overview: {
    totalEmployees: number
    activeToday: number
    presentToday: number
    absentToday: number
    lateToday: number
    attendanceRate: number
  }
  trends: {
    date: string
    present: number
    absent: number
    late: number
    avgHours: number
  }[]
  topIssues: {
    type: string
    count: number
    employees: string[]
  }[]
  departmentStats: {
    department: string
    totalEmployees: number
    avgAttendanceRate: number
    avgHoursPerDay: number
    lateCount: number
  }[]
  overtimeStats: {
    totalOvertimeHours: number
    totalOvertimeRequests: number
    approvedRequests: number
    pendingRequests: number
    avgOvertimePerEmployee: number
  }
}

export async function getComprehensiveAnalytics(
  companyId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceAnalytics> {
  const supabase = await createClient()

  // Get all employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, department")
    .eq("company_id", companyId)
    .eq("status", "active")

  const totalEmployees = employees?.length || 0

  // Get attendance records for period
  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("company_id", companyId)
    .gte("date", startDate)
    .lte("date", endDate)

  // Today's statistics
  const today = new Date().toISOString().split("T")[0]
  const todayRecords = records?.filter((r) => r.date === today) || []

  const presentToday = todayRecords.filter((r) => r.status === "present").length
  const absentToday = totalEmployees - presentToday
  const lateToday = todayRecords.filter((r) => r.is_late).length
  const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0

  // Trends by date
  const trendsMap = new Map<string, any>()
  records?.forEach((record) => {
    if (!trendsMap.has(record.date)) {
      trendsMap.set(record.date, {
        date: record.date,
        present: 0,
        absent: 0,
        late: 0,
        totalHours: 0,
        count: 0,
      })
    }
    const trend = trendsMap.get(record.date)
    if (record.status === "present") trend.present++
    if (record.status === "absent") trend.absent++
    if (record.is_late) trend.late++
    trend.totalHours += record.total_hours || 0
    trend.count++
  })

  const trends = Array.from(trendsMap.values()).map((t) => ({
    date: t.date,
    present: t.present,
    absent: t.absent,
    late: t.late,
    avgHours: t.count > 0 ? Number((t.totalHours / t.count).toFixed(2)) : 0,
  }))

  // Top issues
  const lateEmployees = new Map<string, number>()
  const absentEmployees = new Map<string, number>()

  records?.forEach((record) => {
    if (record.is_late) {
      const count = lateEmployees.get(record.employee_id) || 0
      lateEmployees.set(record.employee_id, count + 1)
    }
    if (record.status === "absent") {
      const count = absentEmployees.get(record.employee_id) || 0
      absentEmployees.set(record.employee_id, count + 1)
    }
  })

  const topIssues = [
    {
      type: "Chronic Lateness",
      count: Array.from(lateEmployees.values()).filter((c) => c >= 3).length,
      employees: Array.from(lateEmployees.entries())
        .filter(([_, count]) => count >= 3)
        .map(([id]) => id)
        .slice(0, 5),
    },
    {
      type: "Frequent Absences",
      count: Array.from(absentEmployees.values()).filter((c) => c >= 3).length,
      employees: Array.from(absentEmployees.entries())
        .filter(([_, count]) => count >= 3)
        .map(([id]) => id)
        .slice(0, 5),
    },
  ]

  // Department statistics
  const deptMap = new Map<string, any>()

  employees?.forEach((emp) => {
    if (!deptMap.has(emp.department)) {
      deptMap.set(emp.department, {
        department: emp.department,
        totalEmployees: 0,
        presentDays: 0,
        totalHours: 0,
        lateCount: 0,
        totalRecords: 0,
      })
    }
    deptMap.get(emp.department).totalEmployees++
  })

  records?.forEach((record) => {
    const emp = employees?.find((e) => e.id === record.employee_id)
    if (emp && deptMap.has(emp.department)) {
      const dept = deptMap.get(emp.department)
      if (record.status === "present") dept.presentDays++
      dept.totalHours += record.total_hours || 0
      if (record.is_late) dept.lateCount++
      dept.totalRecords++
    }
  })

  const departmentStats = Array.from(deptMap.values()).map((d) => ({
    department: d.department,
    totalEmployees: d.totalEmployees,
    avgAttendanceRate: d.totalRecords > 0 ? Number(((d.presentDays / d.totalRecords) * 100).toFixed(1)) : 0,
    avgHoursPerDay: d.presentDays > 0 ? Number((d.totalHours / d.presentDays).toFixed(2)) : 0,
    lateCount: d.lateCount,
  }))

  // Overtime statistics
  const { data: overtimeRequests } = await supabase
    .from("overtime_requests")
    .select("*")
    .eq("company_id", companyId)
    .gte("request_date", startDate)
    .lte("request_date", endDate)

  const totalOvertimeHours = records?.reduce((sum, r) => sum + (r.overtime_hours || 0), 0) || 0
  const totalOvertimeRequests = overtimeRequests?.length || 0
  const approvedRequests = overtimeRequests?.filter((r) => r.status === "approved").length || 0
  const pendingRequests = overtimeRequests?.filter((r) => r.status === "pending").length || 0

  return {
    overview: {
      totalEmployees,
      activeToday: presentToday,
      presentToday,
      absentToday,
      lateToday,
      attendanceRate: Number(attendanceRate.toFixed(1)),
    },
    trends,
    topIssues,
    departmentStats,
    overtimeStats: {
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(2)),
      totalOvertimeRequests,
      approvedRequests,
      pendingRequests,
      avgOvertimePerEmployee: totalEmployees > 0 ? Number((totalOvertimeHours / totalEmployees).toFixed(2)) : 0,
    },
  }
}

// Generate compliance report
export async function generateComplianceReport(companyId: string, startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data: records } = await supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees(full_name, employee_id, department)
    `)
    .eq("company_id", companyId)
    .gte("date", startDate)
    .lte("date", endDate)

  const compliance = {
    totalRecords: records?.length || 0,
    compliantRecords: records?.filter((r) => !r.is_late && r.clock_out).length || 0,
    missingClockOut: records?.filter((r) => r.clock_in && !r.clock_out).length || 0,
    lateArrivals: records?.filter((r) => r.is_late).length || 0,
    highAnomalyScore: records?.filter((r) => (r.ai_anomaly_score || 0) > 0.5).length || 0,
    complianceRate: 0,
  }

  compliance.complianceRate =
    compliance.totalRecords > 0 ? Number(((compliance.compliantRecords / compliance.totalRecords) * 100).toFixed(1)) : 0

  return compliance
}

// Predict absenteeism risk
export async function predictAbsenteeismRisk(companyId: string) {
  const supabase = await createClient()

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90) // Last 90 days

  const { data: records } = await supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees(id, full_name, employee_id, department)
    `)
    .eq("company_id", companyId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])

  // Analyze patterns per employee
  const employeeRisks = new Map<string, any>()

  records?.forEach((record) => {
    const empId = record.employee_id
    if (!employeeRisks.has(empId)) {
      employeeRisks.set(empId, {
        employee: record.employee,
        totalDays: 0,
        absentDays: 0,
        lateDays: 0,
        averageAnomalyScore: 0,
        riskScore: 0,
      })
    }

    const risk = employeeRisks.get(empId)
    risk.totalDays++
    if (record.status === "absent") risk.absentDays++
    if (record.is_late) risk.lateDays++
    risk.averageAnomalyScore += record.ai_anomaly_score || 0
  })

  // Calculate risk scores
  const risks = Array.from(employeeRisks.values()).map((risk) => {
    risk.averageAnomalyScore = risk.totalDays > 0 ? risk.averageAnomalyScore / risk.totalDays : 0

    const absentRate = risk.totalDays > 0 ? risk.absentDays / risk.totalDays : 0
    const lateRate = risk.totalDays > 0 ? risk.lateDays / risk.totalDays : 0

    // Risk score: weighted combination
    risk.riskScore = Number((absentRate * 0.5 + lateRate * 0.3 + risk.averageAnomalyScore * 0.2).toFixed(2))

    return risk
  })

  // Sort by risk score and return top 10
  return risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10)
}
