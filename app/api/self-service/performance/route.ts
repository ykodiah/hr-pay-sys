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
    const [reviewsRes, competencyRes, goalsRes] = await Promise.all([
      session.db
        .from("performance_reviews")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("review_period_end", { ascending: false, nullsFirst: false })
        .limit(30),
      session.db
        .from("performance_competency_assessments")
        .select("*")
        .eq("employee_id", session.employeeId)
        .limit(100),
      session.db
        .from("performance_goals")
        .select("id, title, status, progress, due_date, category")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .limit(50),
    ])

    const reviews = reviewsRes.data || []
    const rated = reviews.filter((r: any) => r.overall_rating || r.overall_score || r.rating)
    const average = rated.length
      ? rated.reduce(
          (s: number, r: any) => s + Number(r.overall_rating || r.overall_score || r.rating || 0),
          0,
        ) / rated.length
      : null

    return NextResponse.json({
      reviews,
      competencies: competencyRes.data || [],
      goals: goalsRes.data || [],
      summary: {
        total_reviews: reviews.length,
        average_rating: average != null ? Number(average.toFixed(2)) : null,
        latest: reviews[0] || null,
        awaiting_self_assessment: reviews.filter((r: any) =>
          ["draft", "pending", "self_assessment"].includes(String(r.status || "").toLowerCase()),
        ).length,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load performance data")
  }
}

/** PATCH — employee submits self-assessment comments on an open review. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Review id is required" }, { status: 400 })

    const { data: review } = await session.db
      .from("performance_reviews")
      .select("id, status")
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .maybeSingle()

    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })
    if (["approved", "completed", "closed"].includes(String(review.status || "").toLowerCase())) {
      return NextResponse.json({ error: "This review is already closed" }, { status: 400 })
    }

    const { data, error } = await session.db
      .from("performance_reviews")
      .update({
        comments: String(body.comments || "").trim() || null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "self_assessment", body.id)
    return NextResponse.json({ success: true, review: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit self-assessment")
  }
}
