import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

function normaliseRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export async function GET(_request: NextRequest, { params }: { params: { snippetId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)

    const { data, error } = await supabase
      .from("communication_snippets")
      .select("*")
      .match({ id: params.snippetId, company_id: companyId })
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error(`[communication/snippets/${params.snippetId}][GET]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to load snippet" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { snippetId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const body = await request.json()

    const updatePayload: Record<string, unknown> = { updated_by: userId }

    if (body.name !== undefined) updatePayload.name = body.name
    if (body.description !== undefined) updatePayload.description = body.description
    if (body.category !== undefined) updatePayload.category = body.category
    if (body.language !== undefined) updatePayload.language = body.language
    if (body.text !== undefined) updatePayload.content_text = body.text
    if (body.html !== undefined) updatePayload.content_html = body.html
    if (body.metadata !== undefined) updatePayload.metadata = normaliseRecord(body.metadata)
    if (body.variables !== undefined)
      updatePayload.variables = Array.isArray(body.variables) ? body.variables : []
    if (body.isActive !== undefined) updatePayload.is_active = Boolean(body.isActive)

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ data: null })
    }

    const { data, error } = await supabase
      .from("communication_snippets")
      .update(updatePayload)
      .match({ id: params.snippetId, company_id: companyId })
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error(`[communication/snippets/${params.snippetId}][PATCH]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to update snippet" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { snippetId: string } }) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)

    const { error } = await supabase
      .from("communication_snippets")
      .delete()
      .match({ id: params.snippetId, company_id: companyId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`[communication/snippets/${params.snippetId}][DELETE]`, error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete snippet" },
      { status: 500 }
    )
  }
}
