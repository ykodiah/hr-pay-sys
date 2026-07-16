/**
 * GET /api/employees/next-id?company_id=&prefix=
 * Peeks the next sequential employee_id (does not reserve).
 * Allocation is finalized when the employee is created.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

function buildPrefix(raw: string | null): string {
  const cleaned = String(raw || "EMP")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  if (cleaned.length >= 4) return cleaned.slice(0, 4)
  return cleaned.padEnd(4, "X")
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const sp = new URL(req.url).searchParams
    let companyId = sp.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const prefix = buildPrefix(sp.get("prefix"))

    const { data: rows, error } = await client
      .from("employees")
      .select("employee_id")
      .eq("company_id", companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let max = 0
    for (const row of rows ?? []) {
      const code = String(row.employee_id || "")
      if (!code.startsWith(prefix)) continue
      const suffix = code.slice(prefix.length)
      if (!/^\d+$/.test(suffix)) continue
      const num = Number(suffix)
      if (Number.isFinite(num) && num > max) max = num
    }

    // Also consider sequence table if present (without incrementing)
    const { data: seq } = await client
      .from("employee_id_sequences")
      .select("last_number")
      .eq("company_id", companyId)
      .eq("prefix", prefix)
      .maybeSingle()

    if (seq?.last_number != null && Number(seq.last_number) > max) {
      max = Number(seq.last_number)
    }

    const next = `${prefix}${String(max + 1).padStart(4, "0")}`
    return NextResponse.json({
      success: true,
      employee_id: next,
      prefix,
      next_number: max + 1,
      source: "peek",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate employee id" },
      { status: 500 },
    )
  }
}
