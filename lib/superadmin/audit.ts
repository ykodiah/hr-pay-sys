import { createClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  tenantId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    const client = await createClient()
    await client.from("superadmin_audit_logs").insert({
      superadmin_user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      tenant_id: entry.tenantId,
      changes: entry.changes || null,
      ip_address: entry.ipAddress || "unknown",
      user_agent: entry.userAgent || "unknown",
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[v0] Audit log error:", err)
  }
}

export async function getAuditLogs(filters?: {
  userId?: string
  resourceType?: string
  action?: string
  limit?: number
  offset?: number
}) {
  try {
    const client = await createClient()
    let query = client
      .from("superadmin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters?.userId) query = query.eq("superadmin_user_id", filters.userId)
    if (filters?.resourceType) query = query.eq("resource_type", filters.resourceType)
    if (filters?.action) query = query.eq("action", filters.action)

    const limit = filters?.limit || 100
    const offset = filters?.offset || 0

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error
    return data
  } catch (err) {
    console.error("[v0] Get audit logs error:", err)
    return []
  }
}
