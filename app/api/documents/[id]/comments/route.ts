/**
 * GET  /api/documents/[id]/comments
 * POST /api/documents/[id]/comments  { comment, is_internal? }
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

async function assertDoc(service: any, companyId: string, id: string) {
  const { data, error } = await service
    .from("document_vault")
    .select("id")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return data
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const { id } = await params
    if (!(await assertDoc(service, companyId, id))) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data, error } = await service
      .from("document_comments")
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, comments: data || [] })
  } catch (err) {
    return jsonError(err, "Failed to load comments")
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await req.json().catch(() => ({}))
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const { id } = await params
    const comment = String(body.comment || "").trim()
    if (!comment) return NextResponse.json({ error: "comment is required" }, { status: 400 })

    if (!(await assertDoc(service, companyId, id))) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data, error } = await service
      .from("document_comments")
      .insert({
        document_id: id,
        user_id: userId || null,
        user_name: userId || "User",
        comment,
        is_internal: Boolean(body.is_internal),
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await service.from("document_access_logs").insert({
        document_id: id,
        user_id: userId || null,
        user_name: userId || "User",
        action: "comment",
        details: { comment_id: data.id },
      })
    } catch {
      /* ignore */
    }

    return NextResponse.json({ success: true, comment: data })
  } catch (err) {
    return jsonError(err, "Failed to add comment")
  }
}
