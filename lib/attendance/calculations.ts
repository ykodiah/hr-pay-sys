// Attendance calculation utilities

export interface ShiftConfig {
  start_time: string
  end_time: string
  grace_period_minutes: number
  break_duration_minutes: number
}

export function calculateLateMinutes(
  clockIn: string,
  shiftStart: string,
  gracePeriod: number,
): { isLate: boolean; lateMinutes: number } {
  const clockInTime = new Date(`1970-01-01T${clockIn}`)
  const shiftStartTime = new Date(`1970-01-01T${shiftStart}`)
  const graceTime = new Date(shiftStartTime.getTime() + gracePeriod * 60000)

  if (clockInTime <= graceTime) {
    return { isLate: false, lateMinutes: 0 }
  }

  const lateMinutes = Math.floor((clockInTime.getTime() - shiftStartTime.getTime()) / 60000)

  return { isLate: true, lateMinutes }
}

export function calculateTotalHours(clockIn: string, clockOut: string, breakDuration: number): number {
  const start = new Date(`1970-01-01T${clockIn}`)
  const end = new Date(`1970-01-01T${clockOut}`)

  const totalMinutes = (end.getTime() - start.getTime()) / 60000
  const workMinutes = totalMinutes - breakDuration

  return Math.max(0, Number((workMinutes / 60).toFixed(2)))
}

export function calculateOvertimeHours(totalHours: number, standardHours = 8): number {
  const overtime = totalHours - standardHours
  return Math.max(0, Number(overtime.toFixed(2)))
}

export function calculateAnomalyScore(record: {
  clock_in?: string
  clock_out?: string
  is_late?: boolean
  late_minutes?: number
  status: string
}): number {
  let score = 0

  // Missing clock out
  if (record.clock_in && !record.clock_out) score += 0.3

  // Late arrival
  if (record.is_late && record.late_minutes) {
    if (record.late_minutes > 60) score += 0.5
    else if (record.late_minutes > 30) score += 0.3
    else score += 0.1
  }

  // Absent
  if (record.status === "absent") score += 0.2

  return Math.min(1, Number(score.toFixed(2)))
}

export function generateTimesheetSummary(records: any[], period: { start: string; end: string }) {
  const summary = {
    period,
    totalDays: records.length,
    presentDays: records.filter((r) => r.status === "present").length,
    absentDays: records.filter((r) => r.status === "absent").length,
    lateDays: records.filter((r) => r.is_late).length,
    totalHours: records.reduce((sum, r) => sum + (r.total_hours || 0), 0),
    overtimeHours: records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0),
    averageHoursPerDay: 0,
    inconsistencies: records.filter((r) => !r.clock_out && r.clock_in).length,
  }

  summary.averageHoursPerDay =
    summary.presentDays > 0 ? Number((summary.totalHours / summary.presentDays).toFixed(2)) : 0

  return summary
}
