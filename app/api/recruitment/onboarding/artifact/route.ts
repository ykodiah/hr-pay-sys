/**
 * POST /api/recruitment/onboarding/artifact
 * multipart: task_id, company_id?, fields (JSON string), file?, complete?=true
 * Saves typed responses + optional upload → document vault → task (and employee card when linked).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { storeEmployeeDocumentFile } from "@/lib/employees/document-upload"
import { persistVaultDocument } from "@/lib/employees/persist-vault-document"
import {
  getOnboardingTaskArtifactConfig,
  validateTaskArtifactInput,
} from "@/lib/recruitment/task-artifacts"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

async function recomputeChecklist(client: any, checklistId: string) {
  const { data: tasks } = await client
    .from("recruitment_onboarding_tasks")
    .select("status, stage")
    .eq("checklist_id", checklistId)
  const total = tasks?.length ?? 0
  const done = (tasks ?? []).filter((t: any) => t.status === "completed" || t.status === "skipped").length
  const progress = total ? Math.round((done / total) * 100) : 0
  const pending = (tasks ?? []).find((t: any) => t.status !== "completed" && t.status !== "skipped")
  await client
    .from("recruitment_onboarding_checklists")
    .update({
      progress,
      status: progress >= 100 ? "completed" : "in_progress",
      stage: progress >= 100 ? "completed" : pending?.stage || "welcome",
      stage_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", checklistId)
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.isDemo) {
      return NextResponse.json({ error: "Uploads disabled in demo mode" }, { status: 403 })
    }

    const client: any = await db()
    const authClient = await createClient()
    const form = await req.formData()

    const taskId = String(form.get("task_id") || "").trim()
    if (!taskId) return NextResponse.json({ error: "task_id is required" }, { status: 400 })

    let companyId = String(form.get("company_id") || "").trim() || null
    if (!companyId) {
      companyId = (await resolveCompanyId(authClient, user.id, user))?.companyId || null
    }

    const { data: task, error: taskErr } = await client
      .from("recruitment_onboarding_tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle()
    if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 })
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    const { data: checklist } = await client
      .from("recruitment_onboarding_checklists")
      .select("*")
      .eq("id", task.checklist_id)
      .maybeSingle()
    if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 })
    if (companyId && checklist.company_id !== companyId) {
      return NextResponse.json({ error: "Task does not belong to this company" }, { status: 403 })
    }
    companyId = checklist.company_id

    let fields: Record<string, string> = {}
    try {
      const raw = String(form.get("fields") || "{}")
      fields = JSON.parse(raw)
    } catch {
      fields = {}
    }

    const complete =
      String(form.get("complete") || "true").toLowerCase() !== "false" &&
      String(form.get("complete") || "true") !== "0"

    const file = form.get("file")
    const hasNewFile = file instanceof File && file.size > 0
    const hasExisting = Boolean(task.attachment_url || task.vault_document_id)
    const config = getOnboardingTaskArtifactConfig(task)

    if (config.linkedOfferSignature) {
      return NextResponse.json(
        {
          error:
            "This task is completed when both Candidate and HR Head sign the offer letter.",
        },
        { status: 400 },
      )
    }

    const missing = validateTaskArtifactInput(
      config,
      fields,
      hasNewFile || hasExisting || !config.requiresUpload,
    )
    // If requires upload and neither new nor existing — fail
    if (config.requiresUpload && !hasNewFile && !hasExisting) {
      return NextResponse.json(
        { error: `Upload required: ${config.uploadLabel || "document"}` },
        { status: 400 },
      )
    }
    if (missing.length && complete) {
      // Allow save-without-complete for drafts; for complete, require fields
      const fieldMissing = missing.filter((m) => m !== (config.uploadLabel || "Document upload"))
      if (fieldMissing.length) {
        return NextResponse.json(
          { error: `Missing required fields: ${fieldMissing.join(", ")}` },
          { status: 400 },
        )
      }
    }

    let attachmentUrl = task.attachment_url || null
    let attachmentName = task.attachment_name || null
    let vaultDocumentId = task.vault_document_id || null
    const documentType = config.documentType || task.document_type || "onboarding-document"

    if (hasNewFile && file instanceof File) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be smaller than 10MB" }, { status: 400 })
      }
      const stored = await storeEmployeeDocumentFile(file, file.name)
      attachmentUrl = stored.fileUrl
      attachmentName = file.name

      const vault = await persistVaultDocument(client, {
        employee_id: checklist.employee_id || null,
        employee_name: checklist.candidate_name || null,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
        file_url: stored.fileUrl,
        uploaded_by: user.id,
        status: "approved",
        notes: task.title || "Onboarding document",
        source: "recruitment-onboarding",
        category: "employee-document",
        company_id: companyId,
        checklist_id: checklist.id,
        onboarding_task_id: task.id,
        access_level: "confidential",
      })
      vaultDocumentId = vault.id

      // Also link to employee_documents when hire already converted
      if (checklist.employee_id && isUuid(checklist.employee_id) && vaultDocumentId) {
        try {
          await client.from("employee_documents").upsert(
            {
              employee_id: checklist.employee_id,
              document_type: documentType,
              document_name: file.name,
              file_name: file.name,
              file_path: stored.fileUrl,
              file_url: stored.fileUrl,
              file_size: file.size,
              mime_type: file.type || "application/octet-stream",
              upload_date: new Date().toISOString(),
              uploaded_by: user.id,
              notes: task.title || "Onboarding document",
              vault_document_id: vaultDocumentId,
            },
            { onConflict: "employee_id,document_type" },
          )
        } catch (err) {
          console.warn("[onboarding-artifact] employee_documents sync skipped", err)
        }
      }
    }

    // Store typed-only responses as a small vault note when no file but fields present
    if (!hasNewFile && !vaultDocumentId && Object.keys(fields).some((k) => fields[k]?.trim())) {
      const summary = Object.entries(fields)
        .filter(([, v]) => String(v || "").trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
      const dataUrl = `data:text/plain;charset=utf-8;base64,${Buffer.from(summary, "utf8").toString("base64")}`
      const fileName = `${String(task.title || "onboarding").replace(/\s+/g, "-").slice(0, 40)}-details.txt`
      const vault = await persistVaultDocument(client, {
        employee_id: checklist.employee_id || null,
        employee_name: checklist.candidate_name || null,
        document_type: documentType || "onboarding-form",
        file_name: fileName,
        file_size: Buffer.byteLength(summary, "utf8"),
        file_type: "text/plain",
        file_url: dataUrl,
        uploaded_by: user.id,
        status: "approved",
        notes: task.title || "Onboarding form",
        source: "recruitment-onboarding",
        category: "employee-document",
        company_id: companyId,
        checklist_id: checklist.id,
        onboarding_task_id: task.id,
        access_level: "confidential",
      })
      vaultDocumentId = vault.id
      attachmentUrl = dataUrl
      attachmentName = fileName
    }

    const taskPatch: Record<string, unknown> = {
      response_data: { ...(task.response_data || {}), ...fields },
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      vault_document_id: vaultDocumentId,
      document_type: documentType,
      updated_at: new Date().toISOString(),
    }
    if (complete) {
      taskPatch.status = "completed"
      taskPatch.completed_at = new Date().toISOString()
    }

    const { data: updatedTask, error: updErr } = await client
      .from("recruitment_onboarding_tasks")
      .update(taskPatch)
      .eq("id", taskId)
      .select()
      .single()
    if (updErr) {
      // Fallback if 091 columns missing
      if (/column|schema cache|does not exist/i.test(updErr.message)) {
        const legacy: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (complete) {
          legacy.status = "completed"
          legacy.completed_at = new Date().toISOString()
        }
        const retry = await client
          .from("recruitment_onboarding_tasks")
          .update(legacy)
          .eq("id", taskId)
          .select()
          .single()
        if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 })
        if (complete) await recomputeChecklist(client, checklist.id)
        return NextResponse.json({
          success: true,
          task: retry.data,
          warning: "Run SQL 091 to persist uploads and typed fields on tasks.",
          vault_document_id: vaultDocumentId,
        })
      }
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    if (complete) await recomputeChecklist(client, checklist.id)

    const { data: refreshed } = await client
      .from("recruitment_onboarding_checklists")
      .select(`*, tasks:recruitment_onboarding_tasks(*)`)
      .eq("id", checklist.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      task: updatedTask,
      vault_document_id: vaultDocumentId,
      checklist: refreshed,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Artifact save failed" },
      { status: 500 },
    )
  }
}
