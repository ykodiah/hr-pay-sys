// Advanced Document Service with RBAC, Audit Trails, E-Signatures, and Retention Policies
export interface UserRole {
  id: string
  name: string
  description: string
  permissions: Record<string, any>
  isActive: boolean
}

export interface DocumentAccessLog {
  id: string
  documentId: string
  userId: string
  action: string
  actionDetails?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  accessedAt: Date
}

export interface DocumentSignature {
  id: string
  documentId: string
  signerId: string
  signatureType: 'electronic' | 'digital' | 'wet_signature'
  signatureData: Record<string, any>
  signatureHash?: string
  signedAt: Date
  ipAddress?: string
  userAgent?: string
  isValid: boolean
  validationDetails?: Record<string, any>
}

export interface RetentionPolicy {
  id: string
  name: string
  description: string
  documentTypes: string[]
  categories: string[]
  retentionPeriodDays: number
  archiveAfterDays?: number
  deleteAfterDays?: number
  complianceRequirements: string[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentWorkflow {
  id: string
  documentId: string
  workflowType: string
  currentStep: number
  totalSteps: number
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  workflowData: Record<string, any>
  startedBy: string
  startedAt: Date
  completedAt?: Date
  completedBy?: string
}

export interface WorkflowStep {
  id: string
  workflowId: string
  stepNumber: number
  stepName: string
  stepType: 'approval' | 'review' | 'signature' | 'notification'
  assignedTo?: string
  assignedRole?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rejected'
  dueDate?: Date
  completedAt?: Date
  completedBy?: string
  stepData: Record<string, any>
  comments?: string
}

export interface DocumentComment {
  id: string
  documentId: string
  userId: string
  commentText: string
  commentType: 'general' | 'review' | 'approval' | 'rejection' | 'annotation'
  isInternal: boolean
  parentCommentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentSharing {
  id: string
  documentId: string
  sharedWithUserId?: string
  sharedWithRole?: string
  sharedBy: string
  permissionLevel: 'view' | 'comment' | 'edit' | 'admin'
  expiresAt?: Date
  isActive: boolean
  sharedAt: Date
}

export interface AdvancedDocument {
  id: string
  employeeId?: string
  employeeName?: string
  documentType: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  fileHash?: string
  uploadDate: Date
  uploadedBy: string
  status: 'pending' | 'approved' | 'rejected' | 'archived' | 'deleted'
  notes?: string
  source: string
  category: string
  
  // RBAC fields
  accessLevel: 'public' | 'standard' | 'confidential' | 'restricted'
  requiredRoles: string[]
  allowedUsers: string[]
  
  // E-signature fields
  requiresSignature: boolean
  signatureRequiredBy?: string
  signatureDeadline?: Date
  signatureStatus: 'not_required' | 'pending' | 'signed' | 'expired' | 'declined'
  signatureData?: Record<string, any>
  signedBy?: string
  signedAt?: Date
  
  // Retention policy fields
  retentionPolicyId?: string
  retentionPeriodDays?: number
  autoArchiveDate?: Date
  autoDeleteDate?: Date
  isArchived: boolean
  archivedAt?: Date
  archivedBy?: string
  
  // Compliance fields
  complianceCategory?: string
  gdprApplicable: boolean
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted'
  encryptionStatus: 'encrypted' | 'unencrypted' | 'pending'
  
  // Version control
  versionNumber: number
  parentDocumentId?: string
  isLatestVersion: boolean
  
  // Metadata
  metadata: Record<string, any>
  tags: string[]
  
  createdAt: Date
  updatedAt: Date
}

export class AdvancedDocumentService {
  private static instance: AdvancedDocumentService
  private documents: Map<string, AdvancedDocument> = new Map()
  private accessLogs: DocumentAccessLog[] = []
  private signatures: DocumentSignature[] = []
  private workflows: Map<string, DocumentWorkflow> = new Map()
  private workflowSteps: Map<string, WorkflowStep[]> = new Map()
  private comments: Map<string, DocumentComment[]> = new Map()
  private sharing: Map<string, DocumentSharing[]> = new Map()
  private roles: Map<string, UserRole> = new Map()
  private retentionPolicies: Map<string, RetentionPolicy> = new Map()

  static getInstance(): AdvancedDocumentService {
    if (!AdvancedDocumentService.instance) {
      AdvancedDocumentService.instance = new AdvancedDocumentService()
    }
    return AdvancedDocumentService.instance
  }

  constructor() {
    this.initializeDefaultData()
  }

  private initializeDefaultData() {
    // Initialize default roles
    const defaultRoles: UserRole[] = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access',
        permissions: { documents: { all: true }, users: { all: true }, settings: { all: true } },
        isActive: true
      },
      {
        id: 'hr_manager',
        name: 'HR Manager',
        description: 'Full document access',
        permissions: { documents: { all: true }, employees: { all: true } },
        isActive: true
      },
      {
        id: 'hr_specialist',
        name: 'HR Specialist',
        description: 'Standard document access',
        permissions: { documents: { view: true, upload: true, edit: true }, employees: { view: true, edit: true } },
        isActive: true
      },
      {
        id: 'manager',
        name: 'Department Manager',
        description: 'Team document access',
        permissions: { documents: { view: true, upload: true }, employees: { view: true } },
        isActive: true
      },
      {
        id: 'employee',
        name: 'Employee',
        description: 'Personal document access',
        permissions: { documents: { view: true, upload: true }, employees: { view: 'own' } },
        isActive: true
      },
      {
        id: 'auditor',
        name: 'Auditor',
        description: 'Read-only access',
        permissions: { documents: { view: true }, audit: { all: true } },
        isActive: true
      }
    ]

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role)
    })

    // Initialize default retention policies
    const defaultPolicies: RetentionPolicy[] = [
      {
        id: 'employee_records',
        name: 'Employee Records',
        description: 'Standard retention for employee documents',
        documentTypes: ['academic', 'resume', 'passport', 'national-id'],
        categories: ['employee-document'],
        retentionPeriodDays: 2555, // 7 years
        archiveAfterDays: 1825, // 5 years
        deleteAfterDays: 2555, // 7 years
        complianceRequirements: ['GDPR', 'Labor Law'],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'medical_records',
        name: 'Medical Records',
        description: 'Medical document retention policy',
        documentTypes: ['medical'],
        categories: ['employee-document'],
        retentionPeriodDays: 1825, // 5 years
        archiveAfterDays: 1095, // 3 years
        deleteAfterDays: 1825, // 5 years
        complianceRequirements: ['Medical Privacy', 'GDPR'],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultPolicies.forEach(policy => {
      this.retentionPolicies.set(policy.id, policy)
    })
  }

  // Document Management
  async uploadDocument(params: {
    file: File
    employeeId?: string
    employeeName?: string
    documentType: string
    source: string
    uploadedBy: string
    notes?: string
    accessLevel?: 'public' | 'standard' | 'confidential' | 'restricted'
    requiredRoles?: string[]
    allowedUsers?: string[]
    requiresSignature?: boolean
    signatureRequiredBy?: string
    signatureDeadline?: Date
    tags?: string[]
    metadata?: Record<string, any>
  }): Promise<string> {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Simulate file upload
    const fileUrl = await this.simulateFileUpload(params.file)
    const fileHash = await this.generateFileHash(params.file)
    
    // Determine retention policy
    const retentionPolicy = this.getRetentionPolicy(params.documentType, params.source)
    
    // Calculate retention dates
    const now = new Date()
    const autoArchiveDate = retentionPolicy ? 
      new Date(now.getTime() + (retentionPolicy.archiveAfterDays || retentionPolicy.retentionPeriodDays) * 24 * 60 * 60 * 1000) : 
      undefined
    const autoDeleteDate = retentionPolicy ? 
      new Date(now.getTime() + retentionPolicy.deleteAfterDays! * 24 * 60 * 60 * 1000) : 
      undefined

    const document: AdvancedDocument = {
      id: documentId,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      documentType: params.documentType,
      fileName: params.file.name,
      fileSize: params.file.size,
      fileType: params.file.type,
      fileUrl,
      fileHash,
      uploadDate: now,
      uploadedBy: params.uploadedBy,
      status: 'pending',
      notes: params.notes,
      source: params.source,
      category: this.determineCategory(params.documentType, params.source),
      
      // RBAC
      accessLevel: params.accessLevel || 'standard',
      requiredRoles: params.requiredRoles || [],
      allowedUsers: params.allowedUsers || [],
      
      // E-signature
      requiresSignature: params.requiresSignature || false,
      signatureRequiredBy: params.signatureRequiredBy,
      signatureDeadline: params.signatureDeadline,
      signatureStatus: params.requiresSignature ? 'pending' : 'not_required',
      
      // Retention
      retentionPolicyId: retentionPolicy?.id,
      retentionPeriodDays: retentionPolicy?.retentionPeriodDays,
      autoArchiveDate,
      autoDeleteDate,
      isArchived: false,
      
      // Compliance
      gdprApplicable: this.isGdprApplicable(params.documentType),
      dataClassification: this.getDataClassification(params.accessLevel || 'standard'),
      encryptionStatus: 'encrypted',
      
      // Version control
      versionNumber: 1,
      isLatestVersion: true,
      
      // Metadata
      metadata: params.metadata || {},
      tags: params.tags || [],
      
      createdAt: now,
      updatedAt: now
    }

    this.documents.set(documentId, document)
    
    // Log access
    await this.logDocumentAccess(documentId, 'upload', {
      fileName: params.file.name,
      fileSize: params.file.size,
      fileType: params.file.type
    })

    // Start workflow if required
    if (this.requiresWorkflow(params.documentType)) {
      await this.startDocumentWorkflow(documentId, 'approval')
    }

    console.log(`[Advanced Document Service] Document uploaded:`, {
      id: documentId,
      fileName: params.file.name,
      accessLevel: document.accessLevel,
      requiresSignature: document.requiresSignature,
      retentionPolicy: retentionPolicy?.name
    })

    return documentId
  }

  // Access Control
  async checkDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    // Check if user has specific access
    if (document.allowedUsers.includes(userId)) {
      return true
    }

    // Check if user has required role
    if (document.requiredRoles.length > 0) {
      // In a real implementation, check user roles from database
      const userHasRole = await this.checkUserRoles(userId, document.requiredRoles)
      if (userHasRole) return true
    }

    // Check access level
    if (document.accessLevel === 'public') return true

    // Check if user is the uploader or employee
    if (userId === document.uploadedBy || userId === document.employeeId) return true

    return false
  }

  async getAccessibleDocuments(userId: string): Promise<AdvancedDocument[]> {
    const accessibleDocs: AdvancedDocument[] = []
    
    for (const doc of this.documents.values()) {
      if (await this.checkDocumentAccess(doc.id, userId)) {
        accessibleDocs.push(doc)
      }
    }
    
    return accessibleDocs
  }

  // Audit Trail
  async logDocumentAccess(
    documentId: string, 
    action: string, 
    actionDetails?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const log: DocumentAccessLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      userId: userId || 'current-user',
      action,
      actionDetails,
      ipAddress: '127.0.0.1', // In production, get from request
      userAgent: navigator.userAgent,
      sessionId: 'session-id', // In production, get from session
      accessedAt: new Date()
    }

    this.accessLogs.push(log)
    
    console.log(`[Audit Trail] Document ${action}:`, {
      documentId,
      userId: log.userId,
      action,
      timestamp: log.accessedAt
    })
  }

  async getDocumentAccessLogs(documentId: string): Promise<DocumentAccessLog[]> {
    return this.accessLogs.filter(log => log.documentId === documentId)
  }

  // E-Signatures
  async requestSignature(
    documentId: string, 
    signerId: string, 
    signatureType: 'electronic' | 'digital' = 'electronic',
    deadline?: Date
  ): Promise<string> {
    const document = this.documents.get(documentId)
    if (!document) throw new Error('Document not found')

    document.requiresSignature = true
    document.signatureRequiredBy = signerId
    document.signatureDeadline = deadline
    document.signatureStatus = 'pending'

    // Log signature request
    await this.logDocumentAccess(documentId, 'signature_requested', {
      signerId,
      signatureType,
      deadline
    })

    console.log(`[E-Signature] Signature requested for document ${documentId} by ${signerId}`)
    return `signature_request_${Date.now()}`
  }

  async addSignature(
    documentId: string,
    signerId: string,
    signatureData: Record<string, any>,
    signatureType: 'electronic' | 'digital' | 'wet_signature' = 'electronic'
  ): Promise<string> {
    const document = this.documents.get(documentId)
    if (!document) throw new Error('Document not found')

    const signature: DocumentSignature = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      signerId,
      signatureType,
      signatureData,
      signatureHash: await this.generateSignatureHash(signatureData),
      signedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
      isValid: true
    }

    this.signatures.push(signature)

    // Update document
    document.signatureStatus = 'signed'
    document.signedBy = signerId
    document.signedAt = new Date()
    document.signatureData = signatureData

    // Log signature
    await this.logDocumentAccess(documentId, 'signed', {
      signerId,
      signatureType,
      signatureId: signature.id
    })

    console.log(`[E-Signature] Document ${documentId} signed by ${signerId}`)
    return signature.id
  }

  async getDocumentSignatures(documentId: string): Promise<DocumentSignature[]> {
    return this.signatures.filter(sig => sig.documentId === documentId)
  }

  // Retention Policies
  private getRetentionPolicy(documentType: string, source: string): RetentionPolicy | undefined {
    for (const policy of this.retentionPolicies.values()) {
      if (policy.isActive && 
          (policy.documentTypes.includes(documentType) || policy.categories.includes(this.determineCategory(documentType, source)))) {
        return policy
      }
    }
    return undefined
  }

  async applyRetentionPolicies(): Promise<void> {
    const now = new Date()
    
    for (const doc of this.documents.values()) {
      if (doc.autoArchiveDate && now >= doc.autoArchiveDate && !doc.isArchived) {
        await this.archiveDocument(doc.id, 'retention_policy')
      }
      
      if (doc.autoDeleteDate && now >= doc.autoDeleteDate) {
        await this.deleteDocument(doc.id, 'retention_policy')
      }
    }
  }

  async archiveDocument(documentId: string, reason: string): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    document.isArchived = true
    document.archivedAt = new Date()
    document.archivedBy = 'system'
    document.status = 'archived'

    await this.logDocumentAccess(documentId, 'archived', { reason })
    console.log(`[Retention] Document ${documentId} archived: ${reason}`)
  }

  async deleteDocument(documentId: string, reason: string): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    document.status = 'deleted'
    document.updatedAt = new Date()

    await this.logDocumentAccess(documentId, 'deleted', { reason })
    console.log(`[Retention] Document ${documentId} deleted: ${reason}`)
  }

  // Workflows
  async startDocumentWorkflow(documentId: string, workflowType: string): Promise<string> {
    const workflow: DocumentWorkflow = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      workflowType,
      currentStep: 1,
      totalSteps: this.getWorkflowSteps(workflowType).length,
      status: 'active',
      workflowData: {},
      startedBy: 'current-user',
      startedAt: new Date()
    }

    this.workflows.set(workflow.id, workflow)

    // Create workflow steps
    const steps = this.getWorkflowSteps(workflowType).map((step, index) => ({
      id: `step_${Date.now()}_${index}`,
      workflowId: workflow.id,
      stepNumber: index + 1,
      stepName: step.name,
      stepType: step.type,
      assignedTo: step.assignedTo,
      assignedRole: step.assignedRole,
      status: 'pending' as const,
      dueDate: step.dueDate,
      stepData: step.data || {},
      comments: step.comments
    }))

    this.workflowSteps.set(workflow.id, steps)

    console.log(`[Workflow] Started ${workflowType} workflow for document ${documentId}`)
    return workflow.id
  }

  private getWorkflowSteps(workflowType: string): any[] {
    const workflows = {
      approval: [
        { name: 'HR Review', type: 'review', assignedRole: 'hr_specialist', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
        { name: 'Manager Approval', type: 'approval', assignedRole: 'hr_manager', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }
      ],
      signature: [
        { name: 'Prepare for Signature', type: 'notification', assignedRole: 'hr_specialist' },
        { name: 'Collect Signature', type: 'signature', assignedRole: 'employee' }
      ]
    }

    return workflows[workflowType as keyof typeof workflows] || []
  }

  // Comments and Collaboration
  async addComment(
    documentId: string,
    userId: string,
    commentText: string,
    commentType: 'general' | 'review' | 'approval' | 'rejection' | 'annotation' = 'general',
    isInternal: boolean = true,
    parentCommentId?: string
  ): Promise<string> {
    const comment: DocumentComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      userId,
      commentText,
      commentType,
      isInternal,
      parentCommentId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.comments.has(documentId)) {
      this.comments.set(documentId, [])
    }
    this.comments.get(documentId)!.push(comment)

    await this.logDocumentAccess(documentId, 'comment_added', {
      commentId: comment.id,
      commentType,
      isInternal
    })

    console.log(`[Comments] Comment added to document ${documentId}`)
    return comment.id
  }

  async getDocumentComments(documentId: string): Promise<DocumentComment[]> {
    return this.comments.get(documentId) || []
  }

  // Sharing and Collaboration
  async shareDocument(
    documentId: string,
    sharedWithUserId: string,
    permissionLevel: 'view' | 'comment' | 'edit' | 'admin',
    expiresAt?: Date,
    sharedBy: string = 'current-user'
  ): Promise<string> {
    const sharing: DocumentSharing = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      sharedWithUserId,
      sharedBy,
      permissionLevel,
      expiresAt,
      isActive: true,
      sharedAt: new Date()
    }

    if (!this.sharing.has(documentId)) {
      this.sharing.set(documentId, [])
    }
    this.sharing.get(documentId)!.push(sharing)

    await this.logDocumentAccess(documentId, 'shared', {
      sharedWithUserId,
      permissionLevel,
      expiresAt
    })

    console.log(`[Sharing] Document ${documentId} shared with ${sharedWithUserId}`)
    return sharing.id
  }

  // Utility Methods
  private async simulateFileUpload(file: File): Promise<string> {
    // In production, upload to cloud storage
    return `https://storage.akwaabahrpay.com/documents/${Date.now()}_${file.name}`
  }

  private async generateFileHash(file: File): Promise<string> {
    // In production, generate actual file hash
    return `hash_${Date.now()}_${file.size}`
  }

  private async generateSignatureHash(signatureData: Record<string, any>): Promise<string> {
    // In production, generate actual signature hash
    return `sig_hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private determineCategory(documentType: string, source: string): string {
    if (source === 'employee-onboarding' || source === 'recruitment') {
      return 'employee-document'
    }
    if (source === 'settings') {
      return 'company-asset'
    }
    if (source === 'training') {
      return 'training-content'
    }
    return 'system-data'
  }

  private isGdprApplicable(documentType: string): boolean {
    const gdprTypes = ['academic', 'passport', 'national-id', 'medical', 'resume']
    return gdprTypes.includes(documentType)
  }

  private getDataClassification(accessLevel: string): 'public' | 'internal' | 'confidential' | 'restricted' {
    const classificationMap = {
      'public': 'public',
      'standard': 'internal',
      'confidential': 'confidential',
      'restricted': 'restricted'
    }
    return classificationMap[accessLevel as keyof typeof classificationMap] || 'internal'
  }

  private requiresWorkflow(documentType: string): boolean {
    const workflowTypes = ['academic', 'medical', 'police', 'passport']
    return workflowTypes.includes(documentType)
  }

  private async checkUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    // In production, check against actual user roles in database
    // For now, simulate based on user ID patterns
    const userRoleMap: Record<string, string[]> = {
      'admin': ['super_admin', 'hr_manager', 'hr_specialist', 'manager', 'employee', 'auditor'],
      'hr-manager': ['hr_manager', 'hr_specialist', 'employee'],
      'hr-specialist': ['hr_specialist', 'employee'],
      'manager': ['manager', 'employee'],
      'employee': ['employee'],
      'auditor': ['auditor']
    }

    const userRoles = userRoleMap[userId] || ['employee']
    return requiredRoles.some(role => userRoles.includes(role))
  }

  // Getters
  getAllDocuments(): AdvancedDocument[] {
    return Array.from(this.documents.values())
  }

  getDocumentById(id: string): AdvancedDocument | undefined {
    return this.documents.get(id)
  }

  getRoles(): UserRole[] {
    return Array.from(this.roles.values())
  }

  getRetentionPolicies(): RetentionPolicy[] {
    return Array.from(this.retentionPolicies.values())
  }

  getWorkflows(): DocumentWorkflow[] {
    return Array.from(this.workflows.values())
  }
}