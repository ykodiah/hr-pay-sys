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

export async function getLearningOverview(companyId: string) {
  const service = db()
  const employees = await loadEmployees(companyId)
  const empMap = new Map(employees.map((e: any) => [e.id, e]))

  const [
    { data: courses },
    { data: enrollments },
    { data: paths },
    { data: pathCourses },
    { data: certifications },
    { data: instructors },
    { data: insights },
  ] = await Promise.all([
    service.from("training_courses").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(200),
    service.from("training_enrollments").select("*").eq("company_id", companyId).order("enrolled_at", { ascending: false }).limit(400),
    service.from("learning_paths").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(100),
    service.from("learning_path_courses").select("*").limit(500),
    service.from("training_certifications").select("*").eq("company_id", companyId).order("date_issued", { ascending: false }).limit(200),
    service.from("training_instructors").select("*").eq("company_id", companyId).eq("is_active", true).order("name"),
    service
      .from("learning_insights")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(40),
  ])

  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]))

  const courseRows = (courses || []).map((c: any) => ({
    ...c,
    duration: Number(c.duration_hours || 0),
    type: c.delivery_type || "online",
    enrollments: Number(c.enrollment_count || 0),
    instructor: c.instructor_name || "—",
    learningObjectives: c.learning_objectives || [],
    prerequisites: c.prerequisites || [],
    tags: c.tags || [],
  }))

  const enrollmentRows = (enrollments || []).map((e: any) => {
    const emp = empMap.get(e.employee_id) as any
    const course = courseMap.get(e.course_id) as any
    return {
      ...e,
      courseName: course?.title || "Course",
      employeeName: emp ? empName(emp) : null,
      employeeCode: emp?.employee_id || null,
      progress: Number(e.progress ?? e.hours_completed ?? 0),
      score: e.score ?? e.post_score ?? null,
      certificateIssued: Boolean(e.certificate_issued),
      enrollmentDate: e.enrolled_at,
      completionDate: e.completed_at,
    }
  })

  const pathRows = (paths || []).map((p: any) => {
    const linked = (pathCourses || []).filter((pc: any) => pc.path_id === p.id).sort((a: any, b: any) => a.sort_order - b.sort_order)
    return {
      ...p,
      courses: linked.map((pc: any) => pc.course_id),
      courseTitles: linked.map((pc: any) => (courseMap.get(pc.course_id) as any)?.title).filter(Boolean),
      totalDuration: Number(p.total_duration || 0),
      completionRate: Number(p.completion_rate || 0),
    }
  })

  const certRows = (certifications || []).map((c: any) => {
    const emp = empMap.get(c.employee_id) as any
    return {
      ...c,
      employeeName: emp ? empName(emp) : null,
      validityPeriod: c.validity_months,
      dateIssued: c.date_issued,
      expiryDate: c.expiry_date,
      cpdPoints: Number(c.cpd_points || 0),
    }
  })

  const instructorRows = (instructors || []).map((i: any) => {
    const taught = courseRows.filter((c: any) => c.instructor_id === i.id || c.instructor_name === i.name)
    const studentIds = new Set(
      enrollmentRows.filter((e: any) => taught.some((c: any) => c.id === e.course_id)).map((e: any) => e.employee_id),
    )
    return {
      ...i,
      coursesCount: taught.length,
      studentsCount: studentIds.size,
    }
  })

  const activeCourses = courseRows.filter((c: any) => c.status === "active").length
  const completedEnrollments = enrollmentRows.filter((e: any) => e.status === "completed").length
  const inProgress = enrollmentRows.filter((e: any) => ["enrolled", "in-progress", "in_progress"].includes(String(e.status))).length
  const avgProgress =
    enrollmentRows.length > 0
      ? Math.round(
          (enrollmentRows.reduce((s: number, e: any) => s + Number(e.progress || 0), 0) / enrollmentRows.length) * 10,
        ) / 10
      : 0

  const byCategory = new Map<string, number>()
  for (const c of courseRows) {
    const key = c.category || "other"
    byCategory.set(key, (byCategory.get(key) || 0) + 1)
  }

  return {
    courses: courseRows,
    enrollments: enrollmentRows,
    paths: pathRows,
    certifications: certRows,
    instructors: instructorRows,
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
      })),
    stats: {
      activeCourses,
      totalCourses: courseRows.length,
      enrollments: enrollmentRows.length,
      inProgress,
      completed: completedEnrollments,
      certifications: certRows.filter((c: any) => c.status === "active").length,
      instructors: instructorRows.length,
      avgProgress,
      paths: pathRows.length,
    },
    charts: {
      byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
      statusMix: ["enrolled", "in-progress", "completed", "dropped"].map((status) => ({
        status,
        count: enrollmentRows.filter((e: any) => String(e.status).replace(/_/g, "-") === status || e.status === status.replace(/-/g, "_")).length,
      })),
    },
  }
}

