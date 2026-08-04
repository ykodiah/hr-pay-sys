import { createServiceClient } from "@/lib/supabase/server"

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

const DEFAULT_CHECKLIST = [
  { item_key: "exit_interview", label: "Complete exit interview", category: "interview", sort_order: 1 },
  { item_key: "assets", label: "Return company assets", category: "assets", sort_order: 2 },
  { item_key: "access", label: "Revoke system & building access", category: "it", sort_order: 3 },
  { item_key: "handover", label: "Knowledge / duty handover", category: "documents", sort_order: 4 },
  { item_key: "resignation_letter", label: "Resignation / termination letter filed", category: "documents", sort_order: 5 },
  { item_key: "settlement", label: "Process final settlement", category: "settlement", sort_order: 6 },
  { item_key: "benefits", label: "Close benefits / SSNIT notice", category: "hr", sort_order: 7 },
]

async function loadEmployees(companyId: string) {
  const { data } = await db()
    .from("employees")
    .select("id, first_name, last_name, full_name, display_name, employee_id, department, position, status")
    .eq("company_id", companyId)
    .limit(500)
  return data || []
}

export async function getOffboardingOverview(companyId: string) {
  const service = db()
  const employees = await loadEmployees(companyId)
  const empMap = new Map(employees.map((e: any) => [e.id, e]))

  const [{ data: cases }, { data: assets }, { data: interviews }, { data: checklist }, { data: insights }] =
    await Promise.all([
      service.from("offboarding_cases").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(200),
      service.from("offboarding_assets").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(400),
      service.from("offboarding_exit_interviews").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(200),
      service.from("offboarding_checklist").select("*").eq("company_id", companyId).order("sort_order"),
      service
        .from("offboarding_insights")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("generated_at", { ascending: false })
        .limit(40),
    ])

  const caseRows = (cases || []).map((c: any) => {
    const emp = empMap.get(c.employee_id) as any
    const caseAssets = (assets || []).filter((a: any) => a.case_id === c.id)
    const caseChecks = (checklist || []).filter((ch: any) => ch.case_id === c.id)
    const interview = (interviews || []).find((i: any) => i.case_id === c.id) || null
    const done = caseChecks.filter((ch: any) => ch.is_done).length
    return {
      ...c,
      status: String(c.status || "").replace(/-/g, "_"),
      employee_name: emp ? empName(emp) : null,
      employee_code: emp?.employee_id || null,
      department: c.department || emp?.department || null,
      position: c.position || emp?.position || null,
      assets: caseAssets,
      checklist: caseChecks,
      interview,
      checklist_progress: caseChecks.length ? Math.round((done / caseChecks.length) * 100) : 0,
    }
  })

  const active = caseRows.filter((c: any) => ["initiated", "in_progress"].includes(c.status))
  const completed = caseRows.filter((c: any) => c.status === "completed")
  const pendingAssets = (assets || []).filter((a: any) => !a.returned).length
  const pendingSettlements = caseRows.filter(
    (c: any) => c.status !== "completed" && c.settlement_status !== "paid",
  ).length

  // Avg process days for completed
  let avgDays = 0
  const durations = completed
    .map((c: any) => {
      if (!c.completed_at || !c.created_at) return null
      return Math.max(0, Math.round((new Date(c.completed_at).getTime() - new Date(c.created_at).getTime()) / 86400000))
    })
    .filter((n: number | null): n is number => n != null)
  if (durations.length) avgDays = Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)

  const byReason = new Map<string, number>()
  for (const c of caseRows) {
    const r = c.reason || "other"
    byReason.set(r, (byReason.get(r) || 0) + 1)
  }

  return {
    cases: caseRows,
    assets: assets || [],
    interviews: interviews || [],
    insights: (insights || []).map((ins: any) => ({
      ...ins,
      employee_name: empMap.get(ins.employee_id) ? empName(empMap.get(ins.employee_id)) : null,
    })),
    employees: employees
      .filter((e: any) => ["active", "Active", "ACTIVE", "probation", "Probation"].includes(String(e.status)))
      .map((e: any) => ({
        id: e.id,
        name: empName(e),
        code: e.employee_id,
        department: e.department,
        position: e.position,
      })),
    stats: {
      activeCases: active.length,
      completedCases: completed.length,
      pendingAssets,
      pendingSettlements,
      avgProcessDays: avgDays,
      totalCases: caseRows.length,
    },
    charts: {
      byReason: [...byReason.entries()].map(([reason, count]) => ({ reason, count })),
      statusMix: ["initiated", "in_progress", "completed", "cancelled"].map((status) => ({
        status,
        count: caseRows.filter((c: any) => c.status === status).length,
      })),
    },
  }
}

