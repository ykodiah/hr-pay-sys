import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { listDevices, saveDevice } from "@/lib/services/attendance-ops-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const devices = await listDevices(ctx.companyId)
    return NextResponse.json({ devices })
  } catch (err) {
    return jsonError(err, "Failed to load devices")
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

    if (body.action === "sync" && body.id) {
      const { createServiceClient } = await import("@/lib/supabase/server")
      const service = await createServiceClient()
      const { data, error } = await service
        .from("biometric_devices")
        .update({
          last_sync: new Date().toISOString(),
          status: "online",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .eq("company_id", ctx.companyId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ device: data, message: "Device sync timestamp updated" })
    }

    const device = await saveDevice(ctx.companyId, body, body.id)
    return NextResponse.json({ device }, { status: body.id ? 200 : 201 })
  } catch (err) {
    return jsonError(err, "Failed to save device")
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
    const { createServiceClient } = await import("@/lib/supabase/server")
    const service = await createServiceClient()
    const { error } = await service
      .from("biometric_devices")
      .update({ is_active: false, status: "offline", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", ctx.companyId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError(err, "Failed to deactivate device")
  }
}
