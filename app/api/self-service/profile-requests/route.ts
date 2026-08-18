import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"
import { coerceFieldValue, fieldLabel } from "@/lib/employees/audit-fields"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Fields an employee may REQUEST a change to. HR reviews and applies these
 * through the governed update path, so the audit trail stays intact.
 */
const REQUESTABLE = [
  "first_name",
  "other_names",
  "last_name",
  "date_of_birth",
  "gender",
  "marital_status",
  "ghana_card_number",
  "educational_level",
  "corporate_email",
] as const

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { data, error } = await session.db
      .from("employee_profile_change_requests")
      .select("*")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) throw new Error(error.message)
    return NextResponse.json({ requests: data || [], requestable_fields: REQUESTABLE })
  } catch (err) {
    return portalJsonError(err, "Failed to load change requests")
  }
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const incoming = body.changes || {}
    const changes: Record<string, { label: string; from: any; to: any }> = {}

    for (const field of REQUESTABLE) {
      if (incoming[field] === undefined) continue
      const next = coerceFieldValue(field, incoming[field])
      const current = session.employee[field] ?? null
      if (String(next ?? "") === String(current ?? "")) continue
      changes[field] = { label: fieldLabel(field), from: current, to: next }
    }

    if (!Object.keys(changes).length) {
      return NextResponse.json({ error: "No changes were requested" }, { status: 400 })
    }

    const { data: pending } = await session.db
      .from("employee_profile_change_requests")
      .select("id")
      .eq("employee_id", session.employeeId)
      .eq("status", "pending")
      .limit(1)

    if (pending && pending.length) {
      return NextResponse.json(
        { error: "You already have a change request awaiting HR review" },
        { status: 409 },
      )
    }

    const { data, error } = await session.db
      .from("employee_profile_change_requests")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        requested_by: session.user.id,
        changes,
        employee_note: String(body.note || "").trim() || null,
        status: "pending",
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "profile_change_request", Object.keys(changes).join(", "))

    return NextResponse.json({ success: true, request: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit change request")
  }
}

/** PATCH — employee withdraws their own pending request. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Request id is required" }, { status: 400 })

    const { data, error } = await session.db
      .from("employee_profile_change_requests")
      .update({ status: "withdrawn" })
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("status", "pending")
      .select("*")
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: "Pending request not found" }, { status: 404 })

    return NextResponse.json({ success: true, request: data })
  } catch (err) {
    return portalJsonError(err, "Failed to withdraw request")
  }
}