export async function upsertOffboardingCase(companyId: string, body: any) {
  const service = db()
  const employeeId = body.employeeId || body.employee_id
  if (!employeeId) throw new Error("Employee is required")
  const lastDay = body.lastWorkingDay || body.last_working_day
  if (!lastDay) throw new Error("Last working day is required")

  const { data: emp } = await service
    .from("employees")
    .select("id, first_name, last_name, full_name, display_name, department, position")
    .eq("id", employeeId)
    .maybeSingle()

  let salaryHint = 0
  try {
    const { data: fin } = await service
      .from("employee_financial")
      .select("monthly_salary")
      .eq("employee_id", employeeId)
      .maybeSingle()
    salaryHint = Number(fin?.monthly_salary || 0)
  } catch {
    /* optional */
  }

  const settlementHint = Number(body.settlementAmount ?? body.settlement_amount ?? salaryHint ?? 0)

  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: employeeId,
    department: body.department || emp?.department || null,
    position: body.position || emp?.position || null,
    last_working_day: lastDay,
    reason: String(body.reason || "resignation")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_"),
    reason_notes: body.notes || body.reason_notes || null,
    status: (body.status || "initiated").replace(/-/g, "_"),
    exit_interview_completed: Boolean(body.exitInterviewCompleted ?? body.exit_interview_completed),
    assets_returned: Boolean(body.assetsReturned ?? body.assets_returned),
    documents_complete: Boolean(body.documentsComplete ?? body.documents_complete),
    settlement_amount: settlementHint,
    settlement_status: body.settlementStatus || body.settlement_status || "pending",
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    if (row.status === "completed") row.completed_at = new Date().toISOString()
    const { data, error } = await service
      .from("offboarding_cases")
      .update(row)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const caseNumber = `OFF-${Date.now().toString(36).toUpperCase()}`
  const { data, error } = await service
    .from("offboarding_cases")
    .insert({ ...row, case_number: caseNumber, initiated_by: body.initiatedBy || null })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Seed checklist
  await service
    .from("offboarding_checklist")
    .insert(DEFAULT_CHECKLIST.map((item) => ({ ...item, company_id: companyId, case_id: data.id })))
    .then(() => null)
    .catch(() => null)

  // Seed exit interview stub
  await service
    .from("offboarding_exit_interviews")
    .insert({
      company_id: companyId,
      case_id: data.id,
      employee_id: employeeId,
      status: "scheduled",
      scheduled_at: new Date(`${lastDay}T10:00:00`).toISOString(),
    })
    .then(() => null)
    .catch(() => null)

  // Optional default assets
  const defaultAssets = body.assets || [
    { name: "Laptop", asset_type: "Laptop", serial_number: "", condition: "good" },
    { name: "Access card / keys", asset_type: "Access", serial_number: "", condition: "good" },
  ]
  if (Array.isArray(defaultAssets) && defaultAssets.length) {
    await service
      .from("offboarding_assets")
      .insert(
        defaultAssets.map((a: any) => ({
          company_id: companyId,
          case_id: data.id,
          employee_id: employeeId,
          name: a.name,
          asset_type: a.asset_type || a.type || "equipment",
          serial_number: a.serial_number || a.serialNumber || null,
          condition: a.condition || "good",
          returned: Boolean(a.returned),
        })),
      )
      .then(() => null)
      .catch(() => null)
  }

  return data
}

