import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  listAlertSchedules,
  upsertAlertSchedule,
  runDueAlertSchedules,
} from "@/lib/services/attendance-alert-schedule-service"

/** GET /api/attendance/alerts/schedules */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const schedules = await listAlertSchedules(ctx.companyId)
    return NextResponse.json({ schedules })
  } catch (err) {
    return jsonError(err, "Failed to load alert schedules")
  }
}

/** POST /api/attendance/alerts/schedules — create/update or run now */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    if (body.action === "run_now") {
      const result = await runDueAlertSchedules({
        companyId: ctx.companyId,
        force: true,
        scheduleId: body.schedule_id || undefined,
      })
      return NextResponse.json({ success: true, ...result })
    }

    const schedule = await upsertAlertSchedule({
      companyId: ctx.companyId,
      id: body.id,
      name: body.name,
      frequency: body.frequency,
      run_hour: body.run_hour,
      lookback_days: body.lookback_days,
      is_active: body.is_active,
    })
    return NextResponse.json({ schedule }, { status: body.id ? 200 : 201 })
  } catch (err) {
    return jsonError(err, "Failed to save alert schedule")
  }
}

/** PATCH — toggle / update fields */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const schedule = await upsertAlertSchedule({
      companyId: ctx.companyId,
      id: body.id,
      name: body.name,
      frequency: body.frequency,
      run_hour: body.run_hour,
      lookback_days: body.lookback_days,
      is_active: body.is_active,
    })
    return NextResponse.json({ schedule })
  } catch (err) {
    return jsonError(err, "Failed to update schedule")
  }
}

/** DELETE soft-deactivate */
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const schedule = await upsertAlertSchedule({
      companyId: ctx.companyId,
      id,
      is_active: false,
    })
    return NextResponse.json({ success: true, schedule })
  } catch (err) {
    return jsonError(err, "Failed to deactivate schedule")
  }
}
