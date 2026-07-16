/**
 * GET  /api/org-charts?company_id=&subsidiary_id=
 * POST /api/org-charts  — generate and optionally save
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { ACTIVE_EMPLOYEE_STATUSES } from "@/lib/employees/status"
import { buildOrgChartData, buildPreviewSvg, hashEmployeeSet } from "@/lib/org-chart/builder"

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
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    let query = client
      .from("organizational_charts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    const subsidiaryId = sp.get("subsidiary_id")
    if (subsidiaryId && subsidiaryId !== "all") query = query.eq("subsidiary_id", subsidiaryId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const [{ data: subsidiaries }, { data: employees }] = await Promise.all([
      client.from("subsidiaries").select("id, name, status").eq("company_id", companyId).eq("status", "active"),
      client
        .from("employees")
        .select(
          "id, first_name, last_name, full_name, display_name, position, department, subsidiary_id, direct_supervisor, head_of_department, special_role, employee_id",
        )
        .eq("company_id", companyId)
        .in("status", [...ACTIVE_EMPLOYEE_STATUSES]),
    ])

    return NextResponse.json({
      success: true,
      charts: data ?? [],
      subsidiaries: subsidiaries ?? [],
      employees: employees ?? [],
      company_id: companyId,
      meta: { fetched_at: new Date().toISOString() },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const body = await req.json()
    let companyId = body.company_id
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId || !body.name) {
      return NextResponse.json({ error: "company_id and name required" }, { status: 400 })
    }

    const scope = body.scope || body.subsidiary_id || "all"
    const { data: employees, error: empErr } = await client
      .from("employees")
      .select(
        "id, first_name, last_name, full_name, display_name, position, department, subsidiary_id, direct_supervisor, head_of_department, special_role, employee_id",
      )
      .eq("company_id", companyId)
      .in("status", [...ACTIVE_EMPLOYEE_STATUSES])
    if (empErr) return NextResponse.json({ error: empErr.message }, { status: 500 })

    const chartData = buildOrgChartData(employees ?? [], {
      chartType: body.chart_type,
      chartStyle: body.chart_style,
      scope,
    })
    const preview = buildPreviewSvg(chartData, body.name)
    const sourceHash = hashEmployeeSet(employees ?? [])

    if (body.save === false) {
      return NextResponse.json({
        success: true,
        preview: true,
        chart_data: chartData,
        preview_image: preview,
        source_employee_count: chartData.nodes.length,
        source_hash: sourceHash,
      })
    }

    const subsidiaryId = scope === "all" || scope === "parent" ? null : scope
    const payload = {
      company_id: companyId,
      subsidiary_id: subsidiaryId,
      name: body.name,
      description: body.description ?? null,
      chart_type: body.chart_type ?? "hierarchical",
      chart_style: body.chart_style ?? "modern",
      chart_data: chartData,
      preview_image: preview,
      source_employee_count: chartData.nodes.length,
      source_hash: sourceHash,
      is_active: Boolean(body.is_active),
      created_by: user.isDemo ? null : user.id,
      updated_by: user.isDemo ? null : user.id,
      updated_at: new Date().toISOString(),
    }

    if (body.is_active) {
      let deactivate = client
        .from("organizational_charts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("company_id", companyId)
        .eq("is_active", true)
      if (subsidiaryId) deactivate = deactivate.eq("subsidiary_id", subsidiaryId)
      else deactivate = deactivate.is("subsidiary_id", null)
      await deactivate
    }

    const { data, error } = await client.from("organizational_charts").insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, chart: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