export async function upsertOffboardingAsset(companyId: string, body: any) {
  const service = db()
  const caseId = body.caseId || body.case_id
  if (!caseId && !body.id) throw new Error("case_id required")

  const row: Record<string, any> = {
    company_id: companyId,
    case_id: caseId,
    employee_id: body.employeeId || body.employee_id || null,
    name: String(body.name || "").trim(),
    asset_type: body.assetType || body.asset_type || body.type || "equipment",
    serial_number: body.serialNumber || body.serial_number || null,
    condition: body.condition || "good",
    returned: Boolean(body.returned),
    returned_at: body.returned ? body.returned_at || new Date().toISOString() : null,
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  }
  if (!row.name && !body.id) throw new Error("Asset name required")

  if (body.id) {
    const patch: Record<string, any> = { updated_at: row.updated_at }
    if (body.returned != null) {
      patch.returned = Boolean(body.returned)
      patch.returned_at = body.returned ? new Date().toISOString() : null
    }
    if (body.name) patch.name = body.name
    if (body.condition) patch.condition = body.condition
    if (body.notes != null) patch.notes = body.notes
    const { data, error } = await service
      .from("offboarding_assets")
      .update(patch)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Sync case assets_returned flag
    const { data: all } = await service.from("offboarding_assets").select("returned, case_id").eq("case_id", data.case_id)
    if (all?.length) {
      const allReturned = all.every((a: any) => a.returned)
      await service
        .from("offboarding_cases")
        .update({ assets_returned: allReturned, updated_at: new Date().toISOString() })
        .eq("id", data.case_id)
      // checklist
      if (allReturned) {
        await service
          .from("offboarding_checklist")
          .update({ is_done: true, done_at: new Date().toISOString() })
          .eq("case_id", data.case_id)
          .eq("item_key", "assets")
          .then(() => null)
          .catch(() => null)
      }
    }
    return data
  }

  const { data, error } = await service.from("offboarding_assets").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertChecklistItem(companyId: string, body: any) {
  const service = db()
  if (!body.id) throw new Error("checklist item id required")
  const { data, error } = await service
    .from("offboarding_checklist")
    .update({
      is_done: Boolean(body.isDone ?? body.is_done),
      done_at: body.isDone ?? body.is_done ? new Date().toISOString() : null,
      done_by: body.doneBy || body.done_by || null,
      notes: body.notes ?? undefined,
    })
    .eq("id", body.id)
    .eq("company_id", companyId)
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Sync interview / settlement flags
  if (data.item_key === "exit_interview" && data.is_done) {
    await service
      .from("offboarding_cases")
      .update({ exit_interview_completed: true, status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", data.case_id)
    await service
      .from("offboarding_exit_interviews")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("case_id", data.case_id)
      .then(() => null)
      .catch(() => null)
  }
  if (data.item_key === "settlement" && data.is_done) {
    await service
      .from("offboarding_cases")
      .update({ settlement_status: "paid", settlement_paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", data.case_id)
  }

  // Auto-complete case when all checklist done
  const { data: checks } = await service.from("offboarding_checklist").select("is_done").eq("case_id", data.case_id)
  if (checks?.length && checks.every((c: any) => c.is_done)) {
    await service
      .from("offboarding_cases")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        assets_returned: true,
        exit_interview_completed: true,
        documents_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.case_id)
  }
  return data
}

export async function upsertExitInterview(companyId: string, body: any) {
  const service = db()
  const caseId = body.caseId || body.case_id
  if (!caseId) throw new Error("case_id required")

  const row = {
    company_id: companyId,
    case_id: caseId,
    employee_id: body.employeeId || body.employee_id || null,
    scheduled_at: body.scheduledAt || body.scheduled_at || null,
    completed_at: body.status === "completed" ? new Date().toISOString() : body.completed_at || null,
    interviewer: body.interviewer || null,
    status: body.status || "completed",
    reasons: body.reasons || [],
    ratings: body.ratings || {},
    feedback: body.feedback || null,
    would_recommend: body.wouldRecommend ?? body.would_recommend ?? null,
    rehire_eligible: body.rehireEligible ?? body.rehire_eligible ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await service
    .from("offboarding_exit_interviews")
    .upsert(row, { onConflict: "case_id" })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (row.status === "completed") {
    await service
      .from("offboarding_cases")
      .update({ exit_interview_completed: true, status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", caseId)
    await service
      .from("offboarding_checklist")
      .update({ is_done: true, done_at: new Date().toISOString() })
      .eq("case_id", caseId)
      .eq("item_key", "exit_interview")
      .then(() => null)
      .catch(() => null)
  }
  return data
}

export async function processSettlement(companyId: string, body: any) {
  const service = db()
  const id = body.id || body.caseId || body.case_id
  if (!id) throw new Error("case id required")
  const amount = body.settlementAmount != null ? Number(body.settlementAmount) : undefined
  const { data, error } = await service
    .from("offboarding_cases")
    .update({
      settlement_status: "paid",
      settlement_paid_at: new Date().toISOString(),
      ...(amount != null ? { settlement_amount: amount } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single()
  if (error) throw new Error(error.message)

  await service
    .from("offboarding_checklist")
    .update({ is_done: true, done_at: new Date().toISOString() })
    .eq("case_id", id)
    .eq("item_key", "settlement")
    .then(() => null)
    .catch(() => null)

  return data
}

export async function generateOffboardingInsights(companyId: string) {
  const service = db()
  const overview = await getOffboardingOverview(companyId)
  const today = new Date().toISOString().slice(0, 10)
  const insights: any[] = []

  for (const c of overview.cases.filter((x: any) => ["initiated", "in_progress"].includes(x.status))) {
    const daysToExit = Math.round(
      (new Date(`${c.last_working_day}T12:00:00`).getTime() - Date.now()) / 86400000,
    )
    if (daysToExit <= 7 && !c.exit_interview_completed) {
      insights.push({
        company_id: companyId,
        employee_id: c.employee_id,
        case_id: c.id,
        insight_type: "interview_due",
        title: `Exit interview due: ${c.employee_name || "Employee"}`,
        body: `Last day ${c.last_working_day} (${daysToExit}d). Schedule interview to capture attrition signals.`,
        severity: daysToExit <= 2 ? "high" : "medium",
        confidence: 0.86,
        metadata: { days_to_exit: daysToExit },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 7),
      })
    }
    if (!c.assets_returned && (c.assets || []).some((a: any) => !a.returned)) {
      const pending = (c.assets || []).filter((a: any) => !a.returned).length
      insights.push({
        company_id: companyId,
        employee_id: c.employee_id,
        case_id: c.id,
        insight_type: "assets_pending",
        title: `${pending} asset(s) still out`,
        body: `${c.employee_name || "Employee"} has unreturned equipment. Block settlement until cleared.`,
        severity: daysToExit <= 3 ? "high" : "medium",
        confidence: 0.88,
        metadata: { pending },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 10),
      })
    }
    if (c.settlement_status === "pending" && daysToExit <= 5) {
      insights.push({
        company_id: companyId,
        employee_id: c.employee_id,
        case_id: c.id,
        insight_type: "settlement_due",
        title: `Settlement pending (GHS ${Number(c.settlement_amount || 0).toLocaleString()})`,
        body: "Prepare final pay, leave encashment, and statutory deductions before last working day.",
        severity: "medium",
        confidence: 0.8,
        metadata: {},
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 7),
      })
    }
    if (Number(c.checklist_progress || 0) < 40 && daysToExit <= 10) {
      insights.push({
        company_id: companyId,
        employee_id: c.employee_id,
        case_id: c.id,
        insight_type: "process_risk",
        title: `Offboarding lag: ${c.checklist_progress}% complete`,
        body: "Checklist progress is low relative to exit date. Assign an HR owner.",
        severity: "high",
        confidence: 0.77,
        metadata: { progress: c.checklist_progress },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 7),
      })
    }
  }

  const resignations = overview.charts.byReason.find((r) => r.reason === "resignation")?.count || 0
  if (resignations >= 2 && overview.stats.totalCases >= 3) {
    insights.push({
      company_id: companyId,
      insight_type: "attrition_signal",
      title: "Resignation-heavy exit mix",
      body: `${resignations} of ${overview.stats.totalCases} exits are resignations. Review engagement / compensation signals from exit interviews.`,
      severity: "info",
      confidence: 0.72,
      metadata: { resignations },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  // Sentiment from completed interviews
  for (const iv of overview.interviews.filter((i: any) => i.status === "completed" && i.would_recommend === false)) {
    insights.push({
      company_id: companyId,
      employee_id: iv.employee_id,
      case_id: iv.case_id,
      insight_type: "nps_risk",
      title: "Would not recommend employer",
      body: iv.feedback || "Exit interview flagged negative recommendation. Feed into retention analysis.",
      severity: "medium",
      confidence: 0.74,
      metadata: {},
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  await service.from("offboarding_insights").update({ is_active: false }).eq("company_id", companyId)
  if (insights.length) {
    const { error } = await service.from("offboarding_insights").insert(insights)
    if (error) throw new Error(error.message)
  }
  return { generated: insights.length, insights }
}
