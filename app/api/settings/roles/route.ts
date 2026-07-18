// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function mapRole(row: any, userCount = 0) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || "",
    permissions: Array.isArray(row.permissions) ? row.permissions : ensureArray(row.permissions),
    user_count: userCount,
    code: row.code || null,
    level: row.level ?? 1,
    is_system_role: !!row.is_system_role,
    is_active: row.is_active !== false,
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { data: roles, error } = await service
      .from("roles")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    if (error) throw error

    const roleIds = (roles || []).map((r) => r.id)
    let counts: Record<string, number> = {}
    if (roleIds.length) {
      const { data: assignments } = await service
        .from("user_roles")
        .select("role_id")
        .in("role_id", roleIds)
        .eq("is_active", true)
      counts = (assignments || []).reduce<Record<string, number>>((acc, row) => {
        acc[row.role_id] = (acc[row.role_id] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({
      roles: (roles || []).map((r) => mapRole(r, counts[r.id] || 0)),
    })
  } catch (err) {
    return jsonError(err, "Failed to load roles")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const now = new Date().toISOString()
    const action = body.action || "save"

    if (action === "save" || action === "create" || action === "update") {
      const role = body.role || body
      const code =
        role.code ||
        String(role.name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")

      const row = {
        company_id: companyId,
        name: role.name,
        description: role.description || "",
        code,
        level: Number(role.level || 1),
        permissions: Array.isArray(role.permissions) ? role.permissions : ensureArray(role.permissions),
        is_system_role: !!role.is_system_role,
        is_active: role.is_active !== false,
        updated_at: now,
        created_by: userId,
      }

      if (role.id && !String(role.id).startsWith("temp-") && !String(role.id).startsWith("role-")) {
        const { data, error } = await service
          .from("roles")
          .update(row)
          .eq("id", role.id)
          .eq("company_id", companyId)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, role: mapRole(data) })
      }

      const { data, error } = await service.from("roles").insert({ ...row, created_at: now }).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, role: mapRole(data) })
    }

    if (action === "delete") {
      const { error } = await service.from("roles").delete().eq("id", body.id).eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save role")
  }
}
