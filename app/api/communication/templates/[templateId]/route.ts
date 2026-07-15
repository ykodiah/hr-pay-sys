import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { validateTemplateVariables } from "@/lib/communication/templates"

export async function GET(_request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)
    const templateId = params.templateId

    const { data: summary, error: summaryError } = await supabase
      .from("communication_template_summaries")
      .select("*")
      .match({ id: templateId, company_id: companyId })
      .maybeSingle()

    if (summaryError) throw summaryError
    if (!summary) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const { data: versions, error: versionsError } = await supabase
      .from("communication_template_versions")
      .select("*")
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })

    if (versionsError) throw versionsError

    const warnings = versions?.length
      ? validateTemplateVariables(versions[0], versions[0]?.variables)
      : { missingDefinitions: [], unusedDefinitions: [] }

    return NextResponse.json({ data: { template: summary, versions: versions ?? [] }, warnings })
  } catch (error: any) {
    console.error(`[communication/templates/${params.templateId}][GET]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to load template" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const templateId = params.templateId
    const body = await request.json()

    const updatePayload: Record<string, unknown> = { updated_by: userId }

    if (body.name !== undefined) updatePayload.name = body.name
    if (body.description !== undefined) updatePayload.description = body.description
    if (body.category !== undefined) updatePayload.category = body.category
    if (body.tags !== undefined)
      updatePayload.tags = Array.isArray(body.tags)
        ? body.tags.map((tag: any) => String(tag).trim()).filter(Boolean)
        : []
    if (body.language !== undefined) updatePayload.language = body.language
    if (body.metadata !== undefined && typeof body.metadata === "object") updatePayload.metadata = body.metadata
    if (body.isActive !== undefined) updatePayload.is_active = Boolean(body.isActive)
    if (body.currentVersionId !== undefined) updatePayload.current_version_id = body.currentVersionId

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ data: null })
    }

    const { data: templateRow, error: updateError } = await supabase
      .from("communication_templates")
      .update(updatePayload)
      .match({ id: templateId, company_id: companyId })
      .select("*")
      .single()

    if (updateError) throw updateError

    if (body.publishVersionId) {
      const publishId = body.publishVersionId as string
      const nowIso = new Date().toISOString()

      await supabase
        .from("communication_template_versions")
        .update({ status: "archived" })
        .match({ template_id: templateId, status: "published" })
        .neq("id", publishId)

      const { error: publishError } = await supabase
        .from("communication_template_versions")
        .update({ status: "published", published_at: nowIso, updated_by: userId })
        .match({ id: publishId, template_id: templateId })

      if (publishError) throw publishError

      await supabase
        .from("communication_templates")
        .update({ current_version_id: publishId, is_active: true, updated_by: userId })
        .match({ id: templateId, company_id: companyId })
    }

    const { data: summary, error: summaryError } = await supabase
      .from("communication_template_summaries")
      .select("*")
      .match({ id: templateRow.id, company_id: companyId })
      .maybeSingle()

    if (summaryError) throw summaryError

    return NextResponse.json({ data: summary })
  } catch (error: any) {
    console.error(`[communication/templates/${params.templateId}][PATCH]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to update template" },
      { status: 500 }
    )
  }
}
