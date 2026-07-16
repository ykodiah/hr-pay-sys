import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { buildOrgChartData, buildPreviewSvg, hashEmployeeSet } from "@/lib/org-chart/builder"
import { fetchAllOrgEmployees } from "@/lib/org-chart/fetch-employees"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const client = await createClient()
    const format = new URL(req.url).searchParams.get("format")

    const { data, error } = await client.from("organizational_charts").select("*").eq("id", id).single()
    if (error || !data) return NextResponse.json({ error: "Chart not found" }, { status: 404 })

    if (format === "json") {
      return NextResponse.json(data.chart_data, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="org-chart-${id.slice(0, 8)}.json"`,
        },
      })
    }

    if (format === "csv") {
      const nodes = (data.chart_data as any)?.nodes ?? []
      const edges = (data.chart_data as any)?.edges ?? []
      const parentByTarget = new Map<string, string>()
      for (const e of edges) parentByTarget.set(e.target, e.source)
      const labelById = new Map(nodes.map((n: any) => [n.id, n.label]))
      const header = "Employee,Position,Department,Type,Employee Code,Reports To"
      const rows = nodes.map((n: any) => {
        const reportsTo = parentByTarget.get(n.id)
        const manager = reportsTo ? labelById.get(reportsTo) || reportsTo : ""
        return `"${n.label}","${n.position || ""}","${n.department || ""}","${n.type}","${n.employeeCode || ""}","${manager}"`
      })
      const csv = "\uFEFF" + [header, ...rows].join("\n")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="org-chart-${id.slice(0, 8)}.csv"`,
        },
      })
    }

    if (format === "svg") {
      const svgDataUrl =
        data.preview_image || buildPreviewSvg((data.chart_data as any) || { nodes: [], edges: [], layout: { columns: 1, rows: 1, width: 640, height: 360 }, style: data.chart_style, type: data.chart_type, scope: data.scope || "all", generated_at: new Date().toISOString() }, data.name)
      const b64 = svgDataUrl.replace(/^data:image\/svg\+xml;base64,/, "")
      const svg = Buffer.from(b64, "base64").toString("utf8")
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="org-chart-${id.slice(0, 8)}.svg"`,
        },
      })
    }

    return NextResponse.json({ success: true, chart: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const client = await createClient()
    const body = await req.json()

    if (body.action === "activate") {
      const { data: chart } = await client.from("organizational_charts").select("*").eq("id", id).single()
      if (!chart) return NextResponse.json({ error: "Chart not found" }, { status: 404 })

      let deactivate = client
        .from("organizational_charts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("company_id", chart.company_id)
        .eq("is_active", true)
      if (chart.subsidiary_id) deactivate = deactivate.eq("subsidiary_id", chart.subsidiary_id)
      else deactivate = deactivate.is("subsidiary_id", null)
      await deactivate

      const { data, error } = await client
        .from("organizational_charts")
        .update({
          is_active: true,
          updated_by: user.isDemo ? null : user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, chart: data })
    }

    if (body.action === "regenerate") {
      const { data: chart } = await client.from("organizational_charts").select("*").eq("id", id).single()
      if (!chart) return NextResponse.json({ error: "Chart not found" }, { status: 404 })

      const { employees, error: empErr } = await fetchAllOrgEmployees(client, chart.company_id)
      if (empErr) return NextResponse.json({ error: empErr }, { status: 500 })

      const scope =
        chart.scope ||
        (chart.chart_data as any)?.scope ||
        chart.subsidiary_id ||
        "all"
      const chartData = buildOrgChartData(employees, {
        chartType: chart.chart_type,
        chartStyle: chart.chart_style,
        scope,
      })
      const preview = buildPreviewSvg(chartData, chart.name)

      const { data, error } = await client
        .from("organizational_charts")
        .update({
          scope,
          chart_data: chartData,
          preview_image: preview,
          source_employee_count: chartData.nodes.length,
          source_hash: hashEmployeeSet(employees),
          updated_by: user.isDemo ? null : user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, chart: data })
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.isDemo ? null : user.id,
    }
    for (const key of ["name", "description", "chart_type", "chart_style", "is_active", "scope"]) {
      if (body[key] !== undefined) patch[key] = body[key]
    }

    const { data, error } = await client
      .from("organizational_charts")
      .update(patch)
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, chart: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const client = await createClient()
    const { error } = await client.from("organizational_charts").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
