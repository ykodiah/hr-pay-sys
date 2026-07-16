/** Map DB document_vault / employee_documents rows → vault UI shape. */

export type VaultDocumentDto = {
  id: string
  employeeId?: string
  employeeName?: string
  documentType: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadDate: string
  uploadedBy: string
  status: "pending" | "approved" | "rejected" | "archived" | "deleted"
  notes?: string
  source: string
  category: string
  accessLevel: string
  signatureStatus: string
  isArchived: boolean
  companyId?: string | null
}

export function mapVaultRow(row: any): VaultDocumentDto {
  const fileUrl = row.file_url || row.file_path || row.file_content || ""
  return {
    id: row.id,
    employeeId: row.employee_id || undefined,
    employeeName: row.employee_name || undefined,
    documentType: row.document_type || "other",
    fileName: row.file_name || row.document_name || "Document",
    fileSize: Number(row.file_size || 0),
    fileType: row.file_type || row.mime_type || "application/octet-stream",
    fileUrl,
    uploadDate: row.upload_date || row.created_at || new Date().toISOString(),
    uploadedBy: row.uploaded_by || "HR Admin",
    status: (row.status || "pending") as VaultDocumentDto["status"],
    notes: row.notes || undefined,
    source: row.source || "employee-onboarding",
    category: row.category || "employee-document",
    accessLevel: row.access_level || "standard",
    signatureStatus: row.signature_status || "not_required",
    isArchived: Boolean(row.is_archived),
    companyId: row.company_id ?? null,
  }
}

export function mapEmployeeDocumentRow(row: any, employeeName?: string | null): VaultDocumentDto {
  return mapVaultRow({
    ...row,
    file_name: row.file_name || row.document_name,
    file_type: row.mime_type || row.file_type,
    employee_name: employeeName || row.employee_name,
    source: row.source || "employee-onboarding",
    category: row.category || "employee-document",
    status: row.status || "pending",
  })
}
