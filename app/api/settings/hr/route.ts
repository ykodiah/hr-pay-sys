// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "0 MB"
  const megabytes = bytes / (1024 * 1024)
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
}

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

function isMissingRelation(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  )
}

async function safeSelect(query: PromiseLike<{ data: any; error: any }>, label: string) {
  const { data, error } = await query
  if (error) {
    if (isMissingRelation(error)) {
      console.warn(`[settings/hr] ${label} table missing:`, error.message)
      return []
    }
    throw error
  }
  return data || []
}

async function safeMaybeSingle(query: PromiseLike<{ data: any; error: any }>, label: string) {
  const { data, error } = await query
  if (error) {
    if (isMissingRelation(error)) {
      console.warn(`[settings/hr] ${label} table missing:`, error.message)
      return null
    }
    throw error
  }
  return data || null
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [configuration, documents, policies, structuredGrades, unstructured] = await Promise.all([
      safeMaybeSingle(
        service.from("hr_configuration").select("*").eq("company_id", companyId).maybeSingle(),
        "hr_configuration",
      ),
      safeSelect(
        service
          .from("hr_documents")
          .select("id, document_name, document_type, file_path, file_size, visible_to_all, created_at, content")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        "hr_documents",
      ),
      safeSelect(
        service
          .from("leave_policies")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        "leave_policies",
      ),
      safeSelect(
        service
          .from("salary_grades")
          .select("id, grade_name, grade_level, step_1, step_2, step_3, step_4, step_5, min_salary, max_salary, notches")
          .eq("company_id", companyId)
          .order("grade_level", { ascending: true }),
        "salary_grades",
      ),
      safeSelect(
        service
          .from("unstructured_salary_grades")
          .select(
            "id, grade_name, description, general_increment_type, general_increment_value, performance_increment_type, performance_increment_value",
          )
          .eq("company_id", companyId)
          .order("created_at", { ascending: true }),
        "unstructured_salary_grades",
      ),
    ])

    const hrConfig = configuration
      ? {
          leaveYearStart: configuration.leave_year_start || "January",
          probationPeriod: configuration.probation_period ?? 3,
          workingHoursPerDay: configuration.working_hours_per_day ?? 8,
          workingDaysPerWeek: configuration.working_days_per_week ?? 5,
          autoApproveLeave: !!configuration.auto_approve_leave,
          emailNotifications: !!configuration.email_notifications,
          aiRecommendations: !!configuration.ai_recommendations,
          smartScheduling: !!configuration.smart_scheduling,
          performanceTracking: !!configuration.performance_tracking,
        }
      : null

    const hrDocuments = (documents || []).map((doc) => ({
      id: String(doc.id),
      name: doc.document_name,
      type: doc.document_type,
      size: formatBytes(doc.file_size),
      visibleToAll: !!doc.visible_to_all,
      fileUrl: doc.file_path,
      uploadedAt: doc.created_at || new Date().toISOString(),
      content: doc.content || "",
    }))

    const leavePolicies = (policies || []).map((p) => ({
      id: p.id,
      // Support both 059 (name/days) and older 014 (policy_name/max_days) schemas
      name: p.name || p.policy_name || "Leave Policy",
      days: Number(p.days ?? p.max_days ?? 0),
      usage: p.usage_rate || (p.usage_percentage != null ? `${p.usage_percentage}%` : "0%"),
      trend: p.trend || "stable",
      description: p.description || "",
      carryOver: !!(p.carry_over ?? (Number(p.carry_over_days || 0) > 0)),
    }))

    const salaryGrades = (structuredGrades || []).map((grade) => {
      const fromNotches = Array.isArray(grade.notches) ? grade.notches : null
      const stepValues = [grade.step_1, grade.step_2, grade.step_3, grade.step_4, grade.step_5].filter(
        (value) => typeof value === "number",
      ) as number[]
      const notches =
        fromNotches && fromNotches.length
          ? fromNotches
          : stepValues.map((amount, index) => ({ step: index + 1, amount: Number(amount) }))
      return {
        id: grade.id,
        name: grade.grade_name || `Grade ${grade.grade_level}`,
        description: grade.grade_name,
        minSalary: Number(grade.min_salary ?? notches[0]?.amount ?? 0),
        maxSalary: Number(grade.max_salary ?? notches[notches.length - 1]?.amount ?? notches[0]?.amount ?? 0),
        notches,
      }
    })

    const unstructuredGrades = (unstructured || []).map((grade) => ({
      id: grade.id,
      name: grade.grade_name,
      description: grade.description || "",
      generalIncrement: {
        type: (grade.general_increment_type || "percentage") as "percentage" | "fixed",
        value: Number(grade.general_increment_value ?? 0),
      },
      performanceIncrement: {
        type: (grade.performance_increment_type || "percentage") as "percentage" | "fixed",
        value: Number(grade.performance_increment_value ?? 0),
      },
    }))

    return NextResponse.json({
      hrConfig,
      hrDocuments,
      leavePolicies,
      salaryGrades,
      unstructuredGrades,
    })
  } catch (err) {
    return jsonError(err, "Failed to load HR settings")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const now = new Date().toISOString()
    const action = body.action || "save_config"

    if (action === "save_config") {
      const config = body.config || body
      const { error } = await service.from("hr_configuration").upsert(
        {
          company_id: companyId,
          leave_year_start: config.leaveYearStart ?? config.leave_year_start,
          probation_period: config.probationPeriod ?? config.probation_period,
          working_hours_per_day: config.workingHoursPerDay ?? config.working_hours_per_day,
          working_days_per_week: config.workingDaysPerWeek ?? config.working_days_per_week,
          auto_approve_leave: !!(config.autoApproveLeave ?? config.auto_approve_leave),
          email_notifications: !!(config.emailNotifications ?? config.email_notifications),
          ai_recommendations: !!(config.aiRecommendations ?? config.ai_recommendations),
          smart_scheduling: !!(config.smartScheduling ?? config.smart_scheduling),
          performance_tracking: !!(config.performanceTracking ?? config.performance_tracking),
          updated_at: now,
        },
        { onConflict: "company_id" },
      )
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "save_leave_policy") {
      const policy = body.policy || body
      const policyName = String(policy.name || "").trim()
      if (!policyName) {
        return NextResponse.json({ error: "Leave policy name is required" }, { status: 400 })
      }
      const days = Number(policy.days || 0)
      const lowered = policyName.toLowerCase()
      const policyType =
        String(policy.policy_type || policy.type || "").trim().toLowerCase() ||
        (lowered.includes("sick")
          ? "sick"
          : lowered.includes("maternity")
            ? "maternity"
            : lowered.includes("paternity")
              ? "paternity"
              : "annual")

      // Dual-write payloads for 014 (policy_name/max_days) and 059 (name/days)
      const attempts = [
        {
          company_id: companyId,
          name: policyName,
          policy_name: policyName,
          policy_type: policyType,
          days,
          max_days: days,
          description: policy.description || "",
          carry_over: !!policy.carryOver,
          carry_over_days: policy.carryOver ? days : 0,
          usage_rate: policy.usage || "0%",
          trend: policy.trend || "new",
          is_active: true,
          updated_at: now,
        },
        {
          company_id: companyId,
          policy_name: policyName,
          policy_type: policyType,
          max_days: days,
          description: policy.description || "",
          is_active: true,
          updated_at: now,
        },
        {
          company_id: companyId,
          name: policyName,
          days,
          description: policy.description || "",
          carry_over: !!policy.carryOver,
          usage_rate: policy.usage || "0%",
          trend: policy.trend || "new",
          is_active: true,
          updated_at: now,
        },
      ]

      const isColumnError = (error: any) => {
        const msg = String(error?.message || "").toLowerCase()
        return (
          error?.code === "PGRST204" ||
          msg.includes("column") ||
          msg.includes("could not find") ||
          msg.includes("schema cache")
        )
      }

      const writeLeave = async (rowId?: string) => {
        let lastError: any = null
        for (const attempt of attempts) {
          const query = rowId
            ? service.from("leave_policies").update(attempt).eq("id", rowId).eq("company_id", companyId)
            : service.from("leave_policies").insert({ ...attempt, created_at: now })
          const { data, error } = await query.select().single()
          if (!error) return data
          lastError = error
          if (isColumnError(error)) continue
          throw error
        }
        throw lastError || new Error("Failed to save leave policy")
      }

      let targetId = isUuid(policy.id) ? policy.id : null
      if (!targetId) {
        const { data: existing } = await service
          .from("leave_policies")
          .select("id")
          .eq("company_id", companyId)
          .or(`name.eq."${policyName}",policy_name.eq."${policyName}"`)
          .limit(1)
          .maybeSingle()
        if (existing?.id) targetId = existing.id
      }

      try {
        const data = await writeLeave(targetId || undefined)
        return NextResponse.json({ success: true, policy: data })
      } catch (error: any) {
        if (String(error.message || "").toLowerCase().includes("duplicate") || error.code === "23505") {
          const { data: byName } = await service
            .from("leave_policies")
            .select("id")
            .eq("company_id", companyId)
            .or(`name.eq."${policyName}",policy_name.eq."${policyName}"`)
            .limit(1)
            .maybeSingle()
          if (byName?.id) {
            const data = await writeLeave(byName.id)
            return NextResponse.json({ success: true, policy: data })
          }
        }
        throw error
      }
    }

    if (action === "delete_leave_policy") {
      const id = body.id
      const name = body.name
      let query = service.from("leave_policies").update({ is_active: false, updated_at: now }).eq("company_id", companyId)
      if (isUuid(id)) query = query.eq("id", id)
      else if (name) query = query.or(`name.eq."${name}",policy_name.eq."${name}"`)
      else return NextResponse.json({ error: "id or name required" }, { status: 400 })
      const { error } = await query
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "save_document") {
      const doc = body.document || body
      const row = {
        company_id: companyId,
        document_name: doc.name || doc.document_name,
        document_type: doc.type || doc.document_type || "FILE",
        file_path: doc.fileUrl || doc.file_path || null,
        file_size: typeof doc.file_size === "number" ? doc.file_size : null,
        file_type: doc.file_type || doc.type || null,
        visible_to_all: !!(doc.visibleToAll ?? doc.visible_to_all),
        content: doc.content || null,
        uploaded_by: userId,
        updated_at: now,
      }
      if (isUuid(doc.id)) {
        const { data, error } = await service
          .from("hr_documents")
          .update(row)
          .eq("id", doc.id)
          .eq("company_id", companyId)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, document: data })
      }
      const { data, error } = await service.from("hr_documents").insert({ ...row, created_at: now }).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, document: data })
    }

    if (action === "toggle_document_visibility") {
      if (!isUuid(body.id)) {
        return NextResponse.json({ error: "Valid document id required" }, { status: 400 })
      }
      const { error } = await service
        .from("hr_documents")
        .update({ visible_to_all: !!body.visible_to_all, updated_at: now })
        .eq("id", body.id)
        .eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "delete_document") {
      if (!isUuid(body.id)) {
        return NextResponse.json({ error: "Valid document id required" }, { status: 400 })
      }
      const { error } = await service.from("hr_documents").delete().eq("id", body.id).eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "save_salary_grade") {
      const grade = body.grade || body
      const notches = Array.isArray(grade.notches) ? grade.notches : []
      const steps = [1, 2, 3, 4, 5].map((n) => {
        const found = notches.find((x: any) => Number(x.step) === n)
        return found ? Number(found.amount) : null
      })
      const row = {
        company_id: companyId,
        grade_name: grade.name,
        name: grade.name,
        grade_level: grade.grade_level ?? null,
        min_salary: Number(grade.minSalary || 0),
        max_salary: Number(grade.maxSalary || 0),
        step_1: steps[0],
        step_2: steps[1],
        step_3: steps[2],
        step_4: steps[3],
        step_5: steps[4],
        notches,
        is_active: true,
        updated_at: now,
      }
      if (isUuid(grade.id)) {
        const { data, error } = await service
          .from("salary_grades")
          .update(row)
          .eq("id", grade.id)
          .eq("company_id", companyId)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, grade: data })
      }
      const { data, error } = await service.from("salary_grades").insert({ ...row, created_at: now }).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, grade: data })
    }

    if (action === "delete_salary_grade") {
      if (!isUuid(body.id)) {
        return NextResponse.json({ error: "Valid grade id required" }, { status: 400 })
      }
      const { error } = await service.from("salary_grades").delete().eq("id", body.id).eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "save_unstructured_grade") {
      const grade = body.grade || body
      const row = {
        company_id: companyId,
        grade_name: grade.name,
        description: grade.description || "",
        general_increment_type: grade.generalIncrement?.type || "percentage",
        general_increment_value: Number(grade.generalIncrement?.value || 0),
        performance_increment_type: grade.performanceIncrement?.type || "percentage",
        performance_increment_value: Number(grade.performanceIncrement?.value || 0),
        is_active: true,
        updated_at: now,
      }
      if (isUuid(grade.id)) {
        const { data, error } = await service
          .from("unstructured_salary_grades")
          .update(row)
          .eq("id", grade.id)
          .eq("company_id", companyId)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, grade: data })
      }
      const { data, error } = await service
        .from("unstructured_salary_grades")
        .insert({ ...row, created_at: now })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, grade: data })
    }

    if (action === "delete_unstructured_grade") {
      if (!isUuid(body.id)) {
        return NextResponse.json({ error: "Valid grade id required" }, { status: 400 })
      }
      const { error } = await service
        .from("unstructured_salary_grades")
        .delete()
        .eq("id", body.id)
        .eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save HR settings")
  }
}
