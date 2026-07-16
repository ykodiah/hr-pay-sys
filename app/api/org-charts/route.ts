/**
 * GET  /api/org-charts?company_id=&subsidiary_id=
 * POST /api/org-charts  — generate and optionally save
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { buildOrgChartData, buildPreviewSvg, hashEmployeeSet } from "@/lib/org-chart/builder"
import { fetchAllOrgEmployees } from "@/lib/org-chart/fetch-employees"

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

    const [{ data: subsidiaries }, empResult] = await Promise.all([
      client.from("subsidiaries").select("id, name, status").eq("company_id", companyId).eq("status", "active"),
      fetchAllOrgEmployees(client, companyId),
    ])
    if (empResult.error) return NextResponse.json({ error: empResult.error }, { status: 500 })

    const currentHash = hashEmployeeSet(empResult.employees)
    const charts = (data ?? []).map((chart) => ({
      ...chart,
      is_stale: Boolean(chart.source_hash && chart.source_hash !== currentHash),
    }))

    return NextResponse.json({
      success: true,
      charts,
      subsidiaries: subsidiaries ?? [],
      employee_count: empResult.employees.length,
      company_id: companyId,
      source_hash: currentHash,
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
    const { employees, error: empErr } = await fetchAllOrgEmployees(client, companyId)
    if (empErr) return NextResponse.json({ error: empErr }, { status: 500 })

    const chartData = buildOrgChartData(employees, {
      chartType: body.chart_type,
      chartStyle: body.chart_style,
      scope,
    })
    const preview = buildPreviewSvg(chartData, body.name)
    const sourceHash = hashEmployeeSet(employees)

    if (body.save === false) {
      return NextResponse.json({
        success: true,
        preview: true,
        chart_data: chartData,
        preview_image: preview,
        source_employee_count: chartData.nodes.length,
        source_hash: sourceHash,
        scope,
      })
    }

    const subsidiaryId = scope === "all" || scope === "parent" ? null : scope
    const payload = {
      company_id: companyId,
      subsidiary_id: subsidiaryId,
      scope,
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
