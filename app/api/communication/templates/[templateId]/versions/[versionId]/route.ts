import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { validateTemplateVariables, TemplateVariableDefinition } from "@/lib/communication/templates"

export async function GET(_request: NextRequest, { params }: { params: { templateId: string; versionId: string } }) {
  try {
    const supabase = await createClient()
    await getCurrentCompanyId(supabase) // ensures auth context, RLS applied

    const { data, error } = await supabase
      .from("communication_template_versions")
      .select("*")
      .match({ template_id: params.templateId, id: params.versionId })
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    const warnings = validateTemplateVariables(data, data.variables as TemplateVariableDefinition[] | null | undefined)

    return NextResponse.json({ data, warnings })
  } catch (error: any) {
    console.error(
      `[communication/templates/${params.templateId}/versions/${params.versionId}][GET]`,
      error,
    )
    return NextResponse.json(
      { error: error?.message || "Failed to load template version" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { templateId: string; versionId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const body = await request.json()

    const updatePayload: Record<string, unknown> = { updated_by: userId }

    if (body.subject !== undefined) updatePayload.subject = body.subject
    if (body.text !== undefined) updatePayload.content_text = body.text
    if (body.html !== undefined) updatePayload.content_html = body.html
    if (body.preview !== undefined && typeof body.preview === "object" && !Array.isArray(body.preview)) {
      updatePayload.preview_json = body.preview
    }
    if (body.metadata !== undefined && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
      updatePayload.metadata = body.metadata
    }
    if (body.variables !== undefined) {
      updatePayload.variables = Array.isArray(body.variables)
        ? (body.variables as TemplateVariableDefinition[])
        : []
    }
    if (body.status) {
      const status = String(body.status)
      if (["draft", "published", "archived"].includes(status)) {
        updatePayload.status = status
        updatePayload.published_at =
          status === "published" ? new Date().toISOString() : null
      }
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ data: null })
    }

    const { data: versionRow, error: updateError } = await supabase
      .from("communication_template_versions")
      .update(updatePayload)
      .match({ id: params.versionId, template_id: params.templateId })
      .select("*")
      .single()

    if (updateError) throw updateError

    if (versionRow.status === "published") {
      await supabase
        .from("communication_template_versions")
        .update({ status: "archived" })
        .match({ template_id: params.templateId, status: "published" })
        .neq("id", params.versionId)

      await supabase
        .from("communication_templates")
        .update({ current_version_id: params.versionId, is_active: true, updated_by: userId })
        .match({ id: params.templateId, company_id: companyId })
    }

    const warnings = validateTemplateVariables(
      versionRow,
      versionRow.variables as TemplateVariableDefinition[] | null | undefined,
    )

    return NextResponse.json({ data: versionRow, warnings })
  } catch (error: any) {
    console.error(
      `[communication/templates/${params.templateId}/versions/${params.versionId}][PATCH]`,
      error,
    )
    return NextResponse.json(
      { error: error?.message || "Failed to update template version" },
      { status: 500 }
    )
  }
}
