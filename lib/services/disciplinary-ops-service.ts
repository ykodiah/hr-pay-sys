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

async function loadEmployees(companyId: string) {
  const { data } = await db()
    .from("employees")
    .select("id, first_name, last_name, full_name, display_name, employee_id, department, position, status")
    .eq("company_id", companyId)
    .limit(500)
  return data || []
}

export async function getDisciplinaryOverview(companyId: string) {
  const service = db()
  const employees = await loadEmployees(companyId)
  const empMap = new Map(employees.map((e: any) => [e.id, e]))

  const [{ data: cases }, { data: actions }, { data: grievances }, { data: insights }] = await Promise.all([
    service.from("disciplinary_cases").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(200),
    service.from("disciplinary_actions").select("*").eq("company_id", companyId).order("issued_at", { ascending: false }).limit(300),
    service.from("grievances").select("*").eq("company_id", companyId).order("filed_at", { ascending: false }).limit(200),
    service
      .from("disciplinary_insights")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(40),
  ])

  const caseRows = (cases || []).map((c: any) => {
    const emp = empMap.get(c.employee_id) as any
    const caseActions = (actions || []).filter((a: any) => a.case_id === c.id)
    return {
      ...c,
      employee_name: emp ? empName(emp) : null,
      employee_code: emp?.employee_id || null,
      department: emp?.department || null,
      actions: caseActions,
    }
  })

  const grievanceRows = (grievances || []).map((g: any) => {
    const emp = empMap.get(g.employee_id) as any
    return {
      ...g,
      title: g.title || g.subject,
      employee_name: emp ? empName(emp) : null,
      employee_code: emp?.employee_id || null,
      status: g.status === "filed" ? "submitted" : g.status,
    }
  })

  const openStatuses = ["open", "investigating", "hearing_scheduled", "escalated"]
  const critical = caseRows.filter((c: any) => ["critical", "high"].includes(String(c.severity))).length
  const investigating = caseRows.filter((c: any) => c.status === "investigating").length
  const resolved = caseRows.filter((c: any) => ["resolved", "closed"].includes(String(c.status))).length
  const openCases = caseRows.filter((c: any) => openStatuses.includes(String(c.status))).length
  const openGrievances = grievanceRows.filter(
    (g: any) => !["resolved", "closed", "withdrawn"].includes(String(g.status)),
  ).length

  const byCategory = new Map<string, number>()
  for (const c of caseRows) {
    const key = c.category || "Other"
    byCategory.set(key, (byCategory.get(key) || 0) + 1)
  }
  const bySeverity = ["low", "medium", "high", "critical"].map((s) => ({
    severity: s,
    count: caseRows.filter((c: any) => c.severity === s).length,
  }))

  const insightRows = (insights || []).map((ins: any) => ({
    ...ins,
    employee_name: empMap.get(ins.employee_id) ? empName(empMap.get(ins.employee_id)) : null,
  }))

  return {
    cases: caseRows,
    actions: actions || [],
    grievances: grievanceRows,
    insights: insightRows,
    employees: employees.map((e: any) => ({
      id: e.id,
      name: empName(e),
      code: e.employee_id,
      department: e.department,
    })),
    stats: {
      totalCases: caseRows.length,
      openCases,
      investigating,
      critical,
      resolved,
      totalGrievances: grievanceRows.length,
      openGrievances,
      actionsIssued: (actions || []).length,
    },
    charts: {
      byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
      bySeverity,
    },
  }
}

