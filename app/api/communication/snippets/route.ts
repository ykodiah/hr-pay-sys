import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

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

    const category = searchParams.get("category") || undefined
    const search = searchParams.get("search")?.trim()

    let query = supabase
      .from("communication_snippets")
      .select("*")
      .match({ company_id: companyId })
      .order("updated_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,snippet_key.ilike.%${search}%,description.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    console.error("[communication/snippets][GET]", error)
    return NextResponse.json(
      { error: error?.message || "Failed to load snippets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const body = await request.json()

    const snippetKey = (body.snippetKey as string | undefined)?.trim()
    const name = (body.name as string | undefined)?.trim()

    if (!snippetKey) {
      return NextResponse.json({ error: "snippetKey is required" }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const payload = {
      company_id: companyId,
      snippet_key: snippetKey,
      name,
      description: body.description ?? null,
      category: body.category ?? null,
      language: body.language ?? "en",
      content_text: body.text ?? null,
      content_html: body.html ?? null,
      variables: Array.isArray(body.variables) ? body.variables : [],
      metadata: normaliseRecord(body.metadata),
      is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
      created_by: userId,
      updated_by: userId,
    }

    const { data, error } = await supabase
      .from("communication_snippets")
      .insert(payload)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error("[communication/snippets][POST]", error)
    const message = error?.message || "Failed to create snippet"
    const isConflict = message.includes("duplicate") || message.includes("unique")
    return NextResponse.json(
      { error: message },
      { status: isConflict ? 409 : 500 }
    )
  }
}
