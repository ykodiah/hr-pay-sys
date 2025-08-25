export interface EmployeeDocument {
  id: string
  employeeId: string
  employeeName: string
  documentType: "academic" | "passport-picture" | "resume" | "passport" | "national-id" | "medical" | "police" | "other"
  fileName: string
  fileSize: number
  fileType: string
  uploadDate: Date
  uploadedBy: string
  fileUrl: string
  status: "pending" | "approved" | "rejected"
  notes?: string
}

export class DocumentVaultService {
  private static instance: DocumentVaultService
  private documents: Map<string, EmployeeDocument[]> = new Map()

  static getInstance(): DocumentVaultService {
    if (!DocumentVaultService.instance) {
      DocumentVaultService.instance = new DocumentVaultService()
    }
    return DocumentVaultService.instance
  }

  async uploadDocument(employeeId: string, employeeName: string, file: File, documentType: string): Promise<string> {
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
    }

    if (!this.documents.has(employeeId)) {
      this.documents.set(employeeId, [])
    }

    this.documents.get(employeeId)!.push(document)

    console.log(`[v0] Document uploaded for employee ${employeeName}:`, document)
    return documentId
  }

  private async simulateFileUpload(file: File): Promise<string> {
    // In production, this would upload to actual storage service
    return `https://storage.akwaabahrpay.com/documents/${file.name}`
  }

  getEmployeeDocuments(employeeId: string): EmployeeDocument[] {
    return this.documents.get(employeeId) || []
  }

  getAllDocuments(): EmployeeDocument[] {
    const allDocs: EmployeeDocument[] = []
    this.documents.forEach((docs) => allDocs.push(...docs))
    return allDocs
  }

  async downloadDocument(documentId: string): Promise<Blob | null> {
    // In production, this would fetch from storage service
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
