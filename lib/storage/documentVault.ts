export interface EmployeeDocument {
  id: string
  employeeId: string
  employeeName: string
  documentType:
    | "academic"
    | "passport-picture"
    | "resume"
    | "passport"
    | "national-id"
    | "medical"
    | "police"
    | "other"
    | "csv-import"
    | "company-logo"
    | "profile-additional"
  fileName: string
  fileSize: number
  fileType: string
  uploadDate: Date
  uploadedBy: string
  fileUrl: string
  status: "pending" | "approved" | "rejected"
  notes?: string
  uploadSource:
    | "employee-onboarding"
    | "bulk-import"
    | "company-settings"
    | "employee-profile"
    | "recruitment"
    | "other"
  category: "employee-documents" | "system-files" | "company-assets" | "profile-updates"
}

export class DocumentVaultService {
  private static instance: DocumentVaultService
  private documents: Map<string, EmployeeDocument[]> = new Map()
  private systemDocuments: EmployeeDocument[] = []

  static getInstance(): DocumentVaultService {
    if (!DocumentVaultService.instance) {
      DocumentVaultService.instance = new DocumentVaultService()
    }
    return DocumentVaultService.instance
  }

  async uploadDocument(
    employeeId: string,
    employeeName: string,
    file: File,
    documentType: string,
    uploadSource = "other",
    category = "employee-documents",
  ): Promise<string> {
    // In a real implementation, this would upload to cloud storage (Vercel Blob, AWS S3, etc.)
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Simulate file upload and get URL
    const fileUrl = await this.simulateFileUpload(file)

    const document: EmployeeDocument = {
      id: documentId,
      employeeId,
      employeeName,
      documentType: documentType as any,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date(),
      uploadedBy: "current-user", // Would get from auth context
      fileUrl,
      status: "pending",
      uploadSource: uploadSource as any,
      category: category as any,
    }

    if (category === "system-files" || category === "company-assets") {
      this.systemDocuments.push(document)
    } else {
      if (!this.documents.has(employeeId)) {
        this.documents.set(employeeId, [])
      }
      this.documents.get(employeeId)!.push(document)
    }

    console.log(`[v0] Document uploaded from ${uploadSource} for ${employeeName}:`, document)
    return documentId
  }

  async uploadSystemDocument(
    file: File,
    documentType: string,
    uploadSource: string,
    uploadedBy = "system-admin",
  ): Promise<string> {
    const documentId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fileUrl = await this.simulateFileUpload(file)

    const document: EmployeeDocument = {
      id: documentId,
      employeeId: "SYSTEM",
      employeeName: "System Upload",
      documentType: documentType as any,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date(),
      uploadedBy,
      fileUrl,
      status: "approved", // System uploads are auto-approved
      uploadSource: uploadSource as any,
      category: uploadSource === "company-settings" ? "company-assets" : "system-files",
    }

    this.systemDocuments.push(document)
    console.log(`[v0] System document uploaded from ${uploadSource}:`, document)
    return documentId
  }

  private async simulateFileUpload(file: File): Promise<string> {
    // In production, this would upload to actual storage service
    return `https://storage.akwaabahrpay.com/documents/${file.name}`
  }

  getEmployeeDocuments(employeeId: string): EmployeeDocument[] {
    return this.documents.get(employeeId) || []
  }

  getAllDocuments(includeSystemDocs = true): EmployeeDocument[] {
    const allDocs: EmployeeDocument[] = []
    this.documents.forEach((docs) => allDocs.push(...docs))

    if (includeSystemDocs) {
      allDocs.push(...this.systemDocuments)
    }

    return allDocs
  }

  getDocumentsBySource(source: string): EmployeeDocument[] {
    const allDocs = this.getAllDocuments()
    return allDocs.filter((doc) => doc.uploadSource === source)
  }

  getDocumentsByCategory(category: string): EmployeeDocument[] {
    const allDocs = this.getAllDocuments()
    return allDocs.filter((doc) => doc.category === category)
  }

  async downloadDocument(documentId: string): Promise<Blob | null> {
    // In production, this would fetch from storage service
    console.log(`[v0] Downloading document: ${documentId}`)
    return null
  }

  updateDocumentStatus(documentId: string, status: "approved" | "rejected", notes?: string): boolean {
    // Check employee documents
    for (const docs of this.documents.values()) {
      const doc = docs.find((d) => d.id === documentId)
      if (doc) {
        doc.status = status
        if (notes) doc.notes = notes
        return true
      }
    }

    const systemDoc = this.systemDocuments.find((d) => d.id === documentId)
    if (systemDoc) {
      systemDoc.status = status
      if (notes) systemDoc.notes = notes
      return true
    }

    return false
  }

  getDocumentStats() {
    const allDocs = this.getAllDocuments()
    return {
      total: allDocs.length,
      pending: allDocs.filter((d) => d.status === "pending").length,
      approved: allDocs.filter((d) => d.status === "approved").length,
      rejected: allDocs.filter((d) => d.status === "rejected").length,
      bySource: {
        employeeOnboarding: allDocs.filter((d) => d.uploadSource === "employee-onboarding").length,
        bulkImport: allDocs.filter((d) => d.uploadSource === "bulk-import").length,
        companySettings: allDocs.filter((d) => d.uploadSource === "company-settings").length,
        employeeProfile: allDocs.filter((d) => d.uploadSource === "employee-profile").length,
      },
    }
  }
}
