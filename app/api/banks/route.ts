/**
 * GET /api/banks?company_id=
 * Returns default Ghanaian banks + company custom_banks (active).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

export const dynamic = "force-dynamic"

const GHANAIAN_BANKS = [
  "Access Bank",
  "Agricultural Development Bank",
  "Bank of Africa",
  "CalBank",
  "Consolidated Bank Ghana",
  "Ecobank Ghana",
  "Fidelity Bank Ghana",
  "First Atlantic Bank",
  "First National Bank Ghana Limited",
  "GCB Bank Limited",
  "Guaranty Trust Bank Ghana",
  "National Investment Bank",
  "OmniBSIC Bank",
  "Prudential Bank Ghana",
  "Republic Bank Ghana",
  "Societe Generale Ghana",
  "Stanbic Bank Ghana",
  "Standard Chartered Bank Ghana",
  "United Bank for Africa Ghana",
  "Zenith Bank Ghana",
]

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client: any = await db()
    const authClient = await createClient()
    let companyId =
      new URL(req.url).searchParams.get("company_id") ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      null

    let custom: string[] = []
    if (companyId) {
      const { data } = await client
        .from("custom_banks")
        .select("bank_name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("bank_name")
      custom = (data ?? []).map((b: any) => String(b.bank_name || "").trim()).filter(Boolean)
    }

    const banks = [...new Set([...GHANAIAN_BANKS, ...custom])].sort((a, b) =>
      a.localeCompare(b),
    )

    return NextResponse.json({ success: true, banks, company_id: companyId })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load banks" },
      { status: 500 },
    )
  }
}
