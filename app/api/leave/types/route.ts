import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

const LEAVE_TYPE_FIELDS = [
  "code",
  "name",
  "description",
  "category",
  "entitlement_type",
  "entitlement_amount",
  "max_days_per_year",
  "max_consecutive_days",
  "min_service_months",
  "requires_approval",
  "approval_levels",
  "auto_approve_threshold",
  "min_notice_days",
  "requires_documentation",
  "is_paid",
  "payment_percentage",
  "pay_mode",
  "has_leave_allowance",
  "leave_allowance_type",
  "leave_allowance_amount",
  "leave_allowance_once_per_year",
  "leave_allowance_notes",
  "allow_carry_over",
  "max_carry_over_days",
  "is_active",
] as const

function coerceField(key: string, value: any) {
  switch (key) {
    case "code":
      return String(value || "")
        .trim()
        .toUpperCase()
    case "name":
      return String(value || "").trim()
    case "description":
    case "leave_allowance_notes":
      return value != null ? String(value) : null
    case "category":
      return value || "general"
    case "entitlement_type":
      return value || "annual"
    case "pay_mode": {
      const m = String(value || "prorate").toLowerCase()
      return m === "full_salary" ? "full_salary" : "prorate"
    }
    case "leave_allowance_type": {
      const t = String(value || "fixed").toLowerCase()
      if (t === "days_of_pay" || t === "percent_monthly") return t
      return "fixed"
    }
    case "entitlement_amount":
    case "max_days_per_year":
    case "max_carry_over_days":
    case "payment_percentage":
    case "auto_approve_threshold":
    case "leave_allowance_amount":
      return value == null || value === "" ? null : Number(value)
    case "max_consecutive_days":
    case "min_service_months":
    case "min_notice_days":
    case "approval_levels":
      return value == null || value === "" ? null : Math.max(0, Math.floor(Number(value)))
    case "requires_approval":
    case "requires_documentation":
    case "is_paid":
    case "allow_carry_over":
    case "is_active":
    case "has_leave_allowance":
    case "leave_allowance_once_per_year":
      return Boolean(value)
    default:
      return value
  }
}

/** Full create payload — requires code + name. */
function sanitizeCreate(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const key of LEAVE_TYPE_FIELDS) {
    if (body[key] !== undefined) out[key] = coerceField(key, body[key])
  }
  if (!out.code) throw new Error("Leave code is required")
  if (!out.name) throw new Error("Leave name is required")
  out.category = out.category || "general"
  out.entitlement_type = out.entitlement_type || "annual"
  out.entitlement_amount = Number(out.entitlement_amount ?? 0)
  out.requires_approval = out.requires_approval !== false
  out.is_paid = out.is_paid !== false
  out.is_active = out.is_active !== false
  out.allow_carry_over = Boolean(out.allow_carry_over)
  out.max_carry_over_days = Number(out.max_carry_over_days ?? 0)
  out.min_notice_days = Math.max(0, Math.floor(Number(out.min_notice_days ?? 0)))
  out.approval_levels = Math.max(1, Math.floor(Number(out.approval_levels ?? 1)))
  out.payment_percentage = out.is_paid ? Number(out.payment_percentage ?? 100) : 0
  out.pay_mode = out.is_paid ? out.pay_mode || "prorate" : "prorate"
  out.has_leave_allowance = Boolean(out.has_leave_allowance)
  out.leave_allowance_type = out.leave_allowance_type || "fixed"
  out.leave_allowance_amount = Number(out.leave_allowance_amount ?? 0)
  out.leave_allowance_once_per_year = out.leave_allowance_once_per_year !== false
  return out
}

/** Partial update — only provided fields. */
function sanitizePatch(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const key of LEAVE_TYPE_FIELDS) {
    if (body[key] !== undefined) out[key] = coerceField(key, body[key])
  }
  if (out.code !== undefined && !out.code) throw new Error("Leave code is required")
  if (out.name !== undefined && !out.name) throw new Error("Leave name is required")
  return out
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const includeInactive = request.nextUrl.searchParams.get("include_inactive") === "true"
    let query = ctx.service
      .from("leave_types")
      .select("*")
      .eq("company_id", ctx.companyId)
      .order("name")

    if (!includeInactive) query = query.eq("is_active", true)

    const { data, error } = await query
    if (error) {
      if (/does not exist/i.test(error.message)) return NextResponse.json({ leave_types: [] })
      throw new Error(error.message)
    }
    return NextResponse.json({ leave_types: data || [], company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load leave types")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const payload = sanitizeCreate(body)
    const full = {
      ...payload,
      company_id: ctx.companyId,
      updated_at: new Date().toISOString(),
    }

    let { data, error } = await ctx.service.from("leave_types").insert(full).select().single()

    // Fallback for older schemas missing optional columns
    if (error && /column|does not exist/i.test(error.message)) {
      const minimal = {
        company_id: ctx.companyId,
        code: payload.code,
        name: payload.name,
        category: payload.category || "general",
        entitlement_type: payload.entitlement_type || "annual",
        entitlement_amount: payload.entitlement_amount ?? 0,
        is_paid: payload.is_paid !== false,
        requires_approval: payload.requires_approval !== false,
        is_active: payload.is_active !== false,
      }
      ;({ data, error } = await ctx.service.from("leave_types").insert(minimal).select().single())
    }

    if (error) {
      if (/unique|duplicate/i.test(error.message)) {
        return NextResponse.json({ error: "A leave type with this code already exists" }, { status: 409 })
      }
      throw new Error(error.message)
    }
    return NextResponse.json({ leave_type: data, company_id: ctx.companyId }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to create leave type")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const payload = sanitizePatch(body)
    if (!Object.keys(payload).length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    const { data, error } = await ctx.service
      .from("leave_types")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .eq("company_id", ctx.companyId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ leave_type: data })
  } catch (err) {
    return jsonError(err, "Failed to update leave type")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    // Soft-delete
    const { error } = await ctx.service
      .from("leave_types")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", ctx.companyId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError(err, "Failed to deactivate leave type")
  }
}
