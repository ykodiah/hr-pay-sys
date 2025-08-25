// Document Vault Storage Utilities
export interface DocumentMetadata {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: Date
  category: string
  tags: string[]
  isConfidential: boolean
  accessLevel: "public" | "internal" | "confidential" | "restricted"
  employeeId?: string
  department?: string
  expiryDate?: Date
  version: number
  checksum: string
}

export interface DocumentCategory {
  id: string
  name: string
  description: string
  allowedFileTypes: string[]
  maxFileSize: number
  retentionPeriod?: number // in days
  isActive: boolean
}

export class DocumentVaultStorage {
  private static instance: DocumentVaultStorage
  private documents: Map<string, DocumentMetadata> = new Map()
  private categories: Map<string, DocumentCategory> = new Map()

  private constructor() {
    this.initializeDefaultCategories()
  }

  public static getInstance(): DocumentVaultStorage {
    if (!DocumentVaultStorage.instance) {
      DocumentVaultStorage.instance = new DocumentVaultStorage()
    }
    return DocumentVaultStorage.instance
  }

  private initializeDefaultCategories() {
    const defaultCategories: DocumentCategory[] = [
      {
        id: "contracts",
        name: "Employment Contracts",
        description: "Employee contracts and agreements",
        allowedFileTypes: ["pdf", "doc", "docx"],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        retentionPeriod: 2555, // 7 years
        isActive: true,
      },
      {
        id: "policies",
        name: "HR Policies",
        description: "Company policies and procedures",
        allowedFileTypes: ["pdf", "doc", "docx"],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        isActive: true,
      },
      {
        id: "certificates",
        name: "Certificates & Licenses",
        description: "Professional certificates and licenses",
        allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        retentionPeriod: 1825, // 5 years
        isActive: true,
      },
      {
        id: "payroll",
        name: "Payroll Documents",
        description: "Payslips, tax documents, and payroll records",
        allowedFileTypes: ["pdf", "xlsx", "csv"],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        retentionPeriod: 2555, // 7 years
        isActive: true,
      },
    ]

    defaultCategories.forEach((category) => {
      this.categories.set(category.id, category)
    })
  }

  public uploadDocument(file: File, metadata: Partial<DocumentMetadata>): Promise<DocumentMetadata> {
    return new Promise((resolve, reject) => {
      try {
        const documentId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const document: DocumentMetadata = {
          id: documentId,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedBy: metadata.uploadedBy || "Unknown",
          uploadedAt: new Date(),
          category: metadata.category || "general",
          tags: metadata.tags || [],
          isConfidential: metadata.isConfidential || false,
          accessLevel: metadata.accessLevel || "internal",
          employeeId: metadata.employeeId,
          department: metadata.department,
          expiryDate: metadata.expiryDate,
          version: 1,
          checksum: this.generateChecksum(file.name + file.size + Date.now()),
        }

        // Validate file against category rules
        const category = this.categories.get(document.category)
        if (category) {
          const fileExtension = file.name.split(".").pop()?.toLowerCase()
          if (fileExtension && !category.allowedFileTypes.includes(fileExtension)) {
            reject(new Error(`File type .${fileExtension} not allowed for category ${category.name}`))
            return
          }
          if (file.size > category.maxFileSize) {
            reject(new Error(`File size exceeds maximum allowed size for category ${category.name}`))
            return
          }
        }

        this.documents.set(documentId, document)
        resolve(document)
      } catch (error) {
        reject(error)
      }
    })
  }

  public getDocument(documentId: string): DocumentMetadata | undefined {
    return this.documents.get(documentId)
  }

  public getDocumentsByEmployee(employeeId: string): DocumentMetadata[] {
    return Array.from(this.documents.values()).filter((doc) => doc.employeeId === employeeId)
  }

  public getDocumentsByCategory(categoryId: string): DocumentMetadata[] {
    return Array.from(this.documents.values()).filter((doc) => doc.category === categoryId)
  }

  public searchDocuments(query: string): DocumentMetadata[] {
    const searchTerm = query.toLowerCase()
    return Array.from(this.documents.values()).filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        doc.category.toLowerCase().includes(searchTerm),
    )
  }

  public deleteDocument(documentId: string): boolean {
    return this.documents.delete(documentId)
  }

  public getCategories(): DocumentCategory[] {
    return Array.from(this.categories.values())
  }

  public addCategory(category: DocumentCategory): void {
    this.categories.set(category.id, category)
  }

  public updateCategory(categoryId: string, updates: Partial<DocumentCategory>): boolean {
    const category = this.categories.get(categoryId)
    if (category) {
      this.categories.set(categoryId, { ...category, ...updates })
      return true
    }
    return false
  }

  private generateChecksum(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  public getDocumentStats() {
    const totalDocuments = this.documents.size
    const documentsByCategory = new Map<string, number>()
    const documentsByAccessLevel = new Map<string, number>()
    let totalSize = 0

    this.documents.forEach((doc) => {
      // Count by category
      const categoryCount = documentsByCategory.get(doc.category) || 0
      documentsByCategory.set(doc.category, categoryCount + 1)

      // Count by access level
      const accessCount = documentsByAccessLevel.get(doc.accessLevel) || 0
      documentsByAccessLevel.set(doc.accessLevel, accessCount + 1)

      // Sum total size
      totalSize += doc.size
    })

    return {
      totalDocuments,
      totalSize,
      documentsByCategory: Object.fromEntries(documentsByCategory),
      documentsByAccessLevel: Object.fromEntries(documentsByAccessLevel),
    }
  }
}

// Export singleton instance
export const documentVault = DocumentVaultStorage.getInstance()
