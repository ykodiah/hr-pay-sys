/**
 * GET /api/employees/meta?company_id=
 * Company org structure + payroll allowance/deduction catalogs for the employee form.
 * Always tenant-scoped via resolveTenantContext (service role + membership check).
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { extractOrgOptions } from "@/lib/employees/form-mapper"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, demo } = ctx

    const [{ data: company }, { data: settings }, { data: subsidiaries }] = await Promise.all([
      service.from("companies").select("*").eq("id", companyId).maybeSingle(),
      service.from("company_settings").select("settings_data").eq("company_id", companyId).maybeSingle(),
      service.from("subsidiaries").select("*").eq("company_id", companyId).eq("status", "active"),
    ])

    const settingsData = (settings?.settings_data as any) || {}
    const org = extractOrgOptions(company, settingsData, { allowDemoFallback: Boolean(demo) })

    const { data: people } = await service
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

    // Catalog from THIS tenant only — never seed defaults
    const { data: allowances } = await service
      .from("payroll_allowances")
      .select("id, code, description, taxable, recurring, amount, percentage, type, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("code")

    const { data: deductions } = await service
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
    return jsonError(err, "Failed to load employee meta")
  }
}
