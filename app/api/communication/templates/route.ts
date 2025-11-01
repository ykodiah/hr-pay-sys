import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { validateTemplateVariables, TemplateVariableDefinition } from "@/lib/communication/templates"

function normaliseTags(value: unknown): string[] | null {
  if (value === null) return null
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function normaliseRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)
    const searchParams = new URL(request.url).searchParams

    const channelType = searchParams.get("channelType") || undefined
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search")?.trim()

    let query = supabase
      .from("communication_template_summaries")
      .select("*")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false })

    if (channelType) {
      query = query.eq("channel_type", channelType)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,template_key.ilike.%${search}%,category.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    console.error("[communication/templates][GET]", error)
    return NextResponse.json(
      { error: error?.message || "Failed to load templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const body = await request.json()

    const templateKey = (body.templateKey as string | undefined)?.trim()
    const name = (body.name as string | undefined)?.trim()
    const channelType = (body.channelType as string | undefined)?.trim()

    if (!templateKey) {
      return NextResponse.json({ error: "templateKey is required" }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }
    if (!channelType) {
      return NextResponse.json({ error: "channelType is required" }, { status: 400 })
    }

    const tags = normaliseTags(body.tags)

    const templateInsert = {
      company_id: companyId,
      template_key: templateKey,
      name,
      description: body.description ?? null,
      channel_type: channelType,
      category: body.category ?? null,
      tags: tags ?? [],
      language: body.language ?? "en",
      metadata: normaliseRecord(body.metadata),
      is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      created_by: userId,
      updated_by: userId,
    }

    const { data: templateRow, error: templateError } = await supabase
      .from("communication_templates")
      .insert(templateInsert)
      .select("*")
      .single()

    if (templateError) {
      throw templateError
    }

    const versionStatus = (body.status as string | undefined)?.trim() || "draft"
    const variables = Array.isArray(body.variables)
      ? (body.variables as TemplateVariableDefinition[])
      : []

    const previewPayload = body.preview ?? body.preview_json

    const versionInsert = {
      template_id: templateRow.id,
      version_number: 1,
      status: ["draft", "published", "archived"].includes(versionStatus)
        ? versionStatus
        : "draft",
      subject: body.subject ?? null,
      content_text: body.text ?? null,
      content_html: body.html ?? null,
      preview_json: normaliseRecord(previewPayload),
      variables,
      metadata: normaliseRecord(body.versionMetadata),
      created_by: userId,
      updated_by: userId,
    }

    const { data: versionRow, error: versionError } = await supabase
      .from("communication_template_versions")
      .insert(versionInsert)
      .select("*")
      .single()

    if (versionError) {
      // best-effort rollback of template shell
      await supabase
        .from("communication_templates")
        .delete()
        .match({ id: templateRow.id, company_id: companyId })
      throw versionError
    }

    if (versionRow.status === "published") {
      await supabase
        .from("communication_templates")
        .update({ current_version_id: versionRow.id, is_active: true, updated_by: userId })
        .match({ id: templateRow.id, company_id: companyId })
    }

    const { data: summary, error: summaryError } = await supabase
      .from("communication_template_summaries")
      .select("*")
      .match({ id: templateRow.id, company_id: companyId })
      .maybeSingle()

    if (summaryError) throw summaryError

    const validation = validateTemplateVariables(versionRow, versionRow.variables)

    return NextResponse.json(
      {
        data: summary,
        warnings: validation,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[communication/templates][POST]", error)
    const message = error?.message || "Failed to create template"
    const isConflict = message.includes("duplicate") || message.includes("unique")
    return NextResponse.json(
      { error: message },
      { status: isConflict ? 409 : 500 }
    )
  }
}

