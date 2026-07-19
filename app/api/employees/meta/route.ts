/**
 * GET /api/employees/meta?company_id=
 * Company org structure + payroll allowance/deduction catalogs for the employee form.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { extractOrgOptions } from "@/lib/employees/form-mapper"

const DEFAULT_ALLOWANCES = [
  { code: "TRANS", description: "Transport Allowance", taxable: true, recurring: true, amount: 0, percentage: 0 },
  { code: "HOUSE", description: "Housing Allowance", taxable: true, recurring: true, amount: 0, percentage: 0 },
  { code: "MED", description: "Medical Allowance", taxable: false, recurring: true, amount: 0, percentage: 0 },
  { code: "MEAL", description: "Meal Allowance", taxable: false, recurring: true, amount: 0, percentage: 0 },
  { code: "UNIFORM", description: "Uniform Allowance", taxable: false, recurring: true, amount: 0, percentage: 0 },
  { code: "COMM", description: "Communication Allowance", taxable: false, recurring: true, amount: 0, percentage: 0 },
]

const DEFAULT_DEDUCTIONS = [
  { code: "TAX", description: "Tax Deduction", taxable: false, recurring: true, amount: 0, percentage: 0 },
  { code: "SSNIT", description: "SSNIT Deduction", taxable: false, recurring: true, amount: 0, percentage: 5.5 },
  { code: "TIER3", description: "Tier 3 Contribution", taxable: false, recurring: true, amount: 0, percentage: 5 },
  { code: "LOAN", description: "Loan Deduction", taxable: false, recurring: true, amount: 0, percentage: 0 },
  { code: "ADVANCE", description: "Advance Deduction", taxable: false, recurring: true, amount: 0, percentage: 0 },
]

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    let companyId = new URL(req.url).searchParams.get("company_id")
    const resolved = await resolveCompanyId(
      client,
      user.isDemo ? null : user.id,
      user.isDemo ? null : user,
    )
    if (!companyId) {
      companyId = resolved?.companyId ?? null
    } else if (resolved?.companyId && companyId !== resolved.companyId) {
      return NextResponse.json(
        { error: "company_id does not belong to the authenticated user" },
        { status: 403 },
      )
    }
    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "Unable to resolve company for this user. Open Company settings and save your company, or set company_id on the user profile.",
        },
        { status: 400 },
      )
    }

    const [{ data: company }, { data: settings }, { data: subsidiaries }] = await Promise.all([
      client.from("companies").select("*").eq("id", companyId).maybeSingle(),
      client.from("company_settings").select("settings_data").eq("company_id", companyId).maybeSingle(),
      client.from("subsidiaries").select("*").eq("company_id", companyId).eq("status", "active"),
    ])

    const settingsData = (settings?.settings_data as any) || {}
    const org = extractOrgOptions(company, settingsData)

    let { data: allowances } = await client
      .from("payroll_allowances")
      .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code")

    let { data: deductions } = await client
      .from("payroll_deductions")
      .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code")

    // Seed defaults when company has no payroll catalog yet
    if (!allowances?.length) {
      const seed = DEFAULT_ALLOWANCES.map((a) => ({ ...a, company_id: companyId, type: "FIXED", is_active: true }))
      await client.from("payroll_allowances").upsert(seed, { onConflict: "company_id,code" })
      const again = await client
        .from("payroll_allowances")
        .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code")
      allowances = again.data
    }

    if (!deductions?.length) {
      const seed = DEFAULT_DEDUCTIONS.map((d) => ({ ...d, company_id: companyId, type: "FIXED", is_active: true }))
      await client.from("payroll_deductions").upsert(seed, { onConflict: "company_id,code" })
      const again = await client
        .from("payroll_deductions")
        .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code")
      deductions = again.data
    }

    return NextResponse.json({
      success: true,
      company_id: companyId,
      company: company
        ? {
            id: company.id,
            name: company.name,
            divisions: org.divisions,
            departments: org.departments,
            locations: org.locations,
          }
        : null,
      divisions: org.divisions,
      departments: org.departments,
      locations: org.locations,
      subsidiaries: subsidiaries ?? [],
      allowances: allowances ?? [],
      deductions: deductions ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
