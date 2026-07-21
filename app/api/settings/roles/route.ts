// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

function isMissingRelation(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  )
}

function isColumnError(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "PGRST204" ||
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  )
}

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
    if (error) {
      if (isMissingRelation(error)) return NextResponse.json({ roles: [] })
      throw error
    }

    const roleIds = (roles || []).map((r) => r.id)
    let counts: Record<string, number> = {}
    if (roleIds.length) {
      const { data: assignments, error: assignError } = await service
        .from("user_roles")
        .select("role_id")
        .in("role_id", roleIds)
        .eq("is_active", true)
      if (!assignError) {
        counts = (assignments || []).reduce<Record<string, number>>((acc, row) => {
          acc[row.role_id] = (acc[row.role_id] || 0) + 1
          return acc
        }, {})
      } else if (!isMissingRelation(assignError) && !isColumnError(assignError)) {
        throw assignError
      }
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

      if (!String(role.name || "").trim()) {
        return NextResponse.json({ error: "Role name is required" }, { status: 400 })
      }

      const row = {
        company_id: companyId,
        name: String(role.name).trim(),
        description: role.description || "",
        code,
        level: Number(role.level || 1),
        permissions: Array.isArray(role.permissions) ? role.permissions : ensureArray(role.permissions),
        is_system_role: !!role.is_system_role,
        is_active: role.is_active !== false,
        updated_at: now,
        created_by: userId,
      }

      const persistRole = async (mode: "update" | "insert") => {
        // Drop optional columns progressively if the schema is older.
        const attempts = [
          row,
          (({ created_by, is_system_role, ...rest }) => rest)(row),
          (({ created_by, is_system_role, level, code, ...rest }) => rest)(row),
        ]
        let lastError: any = null
        for (const attempt of attempts) {
          const query =
            mode === "update"
              ? service.from("roles").update(attempt).eq("id", role.id).eq("company_id", companyId)
              : service.from("roles").insert({ ...attempt, created_at: now })
          const { data, error } = await query.select().single()
          if (!error) return data
          lastError = error
          if (isColumnError(error)) continue
          throw error
        }
        throw lastError || new Error("Failed to save role")
      }

      if (isUuid(role.id)) {
        const data = await persistRole("update")
        return NextResponse.json({ success: true, role: mapRole(data) })
      }

      try {
        const data = await persistRole("insert")
        return NextResponse.json({ success: true, role: mapRole(data) })
      } catch (error: any) {
        // Unique (company_id, name) — update the existing role instead.
        if (String(error.message || "").toLowerCase().includes("duplicate") || error.code === "23505") {
          const { data: existing } = await service
            .from("roles")
            .select("id")
            .eq("company_id", companyId)
            .eq("name", row.name)
            .maybeSingle()
          if (existing?.id) {
            role.id = existing.id
            const data = await persistRole("update")
            return NextResponse.json({ success: true, role: mapRole(data) })
          }
        }
        throw error
      }
    }

    if (action === "delete") {
      if (!isUuid(body.id)) {
        return NextResponse.json({ error: "Valid role id required" }, { status: 400 })
      }
      const { error } = await service.from("roles").delete().eq("id", body.id).eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save role")
  }
}
