import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const includeInactive = request.nextUrl.searchParams.get("include_inactive") === "true"
    let query = ctx.service
      .from("attendance_geofences")
      .select("*")
      .eq("company_id", ctx.companyId)
      .order("name")
    if (!includeInactive) query = query.eq("is_active", true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json({ geofences: data || [] })
  } catch (err) {
    return jsonError(err, "Failed to load geofences")
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

    if (!body.name || body.latitude == null || body.longitude == null) {
      return NextResponse.json({ error: "name, latitude, longitude required" }, { status: 400 })
    }

    const row = {
      company_id: ctx.companyId,
      name: String(body.name).trim(),
      location_label: body.location_label || null,
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      radius_meters: Math.max(25, Math.floor(Number(body.radius_meters ?? 150))),
      is_active: body.is_active !== false,
      enforce_on_clock_in: body.enforce_on_clock_in !== false,
      enforce_on_clock_out: Boolean(body.enforce_on_clock_out),
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (body.id) {
      const { data, error } = await ctx.service
        .from("attendance_geofences")
        .update(row)
        .eq("id", body.id)
        .eq("company_id", ctx.companyId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ geofence: data })
    }

    const { data, error } = await ctx.service.from("attendance_geofences").insert(row).select().single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ geofence: data }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to save geofence")
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
    const { error } = await ctx.service
      .from("attendance_geofences")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", ctx.companyId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError(err, "Failed to deactivate geofence")
  }
}
