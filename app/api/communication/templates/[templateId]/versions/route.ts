import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { validateTemplateVariables, TemplateVariableDefinition } from "@/lib/communication/templates"

export async function GET(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)
    const templateId = params.templateId
    const searchParams = new URL(request.url).searchParams
    const status = searchParams.get("status") || undefined

    let query = supabase
      .from("communication_template_versions")
      .select("*")
      .match({ template_id: templateId })
      .order("version_number", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    console.error(`[communication/templates/${params.templateId}/versions][GET]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to load template versions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const templateId = params.templateId
    const body = await request.json()

    const { data: templateRow, error: templateError } = await supabase
      .from("communication_templates")
      .select("id, company_id")
      .match({ id: templateId, company_id: companyId })
      .maybeSingle()

    if (templateError) throw templateError
    if (!templateRow) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const { data: latestVersion } = await supabase
      .from("communication_template_versions")
      .select("version_number")
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1
    const status = (body.status as string | undefined)?.trim() || "draft"
    const variables = Array.isArray(body.variables)
      ? (body.variables as TemplateVariableDefinition[])
      : []

    const nowIso = new Date().toISOString()

    const payload: Record<string, unknown> = {
      template_id: templateId,
      version_number: nextVersionNumber,
      status: ["draft", "published", "archived"].includes(status) ? status : "draft",
      subject: body.subject ?? null,
      content_text: body.text ?? null,
      content_html: body.html ?? null,
      preview_json:
        body.preview && typeof body.preview === "object" && !Array.isArray(body.preview)
          ? body.preview
          : {},
      variables,
      metadata:
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? body.metadata
          : {},
      created_by: userId,
      updated_by: userId,
    }

    const finalStatus = payload.status as string | undefined

    if (finalStatus === "published") {
      payload.published_at = nowIso
    }

    const { data: versionRow, error: insertError } = await supabase
      .from("communication_template_versions")
      .insert(payload)
      .select("*")
      .single()

    if (insertError) throw insertError

    if (versionRow.status === "published") {
      await supabase
        .from("communication_template_versions")
        .update({ status: "archived" })
        .match({ template_id: templateId, status: "published" })
        .neq("id", versionRow.id)

      await supabase
        .from("communication_template_versions")
        .update({
          status: "published",
          published_at: (payload.published_at as string | undefined) ?? nowIso,
          updated_by: userId,
        })
        .match({ id: versionRow.id })

      await supabase
        .from("communication_templates")
        .update({ current_version_id: versionRow.id, is_active: true, updated_by: userId })
        .match({ id: templateId, company_id: companyId })
    }

    const validation = validateTemplateVariables(versionRow, versionRow.variables)

    return NextResponse.json({ data: versionRow, warnings: validation }, { status: 201 })
  } catch (error: any) {
    console.error(`[communication/templates/${params.templateId}/versions][POST]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to create template version" },
      { status: 500 }
    )
  }
}

