export interface DocumentUpload {
  id: string
  employeeId?: string
  employeeName?: string
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
    | "employee-csv"
    | "training-material"
  fileName: string
  fileSize: number
  fileType: string
  uploadDate: Date
  uploadedBy: string
  fileUrl: string
  status: "pending" | "approved" | "rejected"
  notes?: string
  source: "employee-onboarding" | "settings" | "training" | "recruitment" | "manual-upload"
  category: "employee-document" | "company-asset" | "system-data" | "training-content"
}

export class CentralDocumentService {
  private static instance: CentralDocumentService
  private documents: DocumentUpload[] = []

  static getInstance(): CentralDocumentService {
    if (!CentralDocumentService.instance) {
      CentralDocumentService.instance = new CentralDocumentService()
    }
    return CentralDocumentService.instance
  }

  async uploadDocument(params: {
    file: File
    employeeId?: string
    employeeName?: string
    documentType: string
    source: string
    uploadedBy: string
    notes?: string
  }): Promise<string> {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Simulate file upload to storage service
    const fileUrl = await this.simulateFileUpload(params.file)

    // Determine category based on document type and source
    const category = this.determineCategory(params.documentType, params.source)

    const document: DocumentUpload = {
      id: documentId,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      documentType: params.documentType as any,
      fileName: params.file.name,
      fileSize: params.file.size,
      fileType: params.file.type,
      uploadDate: new Date(),
      uploadedBy: params.uploadedBy,
      fileUrl,
      status: "pending",
      notes: params.notes,
      source: params.source as any,
      category: category as any,
    }

    this.documents.push(document)

    console.log(`[v0] Document uploaded to central vault:`, {
      fileName: document.fileName,
      source: document.source,
      category: document.category,
      employeeName: document.employeeName || "N/A",
    })

    return documentId
  }

  private determineCategory(documentType: string, source: string): string {
    if (source === "employee-onboarding" || source === "recruitment") {
      return "employee-document"
    }
    if (source === "settings") {
      return "company-asset"
    }
    if (source === "training") {
      return "training-content"
    }
    return "system-data"
  }

  private async simulateFileUpload(file: File): Promise<string> {
    // In production, this would upload to Vercel Blob or similar storage service
    return `https://storage.akwaabahrpay.com/documents/${Date.now()}_${file.name}`
  }

  getAllDocuments(): DocumentUpload[] {
    return this.documents
  }

  getDocumentsByEmployee(employeeId: string): DocumentUpload[] {
    return this.documents.filter((doc) => doc.employeeId === employeeId)
  }

  getDocumentsBySource(source: string): DocumentUpload[] {
    return this.documents.filter((doc) => doc.source === source)
  }

  getDocumentsByCategory(category: string): DocumentUpload[] {
    return this.documents.filter((doc) => doc.category === category)
  }

  updateDocumentStatus(documentId: string, status: "approved" | "rejected", notes?: string): boolean {
    const doc = this.documents.find((d) => d.id === documentId)
    if (doc) {
      doc.status = status
      if (notes) doc.notes = notes
      return true
    }
    return false
  }

  async downloadDocument(documentId: string): Promise<Blob | null> {
    const doc = this.documents.find((d) => d.id === documentId)
    if (doc) {
      console.log(`[v0] Downloading document: ${doc.fileName}`)
      // In production, fetch from storage service
      return null
    }
    return null
  }
}
