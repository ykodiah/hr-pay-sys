import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const employeeId = request.nextUrl.searchParams.get("employee_id")
    let query = ctx.service
      .from("employee_shift_assignments")
      .select("*, shift:shifts(*), employee:employees(id, first_name, last_name, employee_id, department)")
      .eq("company_id", ctx.companyId)
      .order("effective_from", { ascending: false })

    if (employeeId) query = query.eq("employee_id", employeeId)

    const { data, error } = await query
    if (error) {
      // Fallback without embeds
      const fb = await ctx.service
        .from("employee_shift_assignments")
        .select("*")
        .eq("company_id", ctx.companyId)
        .order("effective_from", { ascending: false })
      if (fb.error) throw new Error(fb.error.message)
      return NextResponse.json({ assignments: fb.data || [] })
    }
    return NextResponse.json({ assignments: data || [] })
  } catch (err) {
    return jsonError(err, "Failed to load shift assignments")
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

    if (!body.employee_id || !body.shift_id) {
      return NextResponse.json({ error: "employee_id and shift_id required" }, { status: 400 })
    }

    // Clear other primary flags when setting primary
    if (body.is_primary !== false) {
      await ctx.service
        .from("employee_shift_assignments")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("company_id", ctx.companyId)
        .eq("employee_id", body.employee_id)
    }

    const row = {
      company_id: ctx.companyId,
      employee_id: body.employee_id,
      shift_id: body.shift_id,
      effective_from: body.effective_from || new Date().toISOString().slice(0, 10),
      effective_to: body.effective_to || null,
      is_primary: body.is_primary !== false,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (body.id) {
      const { data, error } = await ctx.service
        .from("employee_shift_assignments")
        .update(row)
        .eq("id", body.id)
        .eq("company_id", ctx.companyId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ assignment: data })
    }

    const { data, error } = await ctx.service
      .from("employee_shift_assignments")
      .insert(row)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ assignment: data }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to save shift assignment")
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
      .from("employee_shift_assignments")
      .delete()
      .eq("id", id)
      .eq("company_id", ctx.companyId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError(err, "Failed to delete assignment")
  }
}
