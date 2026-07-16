/**
 * POST /api/employees/documents/upload
 * multipart: file, document_type, employee_id?, employee_name?, company_id?, notes?
 * Stores file, writes document_vault (+ employee_documents when employee UUID exists).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { storeEmployeeDocumentFile } from "@/lib/employees/document-upload"
import { persistVaultDocument } from "@/lib/employees/persist-vault-document"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

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

    const documentType = String(
      form.get("document_type") || form.get("documentType") || "other",
    ).trim() || "other"
    const employeeIdRaw = String(
      form.get("employee_id") || form.get("employeeId") || "",
    ).trim()
    const employeeName =
      String(form.get("employee_name") || form.get("employeeName") || "").trim() || null
    const notes =
      String(form.get("notes") || form.get("description") || "").trim() || null
    const employeeCode = String(form.get("employee_code") || form.get("employeeCode") || "").trim()

    const client = await createClient()
    let companyId =
      String(form.get("company_id") || form.get("companyId") || "").trim() || null
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }

    const employeeUuid =
      employeeIdRaw && employeeIdRaw !== "temp-id" && isUuid(employeeIdRaw) ? employeeIdRaw : null

    const stored = await storeEmployeeDocumentFile(file, file.name)

    const vault = await persistVaultDocument(client, {
      employee_id: employeeUuid,
      employee_name: employeeName,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
      file_url: stored.fileUrl,
      upload_date: new Date().toISOString(),
      uploaded_by: user.isDemo ? null : user.id,
      status: "pending",
      notes:
        notes ||
        (employeeCode
          ? `Employee module upload (${employeeCode})`
          : "Uploaded from employee module"),
      source: "employee-onboarding",
      category: "employee-document",
      company_id: companyId,
    })

    if (!vault.ok || !vault.id) {
      return NextResponse.json(
        {
          error:
            vault.error ||
            "Failed to save document into Document Vault. Run scripts/054_employee_financial_docs_pf.sql (and 041 if needed).",
        },
        { status: 500 },
      )
    }

    if (employeeUuid) {
      await client
        .from("employee_documents")
        .delete()
        .eq("employee_id", employeeUuid)
        .eq("document_type", documentType)
      const { error: empDocErr } = await client.from("employee_documents").insert({
        employee_id: employeeUuid,
        document_type: documentType,
        document_name: file.name,
        file_name: file.name,
        file_path: stored.fileUrl,
        file_url: stored.fileUrl,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        file_content: stored.fileContent,
        vault_document_id: vault.id,
        upload_date: new Date().toISOString(),
        uploaded_by: "HR Admin",
        notes,
      })
      if (empDocErr) {
        console.warn("[employee-docs] employee_documents insert failed:", empDocErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: vault.id,
        vault_document_id: vault.id,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        fileUrl: stored.fileUrl,
        file_content: stored.fileContent,
        uploadDate: vault.data?.upload_date || new Date().toISOString(),
        uploadedBy: "HR Admin",
      },
    })
  } catch (err) {
    console.error("Employee document upload error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    )
  }
}