export async function upsertDisciplinaryCase(companyId: string, body: any) {
  const service = db()
  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: body.employeeId || body.employee_id || null,
    category: body.category || "Misconduct",
    severity: body.severity || "medium",
    status: body.status || "open",
    title: String(body.title || "").trim(),
    description: body.description || null,
    reported_by: body.reportedBy || body.reported_by || null,
    reported_at: body.reported_at || new Date().toISOString(),
    due_date: body.dueDate || body.due_date || null,
    assigned_to: body.assignedTo || body.assigned_to || null,
    witnesses: Array.isArray(body.witnesses)
      ? body.witnesses
      : typeof body.witnesses === "string"
        ? body.witnesses
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
    documents: body.documents || [],
    hearing_date: body.hearingDate || body.hearing_date || null,
    resolution: body.resolution || null,
    compliance_notes: body.complianceNotes || body.compliance_notes || null,
    labour_act_ref: body.labourActRef || body.labour_act_ref || "Ghana Labour Act 2003 §§61–63",
    updated_at: new Date().toISOString(),
  }
  if (!row.title) throw new Error("Case title is required")
  if (!row.employee_id) throw new Error("Employee is required")

  if (body.id) {
    const { data, error } = await service
      .from("disciplinary_cases")
      .update(row)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const caseNumber = `DISC-${Date.now().toString(36).toUpperCase()}`
  const { data, error } = await service
    .from("disciplinary_cases")
    .insert({ ...row, case_number: caseNumber })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Mirror stub row for analytics rate (disciplinary_actions without case detail is still counted)
  await service
    .from("disciplinary_actions")
    .insert({
      company_id: companyId,
      employee_id: row.employee_id,
      case_id: data.id,
      action_type: "case_opened",
      status: "issued",
      issued_at: new Date().toISOString(),
      notes: `Case opened: ${row.title}`,
      description: `Case opened: ${row.title}`,
      issued_by: row.reported_by,
    })
    .then(() => null)
    .catch(() => null)

  return data
}

