import { createServiceClient } from "@/lib/supabase/server"

function getDb() {
  return createServiceClient()
}

/**
 * Company-scoped attendance analytics for a date range.
 */
export async function getAttendanceAnalytics(input: {
  companyId: string
  from: string
  to: string
}) {
  const service = getDb()

  const { data: employees } = await service
    .from("employees")
    .select("id, first_name, last_name, employee_id, department, status")
    .eq("company_id", input.companyId)
    .in("status", ["active", "Active", "ACTIVE", "probation", "Probation"])

  const empList: any[] = employees || []
  const empMap = new Map<string, any>(empList.map((e: any) => [e.id, e]))
  const headcount = empList.length

  // Prefer employee.department — attendance_records.department may not exist on older DBs
  let rows: any[] = []
  {
    const primary = await service
      .from("attendance_records")
      .select("id, employee_id, date, status, clock_in, clock_out, total_hours, overtime_hours")
      .eq("company_id", input.companyId)
      .gte("date", input.from)
      .lte("date", input.to)
      .order("date", { ascending: true })
    if (primary.error) throw new Error(primary.error.message)
    rows = primary.data || []
  }

  // Daily trend
  const byDate = new Map<string, any>()
  const byDept = new Map<string, any>()
  const byEmployee = new Map<string, any>()

  let present = 0
  let late = 0
  let absent = 0
  let leave = 0
  let halfDay = 0
  let totalHours = 0
  let otHours = 0

  for (const r of rows) {
    const emp = empMap.get(r.employee_id)
    const dept = emp?.department || "General"
    const st = String(r.status || "").toLowerCase()

    if (st === "present") present += 1
    else if (st === "late") late += 1
    else if (st === "absent") absent += 1
    else if (st === "leave") leave += 1
    else if (st === "half_day") halfDay += 1

    totalHours += Number(r.total_hours || 0)
    otHours += Number(r.overtime_hours || 0)

    const day = byDate.get(r.date) || {
      date: r.date,
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      half_day: 0,
      hours: 0,
      overtime: 0,
    }
    if (st === "present") day.present += 1
    else if (st === "late") day.late += 1
    else if (st === "absent") day.absent += 1
    else if (st === "leave") day.leave += 1
    else if (st === "half_day") day.half_day += 1
    day.hours += Number(r.total_hours || 0)
    day.overtime += Number(r.overtime_hours || 0)
    byDate.set(r.date, day)

    const d = byDept.get(dept) || {
      department: dept,
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      hours: 0,
      overtime: 0,
      records: 0,
    }
    d.records += 1
    if (st === "present") d.present += 1
    else if (st === "late") d.late += 1
    else if (st === "absent") d.absent += 1
    else if (st === "leave") d.leave += 1
    d.hours += Number(r.total_hours || 0)
    d.overtime += Number(r.overtime_hours || 0)
    byDept.set(dept, d)

    const eKey = r.employee_id
    const e = byEmployee.get(eKey) || {
      employee_id: eKey,
      employee_name: emp
        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
        : "Employee",
      employee_code: emp?.employee_id || null,
      department: dept,
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      hours: 0,
      overtime: 0,
    }
    if (st === "present") e.present += 1
    else if (st === "late") e.late += 1
    else if (st === "absent") e.absent += 1
    else if (st === "leave") e.leave += 1
    e.hours += Number(r.total_hours || 0)
    e.overtime += Number(r.overtime_hours || 0)
    byEmployee.set(eKey, e)
  }

  const workedDays = present + late + halfDay
  const attendanceRate =
    headcount > 0 && byDate.size > 0
      ? Math.round((workedDays / (headcount * byDate.size)) * 1000) / 10
      : 0
  const punctualityRate =
    workedDays > 0 ? Math.round((present / workedDays) * 1000) / 10 : 0
  const absenteeismRate =
    headcount > 0 && byDate.size > 0
      ? Math.round((absent / (headcount * byDate.size)) * 1000) / 10
      : 0

  const topLate = [...byEmployee.values()]
    .filter((e) => e.late > 0)
    .sort((a, b) => b.late - a.late)
    .slice(0, 8)

  const topOt = [...byEmployee.values()]
    .filter((e) => e.overtime > 0)
    .sort((a, b) => b.overtime - a.overtime)
    .slice(0, 8)

  const topAbsent = [...byEmployee.values()]
    .filter((e) => e.absent > 0)
    .sort((a, b) => b.absent - a.absent)
    .slice(0, 8)

  const departments = [...byDept.values()]
    .map((d) => ({
      ...d,
      hours: Math.round(d.hours * 10) / 10,
      overtime: Math.round(d.overtime * 10) / 10,
      punctuality:
        d.present + d.late > 0
          ? Math.round((d.present / (d.present + d.late)) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.records - a.records)

  // Persist daily rollup (best-effort; ignore if table not migrated yet)
  try {
    for (const day of byDate.values()) {
      await service.from("attendance_daily_stats").upsert(
        {
          company_id: input.companyId,
          stat_date: day.date,
          present_count: day.present,
          late_count: day.late,
          absent_count: day.absent,
          leave_count: day.leave,
          half_day_count: day.half_day,
          overtime_hours: Math.round(day.overtime * 100) / 100,
          total_hours: Math.round(day.hours * 100) / 100,
          headcount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,stat_date" },
      )
    }
  } catch {
    /* optional cache */
  }

  return {
    company_id: input.companyId,
    from: input.from,
    to: input.to,
    headcount,
    kpis: {
      present,
      late,
      absent,
      leave,
      half_day: halfDay,
      total_hours: Math.round(totalHours * 10) / 10,
      overtime_hours: Math.round(otHours * 10) / 10,
      attendance_rate: attendanceRate,
      punctuality_rate: punctualityRate,
      absenteeism_rate: absenteeismRate,
      days_covered: byDate.size,
    },
    trend: [...byDate.values()],
    departments,
    top_late: topLate,
    top_overtime: topOt.map((e) => ({
      ...e,
      overtime: Math.round(e.overtime * 10) / 10,
      hours: Math.round(e.hours * 10) / 10,
    })),
    top_absent: topAbsent,
  }
}
