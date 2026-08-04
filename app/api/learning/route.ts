import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  generateLearningInsights,
  getLearningOverview,
  upsertCertification,
  upsertCourse,
  upsertEnrollment,
  upsertInstructor,
  upsertPath,
} from "@/lib/services/learning-ops-service"

/** GET /api/learning */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const data = await getLearningOverview(ctx.companyId)
    return NextResponse.json({ success: true, ...data, company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load learning data")
  }
}

/**
 * POST /api/learning
 * action: course | instructor | path | enrollment | certification | generate_insights | delete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const action = String(body.action || "").toLowerCase()

    if (action === "generate_insights" || action === "insights") {
      const result = await generateLearningInsights(ctx.companyId)
      return NextResponse.json({ success: true, ...result })
    }
    if (action === "course") {
      const row = await upsertCourse(ctx.companyId, body)
      return NextResponse.json({ success: true, course: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "instructor") {
      const row = await upsertInstructor(ctx.companyId, body)
      return NextResponse.json({ success: true, instructor: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "path") {
      const row = await upsertPath(ctx.companyId, body)
      return NextResponse.json({ success: true, path: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "enrollment") {
      const row = await upsertEnrollment(ctx.companyId, body)
      return NextResponse.json({ success: true, enrollment: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "certification" || action === "cert") {
      const row = await upsertCertification(ctx.companyId, body)
      return NextResponse.json({ success: true, certification: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "delete") {
      const table =
        body.entity === "instructor"
          ? "training_instructors"
          : body.entity === "path"
            ? "learning_paths"
            : body.entity === "enrollment"
              ? "training_enrollments"
              : body.entity === "certification"
                ? "training_certifications"
                : "training_courses"
      if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })
      await ctx.service.from(table).delete().eq("id", body.id).eq("company_id", ctx.companyId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Learning action failed")
  }
}
