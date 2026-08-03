/**
 * HR Formula Reports — compute cheat-sheet formulas from portal data.
 */

export type FormulaUnit = "percent" | "currency" | "days" | "hours" | "ratio" | "rate" | "score" | "units"

export type MetricResult = {
  id: string
  name: string
  formula: string
  unit: FormulaUnit
  value: number | null
  numerator?: number | null
  denominator?: number | null
  inputs: Record<string, number | string | null>
  dataStatus: "ok" | "partial" | "no_data" | "error"
  note?: string
}

export type CategoryReport = {
  id: string
  title: string
  description: string
  metrics: MetricResult[]
}

export type HrFormulaReportBundle = {
  companyId: string
  periodStart: string
  periodEnd: string
  generatedAt: string
  categories: CategoryReport[]
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

function pct(num: number, den: number): number | null {
  if (!den || !Number.isFinite(num) || !Number.isFinite(den)) return null
  return round((num / den) * 100)
}

function ratio(num: number, den: number): number | null {
  if (!den || !Number.isFinite(num) || !Number.isFinite(den)) return null
  return round(num / den, 3)
}

function daysBetween(a: string | Date, b: string | Date): number {
  const da = new Date(a)
  const db = new Date(b)
  return Math.max(0, Math.round((db.getTime() - da.getTime()) / 86400000))
}

function workingDaysInRange(start: Date, end: Date, holidays: Set<string>, daysPerWeek = 5): number {
  let count = 0
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)
  while (cur <= last) {
    const day = cur.getDay() // 0 Sun … 6 Sat
    const iso = cur.toISOString().slice(0, 10)
    const isWeekend = daysPerWeek <= 5 ? day === 0 || day === 6 : day === 0
    if (!isWeekend && !holidays.has(iso)) count += 1
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function activeOn(emp: any, dateIso: string): boolean {
  const join = emp.date_of_joining || emp.hire_date
  const exit = emp.date_of_exit
  if (join && String(join).slice(0, 10) > dateIso) return false
  if (exit && String(exit).slice(0, 10) < dateIso) return false
  const status = String(emp.status || "").toLowerCase()
  if (exit) return true // historically active through exit
  if (["terminated", "resigned", "inactive", "exited"].includes(status) && !exit) return false
  return true
}

async function safeSelect(
  supabase: any,
  table: string,
  build: (q: any) => any,
): Promise<any[]> {
  try {
    const { data, error } = await build(supabase.from(table))
    if (error) {
      if (/does not exist|relation/i.test(error.message || "")) return []
      console.warn(`[hr-formulas] ${table}:`, error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.warn(`[hr-formulas] ${table} failed`, err)
    return []
  }
}

function metric(
  id: string,
  name: string,
  formula: string,
  unit: FormulaUnit,
  value: number | null,
  extras: Partial<MetricResult> = {},
): MetricResult {
  return {
    id,
    name,
    formula,
    unit,
    value,
    inputs: extras.inputs || {},
    dataStatus:
      extras.dataStatus ||
      (value == null ? "no_data" : "ok"),
    numerator: extras.numerator ?? null,
    denominator: extras.denominator ?? null,
    note: extras.note,
  }
}

export async function computeHrFormulaReports(input: {
  companyId: string
  periodStart: string
  periodEnd: string
  categoryId?: string
}): Promise<HrFormulaReportBundle> {
  const { createServiceClient } = await import("@/lib/supabase/server")
  const supabase = await createServiceClient()
  const companyId = input.companyId
  const periodStart = input.periodStart.slice(0, 10)
  const periodEnd = input.periodEnd.slice(0, 10)
  const startDate = new Date(periodStart)
  const endDate = new Date(periodEnd)
  const year = startDate.getFullYear()
  const periodKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`

  const [
    employees,
    leaveTypes,
    leaveBalances,
    holidays,
    hrConfigRows,
    requisitions,
    applications,
    offers,
    recruitmentCosts,
    payslips,
    payrollItems,
    financials,
    trainingCourses,
    trainingEnrollments,
    surveys,
    engagementResponses,
    grievances,
    disciplinary,
    incidents,
  ] = await Promise.all([
    safeSelect(supabase, "employees", (q) =>
      q
        .select(
          "id, status, date_of_joining, hire_date, date_of_exit, inactive_reason, department, direct_supervisor, position, job_title",
        )
        .eq("company_id", companyId),
    ),
    safeSelect(supabase, "leave_types", (q) =>
      q.select("id, company_id, code, category, entitlement_amount, name").eq("company_id", companyId),
    ),
    safeSelect(supabase, "leave_balances", (q) =>
      q.select("employee_id, leave_type_id, year, entitled_days, used_days").eq("company_id", companyId).eq("year", year),
    ),
    safeSelect(supabase, "company_holidays", (q) =>
      q
        .select("holiday_date")
        .eq("company_id", companyId)
        .gte("holiday_date", periodStart)
        .lte("holiday_date", periodEnd),
    ),
    safeSelect(supabase, "hr_configuration", (q) =>
      q.select("working_days_per_week, working_hours_per_day").eq("company_id", companyId).limit(1),
    ),
    safeSelect(supabase, "recruitment_requisitions", (q) =>
      q
        .select("id, status, created_at, updated_at, filled_at")
        .eq("company_id", companyId),
    ),
    safeSelect(supabase, "recruitment_applications", (q) =>
      q
        .select("id, status, source, applied_at")
        .eq("company_id", companyId)
        .gte("applied_at", periodStart)
        .lte("applied_at", `${periodEnd}T23:59:59`),
    ),
    safeSelect(supabase, "recruitment_offers", (q) =>
      q.select("id, status, created_at, sent_at, accepted_at").eq("company_id", companyId),
    ),
    safeSelect(supabase, "recruitment_costs", (q) =>
      q
        .select("amount, incurred_at")
        .eq("company_id", companyId)
        .gte("incurred_at", periodStart)
        .lte("incurred_at", periodEnd),
    ),
    safeSelect(supabase, "payslips", (q) =>
      q
        .select(
          "id, employee_id, net_pay, basic_salary, gross_pay, total_allowances, total_employer_cost, cost_to_company, bonus_pay, overtime_pay, pay_period, pay_period_start",
        )
        .eq("company_id", companyId)
        .or(`pay_period.eq.${periodKey},pay_period_start.gte.${periodStart}`),
    ),
    safeSelect(supabase, "payroll_items", (q) =>
      q
        .select("employee_id, basic_salary, net_pay, gross_pay, total_allowances, bonus_pay, overtime_pay, cost_to_company")
        .eq("company_id", companyId)
        .limit(5000),
    ),
    safeSelect(supabase, "company_financials", (q) =>
      q.select("*").eq("company_id", companyId).eq("period", periodKey).limit(1),
    ),
    safeSelect(supabase, "training_courses", (q) =>
      q.select("id, cost, duration_hours, status").eq("company_id", companyId),
    ),
    safeSelect(supabase, "training_enrollments", (q) =>
      q
        .select("id, course_id, employee_id, hours_completed, pre_score, post_score, benefit_amount, status, completed_at")
        .eq("company_id", companyId),
    ),
    safeSelect(supabase, "engagement_surveys", (q) =>
      q
        .select("id, max_score, period_start, period_end")
        .eq("company_id", companyId)
        .lte("period_start", periodEnd)
        .gte("period_end", periodStart),
    ),
    safeSelect(supabase, "engagement_responses", (q) =>
      q.select("id, survey_id, score, enps_score, is_positive").eq("company_id", companyId),
    ),
    safeSelect(supabase, "grievances", (q) =>
      q
        .select("id, status, filed_at, resolved_at")
        .eq("company_id", companyId)
        .gte("filed_at", periodStart)
        .lte("filed_at", `${periodEnd}T23:59:59`),
    ),
    safeSelect(supabase, "disciplinary_actions", (q) =>
      q
        .select("id, issued_at")
        .eq("company_id", companyId)
        .gte("issued_at", periodStart)
        .lte("issued_at", `${periodEnd}T23:59:59`),
    ),
    safeSelect(supabase, "safety_incidents", (q) =>
      q
        .select("id, is_lost_time, lost_days, incident_date")
        .eq("company_id", companyId)
        .gte("incident_date", periodStart)
        .lte("incident_date", periodEnd),
    ),
  ])

  const empIds = employees.map((e: any) => e.id)
  const chunk = empIds.slice(0, 500)

  const [attendanceRows, leaveRows, reviewRows] = await Promise.all([
    chunk.length
      ? safeSelect(supabase, "attendance_records", (q) =>
          q
            .select("id, employee_id, date, status, total_hours")
            .gte("date", periodStart)
            .lte("date", periodEnd)
            .in("employee_id", chunk),
        )
      : Promise.resolve([]),
    chunk.length
      ? safeSelect(supabase, "leave_requests", (q) =>
          q
            .select("id, employee_id, leave_type_id, days_requested, status, start_date, end_date")
            .eq("status", "approved")
            .lte("start_date", periodEnd)
            .gte("end_date", periodStart)
            .in("employee_id", chunk),
        )
      : Promise.resolve([]),
    chunk.length
      ? safeSelect(supabase, "performance_reviews", (q) =>
          q
            .select("id, employee_id, overall_rating, status, review_period_start, review_period_end")
            .lte("review_period_start", periodEnd)
            .gte("review_period_end", periodStart)
            .in("employee_id", chunk),
        )
      : Promise.resolve([]),
  ])

  const holidaysSet = new Set(
    (holidays || []).map((h: any) => String(h.holiday_date).slice(0, 10)),
  )
  const daysPerWeek = Number(hrConfigRows?.[0]?.working_days_per_week || 5)
  const hoursPerDay = Number(hrConfigRows?.[0]?.working_hours_per_day || 8)
  const workingDaysPerEmp = workingDaysInRange(startDate, endDate, holidaysSet, daysPerWeek)

  const startHeadcount = employees.filter((e: any) => activeOn(e, periodStart)).length
  const endHeadcount = employees.filter((e: any) => activeOn(e, periodEnd)).length
  const avgHeadcount = (startHeadcount + endHeadcount) / 2 || endHeadcount || employees.length

  const left = employees.filter((e: any) => {
    const exit = e.date_of_exit ? String(e.date_of_exit).slice(0, 10) : null
    if (exit && exit >= periodStart && exit <= periodEnd) return true
    const status = String(e.status || "").toLowerCase()
    return ["terminated", "resigned", "inactive"].includes(status) && !exit
  }).length

  const newJoiners = employees.filter((e: any) => {
    const join = String(e.date_of_joining || e.hire_date || "").slice(0, 10)
    return join && join >= periodStart && join <= periodEnd
  }).length

  const absentDays = attendanceRows.filter((a: any) => String(a.status).toLowerCase() === "absent").length
  const presentDays = attendanceRows.filter((a: any) =>
    ["present", "late", "half_day"].includes(String(a.status).toLowerCase()),
  ).length
  const lateDays = attendanceRows.filter((a: any) => String(a.status).toLowerCase() === "late").length
  const onTimeDays = Math.max(0, presentDays - lateDays)
  const totalWorkingDaysPool = workingDaysPerEmp * Math.max(endHeadcount || startHeadcount, 1)

  const leaveTaken = leaveRows.reduce((s: number, r: any) => s + Number(r.days_requested || 0), 0)
  let leaveEntitled = leaveBalances.reduce((s: number, r: any) => s + Number(r.entitled_days || 0), 0)
  if (!leaveEntitled) {
    const annual = leaveTypes
      .filter((t: any) => String(t.code || "").toUpperCase() === "AL" || /annual/i.test(t.name || ""))
      .reduce((s: number, t: any) => s + Number(t.entitlement_amount || 0), 0)
    leaveEntitled = annual * Math.max(endHeadcount, 1)
  }

  // Recruitment
  const filledReqs = requisitions.filter((r: any) => {
    const filledAt = r.filled_at || (String(r.status).toLowerCase() === "filled" ? r.updated_at : null)
    if (!filledAt) return false
    const d = String(filledAt).slice(0, 10)
    return d >= periodStart && d <= periodEnd
  })
  const avgTimeToFill =
    filledReqs.length > 0
      ? round(
          filledReqs.reduce((s: number, r: any) => {
            const filled = r.filled_at || r.updated_at
            return s + daysBetween(r.created_at, filled)
          }, 0) / filledReqs.length,
        )
      : null

  const hires = applications.filter((a: any) => String(a.status).toLowerCase() === "hired")
  const hireCount = hires.length || filledReqs.length
  const totalRecruitCost = recruitmentCosts.reduce((s: number, c: any) => s + Number(c.amount || 0), 0)
  const offersExtended = offers.filter((o: any) =>
    ["sent", "accepted", "declined", "expired", "extended"].includes(String(o.status).toLowerCase()) ||
    o.sent_at,
  ).length
  const offersAccepted = offers.filter((o: any) => String(o.status).toLowerCase() === "accepted").length
  const sourceCounts = new Map<string, number>()
  for (const h of hires) {
    const src = String(h.source || "unknown")
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1)
  }
  const topSourceHires = Math.max(0, ...sourceCounts.values(), 0)

  // Compensation
  const payRows = payslips.length ? payslips : payrollItems
  const totalSalaryPaid = payRows.reduce(
    (s: number, p: any) => s + Number(p.net_pay || p.gross_pay || p.basic_salary || 0),
    0,
  )
  const totalPayrollCost = payRows.reduce(
    (s: number, p: any) =>
      s + Number(p.cost_to_company || p.total_employer_cost || p.gross_pay || p.net_pay || 0),
    0,
  )
  const totalBenefits = payRows.reduce((s: number, p: any) => s + Number(p.total_allowances || 0), 0)
  const totalFixed = payRows.reduce((s: number, p: any) => s + Number(p.basic_salary || 0), 0)
  const totalVariable = payRows.reduce(
    (s: number, p: any) => s + Number(p.bonus_pay || 0) + Number(p.overtime_pay || 0),
    0,
  )
  const revenue = Number(financials?.[0]?.revenue || 0)
  const outputUnits = Number(financials?.[0]?.output_units || 0)
  const hrCost = Number(financials?.[0]?.hr_operating_cost || 0)
  const headcountForComp = Math.max(endHeadcount || employees.length, 1)

  // Training
  const trainCost =
    trainingEnrollments.length > 0
      ? trainingEnrollments.reduce((s: number, e: any) => {
          const course = trainingCourses.find((c: any) => c.id === e.course_id)
          return s + Number(course?.cost || 0)
        }, 0)
      : trainingCourses.reduce((s: number, c: any) => s + Number(c.cost || 0), 0)
  const trainHours = trainingEnrollments.reduce(
    (s: number, e: any) => s + Number(e.hours_completed || 0),
    0,
  )
  const scored = trainingEnrollments.filter(
    (e: any) => e.pre_score != null && e.post_score != null && Number(e.pre_score) > 0,
  )
  const trainEffectiveness =
    scored.length > 0
      ? round(
          scored.reduce(
            (s: number, e: any) =>
              s + ((Number(e.post_score) - Number(e.pre_score)) / Number(e.pre_score)) * 100,
            0,
          ) / scored.length,
        )
      : null
  const trainBenefits = trainingEnrollments.reduce(
    (s: number, e: any) => s + Number(e.benefit_amount || 0),
    0,
  )

  // Performance
  const completedReviews = reviewRows.filter((r: any) =>
    ["approved", "reviewed", "submitted"].includes(String(r.status).toLowerCase()),
  )
  const high = completedReviews.filter((r: any) => Number(r.overall_rating) >= 4).length
  const low = completedReviews.filter((r: any) => Number(r.overall_rating) > 0 && Number(r.overall_rating) <= 2).length
  // Improvement: employees with prior lower rating — approximate via multiple reviews
  const byEmp = new Map<string, any[]>()
  for (const r of reviewRows) {
    const list = byEmp.get(r.employee_id) || []
    list.push(r)
    byEmp.set(r.employee_id, list)
  }
  let improved = 0
  for (const list of byEmp.values()) {
    if (list.length < 2) continue
    const sorted = [...list].sort((a, b) =>
      String(a.review_period_end).localeCompare(String(b.review_period_end)),
    )
    const prev = Number(sorted[sorted.length - 2]?.overall_rating || 0)
    const curr = Number(sorted[sorted.length - 1]?.overall_rating || 0)
    if (curr > prev && prev > 0) improved += 1
  }

  // Engagement
  const surveyIds = new Set(surveys.map((s: any) => s.id))
  const responses = engagementResponses.filter((r: any) => !r.survey_id || surveyIds.has(r.survey_id) || surveys.length === 0)
  const maxScore = Number(surveys?.[0]?.max_score || 100)
  const scoreSum = responses.reduce((s: number, r: any) => s + Number(r.score || 0), 0)
  const maxPossible = responses.length * maxScore
  const promoters = responses.filter((r: any) => Number(r.enps_score) >= 9).length
  const detractors = responses.filter((r: any) => r.enps_score != null && Number(r.enps_score) <= 6).length
  const enpsRespondents = responses.filter((r: any) => r.enps_score != null).length
  const enpsValue =
    enpsRespondents > 0
      ? round((promoters / enpsRespondents) * 100 - (detractors / enpsRespondents) * 100)
      : null
  const positive = responses.filter(
    (r: any) => r.is_positive === true || Number(r.score) >= maxScore * 0.7,
  ).length

  // Relations
  const grievanceFiled = grievances.length
  const grievanceResolved = grievances.filter((g: any) =>
    ["resolved", "closed"].includes(String(g.status).toLowerCase()),
  ).length
  const disciplinaryCount = disciplinary.length

  // Safety
  const incidentCount = incidents.length
  const ltiCount = incidents.filter((i: any) => i.is_lost_time).length
  const manHours =
    attendanceRows.reduce((s: number, a: any) => s + Number(a.total_hours || 0), 0) ||
    totalWorkingDaysPool * hoursPerDay
  const sickTypeIds = new Set(
    leaveTypes
      .filter(
        (t: any) =>
          String(t.code || "").toUpperCase() === "SL" ||
          /sick|medical/i.test(String(t.category || "")) ||
          /sick|medical/i.test(String(t.name || "")),
      )
      .map((t: any) => t.id),
  )
  const sickDays = leaveRows
    .filter((r: any) => sickTypeIds.has(r.leave_type_id))
    .reduce((s: number, r: any) => s + Number(r.days_requested || 0), 0)

  // General
  const managers = new Set(
    employees.map((e: any) => e.direct_supervisor).filter(Boolean),
  )
  const subordinates = employees.filter((e: any) => e.direct_supervisor).length

  const categories: CategoryReport[] = [
    {
      id: "workforce",
      title: "Workforce Planning",
      description: "Turnover, retention, growth, and absenteeism from employee & attendance data",
      metrics: [
        metric(
          "turnover_rate",
          "Employee Turnover Rate (%)",
          "(Employees Left ÷ Average Employees) × 100",
          "percent",
          pct(left, avgHeadcount),
          {
            numerator: left,
            denominator: avgHeadcount,
            inputs: { employeesLeft: left, averageEmployees: round(avgHeadcount) },
          },
        ),
        metric(
          "retention_rate",
          "Retention Rate (%)",
          "((End Headcount − New Joinees) ÷ Start Headcount) × 100",
          "percent",
          pct(Math.max(0, endHeadcount - newJoiners), startHeadcount),
          {
            numerator: Math.max(0, endHeadcount - newJoiners),
            denominator: startHeadcount,
            inputs: { endHeadcount, newJoiners, startHeadcount },
          },
        ),
        metric(
          "workforce_growth",
          "Workforce Growth Rate (%)",
          "((End − Start Headcount) ÷ Start Headcount) × 100",
          "percent",
          pct(endHeadcount - startHeadcount, startHeadcount),
          {
            numerator: endHeadcount - startHeadcount,
            denominator: startHeadcount,
            inputs: { endHeadcount, startHeadcount },
          },
        ),
        metric(
          "absenteeism_rate",
          "Absenteeism Rate (%)",
          "(Absent Days ÷ Working Days) × 100",
          "percent",
          pct(absentDays, totalWorkingDaysPool),
          {
            numerator: absentDays,
            denominator: totalWorkingDaysPool,
            inputs: { absentDays, workingDays: totalWorkingDaysPool },
            dataStatus: attendanceRows.length ? "ok" : "partial",
          },
        ),
      ],
    },
    {
      id: "attendance",
      title: "Time & Attendance",
      description: "Attendance, absence, leave utilization, and punctuality",
      metrics: [
        metric(
          "attendance_pct",
          "Attendance Percentage (%)",
          "(Days Present ÷ Working Days) × 100",
          "percent",
          pct(presentDays, totalWorkingDaysPool),
          {
            numerator: presentDays,
            denominator: totalWorkingDaysPool,
            inputs: { daysPresent: presentDays, workingDays: totalWorkingDaysPool },
            dataStatus: attendanceRows.length ? "ok" : "partial",
          },
        ),
        metric(
          "absence_rate",
          "Absence Rate (%)",
          "(Days Absent ÷ Working Days) × 100",
          "percent",
          pct(absentDays, totalWorkingDaysPool),
          {
            numerator: absentDays,
            denominator: totalWorkingDaysPool,
            inputs: { daysAbsent: absentDays, workingDays: totalWorkingDaysPool },
          },
        ),
        metric(
          "leave_utilization",
          "Leave Utilization (%)",
          "(Leave Days Taken ÷ Leave Days Entitled) × 100",
          "percent",
          pct(leaveTaken, leaveEntitled),
          {
            numerator: leaveTaken,
            denominator: leaveEntitled,
            inputs: { leaveDaysTaken: leaveTaken, leaveDaysEntitled: leaveEntitled },
            dataStatus: leaveEntitled > 0 ? "ok" : "partial",
          },
        ),
        metric(
          "punctuality_rate",
          "Punctuality Rate (%)",
          "(On-time Arrivals ÷ Working Days) × 100",
          "percent",
          pct(onTimeDays, totalWorkingDaysPool),
          {
            numerator: onTimeDays,
            denominator: totalWorkingDaysPool,
            inputs: { onTimeArrivals: onTimeDays, lateDays, workingDays: totalWorkingDaysPool },
          },
        ),
      ],
    },
    {
      id: "recruitment",
      title: "Recruitment",
      description: "Time to fill, cost per hire, offer acceptance, and source effectiveness",
      metrics: [
        metric(
          "time_to_fill",
          "Time to Fill (Days)",
          "Date Position Filled − Date Requisition Raised",
          "days",
          avgTimeToFill,
          {
            inputs: { filledRequisitions: filledReqs.length, averageDays: avgTimeToFill },
            dataStatus: filledReqs.length ? "ok" : "no_data",
          },
        ),
        metric(
          "cost_per_hire",
          "Cost per Hire",
          "Total Recruitment Cost ÷ Number of Hires",
          "currency",
          hireCount > 0 && totalRecruitCost > 0 ? round(totalRecruitCost / hireCount) : null,
          {
            numerator: totalRecruitCost,
            denominator: hireCount,
            inputs: { totalRecruitmentCost: totalRecruitCost, hires: hireCount },
            dataStatus: totalRecruitCost > 0 && hireCount > 0 ? "ok" : "no_data",
            note: totalRecruitCost === 0 ? "Add rows to recruitment_costs to enable this metric" : undefined,
          },
        ),
        metric(
          "offer_acceptance",
          "Offer Acceptance Rate (%)",
          "(Offers Accepted ÷ Offers Extended) × 100",
          "percent",
          pct(offersAccepted, offersExtended || offers.length),
          {
            numerator: offersAccepted,
            denominator: offersExtended || offers.length,
            inputs: { offersAccepted, offersExtended: offersExtended || offers.length },
          },
        ),
        metric(
          "source_effectiveness",
          "Source Effectiveness (%)",
          "(Hires from Top Source ÷ Total Hires) × 100",
          "percent",
          pct(topSourceHires, hireCount || hires.length),
          {
            numerator: topSourceHires,
            denominator: hireCount || hires.length,
            inputs: {
              topSourceHires,
              totalHires: hireCount || hires.length,
              sources: sourceCounts.size,
            },
          },
        ),
      ],
    },
    {
      id: "compensation",
      title: "Compensation & Benefits",
      description: "Average salary, CTC ratio, benefits, and fixed/variable pay",
      metrics: [
        metric(
          "average_salary",
          "Average Salary",
          "Total Salary Paid ÷ Total Employees",
          "currency",
          payRows.length ? round(totalSalaryPaid / headcountForComp) : null,
          {
            numerator: totalSalaryPaid,
            denominator: headcountForComp,
            inputs: { totalSalaryPaid: round(totalSalaryPaid), employees: headcountForComp },
            dataStatus: payRows.length ? "ok" : "no_data",
          },
        ),
        metric(
          "payroll_ctc_pct",
          "Payroll Cost to Company (%)",
          "(Total Payroll Cost ÷ Total Revenue) × 100",
          "percent",
          pct(totalPayrollCost, revenue),
          {
            numerator: totalPayrollCost,
            denominator: revenue,
            inputs: { totalPayrollCost: round(totalPayrollCost), revenue },
            dataStatus: revenue > 0 ? "ok" : "no_data",
            note: revenue === 0 ? "Set company_financials.revenue for this period" : undefined,
          },
        ),
        metric(
          "benefits_per_employee",
          "Benefits Cost per Employee",
          "Total Benefits Cost ÷ Total Employees",
          "currency",
          payRows.length ? round(totalBenefits / headcountForComp) : null,
          {
            numerator: totalBenefits,
            denominator: headcountForComp,
            inputs: { totalBenefitsCost: round(totalBenefits), employees: headcountForComp },
          },
        ),
        metric(
          "fixed_variable_ratio",
          "Fixed to Variable Pay Ratio",
          "Total Fixed Pay ÷ Total Variable Pay",
          "ratio",
          ratio(totalFixed, totalVariable),
          {
            numerator: totalFixed,
            denominator: totalVariable,
            inputs: { totalFixedPay: round(totalFixed), totalVariablePay: round(totalVariable) },
            dataStatus: totalVariable > 0 ? "ok" : "partial",
          },
        ),
      ],
    },
    {
      id: "training",
      title: "Training & Development",
      description: "Training cost, hours, effectiveness, and ROI",
      metrics: [
        metric(
          "training_cost_per_emp",
          "Training Cost per Employee",
          "Total Training Cost ÷ Total Employees",
          "currency",
          trainCost > 0 ? round(trainCost / headcountForComp) : null,
          {
            numerator: trainCost,
            denominator: headcountForComp,
            inputs: { totalTrainingCost: trainCost, employees: headcountForComp },
            dataStatus: trainCost > 0 ? "ok" : "no_data",
          },
        ),
        metric(
          "training_hours_per_emp",
          "Training Hours per Employee",
          "Total Training Hours ÷ Total Employees",
          "hours",
          trainHours > 0 ? round(trainHours / headcountForComp) : null,
          {
            numerator: trainHours,
            denominator: headcountForComp,
            inputs: { totalTrainingHours: trainHours, employees: headcountForComp },
            dataStatus: trainHours > 0 ? "ok" : "no_data",
          },
        ),
        metric(
          "training_effectiveness",
          "Training Effectiveness (%)",
          "((Post − Pre Score) ÷ Pre Score) × 100",
          "percent",
          trainEffectiveness,
          {
            inputs: { scoredEnrollments: scored.length },
            dataStatus: trainEffectiveness != null ? "ok" : "no_data",
          },
        ),
        metric(
          "training_roi",
          "Training ROI (%)",
          "((Benefits − Cost) ÷ Cost) × 100",
          "percent",
          trainCost > 0 ? pct(trainBenefits - trainCost, trainCost) : null,
          {
            numerator: trainBenefits - trainCost,
            denominator: trainCost,
            inputs: { benefits: trainBenefits, trainingCost: trainCost },
            dataStatus: trainCost > 0 && trainBenefits > 0 ? "ok" : "no_data",
          },
        ),
      ],
    },
    {
      id: "performance",
      title: "Performance Management",
      description: "Appraisal completion and high/low performer ratios",
      metrics: [
        metric(
          "perf_completion",
          "Performance Completion Rate (%)",
          "(Completed Appraisals ÷ Employees) × 100",
          "percent",
          pct(completedReviews.length, headcountForComp),
          {
            numerator: completedReviews.length,
            denominator: headcountForComp,
            inputs: { completedAppraisals: completedReviews.length, employees: headcountForComp },
          },
        ),
        metric(
          "high_performer_ratio",
          "High Performer Ratio (%)",
          "(High Performers ÷ Employees) × 100",
          "percent",
          pct(high, headcountForComp),
          {
            numerator: high,
            denominator: headcountForComp,
            inputs: { highPerformers: high, employees: headcountForComp },
            note: "High performer = rating ≥ 4",
          },
        ),
        metric(
          "perf_improvement",
          "Performance Improvement Rate (%)",
          "(Employees Improved ÷ Employees) × 100",
          "percent",
          pct(improved, headcountForComp),
          {
            numerator: improved,
            denominator: headcountForComp,
            inputs: { employeesImproved: improved, employees: headcountForComp },
            dataStatus: byEmp.size ? "ok" : "partial",
          },
        ),
        metric(
          "low_performer_ratio",
          "Low Performer Ratio (%)",
          "(Low Performers ÷ Employees) × 100",
          "percent",
          pct(low, headcountForComp),
          {
            numerator: low,
            denominator: headcountForComp,
            inputs: { lowPerformers: low, employees: headcountForComp },
            note: "Low performer = rating ≤ 2",
          },
        ),
      ],
    },
    {
      id: "engagement",
      title: "Employee Engagement",
      description: "Engagement score, eNPS, and engagement index from surveys",
      metrics: [
        metric(
          "engagement_score",
          "Engagement Score (%)",
          "(Score Obtained ÷ Maximum Possible Score) × 100",
          "percent",
          pct(scoreSum, maxPossible),
          {
            numerator: scoreSum,
            denominator: maxPossible,
            inputs: { scoreObtained: scoreSum, maxPossible, responses: responses.length },
            dataStatus: responses.length ? "ok" : "no_data",
          },
        ),
        metric(
          "enps",
          "eNPS",
          "% Promoters − % Detractors",
          "score",
          enpsValue,
          {
            inputs: { promoters, detractors, respondents: enpsRespondents },
            dataStatus: enpsValue != null ? "ok" : "no_data",
          },
        ),
        metric(
          "engagement_index",
          "Engagement Index (%)",
          "(Positive Responses ÷ Total Responses) × 100",
          "percent",
          pct(positive, responses.length),
          {
            numerator: positive,
            denominator: responses.length,
            inputs: { positiveResponses: positive, totalResponses: responses.length },
            dataStatus: responses.length ? "ok" : "no_data",
          },
        ),
      ],
    },
    {
      id: "relations",
      title: "Employee Relations",
      description: "Grievance and disciplinary action rates",
      metrics: [
        metric(
          "grievance_rate",
          "Grievance Rate (%)",
          "(Grievances Filed ÷ Employees) × 100",
          "percent",
          pct(grievanceFiled, headcountForComp),
          {
            numerator: grievanceFiled,
            denominator: headcountForComp,
            inputs: { grievancesFiled: grievanceFiled, employees: headcountForComp },
          },
        ),
        metric(
          "grievance_resolution",
          "Grievance Resolution Rate (%)",
          "(Resolved ÷ Filed) × 100",
          "percent",
          pct(grievanceResolved, grievanceFiled),
          {
            numerator: grievanceResolved,
            denominator: grievanceFiled,
            inputs: { resolved: grievanceResolved, filed: grievanceFiled },
            dataStatus: grievanceFiled > 0 ? "ok" : "no_data",
          },
        ),
        metric(
          "disciplinary_rate",
          "Disciplinary Action Rate (%)",
          "(Disciplinary Actions ÷ Employees) × 100",
          "percent",
          pct(disciplinaryCount, headcountForComp),
          {
            numerator: disciplinaryCount,
            denominator: headcountForComp,
            inputs: { disciplinaryActions: disciplinaryCount, employees: headcountForComp },
          },
        ),
      ],
    },
    {
      id: "safety",
      title: "Health & Safety",
      description: "Incident rate, LTIFR, and illness absence",
      metrics: [
        metric(
          "incident_rate",
          "Incident Rate (IR)",
          "(Incidents ÷ Man-hours) × 1,000,000",
          "rate",
          manHours > 0 ? round((incidentCount / manHours) * 1_000_000) : null,
          {
            numerator: incidentCount,
            denominator: manHours,
            inputs: { incidents: incidentCount, manHours: round(manHours) },
          },
        ),
        metric(
          "ltifr",
          "LTIFR",
          "(Lost Time Injuries ÷ Man-hours) × 1,000,000",
          "rate",
          manHours > 0 ? round((ltiCount / manHours) * 1_000_000) : null,
          {
            numerator: ltiCount,
            denominator: manHours,
            inputs: { lostTimeInjuries: ltiCount, manHours: round(manHours) },
          },
        ),
        metric(
          "illness_absence",
          "Absence Due to Illness (%)",
          "(Sick Leave Days ÷ Working Days) × 100",
          "percent",
          pct(sickDays, totalWorkingDaysPool),
          {
            numerator: sickDays,
            denominator: totalWorkingDaysPool,
            inputs: { sickLeaveDays: sickDays, workingDays: totalWorkingDaysPool },
          },
        ),
      ],
    },
    {
      id: "general",
      title: "General",
      description: "Span of control, productivity, and HR cost per employee",
      metrics: [
        metric(
          "span_of_control",
          "Span of Control",
          "Subordinates ÷ Managers",
          "ratio",
          ratio(subordinates, managers.size),
          {
            numerator: subordinates,
            denominator: managers.size,
            inputs: { subordinates, managers: managers.size },
            dataStatus: managers.size > 0 ? "ok" : "partial",
          },
        ),
        metric(
          "employee_productivity",
          "Employee Productivity",
          "Output ÷ Number of Employees",
          "units",
          outputUnits > 0 ? round(outputUnits / headcountForComp) : null,
          {
            numerator: outputUnits,
            denominator: headcountForComp,
            inputs: { outputUnits, employees: headcountForComp },
            dataStatus: outputUnits > 0 ? "ok" : "no_data",
            note: outputUnits === 0 ? "Set company_financials.output_units for this period" : undefined,
          },
        ),
        metric(
          "hr_cost_per_employee",
          "HR Cost per Employee",
          "Total HR Cost ÷ Total Employees",
          "currency",
          hrCost > 0 ? round(hrCost / headcountForComp) : null,
          {
            numerator: hrCost,
            denominator: headcountForComp,
            inputs: { totalHrCost: hrCost, employees: headcountForComp },
            dataStatus: hrCost > 0 ? "ok" : "no_data",
            note: hrCost === 0 ? "Set company_financials.hr_operating_cost for this period" : undefined,
          },
        ),
      ],
    },
  ]

  const filtered = input.categoryId
    ? categories.filter((c) => c.id === input.categoryId)
    : categories

  return {
    companyId,
    periodStart,
    periodEnd,
    generatedAt: new Date().toISOString(),
    categories: filtered,
  }
}

export async function persistHrFormulaReport(
  bundle: HrFormulaReportBundle,
  options?: { categoryId?: string; userId?: string | null },
): Promise<{ runId: string }> {
  const { createServiceClient } = await import("@/lib/supabase/server")
  const supabase = await createServiceClient()

  const { data: run, error } = await supabase
    .from("hr_formula_report_runs")
    .insert({
      company_id: bundle.companyId,
      category_id: options?.categoryId || null,
      period_start: bundle.periodStart,
      period_end: bundle.periodEnd,
      status: "completed",
      generated_by: options?.userId || null,
      generated_at: bundle.generatedAt,
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(
      /does not exist/i.test(error.message)
        ? "HR formula tables missing. Run scripts/097_hr_formula_reports_schema.sql"
        : error.message,
    )
  }

  const rows = bundle.categories.flatMap((cat) =>
    cat.metrics.map((m) => ({
      run_id: run.id,
      company_id: bundle.companyId,
      category_id: cat.id,
      formula_id: m.id,
      value: m.value,
      unit: m.unit,
      numerator: m.numerator,
      denominator: m.denominator,
      inputs: m.inputs,
      data_status: m.dataStatus,
    })),
  )

  if (rows.length) {
    const { error: mErr } = await supabase.from("hr_formula_report_metrics").insert(rows)
    if (mErr) {
      console.warn("[hr-formulas] metric persist failed:", mErr.message)
    }
  }

  return { runId: run.id }
}

export function formatMetricValue(m: MetricResult): string {
  if (m.value == null || Number.isNaN(m.value)) return "—"
  switch (m.unit) {
    case "percent":
      return `${m.value.toFixed(1)}%`
    case "currency":
      return `GHS ${m.value.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`
    case "days":
      return `${m.value.toFixed(1)} days`
    case "hours":
      return `${m.value.toFixed(1)} hrs`
    case "ratio":
      return m.value.toFixed(2)
    case "rate":
      return m.value.toLocaleString("en-GH", { maximumFractionDigits: 2 })
    case "score":
      return String(m.value)
    case "units":
      return m.value.toLocaleString("en-GH", { maximumFractionDigits: 2 })
    default:
      return String(m.value)
  }
}

export function categoryReportToCsv(category: CategoryReport, periodStart: string, periodEnd: string): string {
  const lines = [
    `HR Formula Report,${category.title}`,
    `Period,${periodStart} to ${periodEnd}`,
    "",
    "Metric,Formula,Value,Unit,Numerator,Denominator,Data Status",
  ]
  for (const m of category.metrics) {
    lines.push(
      [
        JSON.stringify(m.name),
        JSON.stringify(m.formula),
        m.value ?? "",
        m.unit,
        m.numerator ?? "",
        m.denominator ?? "",
        m.dataStatus,
      ].join(","),
    )
  }
  return lines.join("\n")
}
