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
  const service = db()
  const { data } = await service
    .from("employees")
    .select("id, first_name, last_name, full_name, display_name, employee_id, department, position, status")
    .eq("company_id", companyId)
    .in("status", ["active", "Active", "ACTIVE", "probation", "Probation"])
    .limit(500)
  return data || []
}

export async function getPerformanceOverview(companyId: string) {
  const service = db()
  const employees = await loadEmployees(companyId)
  const empMap = new Map(employees.map((e: any) => [e.id, e]))
  const empIds = employees.map((e: any) => e.id)

  const [
    { data: goals },
    { data: reviewsByCompany },
    { data: catalog },
    { data: assessments },
    { data: succession },
    { data: insights },
  ] = await Promise.all([
    service.from("performance_goals").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(200),
    service.from("performance_reviews").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(200),
    service.from("performance_competencies").select("*").eq("company_id", companyId).eq("is_active", true).order("name"),
    service
      .from("performance_competency_assessments")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(300),
    service.from("performance_succession").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }),
    service
      .from("performance_insights")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(40),
  ])

  let reviewRows = reviewsByCompany || []
  if (!reviewRows.length && empIds.length) {
    const fb = await service
      .from("performance_reviews")
      .select("*")
      .in("employee_id", empIds.slice(0, 200))
      .order("updated_at", { ascending: false })
      .limit(200)
    if (!fb.error) reviewRows = fb.data || []
  }

  const goalRows = (goals || []).map((g: any) => ({
    ...g,
    due_date: g.due_date || g.end_date,
    employee_name: empMap.get(g.employee_id) ? empName(empMap.get(g.employee_id)) : null,
  }))

  const reviewMapped = reviewRows.map((r: any) => ({
    ...r,
    overall_rating: r.overall_score ?? r.rating ?? r.overall_rating,
    period_start: r.period_start || r.review_period_start,
    period_end: r.period_end || r.review_period_end,
    employee_name: empMap.get(r.employee_id) ? empName(empMap.get(r.employee_id)) : null,
  }))

  const competencyRows = (assessments || []).map((c: any) => ({
    ...c,
    employee_name: empMap.get(c.employee_id) ? empName(empMap.get(c.employee_id)) : null,
  }))

  // Seed default catalog once if empty (non-blocking best effort)
  if (!(catalog || []).length) {
    const defaults = ["Leadership", "Communication", "Technical skills", "Teamwork", "Problem solving"].map((name) => ({
      company_id: companyId,
      name,
      category: "Core",
      level: "intermediate",
      is_active: true,
    }))
    await service.from("performance_competencies").insert(defaults).then(() => null).catch(() => null)
  }

  const successionRows = (succession || []).map((s: any) => {
    const eid = s.employee_id || s.incumbent_employee_id
    return {
      ...s,
      employee_id: eid,
      target_position: s.target_position || s.position,
      employee_name: empMap.get(eid) ? empName(empMap.get(eid)) : s.incumbent_name || null,
    }
  })

  const insightRows = (insights || []).map((ins: any) => ({
    ...ins,
    body: ins.body || ins.message,
    employee_name: empMap.get(ins.employee_id) ? empName(empMap.get(ins.employee_id)) : null,
  }))

  const activeGoals = goalRows.filter((g: any) => g.status === "active")
  const completedGoals = goalRows.filter((g: any) => g.status === "completed")
  const avgGoalProgress =
    activeGoals.length > 0
      ? Math.round(
          (activeGoals.reduce((s: number, g: any) => s + Number(g.progress || 0), 0) / activeGoals.length) * 10,
        ) / 10
      : 0

  const ratings: number[] = reviewMapped
    .map((r: any) => Number(r.overall_rating || 0))
    .filter((n: number) => n > 0)
  const avgReviewScore = ratings.length
    ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
    : 0

  const highPerformers = new Set(
    reviewMapped.filter((r: any) => Number(r.overall_rating || 0) >= 4.5).map((r: any) => r.employee_id),
  ).size

  const successionReady = successionRows.filter(
    (s: any) => s.readiness_level === "ready_now" || Number(s.readiness_percent || 0) >= 80,
  ).length

  // Charts
  const ratingDistribution = [1, 2, 3, 4, 5].map((n) => ({
    rating: String(n),
    count: ratings.filter((r: number) => Math.round(r) === n).length,
  }))

  const deptScores = new Map<string, { sum: number; count: number }>()
  for (const r of reviewMapped) {
    const emp = empMap.get(r.employee_id) as any
    const dept = emp?.department || "General"
    const score = Number(r.overall_rating || 0)
    if (!score) continue
    const cur = deptScores.get(dept) || { sum: 0, count: 0 }
    cur.sum += score
    cur.count += 1
    deptScores.set(dept, cur)
  }
  const departmentAvg = [...deptScores.entries()]
    .map(([department, v]) => ({
      department,
      avg: Math.round((v.sum / v.count) * 10) / 10,
      count: v.count,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 12)

  const byComp = new Map<string, { sum: number; count: number }>()
  for (const c of competencyRows) {
    const name = c.competency_name || "Other"
    const cur = byComp.get(name) || { sum: 0, count: 0 }
    cur.sum += Number(c.current_level || 0)
    cur.count += 1
    byComp.set(name, cur)
  }
  let competencyRadar = [...byComp.entries()].slice(0, 8).map(([subject, v]) => ({
    subject: subject.length > 14 ? `${subject.slice(0, 12)}…` : subject,
    score: Math.round((v.sum / v.count) * 10) / 10,
    fullMark: 5,
  }))
  if (!competencyRadar.length) {
    competencyRadar = ["Leadership", "Communication", "Technical", "Teamwork", "Delivery"].map((subject) => ({
      subject,
      score: 0,
      fullMark: 5,
    }))
  }

  return {
    goals: goalRows,
    reviews: reviewMapped,
    competencies: competencyRows,
    catalog: catalog || [],
    succession: successionRows,
    insights: insightRows,
    employees: employees.map((e: any) => ({
      id: e.id,
      name: empName(e),
      employee_id: e.employee_id,
      department: e.department,
      position: e.position,
    })),
    stats: {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      avgGoalProgress,
      avgReviewScore,
      pendingReviews: reviewMapped.filter((r: any) =>
        ["draft", "submitted", "in-progress", "in_progress"].includes(String(r.status)),
      ).length,
      highPerformers,
      successionReady,
    },
    charts: {
      ratingDistribution,
      departmentAvg,
      competencyRadar,
    },
    // legacy aliases
    kpis: {
      active_goals: activeGoals.length,
      avg_rating: avgReviewScore,
    },
  }
}

export async function upsertPerformanceGoal(companyId: string, body: any) {
  const service = db()
  const due = body.dueDate || body.due_date || body.end_date || body.endDate || null
  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: body.employeeId || body.employee_id || null,
    title: String(body.title || "").trim(),
    description: body.description || null,
    goal_type: body.goal_type || body.type || "individual",
    category: body.category || "Individual",
    priority: body.priority || "medium",
    department: body.department || null,
    status: body.status || "active",
    progress: Number(body.progress ?? 0),
    target_value: Number(body.targetValue ?? body.target_value ?? body.target ?? 100),
    current_value: Number(body.currentValue ?? body.current_value ?? body.current ?? 0),
    unit: body.unit || "%",
    start_date: body.start_date || body.startDate || null,
    end_date: due,
    due_date: due,
    key_results: body.key_results || body.keyResults || [],
    owner_name: body.owner_name || body.owner || null,
    updated_at: new Date().toISOString(),
  }
  if (!row.title) throw new Error("Goal title is required")
  if (!row.employee_id) throw new Error("Employee is required")

  if (body.id) {
    const { data, error } = await service
      .from("performance_goals")
      .update(row)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("performance_goals").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertPerformanceReview(companyId: string, body: any) {
  const service = db()
  const score = Number(body.overallRating ?? body.overall_score ?? body.rating ?? body.overall_rating ?? 0)
  const periodStart =
    body.periodStart || body.period_start || body.review_period_start || body.start_date || new Date().toISOString().slice(0, 10)
  const periodEnd =
    body.periodEnd || body.period_end || body.review_period_end || body.end_date || new Date().toISOString().slice(0, 10)
  const employeeId = body.employeeId || body.employee_id
  if (!employeeId) throw new Error("employee_id required")

  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: employeeId,
    reviewer_id: body.reviewerId || body.reviewer_id || employeeId,
    review_period_start: periodStart,
    review_period_end: periodEnd,
    period_start: periodStart,
    period_end: periodEnd,
    review_type: body.reviewType || body.review_type || body.type || "annual",
    period_label: body.period_label || body.period || null,
    overall_rating: score ? Math.round(score) : null,
    overall_score: score || null,
    rating: score || null,
    goals_score: body.goalsScore != null ? Number(body.goalsScore) : null,
    competencies_score: body.competenciesScore != null ? Number(body.competenciesScore) : null,
    competency_scores: body.competency_scores || body.competencyScores || [],
    goals_achievement: body.goals_achievement || body.goals || [],
    strengths: body.strengths || null,
    areas_for_improvement: body.areasForImprovement || body.areas_for_improvement || null,
    development_plan: body.development_plan || body.developmentPlan || null,
    feedback: body.feedback || null,
    comments: body.comments || null,
    status: body.status || "completed",
    due_date: body.due_date || body.dueDate || null,
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    const { data, error } = await service.from("performance_reviews").update(row).eq("id", body.id).select().single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("performance_reviews").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertCompetency(companyId: string, body: any) {
  const service = db()
  // Per-employee assessment (primary path from UI)
  const employeeId = body.employeeId || body.employee_id
  const competencyName = String(body.competencyName || body.competency_name || body.name || "").trim()
  if (employeeId && competencyName) {
    const row = {
      company_id: companyId,
      employee_id: employeeId,
      competency_name: competencyName,
      category: body.category || "Core",
      current_level: Number(body.currentLevel ?? body.current_level ?? 3),
      target_level: Number(body.targetLevel ?? body.target_level ?? 4),
      assessed_by: body.assessedBy || body.assessed_by || null,
      notes: body.notes || null,
      assessed_at: body.assessed_at || new Date().toISOString().slice(0, 10),
      is_active: true,
      updated_at: new Date().toISOString(),
    }
    // Ensure catalog entry exists
    await service
      .from("performance_competencies")
      .upsert(
        {
          company_id: companyId,
          name: competencyName,
          category: row.category,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,name" },
      )
      .then(() => null)
      .catch(() => null)

    if (body.id) {
      const { data, error } = await service
        .from("performance_competency_assessments")
        .update(row)
        .eq("id", body.id)
        .eq("company_id", companyId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    }
    const { data, error } = await service.from("performance_competency_assessments").insert(row).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  // Catalog-only upsert fallback
  const name = competencyName
  if (!name) throw new Error("Competency name required")
  const catalogRow = {
    company_id: companyId,
    name,
    description: body.description || null,
    category: body.category || "Core",
    level: body.level || "intermediate",
    roles: Array.isArray(body.roles) ? body.roles : [],
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  }
  if (body.id) {
    const { data, error } = await service
      .from("performance_competencies")
      .update(catalogRow)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("performance_competencies").insert(catalogRow).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertSuccession(companyId: string, body: any) {
  const service = db()
  const employeeId = body.employeeId || body.employee_id || body.incumbent_employee_id || body.incumbentId || null
  const position = String(body.targetPosition || body.target_position || body.position || "").trim()
  if (!position) throw new Error("Target position required")

  let incumbentName = body.incumbent_name || body.incumbent || null
  if (employeeId && !incumbentName) {
    const { data: emp } = await service
      .from("employees")
      .select("first_name, last_name, full_name, display_name")
      .eq("id", employeeId)
      .maybeSingle()
    if (emp) incumbentName = empName(emp)
  }

  const row = {
    company_id: companyId,
    position,
    target_position: position,
    employee_id: employeeId,
    incumbent_employee_id: employeeId,
    incumbent_name: incumbentName,
    department: body.department || null,
    criticality: body.criticality || "medium",
    risk_level: body.risk_level || body.riskLevel || "medium",
    readiness_level: body.readinessLevel || body.readiness_level || "developing",
    readiness_percent: Number(body.readinessPercent ?? body.readiness_percent ?? 0),
    potential_rating: body.potentialRating || body.potential_rating || "medium",
    development_plan: body.developmentPlan || body.development_plan || null,
    successors: body.successors || [],
    development_needs: body.development_needs || body.developmentNeeds || [],
    notes: body.notes || null,
    status: body.status || "active",
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    const { data, error } = await service
      .from("performance_succession")
      .update(row)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("performance_succession").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

/** Heuristic AI/ML-style insights — fast, DB-backed, regenerable */
export async function generatePerformanceInsights(companyId: string) {
  const service = db()
  const overview = await getPerformanceOverview(companyId)
  const today = new Date().toISOString().slice(0, 10)
  const insights: any[] = []

  for (const g of overview.goals) {
    const due = g.due_date || g.end_date
    if (g.status === "active" && Number(g.progress || 0) < 40 && due && due <= addDays(today, 30)) {
      insights.push({
        company_id: companyId,
        employee_id: g.employee_id,
        insight_type: "risk",
        title: `Goal at risk: ${g.title}`,
        message: `Progress ${g.progress}% with deadline ${due}. Recommend a check-in.`,
        body: `Progress ${g.progress}% with deadline ${due}. Recommend a check-in.`,
        score: Number(g.progress || 0),
        confidence: 0.78,
        severity: Number(g.progress || 0) < 25 ? "high" : "medium",
        metadata: { goal_id: g.id },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 14),
      })
    }
  }

  const byEmp = new Map<string, number[]>()
  for (const r of overview.reviews) {
    const score = Number(r.overall_rating || 0)
    if (!r.employee_id || !score) continue
    const arr = byEmp.get(r.employee_id) || []
    arr.push(score)
    byEmp.set(r.employee_id, arr)
  }

  for (const [empId, scores] of byEmp) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const emp = overview.employees.find((e: any) => e.id === empId)
    if (avg >= 4.3) {
      insights.push({
        company_id: companyId,
        employee_id: empId,
        insight_type: "opportunity",
        title: `High performer: ${emp?.name || "Employee"}`,
        message: `Avg review score ${avg.toFixed(1)}. Consider stretch goals or succession readiness.`,
        body: `Avg review score ${avg.toFixed(1)}. Consider stretch goals or succession readiness.`,
        score: avg,
        confidence: 0.85,
        severity: "info",
        metadata: { reviews: scores.length },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 30),
      })
    } else if (avg <= 2.5) {
      insights.push({
        company_id: companyId,
        employee_id: empId,
        insight_type: "risk",
        title: `Performance risk: ${emp?.name || "Employee"}`,
        message: `Avg score ${avg.toFixed(1)}. Schedule coaching / PIP review.`,
        body: `Avg score ${avg.toFixed(1)}. Schedule coaching / PIP review.`,
        score: avg,
        confidence: 0.82,
        severity: "high",
        metadata: { reviews: scores.length },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 14),
      })
    } else if (avg >= 3.8) {
      insights.push({
        company_id: companyId,
        employee_id: empId,
        insight_type: "recommendation",
        title: `Promotion signal: ${emp?.name || "Employee"}`,
        message: `Solid ${avg.toFixed(1)} average. Cross-check competencies & succession slate.`,
        body: `Solid ${avg.toFixed(1)} average. Cross-check competencies & succession slate.`,
        score: avg,
        confidence: 0.72,
        severity: "low",
        metadata: {},
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 30),
      })
    }
  }

  for (const c of overview.competencies) {
    const gap = Number(c.target_level || 0) - Number(c.current_level || 0)
    if (gap >= 1.5) {
      insights.push({
        company_id: companyId,
        employee_id: c.employee_id,
        insight_type: "recommendation",
        title: `Competency gap: ${c.competency_name}`,
        message: `${c.employee_name || "Employee"} is at ${c.current_level}/${c.target_level}. Add a development goal.`,
        body: `${c.employee_name || "Employee"} is at ${c.current_level}/${c.target_level}. Add a development goal.`,
        score: gap,
        confidence: 0.7,
        severity: "medium",
        metadata: { assessment_id: c.id },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 21),
      })
    }
  }

  for (const s of overview.succession) {
    if (s.readiness_level === "ready_now" || Number(s.readiness_percent || 0) >= 80) {
      insights.push({
        company_id: companyId,
        employee_id: s.employee_id,
        insight_type: "opportunity",
        title: `Succession ready: ${s.target_position}`,
        message: `${s.employee_name || "Candidate"} is ready for ${s.target_position}.`,
        body: `${s.employee_name || "Candidate"} is ready for ${s.target_position}.`,
        score: Number(s.readiness_percent || 100),
        confidence: 0.75,
        severity: "info",
        metadata: { succession_id: s.id },
        is_active: true,
        generated_at: new Date().toISOString(),
        expires_at: addDays(today, 30),
      })
    }
  }

  await service
    .from("performance_insights")
    .update({ is_active: false })
    .eq("company_id", companyId)

  if (insights.length) {
    const { error } = await service.from("performance_insights").insert(insights)
    if (error) throw new Error(error.message)
  }

  try {
    for (const [empId, scores] of byEmp) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      await service.from("employee_analytics").upsert(
        {
          employee_id: empId,
          company_id: companyId,
          performance_score: avg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employee_id" },
      )
    }
  } catch {
    /* optional table */
  }

  return { generated: insights.length, created: insights.length, insights }
}
