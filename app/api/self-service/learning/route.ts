import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const [enrollRes, catalogRes, certRes] = await Promise.all([
      session.db
        .from("training_enrollments")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("enrolled_at", { ascending: false }),
      session.db
        .from("training_courses")
        .select(
          "id, title, description, category, delivery_type, level, duration_hours, instructor_name, rating, status",
        )
        .eq("company_id", session.companyId)
        .limit(100),
      session.db
        .from("training_certifications")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("expiry_date", { ascending: true, nullsFirst: false }),
    ])

    const enrollments = enrollRes.data || []
    const catalog = catalogRes.data || []
    const courseById = new Map<string, any>(catalog.map((c: any) => [c.id, c]))
    const enrolledIds = new Set(enrollments.map((e: any) => e.course_id))

    const myCourses = enrollments.map((e: any) => ({
      ...e,
      course: courseById.get(e.course_id) || null,
      title: courseById.get(e.course_id)?.title || "Course",
    }))

    const certs = certRes.data || []
    const today = new Date()
    const soon = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

    return NextResponse.json({
      my_courses: myCourses,
      available_courses: catalog.filter(
        (c: any) => !enrolledIds.has(c.id) && String(c.status || "active").toLowerCase() !== "archived",
      ),
      certifications: certs.map((c: any) => ({
        ...c,
        expiring_soon:
          c.expiry_date && new Date(c.expiry_date) <= soon && new Date(c.expiry_date) >= today,
        expired: c.expiry_date ? new Date(c.expiry_date) < today : false,
      })),
      summary: {
        enrolled: enrollments.length,
        completed: enrollments.filter((e: any) => String(e.status).toLowerCase() === "completed").length,
        hours: enrollments.reduce((s: number, e: any) => s + Number(e.hours_completed || 0), 0),
        certifications: certs.length,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load learning data")
  }
}

/** POST — self-enroll in a course from the tenant catalogue. */
export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.course_id) return NextResponse.json({ error: "Course id is required" }, { status: 400 })

    const { data: course } = await session.db
      .from("training_courses")
      .select("id, title")
      .eq("id", body.course_id)
      .eq("company_id", session.companyId)
      .maybeSingle()

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const { data, error } = await session.db
      .from("training_enrollments")
      .upsert(
        {
          company_id: session.companyId,
          employee_id: session.employeeId,
          course_id: course.id,
          status: "enrolled",
          progress: 0,
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "course_id,employee_id" },
      )
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "course_enroll", course.title, { course_id: course.id })

    return NextResponse.json({ success: true, enrollment: data })
  } catch (err) {
    return portalJsonError(err, "Failed to enrol")
  }
}

/** PATCH — update own course progress. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Enrollment id is required" }, { status: 400 })

    const progress = Math.max(0, Math.min(100, Number(body.progress) || 0))
    const patch: Record<string, any> = {
      progress,
      updated_at: new Date().toISOString(),
      status: progress >= 100 ? "completed" : "in_progress",
    }
    if (progress >= 100) patch.completed_at = new Date().toISOString()

    const { data, error } = await session.db
      .from("training_enrollments")
      .update(patch)
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })

    return NextResponse.json({ success: true, enrollment: data })
  } catch (err) {
    return portalJsonError(err, "Failed to update progress")
  }
}
