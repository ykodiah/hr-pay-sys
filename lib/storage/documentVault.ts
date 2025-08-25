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
    | "company-logo"
    | "csv-import"
    | "training-material"
  fileName: string
  fileSize: number
  fileType: string
  uploadDate: Date
  uploadedBy: string
  fileUrl: string
  status: "pending" | "approved" | "rejected"
  notes?: string
  uploadSource: "employee-onboarding" | "settings" | "training" | "bulk-import" | "manual-upload"
  category: "employee-documents" | "company-assets" | "training-materials" | "system-files"
  departmentId?: string
  companyId?: string
}

export class DocumentVaultService {
  private static instance: DocumentVaultService
  private documents: Map<string, EmployeeDocument[]> = new Map()
  private globalDocuments: EmployeeDocument[] = []

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
    uploadSource = "manual-upload",
    category = "employee-documents",
    uploadedBy = "current-user",
  ): Promise<string> {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      uploadedBy,
      fileUrl,
      status: "pending",
      uploadSource: uploadSource as any,
      category: category as any,
    }

    if (!this.documents.has(employeeId)) {
      this.documents.set(employeeId, [])
    }
    this.documents.get(employeeId)!.push(document)

    this.globalDocuments.push(document)

    console.log(
      `[v0] Document uploaded to Document Vault - Employee: ${employeeName}, Type: ${documentType}, Source: ${uploadSource}`,
    )
    return documentId
  }

  async uploadCompanyDocument(
    file: File,
    documentType: string,
    uploadSource: string,
    uploadedBy = "admin",
  ): Promise<string> {
    return this.uploadDocument(
      "COMPANY",
      "Company Assets",
      file,
      documentType,
      uploadSource,
      "company-assets",
      uploadedBy,
    )
  }

  async uploadTrainingDocument(file: File, uploadedBy = "trainer"): Promise<string> {
    return this.uploadDocument(
      "TRAINING",
      "Training Materials",
      file,
      "training-material",
      "training",
      "training-materials",
      uploadedBy,
    )
  }

  getEmployeeDocuments(employeeId: string): EmployeeDocument[] {
    return this.documents.get(employeeId) || []
  }

  getAllDocuments(filterBySource?: string, filterByCategory?: string): EmployeeDocument[] {
    let filtered = [...this.globalDocuments]

    if (filterBySource) {
      filtered = filtered.filter((doc) => doc.uploadSource === filterBySource)
    }

    if (filterByCategory) {
      filtered = filtered.filter((doc) => doc.category === filterByCategory)
    }

    return filtered.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
  }

  getDocumentsByCategory(): Record<string, EmployeeDocument[]> {
    const categorized: Record<string, EmployeeDocument[]> = {
      "employee-documents": [],
      "company-assets": [],
      "training-materials": [],
      "system-files": [],
    }

    this.globalDocuments.forEach((doc) => {
      if (categorized[doc.category]) {
        categorized[doc.category].push(doc)
      }
    })

    return categorized
  }

  async downloadDocument(documentId: string): Promise<Blob | null> {
    console.log(`[v0] Downloading document: ${documentId}`)
    return null
  }

  updateDocumentStatus(documentId: string, status: "approved" | "rejected", notes?: string): boolean {
    for (const docs of this.documents.values()) {
      const doc = docs.find((d) => d.id === documentId)
      if (doc) {
        doc.status = status
        if (notes) doc.notes = notes
        return true
      }
    }
    return false
  }
}
