// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isDemoMode } from "@/lib/demo/memory-db"

export type TenantContext = {
  companyId: string
  userId: string | null
  demo: boolean
  service: ReturnType<typeof createServiceClient>
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Resolve the tenant company for settings API routes.
 * Uses service-role for DB IO (same pattern as /api/settings/tax) so RLS
 * cannot silently reject tenant admin writes.
 */
export async function resolveTenantContext(
  req: NextRequest,
  companyIdFromClient?: string | null,
): Promise<TenantContext | NextResponse> {
  const demo = isDemoMode()
  const service = createServiceClient()

  let userId: string | null = null
  if (!demo) {
    try {
      const authClient = await createClient()
      const {
        data: { user },
      } = await authClient.auth.getUser()
      userId = user?.id ?? null
    } catch {
      userId = null
    }
  } else {
    userId = "demo-user"
  }

  let companyId = (companyIdFromClient || "").trim()

  if (!companyId) {
    const { searchParams } = new URL(req.url)
    companyId = (searchParams.get("company_id") || "").trim()
  }

  if (!companyId && userId && !demo) {
    try {
      const { data: rpcId } = await service.rpc("get_current_user_company_id")
      if (typeof rpcId === "string" && rpcId) companyId = rpcId
    } catch {
      // optional RPC
    }
  }

  if (!companyId) {
    const { data: company } = await service
      .from("companies")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    companyId = company?.id || (demo ? "demo-company-001" : "")
  }

  if (!companyId) {
    return badRequest("company_id is required")
  }

  return { companyId, userId, demo, service }
}

export function jsonError(err: unknown, fallback = "Request failed") {
  const message = err instanceof Error ? err.message : fallback
  return NextResponse.json({ error: message }, { status: 500 })
}

export function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch {
      if (value.includes(";")) return value.split(";").map((s) => s.trim()).filter(Boolean)
      if (value.includes(",")) return value.split(",").map((s) => s.trim()).filter(Boolean)
      return value ? [value] : []
    }
  }
  return []
}
