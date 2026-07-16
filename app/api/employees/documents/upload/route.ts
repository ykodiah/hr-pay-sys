/**
 * POST /api/employees/documents/upload
 * multipart: file, document_type, employee_id?, employee_name?, company_id?, notes?
 * Stores file, writes document_vault + returns previewable URL.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { storeEmployeeDocumentFile } from "@/lib/employees/document-upload"

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be smaller than 10MB" }, { status: 400 })
    }

    const documentType = String(form.get("document_type") || "other")
    const employeeId = String(form.get("employee_id") || "").trim() || null
    const employeeName = String(form.get("employee_name") || "").trim() || null
    const notes = String(form.get("notes") || "").trim() || null

    const client = await createClient()
    let companyId = String(form.get("company_id") || "").trim() || null
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }

    const stored = await storeEmployeeDocumentFile(file, file.name)

    const vaultPayload = {
      employee_id: employeeId && employeeId !== "temp-id" && employeeId.length > 20 ? employeeId : null,
      employee_name: employeeName,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
      file_url: stored.fileUrl,
      upload_date: new Date().toISOString(),
      uploaded_by: user.isDemo ? null : user.id,
      status: "pending",
      notes,
      source: "employee-onboarding",
      category: "employee-document",
      company_id: companyId,
      updated_at: new Date().toISOString(),
    }

    const { data: vaultDoc, error: vaultErr } = await client
      .from("document_vault")
      .insert(vaultPayload)
      .select()
      .single()

    if (vaultErr) {
      // Still return a usable upload result even if vault table is missing columns
      console.warn("[employee-docs] vault insert failed", vaultErr.message)
      return NextResponse.json({
        success: true,
        document: {
          id: `local-${Date.now()}`,
          vault_document_id: null,
          documentType,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: stored.fileUrl,
          file_content: stored.fileContent,
          uploadDate: new Date().toISOString(),
          uploadedBy: "HR Admin",
        },
      })
    }

    // If employee already exists, upsert employee_documents row now
    if (vaultPayload.employee_id) {
      await client.from("employee_documents").delete().eq("employee_id", vaultPayload.employee_id).eq("document_type", documentType)
      await client.from("employee_documents").insert({
        employee_id: vaultPayload.employee_id,
        document_type: documentType,
        document_name: file.name,
        file_name: file.name,
        file_path: stored.fileUrl,
        file_url: stored.fileUrl,
        file_size: file.size,
        mime_type: file.type,
        file_content: stored.fileContent,
        vault_document_id: vaultDoc.id,
        upload_date: new Date().toISOString(),
        uploaded_by: "HR Admin",
        notes,
      })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: vaultDoc.id,
        vault_document_id: vaultDoc.id,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: stored.fileUrl,
        file_content: stored.fileContent,
        uploadDate: vaultDoc.upload_date || new Date().toISOString(),
        uploadedBy: "HR Admin",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
}