export async function upsertCourse(companyId: string, body: any) {
  const service = db()
  const title = String(body.title || "").trim()
  if (!title) throw new Error("Course title required")

  const row: Record<string, any> = {
    company_id: companyId,
    title,
    description: body.description || null,
    category: body.category || "technical",
    delivery_type: body.type || body.delivery_type || body.deliveryType || "online",
    level: body.level || "beginner",
    duration_hours: Number(body.duration ?? body.duration_hours ?? 0),
    instructor_id: body.instructorId || body.instructor_id || null,
    instructor_name: body.instructor || body.instructor_name || null,
    price: Number(body.price ?? 0),
    rating: Number(body.rating ?? 0),
    status: body.status || "active",
    tags: Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    prerequisites: Array.isArray(body.prerequisites) ? body.prerequisites : [],
    learning_objectives: Array.isArray(body.learningObjectives || body.learning_objectives)
      ? body.learningObjectives || body.learning_objectives
      : typeof body.learningObjectives === "string"
        ? body.learningObjectives.split("\n").map((s: string) => s.trim()).filter(Boolean)
        : [],
    cost: Number(body.price ?? body.cost ?? 0),
    updated_at: new Date().toISOString(),
  }

  let data: any
  if (body.id) {
    const res = await service.from("training_courses").update(row).eq("id", body.id).eq("company_id", companyId).select().single()
    if (res.error) throw new Error(res.error.message)
    data = res.data
  } else {
    const res = await service.from("training_courses").insert(row).select().single()
    if (res.error) throw new Error(res.error.message)
    data = res.data
  }

  // Bridge dashboard stub
  await service
    .from("learning_courses")
    .upsert(
      {
        id: data.id,
        company_id: companyId,
        title: data.title,
        status: data.status,
        cost: data.price || data.cost || 0,
        duration_hours: data.duration_hours,
        category: data.category,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .then(() => null)
    .catch(() => null)

  return data
}

export async function upsertInstructor(companyId: string, body: any) {
  const service = db()
  const name = String(body.name || "").trim()
  if (!name) throw new Error("Instructor name required")
  const row = {
    company_id: companyId,
    name,
    email: body.email || null,
    bio: body.bio || null,
    expertise: Array.isArray(body.expertise)
      ? body.expertise
      : typeof body.expertise === "string"
        ? body.expertise.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    qualifications: Array.isArray(body.qualifications)
      ? body.qualifications
      : typeof body.qualifications === "string"
        ? body.qualifications.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    rating: Number(body.rating ?? 0),
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  }
  if (body.id) {
    const { data, error } = await service.from("training_instructors").update(row).eq("id", body.id).eq("company_id", companyId).select().single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("training_instructors").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertPath(companyId: string, body: any) {
  const service = db()
  const title = String(body.title || "").trim()
  if (!title) throw new Error("Path title required")
  const courseIds: string[] = Array.isArray(body.courses) ? body.courses : Array.isArray(body.courseIds) ? body.courseIds : []

  const row = {
    company_id: companyId,
    title,
    description: body.description || null,
    category: body.category || "General",
    difficulty: body.difficulty || "beginner",
    status: body.status || "active",
    total_duration: Number(body.totalDuration ?? body.total_duration ?? 0),
    updated_at: new Date().toISOString(),
  }

  let path: any
  if (body.id) {
    const res = await service.from("learning_paths").update(row).eq("id", body.id).eq("company_id", companyId).select().single()
    if (res.error) throw new Error(res.error.message)
    path = res.data
    await service.from("learning_path_courses").delete().eq("path_id", path.id)
  } else {
    const res = await service.from("learning_paths").insert(row).select().single()
    if (res.error) throw new Error(res.error.message)
    path = res.data
  }

  if (courseIds.length) {
    await service.from("learning_path_courses").insert(
      courseIds.map((course_id, i) => ({ path_id: path.id, course_id, sort_order: i })),
    )
    // recompute duration
    const { data: courses } = await service.from("training_courses").select("duration_hours").in("id", courseIds)
    const total = (courses || []).reduce((s: number, c: any) => s + Number(c.duration_hours || 0), 0)
    await service.from("learning_paths").update({ total_duration: total }).eq("id", path.id)
    path.total_duration = total
  }
  return path
}

export async function upsertEnrollment(companyId: string, body: any) {
  const service = db()
  const employeeId = body.employeeId || body.employee_id
  const courseId = body.courseId || body.course_id
  if (!employeeId || !courseId) throw new Error("employeeId and courseId required")

  const row: Record<string, any> = {
    company_id: companyId,
    employee_id: employeeId,
    course_id: courseId,
    status: (body.status || "enrolled").replace(/_/g, "-") === "in-progress" ? "in-progress" : body.status || "enrolled",
    progress: Number(body.progress ?? 0),
    score: body.score != null ? Number(body.score) : null,
    post_score: body.score != null ? Number(body.score) : null,
    hours_completed: Number(body.hoursCompleted ?? body.hours_completed ?? body.progress ?? 0),
    certificate_issued: Boolean(body.certificateIssued ?? body.certificate_issued),
    start_date: body.startDate || body.start_date || new Date().toISOString().slice(0, 10),
    completed_at: body.status === "completed" ? body.completed_at || new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    const { data, error } = await service.from("training_enrollments").update(row).eq("id", body.id).eq("company_id", companyId).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await service
    .from("training_enrollments")
    .insert({ ...row, enrolled_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // bump enrollment count
  const { count } = await service
    .from("training_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
  await service
    .from("training_courses")
    .update({ enrollment_count: count || 0, updated_at: new Date().toISOString() })
    .eq("id", courseId)
    .then(() => null)
    .catch(() => null)

  return data
}

export async function upsertCertification(companyId: string, body: any) {
  const service = db()
  const name = String(body.name || "").trim()
  if (!name) throw new Error("Certification name required")
  const issued = body.dateIssued || body.date_issued || new Date().toISOString().slice(0, 10)
  const months = Number(body.validityPeriod ?? body.validity_months ?? 12)
  const expiry =
    body.expiryDate ||
    body.expiry_date ||
    (() => {
      const d = new Date(`${issued}T12:00:00`)
      d.setMonth(d.getMonth() + months)
      return d.toISOString().slice(0, 10)
    })()

  const row = {
    company_id: companyId,
    employee_id: body.employeeId || body.employee_id || null,
    name,
    description: body.description || null,
    issuer: body.issuer || null,
    category: body.category || "professional",
    credential_id: body.credentialId || body.credential_id || null,
    validity_months: months,
    cpd_points: Number(body.cpdPoints ?? body.cpd_points ?? 0),
    requirements: Array.isArray(body.requirements) ? body.requirements : [],
    status: body.status || "active",
    date_issued: issued,
    expiry_date: expiry,
    document_url: body.documentUrl || body.document_url || null,
    course_id: body.courseId || body.course_id || null,
    updated_at: new Date().toISOString(),
  }

  if (body.id) {
    const { data, error } = await service.from("training_certifications").update(row).eq("id", body.id).eq("company_id", companyId).select().single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await service.from("training_certifications").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function generateLearningInsights(companyId: string) {
  const service = db()
  const overview = await getLearningOverview(companyId)
  const today = new Date().toISOString().slice(0, 10)
  const insights: any[] = []

  const stalled = overview.enrollments.filter(
    (e: any) => ["enrolled", "in-progress", "in_progress"].includes(String(e.status)) && Number(e.progress || 0) < 30,
  )
  for (const e of stalled.slice(0, 15)) {
    insights.push({
      company_id: companyId,
      employee_id: e.employee_id,
      insight_type: "stalled_enrollment",
      title: `Low progress: ${e.courseName}`,
      body: `${e.employeeName || "Learner"} at ${e.progress}%. Consider a nudge or manager follow-up.`,
      severity: Number(e.progress || 0) < 10 ? "high" : "medium",
      confidence: 0.8,
      metadata: { enrollment_id: e.id },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 14),
    })
  }

  for (const c of overview.certifications.filter((x: any) => x.expiry_date && x.expiry_date <= addDays(today, 60) && x.status === "active")) {
    insights.push({
      company_id: companyId,
      employee_id: c.employee_id,
      insight_type: "cert_expiring",
      title: `Certification expiring: ${c.name}`,
      body: `${c.employeeName || "Employee"} — expires ${c.expiry_date}. Schedule renewal.`,
      severity: c.expiry_date <= addDays(today, 14) ? "high" : "medium",
      confidence: 0.9,
      metadata: { certification_id: c.id },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  const byEmp = new Map<string, number>()
  for (const e of overview.enrollments.filter((x: any) => x.status === "completed")) {
    byEmp.set(e.employee_id, (byEmp.get(e.employee_id) || 0) + 1)
  }
  const trained = new Set(byEmp.keys())
  const activeHeadcount = overview.employees.length
  const coverage = activeHeadcount ? Math.round((trained.size / activeHeadcount) * 100) : 0
  if (activeHeadcount >= 3 && coverage < 40) {
    insights.push({
      company_id: companyId,
      insight_type: "coverage_gap",
      title: `Training coverage ${coverage}%`,
      body: `Only ${trained.size} of ${activeHeadcount} active employees have a completed course. Expand mandatory paths.`,
      severity: "medium",
      confidence: 0.75,
      metadata: { coverage },
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  const topCat = [...overview.charts.byCategory].sort((a, b) => b.count - a.count)[0]
  if (topCat && overview.stats.totalCourses >= 3) {
    insights.push({
      company_id: companyId,
      insight_type: "catalog_balance",
      title: `Catalog skewed to ${topCat.category}`,
      body: `${topCat.count} courses in this category. Consider balancing soft-skills / compliance offerings.`,
      severity: "info",
      confidence: 0.68,
      metadata: topCat,
      is_active: true,
      generated_at: new Date().toISOString(),
      expires_at: addDays(today, 30),
    })
  }

  await service.from("learning_insights").update({ is_active: false }).eq("company_id", companyId)
  if (insights.length) {
    const { error } = await service.from("learning_insights").insert(insights)
    if (error) throw new Error(error.message)
  }
  return { generated: insights.length, insights }
}
