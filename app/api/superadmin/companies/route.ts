import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"

/** List companies for tenant assignment in the superadmin portal. */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = getSuperadminDb()
    const { data: companies, error } = await client
      .from("companies")
      .select("id, name, email_address, industry, created_at")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error

    const { data: linked } = await client
      .from("superadmin_tenants")
      .select("id, name, company_id")
      .not("company_id", "is", null)

    const linkedMap = new Map((linked || []).map((t) => [t.company_id, t]))

    return NextResponse.json({
      companies: (companies || []).map((c) => ({
        ...c,
        linked_tenant: linkedMap.get(c.id)
          ? { id: linkedMap.get(c.id)!.id, name: linkedMap.get(c.id)!.name }
          : null,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
