import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getAuditLogs } from "@/lib/superadmin/audit"

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const searchParams = req.nextUrl.searchParams
    const action = searchParams.get("action") || undefined
    const resourceType = searchParams.get("resourceType") || undefined
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    const logs = await getAuditLogs({
      action,
      resourceType,
      limit,
      offset,
    })

    return NextResponse.json({ logs })
  } catch (err: any) {
    console.error("[v0] Audit GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
