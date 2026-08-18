import { NextRequest, NextResponse } from "next/server"
import {
  isPortalError,
  logPortalActivity,
  portalJsonError,
  requirePortalSession,
} from "@/lib/self-service/portal-session"
import { storeEmployeeDocumentFile } from "@/lib/employees/document-upload"
import { persistVaultDocument } from "@/lib/employees/persist-vault-document"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_RECIPIENTS = new Set(["manager", "supervisor", "head_of_department", "hr"])

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { data, error } = await session.db
      .from("document_vault")
      .select("*")
      .eq("company_id", session.companyId)
      .eq("employee_id", session.employeeId)
      .order("upload_date", { ascending: false })
      .limit(250)
    if (error) throw new Error(error.message)
    return NextResponse.json({ documents: data || [] })
  } catch (err) {
    return portalJsonError(err, "Failed to load document vault")
  }
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a document to upload" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Documents must be smaller than 10MB" }, { status: 400 })
    }

    const recipients = String(form.get("recipients") || "hr")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => ALLOWED_RECIPIENTS.has(value))
    const documentType = String(form.get("document_type") || "other").trim() || "other"
    const notes = String(form.get("notes") || "").trim() || null
    const employeeName =
      session.employee.full_name ||
      `${session.employee.first_name || ""} ${session.employee.last_name || ""}`.trim()
    const stored = await storeEmployeeDocumentFile(file, file.name)
    const saved = await persistVaultDocument(session.db, {
      employee_id: session.employeeId,
      employee_name: employeeName,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
      file_url: stored.fileUrl,
      uploaded_by: session.user.id,
      status: "pending",
      notes,
      source: "employee-portal",
      category: "employee-submission",
      company_id: session.companyId,
      access_level: "confidential",
    })
    if (!saved.ok || !saved.id) throw new Error(saved.error || "Could not save document")

    // Routing fields were added by the portal expansion migration. Keep upload
    // compatible with older databases by treating this enrichment as non-fatal.
    await session.db
      .from("document_vault")
      .update({
        submitted_to_roles: recipients.length ? recipients : ["hr"],
        employee_visible: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", saved.id)
      .eq("employee_id", session.employeeId)

    await logPortalActivity(session, "document_upload", file.name, {
      document_id: saved.id,
      recipients,
      document_type: documentType,
    })
    return NextResponse.json({ success: true, document: saved.data }, { status: 201 })
  } catch (err) {
    return portalJsonError(err, "Document upload failed")
  }
}