export async function upsertDisciplinaryAction(companyId: string, body: any) {
  const service = db()
  const caseId = body.caseId || body.case_id
  if (!caseId) throw new Error("case_id required")

  const { data: discCase } = await service
    .from("disciplinary_cases")
    .select("employee_id")
    .eq("id", caseId)
    .eq("company_id", companyId)
    .maybeSingle()

  const row = {
    company_id: companyId,
    case_id: caseId,
    employee_id: body.employeeId || body.employee_id || discCase?.employee_id || null,
    action_type: body.actionType || body.action_type || body.type || "written_warning",
    status: body.status || "issued",
    issued_at: body.issued_at || body.date || new Date().toISOString(),
    notes: body.notes || body.description || null,
    description: body.description || body.notes || null,
    issued_by: body.issuedBy || body.issued_by || null,
    acknowledged: Boolean(body.acknowledged),
    acknowledged_at: body.acknowledged_at || null,
    follow_up_required: Boolean(body.followUpRequired ?? body.follow_up_required),
    follow_up_date: body.followUpDate || body.follow_up_date || null,
    labour_act_ref: body.labourActRef || body.labour_act_ref || body.ghanaLabourActReference || null,
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    const { data, error } = await service.from("disciplinary_actions").update(row).eq("id", body.id).select().single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("disciplinary_actions").insert(row).select().single()
  if (error) throw new Error(error.message)

  // Bump case status if terminating / suspending
  if (["termination", "suspension", "final_warning"].includes(String(row.action_type))) {
    await service
      .from("disciplinary_cases")
      .update({
        status: row.action_type === "termination" ? "resolved" : "investigating",
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId)
      .then(() => null)
      .catch(() => null)
  }
  return data
}

export async function upsertGrievance(companyId: string, body: any) {
  const service = db()
  const title = String(body.title || body.subject || "").trim()
  if (!title) throw new Error("Grievance title required")

  const status = body.status || "submitted"
  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: body.employeeId || body.employee_id || null,
    subject: title,
    title,
    description: body.description || null,
    grievance_type: body.grievanceType || body.grievance_type || body.type || "Workplace",
    priority: body.priority || "medium",
    status: status === "submitted" ? "filed" : status, // keep analytics-compatible filed
    desired_outcome: body.desiredOutcome || body.desired_outcome || null,
    investigator: body.investigator || null,
    mediator: body.mediator || null,
    hearing_date: body.hearingDate || body.hearing_date || null,
    resolution: body.resolution || null,
    hr_response: body.hrResponse || body.hr_response || null,
    satisfaction_rating: body.satisfactionRating != null ? Number(body.satisfactionRating) : null,
    filed_at: body.filed_at || new Date().toISOString(),
    resolved_at: ["resolved", "closed"].includes(status) ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    const { data, error } = await service
      .from("grievances")
      .update(row)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("grievances").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function generateDisciplinaryInsights(companyId: string) {
  const service = db()
  const overview = await getDisciplinaryOverview(companyId)
  const today = new Date().toISOString().slice(0, 10)
  const insights: any[] = []

  // Repeat offenders
  const byEmp = new Map<string, number>()
  for (const c of overview.cases) {
    if (!c.employee_id) continue
    byEmp.set(c.employee_id, (byEmp.get(c.employee_id) || 0) + 1)
  }
  for (const [empId, count] of byEmp) {
    if (count >= 2) {
      const emp = overview.employees.find((e: any) => e.id === empId)
      insights.push({
        company_id: companyId,
        employee_id: empId,
        insight_type: "repeat_offender",
        title: `Repeat cases: ${emp?.name || "Employee"}`,
        body: `${count} disciplinary cases on file. Review pattern and consider coaching or progressive discipline.`,
        severity: count >= 3 ? "high" : "medium",
        confidence: 0.84,
        metadata: { case_count: count },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 21),
      })
    }
  }

  // Overdue / stagnant cases
  for (const c of overview.cases) {
    if (!["open", "investigating", "hearing_scheduled"].includes(String(c.status))) continue
    const due = c.due_date
    const ageDays = c.reported_at
      ? Math.floor((Date.now() - new Date(c.reported_at).getTime()) / 86400000)
      : 0
    if ((due && due < today) || ageDays > 14) {
      insights.push({
        company_id: companyId,
        employee_id: c.employee_id,
        case_id: c.id,
        insight_type: "case_at_risk",
        title: `Stalled case: ${c.title}`,
        body: due && due < today
          ? `Past due date (${due}). Escalate or schedule hearing.`
          : `Open for ${ageDays} days without resolution. Ghana Labour Act fair-hearing expectations apply.`,
        severity: c.severity === "critical" || c.severity === "high" ? "high" : "medium",
        confidence: 0.8,
        metadata: { status: c.status, age_days: ageDays },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 14),
      })
    }
  }

  // Critical severity open
  for (const c of overview.cases.filter((x: any) => x.severity === "critical" && !["resolved", "closed"].includes(x.status))) {
    insights.push({
      company_id: companyId,
      employee_id: c.employee_id,
      case_id: c.id,
      insight_type: "critical_alert",
      title: `Critical case open: ${c.title}`,
      body: "Prioritize investigation and document compliance steps under Labour Act §§61–63.",
      severity: "high",
      confidence: 0.9,
      metadata: {},
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 7),
    })
  }

  // Grievance backlog / urgent
  const openG = overview.grievances.filter((g: any) => !["resolved", "closed", "withdrawn"].includes(String(g.status)))
  if (openG.length >= 3) {
    insights.push({
      company_id: companyId,
      insight_type: "grievance_backlog",
      title: `Grievance backlog (${openG.length} open)`,
      body: "Resolution rate may drag employee relations metrics. Assign mediators to high/urgent items first.",
      severity: "medium",
      confidence: 0.75,
      metadata: { open: openG.length },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 14),
    })
  }
  for (const g of openG.filter((x: any) => ["high", "urgent"].includes(String(x.priority)))) {
    insights.push({
      company_id: companyId,
      employee_id: g.employee_id,
      insight_type: "urgent_grievance",
      title: `Urgent grievance: ${g.title || g.subject}`,
      body: `${g.employee_name || "Employee"} — ${g.grievance_type || "Workplace"}. Desired: ${g.desired_outcome || "not stated"}.`,
      severity: "high",
      confidence: 0.82,
      metadata: { grievance_id: g.id },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 10),
    })
  }

  // Category concentration
  const topCat = [...overview.charts.byCategory].sort((a, b) => b.count - a.count)[0]
  if (topCat && topCat.count >= 3) {
    insights.push({
      company_id: companyId,
      insight_type: "pattern",
      title: `Pattern: ${topCat.category} dominates cases`,
      body: `${topCat.count} cases in this category. Consider targeted policy refresh or manager training.`,
      severity: "info",
      confidence: 0.7,
      metadata: topCat,
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  await service.from("disciplinary_insights").update({ is_active: false }).eq("company_id", companyId)
  if (insights.length) {
    const { error } = await service.from("disciplinary_insights").insert(insights)
    if (error) throw new Error(error.message)
  }
  return { generated: insights.length, insights }
}
