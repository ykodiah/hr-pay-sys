/**
 * GET  /api/documents/[id]/share
 * POST /api/documents/[id]/share  { email, permission?, expires_at? }
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { randomUUID } from "crypto"

async function assertDoc(service: any, companyId: string, id: string) {
  const { data, error } = await service
    .from("document_vault")
    .select("id, file_name")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
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
      .from("document_sharing")
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, shares: data || [] })
  } catch (err) {
    return jsonError(err, "Failed to load shares")
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
    const email = String(body.email || body.shared_with_email || "").trim()
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })

    const doc = await assertDoc(service, companyId, id)
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const permission = ["view", "download", "comment", "edit"].includes(body.permission)
      ? body.permission
      : "view"

    const { data, error } = await service
      .from("document_sharing")
      .insert({
        document_id: id,
        shared_with_email: email,
        permission,
        shared_by: userId || null,
        shared_by_name: userId || "User",
        expires_at: body.expires_at || null,
        access_token: randomUUID(),
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await service.from("document_access_logs").insert({
        document_id: id,
        user_id: userId || null,
        user_name: userId || "User",
        action: "share",
        details: { email, permission },
      })
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      success: true,
      share: data,
      message: `Shared “${doc.file_name}” with ${email}`,
    })
  } catch (err) {
    return jsonError(err, "Failed to share document")
  }
}
