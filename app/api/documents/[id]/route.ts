/**
 * GET    /api/documents/[id]          — fetch one document (+ optional audit)
 * PATCH  /api/documents/[id]          — update status / archive / soft-delete / restore
 * DELETE /api/documents/[id]          — soft-delete (or hard if ?hard=1)
 *
 * Body (PATCH): { action: 'approve'|'reject'|'archive'|'restore'|'delete'|'status', status?, notes? }
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

async function logAccess(
  service: any,
  documentId: string,
  action: string,
  actor?: { id?: string; name?: string },
  details?: Record<string, unknown>,
) {
  try {
    await service.from("document_access_logs").insert({
      document_id: documentId,
      user_id: actor?.id || null,
      user_name: actor?.name || "System",
      action,
      details: details || {},
    })
  } catch {
    // non-fatal if table missing until 082 is applied
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const { id } = await params

    const { data, error } = await service
      .from("document_vault")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const logAction = new URL(req.url).searchParams.get("log")
    await logAccess(service, id, logAction === "download" ? "download" : "view", {
      id: userId || undefined,
      name: userId || "User",
    })

    return NextResponse.json({ success: true, document: data })
  } catch (err) {
    return jsonError(err, "Failed to load document")
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await req.json().catch(() => ({}))
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const { id } = await params

    const { data: existing, error: findErr } = await service
      .from("document_vault")
      .select("id, status, is_archived")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const action = String(body.action || body.status || "").toLowerCase()
    const now = new Date().toISOString()
    const actorId = userId || null
    const patch: Record<string, unknown> = { updated_at: now }
    let auditAction = action || "update"

    if (action === "approve" || body.status === "approved") {
      patch.status = "approved"
      auditAction = "approve"
    } else if (action === "reject" || body.status === "rejected") {
      patch.status = "rejected"
      auditAction = "reject"
    } else if (action === "archive") {
      patch.status = "archived"
      patch.is_archived = true
      patch.archived_at = now
      patch.archived_by = actorId
      auditAction = "archive"
    } else if (action === "restore") {
      patch.status = "approved"
      patch.is_archived = false
      patch.archived_at = null
      patch.deleted_at = null
      auditAction = "restore"
    } else if (action === "delete") {
      patch.status = "deleted"
      patch.deleted_at = now
      patch.deleted_by = actorId
      auditAction = "delete"
    } else if (body.status) {
      patch.status = body.status
      auditAction = `status:${body.status}`
    } else {
      return NextResponse.json({ error: "action or status required" }, { status: 400 })
    }

    if (body.notes != null) patch.notes = body.notes

    const { data, error } = await service
      .from("document_vault")
      .update(patch)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAccess(
      service,
      id,
      auditAction,
      { id: userId || undefined, name: userId || "User" },
      { notes: body.notes },
    )

    return NextResponse.json({ success: true, document: data })
  } catch (err) {
    return jsonError(err, "Failed to update document")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx
    const { id } = await params
    const hard = new URL(req.url).searchParams.get("hard") === "1"

    if (hard) {
      const { error } = await service
        .from("document_vault")
        .delete()
        .eq("id", id)
        .eq("company_id", companyId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, deleted: true })
    }

    const now = new Date().toISOString()
    const { data, error } = await service
      .from("document_vault")
      .update({
        status: "deleted",
        deleted_at: now,
        deleted_by: userId || null,
        updated_at: now,
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id, status")
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    await logAccess(service, id, "delete", {
      id: userId || undefined,
      name: userId || "User",
    })

    return NextResponse.json({ success: true, document: data })
  } catch (err) {
    return jsonError(err, "Failed to delete document")
  }
}
