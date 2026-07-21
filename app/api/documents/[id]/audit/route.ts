/**
 * GET /api/documents/[id]/audit — access / action trail
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const { id } = await params

    const { data: doc, error: docErr } = await service
      .from("document_vault")
      .select("id")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const { data, error } = await service
      .from("document_access_logs")
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, logs: data || [] })
  } catch (err) {
    return jsonError(err, "Failed to load audit trail")
  }
}
