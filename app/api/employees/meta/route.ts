/**
 * GET /api/employees/meta?company_id=
 * Company org structure + payroll allowance/deduction catalogs for the employee form.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { extractOrgOptions } from "@/lib/employees/form-mapper"

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
    const org = extractOrgOptions(company, settingsData, { allowDemoFallback: Boolean(user.isDemo) })

    // Supervisors / HODs from this tenant's employees only
    const { data: people } = await client
      .from("employees")
      .select("id, first_name, last_name, full_name, display_name, department, special_role, position, status")
      .eq("company_id", companyId)
      .order("first_name", { ascending: true })
      .limit(2000)

    const activePeople = (people || []).filter((p) => {
      const s = String(p.status || "").toLowerCase()
      return !s || s === "active"
    })

    const supervisors = activePeople.filter((p) => {
      const role = `${p.special_role || ""} ${p.position || ""}`.toLowerCase()
      return (
        role.includes("supervisor") ||
        role.includes("manager") ||
        role.includes("lead") ||
        role.includes("admin") ||
        role.includes("hr")
      )
    })
    const heads = activePeople.filter((p) => {
      const role = `${p.special_role || ""} ${p.position || ""}`.toLowerCase()
      return (
        role.includes("head") ||
        role.includes("hod") ||
        role.includes("director") ||
        role.includes("admin") ||
        role.includes("ceo")
      )
    })

    // Catalog is tenant-owned — never auto-seed predefined allowances/deductions.
    // Configure them in Settings → Payroll.
    const { data: allowances } = await client
      .from("payroll_allowances")
      .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code")

    const { data: deductions } = await client
      .from("payroll_deductions")
      .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code")

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
      supervisors: supervisors.map((p) => ({
        id: p.id,
        name: p.display_name || p.full_name || `${p.first_name} ${p.last_name}`.trim(),
        department: p.department,
        special_role: p.special_role,
        position: p.position,
      })),
      heads_of_department: heads.map((p) => ({
        id: p.id,
        name: p.display_name || p.full_name || `${p.first_name} ${p.last_name}`.trim(),
        department: p.department,
        special_role: p.special_role,
        position: p.position,
      })),
      employees: activePeople.map((p) => ({
        id: p.id,
        name: p.display_name || p.full_name || `${p.first_name} ${p.last_name}`.trim(),
        department: p.department,
        special_role: p.special_role,
        position: p.position,
      })),
      allowances: allowances ?? [],
      deductions: deductions ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
