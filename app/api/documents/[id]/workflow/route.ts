/**
 * GET  /api/documents/[id]/workflow
 * POST /api/documents/[id]/workflow  — start a simple approval workflow if none exists
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
      .select("id, status, file_name")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const { data: workflows, error } = await service
      .from("document_workflows")
      .select("*, workflow_steps(*)")
      .eq("document_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      // Fallback if join unsupported
      const { data: wf, error: wfErr } = await service
        .from("document_workflows")
        .select("*")
        .eq("document_id", id)
        .order("created_at", { ascending: false })
      if (wfErr) return NextResponse.json({ error: wfErr.message }, { status: 500 })
      return NextResponse.json({
        success: true,
        document: doc,
        workflows: wf || [],
        steps: [],
      })
    }

    return NextResponse.json({ success: true, document: doc, workflows: workflows || [] })
  } catch (err) {
    return jsonError(err, "Failed to load workflow")
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

    const { data: doc, error: docErr } = await service
      .from("document_vault")
      .select("id, file_name, status")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const { data: workflow, error } = await service
      .from("document_workflows")
      .insert({
        document_id: id,
        company_id: companyId,
        name: body.name || "Document approval",
        status: "in_progress",
        current_step: 1,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const steps = [
      { step_order: 1, step_name: "HR Review", status: "pending" },
      { step_order: 2, step_name: "Manager Approval", status: "pending" },
      { step_order: 3, step_name: "Finalise", status: "pending" },
    ]

    await service.from("workflow_steps").insert(
      steps.map((s) => ({
        workflow_id: workflow.id,
        ...s,
        assignee_name: userId || "Unassigned",
      })),
    )

    return NextResponse.json({ success: true, workflow })
  } catch (err) {
    return jsonError(err, "Failed to start workflow")
  }
}
