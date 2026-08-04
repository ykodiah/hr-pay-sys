import { createServiceClient } from "@/lib/supabase/server"
import {
  approvalMatrix,
  computeSalaryDelta,
  evaluateEligibility,
  gradeCatalog,
  type PromotionCase,
} from "@/lib/promotions"

function db() {
  return createServiceClient()
}

function empName(e: any) {
  return (
    e?.display_name ||
    e?.full_name ||
    `${e?.first_name || ""} ${e?.last_name || ""}`.trim() ||
    "Employee"
  )
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function monthsSince(dateStr?: string | null): number {
  if (!dateStr) return 12
  const start = new Date(dateStr)
  if (Number.isNaN(start.getTime())) return 12
  const now = new Date()
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
}

const APPROVER_DIRECTORY: Record<string, string> = {
  "Line Manager": "Ama Koomson",
  "Head of Department": "Kwesi Nyarko",
  "HR Director": "Efua Bediako",
  "Finance Director": "Yaw Sarfo",
  "Managing Director": "Nana Akoto",
}

function mapCaseRow(row: any): PromotionCase {
  return {
    id: row.case_number || row.id,
    employeeId: row.employee_code || row.employee_id,
    employeeName: row.employee_name || "Employee",
    department: row.department || "General",
    fromGrade: row.from_grade,
    fromStep: Number(row.from_step || 1),
    toGrade: row.to_grade,
    toStep: Number(row.to_step || 1),
    effectiveDate: row.effective_date,
    reason: row.reason || "",
    status: row.status,
    initiatedBy: row.initiated_by || "HR",
    initiatedAt: row.initiated_at ? String(row.initiated_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    eligibility: Array.isArray(row.eligibility) ? row.eligibility : [],
    approvals: Array.isArray(row.approvals) ? row.approvals : [],
    compensationDelta: {
      currentBase: Number(row.current_base || 0),
      proposedBase: Number(row.proposed_base || 0),
      currency: row.currency || "GHS",
    },
    letterUrl: row.letter_url || undefined,
    _dbId: row.id,
  } as PromotionCase & { _dbId?: string }
}

export async function loadSalaryGrades(companyId: string) {
  const service = db()
  const { data } = await service.from("salary_grades").select("*").eq("company_id", companyId).eq("is_active", true)
  if (!data?.length) return gradeCatalog
  return data.map((g: any, idx: number) => {
    const code = g.grade_code || g.grade_name || `G${g.grade_level || idx + 6}`
    return {
      id: g.id,
      gradeCode: code,
      band: g.band || g.grade_name || code,
      minStep: 1,
      maxStep: 5,
      steps: [g.step_1, g.step_2, g.step_3, g.step_4, g.step_5].map((base: any, i: number) => ({
        step: i + 1,
        basePay: Number(base || 0),
        currency: "GHS",
        effectiveFrom: "2025-01-01",
      })),
    }
  })
}

export async function loadPromotionEmployeeProfiles(companyId: string) {
  const service = db()
  let employees: any[] = []
  {
    const full = await service
      .from("employees")
      .select(
        "id, first_name, last_name, full_name, display_name, employee_id, department, position, status, date_of_joining, direct_supervisor, head_of_department",
      )
      .eq("company_id", companyId)
      .in("status", ["active", "Active", "ACTIVE", "probation", "Probation"])
      .limit(500)
    if (full.error) {
      const basic = await service
        .from("employees")
        .select("id, first_name, last_name, full_name, display_name, employee_id, department, position, status")
        .eq("company_id", companyId)
        .limit(500)
      employees = basic.data || []
    } else {
      employees = full.data || []
    }
  }

  const empIds = (employees || []).map((e: any) => e.id)

  const [{ data: discCases }, { data: reviews }, { data: enrollments }] = await Promise.all([
    empIds.length
      ? service
          .from("disciplinary_cases")
          .select("employee_id, status")
          .eq("company_id", companyId)
          .in("employee_id", empIds.slice(0, 200))
      : Promise.resolve({ data: [] as any[] }),
    empIds.length
      ? service
          .from("performance_reviews")
          .select("employee_id, overall_score, overall_rating, rating")
          .in("employee_id", empIds.slice(0, 200))
          .limit(400)
      : Promise.resolve({ data: [] as any[] }),
    empIds.length
      ? service
          .from("training_enrollments")
          .select("employee_id, status")
          .eq("company_id", companyId)
          .eq("status", "completed")
          .in("employee_id", empIds.slice(0, 200))
      : Promise.resolve({ data: [] as any[] }),
  ])

  const openDisc = new Set(
    (discCases || [])
      .filter((c: any) => !["resolved", "closed"].includes(String(c.status)))
      .map((c: any) => c.employee_id),
  )
  const trained = new Set((enrollments || []).map((e: any) => e.employee_id))
  const scores = new Map<string, number[]>()
  for (const r of reviews || []) {
    const s = Number(r.overall_score ?? r.rating ?? r.overall_rating ?? 0)
    if (!r.employee_id || !s) continue
    const arr = scores.get(r.employee_id) || []
    arr.push(s)
    scores.set(r.employee_id, arr)
  }

  return (employees || []).map((e: any) => {
    const scoreArr = scores.get(e.id) || []
    const appraisalScore = scoreArr.length
      ? Math.round((scoreArr.reduce((a, b) => a + b, 0) / scoreArr.length) * 10) / 10
      : 3.5
    return {
      id: e.employee_id || e.id,
      _uuid: e.id,
      name: empName(e),
      department: e.department || "General",
      grade: e.grade || e.salary_grade || "G6",
      step: Number(e.step ?? 1),
      tenureMonths: monthsSince(e.date_of_joining || e.hire_date),
      appraisalScore,
      trainingCompleted: trained.has(e.id),
      hasDisciplinary: openDisc.has(e.id),
      supervisor: e.direct_supervisor || "—",
      headOfDepartment: e.head_of_department || "—",
    }
  })
}

export async function listPromotionCases(companyId: string): Promise<PromotionCase[]> {
  const { data, error } = await db()
    .from("promotion_cases")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data || []).map(mapCaseRow)
}

export async function getPromotionsOverview(companyId: string) {
  const [cases, employees, grades, { data: insights }] = await Promise.all([
    listPromotionCases(companyId),
    loadPromotionEmployeeProfiles(companyId),
    loadSalaryGrades(companyId),
    db()
      .from("promotion_insights")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(40),
  ])

  const pending = cases.filter((c) => c.status === "in-review").length
  const approved = cases.filter((c) => c.status === "approved").length
  const draft = cases.filter((c) => c.status === "draft").length
  const avgDelta =
    cases.length > 0
      ? Math.round(
          cases.reduce((s, c) => s + (c.compensationDelta.proposedBase - c.compensationDelta.currentBase), 0) /
            cases.length,
        )
      : 0

  return {
    data: cases,
    cases,
    employees,
    grades,
    insights: insights || [],
    stats: {
      total: cases.length,
      pending,
      approved,
      draft,
      rejected: cases.filter((c) => c.status === "rejected").length,
      avgDelta,
      eligibleEmployees: employees.filter((e) => !e.hasDisciplinary && e.appraisalScore >= 3.5 && e.tenureMonths >= 12)
        .length,
    },
  }
}

export async function upsertPromotionCase(companyId: string, body: any) {
  const service = db()
  const employees = await loadPromotionEmployeeProfiles(companyId)
  const emp =
    employees.find((e) => e.id === body.employeeId || e._uuid === body.employeeId) ||
    employees.find((e) => e.name === body.employeeName)

  const fromGrade = body.fromGrade || emp?.grade || "G6"
  const fromStep = Number(body.fromStep ?? emp?.step ?? 1)
  const toGrade = body.toGrade
  const toStep = Number(body.toStep ?? 1)
  if (!toGrade) throw new Error("toGrade required")

  const tenureMonths = Number(body.tenureMonths ?? emp?.tenureMonths ?? 12)
  const appraisalScore = Number(body.appraisalScore ?? emp?.appraisalScore ?? 3.5)
  const trainingCompleted = body.trainingCompleted ?? emp?.trainingCompleted ?? false
  const hasDisciplinary = body.hasDisciplinary ?? emp?.hasDisciplinary ?? false

  const eligibility =
    Array.isArray(body.eligibility) && body.eligibility.length
      ? body.eligibility
      : evaluateEligibility(fromGrade, fromStep, tenureMonths, appraisalScore, trainingCompleted, hasDisciplinary, false)

  const delta =
    body.compensationDelta || computeSalaryDelta(fromGrade, fromStep, toGrade, toStep)

  const allPassed = eligibility.every((e: any) => e.passed)
  const status = body.status || (allPassed ? "in-review" : "draft")

  const approvals =
    Array.isArray(body.approvals) && body.approvals.length
      ? body.approvals
      : approvalMatrix.map((entry) => ({
          stage: entry.stage,
          role: entry.role,
          approverName: APPROVER_DIRECTORY[entry.role] || entry.role,
          status: "pending" as const,
        }))

  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: emp?._uuid || null,
    employee_code: emp?.id || body.employeeId || null,
    employee_name: body.employeeName || emp?.name || "Employee",
    department: body.department || emp?.department || "General",
    from_grade: fromGrade,
    from_step: fromStep,
    to_grade: toGrade,
    to_step: toStep,
    effective_date: body.effectiveDate || body.effective_date || new Date().toISOString().slice(0, 10),
    reason: body.reason || "",
    status,
    initiated_by: body.initiatedBy || "HR",
    initiated_at: body.initiatedAt || new Date().toISOString(),
    attachments: body.attachments || [],
    eligibility,
    approvals,
    current_base: Number(delta.currentBase || 0),
    proposed_base: Number(delta.proposedBase || 0),
    currency: delta.currency || "GHS",
    letter_url: body.letterUrl || null,
    tenure_check: Boolean(eligibility.find((e: any) => e.id === "tenure")?.passed),
    appraisal_check: Boolean(eligibility.find((e: any) => e.id === "appraisal")?.passed),
    training_check: Boolean(eligibility.find((e: any) => e.id === "training")?.passed),
    disciplinary_check: Boolean(eligibility.find((e: any) => e.id === "disciplinary")?.passed),
    budget_check: Boolean(eligibility.find((e: any) => e.id === "payroll")?.passed ?? true),
    updated_at: new Date().toISOString(),
  }

  // Resolve existing by case_number or uuid
  const existingId = body._dbId || (body.id && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null)
  let existing: any = null
  if (existingId) {
    const { data } = await service.from("promotion_cases").select("id").eq("id", existingId).maybeSingle()
    existing = data
  }
  if (!existing && body.id) {
    const { data } = await service
      .from("promotion_cases")
      .select("id")
      .eq("company_id", companyId)
      .eq("case_number", body.id)
      .maybeSingle()
    existing = data
  }

  if (existing?.id) {
    const { data, error } = await service
      .from("promotion_cases")
      .update(row)
      .eq("id", existing.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapCaseRow(data)
  }

  const caseNumber = body.id && String(body.id).startsWith("PC-") ? body.id : `PC-${Date.now().toString(36).toUpperCase()}`
  const { data, error } = await service
    .from("promotion_cases")
    .insert({ ...row, case_number: caseNumber })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapCaseRow(data)
}

export async function generatePromotionInsights(companyId: string) {
  const service = db()
  const overview = await getPromotionsOverview(companyId)
  const today = new Date().toISOString().slice(0, 10)
  const insights: any[] = []

  for (const emp of overview.employees.filter(
    (e) => e.appraisalScore >= 4.0 && e.tenureMonths >= 12 && !e.hasDisciplinary && e.trainingCompleted,
  ).slice(0, 12)) {
    const already = overview.cases.some(
      (c) => (c.employeeId === emp.id || (c as any).employeeName === emp.name) && ["draft", "in-review"].includes(c.status),
    )
    if (already) continue
    insights.push({
      company_id: companyId,
      employee_id: emp._uuid,
      insight_type: "ready_for_promotion",
      title: `Promotion-ready: ${emp.name}`,
      body: `Appraisal ${emp.appraisalScore}, tenure ${emp.tenureMonths}m, training complete, clear disciplinary. Consider ${emp.grade} → next grade.`,
      severity: "info",
      confidence: 0.82,
      metadata: { grade: emp.grade, appraisal: emp.appraisalScore },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  for (const c of overview.cases.filter((x) => x.status === "in-review")) {
    const pendingStage = c.approvals.find((a) => a.status === "pending")
    if (pendingStage) {
      insights.push({
        company_id: companyId,
        case_id: (c as any)._dbId,
        insight_type: "approval_bottleneck",
        title: `Awaiting ${pendingStage.role}`,
        body: `${c.employeeName} (${c.fromGrade}→${c.toGrade}) stuck at stage ${pendingStage.stage}.`,
        severity: "medium",
        confidence: 0.85,
        metadata: { case: c.id, stage: pendingStage.stage },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 14),
      })
    }
  }

  const blocked = overview.employees.filter((e) => e.hasDisciplinary || !e.trainingCompleted)
  if (blocked.length >= 2) {
    insights.push({
      company_id: companyId,
      insight_type: "eligibility_blockers",
      title: `${blocked.length} employees blocked on eligibility`,
      body: "Open disciplinary cases or incomplete training are blocking promotion readiness. Clear blockers before annual cycle.",
      severity: "medium",
      confidence: 0.78,
      metadata: { count: blocked.length },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 21),
    })
  }

  await service.from("promotion_insights").update({ is_active: false }).eq("company_id", companyId)
  if (insights.length) {
    const { error } = await service.from("promotion_insights").insert(insights)
    if (error) throw new Error(error.message)
  }
  return { generated: insights.length, insights }
}
