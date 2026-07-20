// @ts-nocheck
"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Download,
  Eye,
  MoreHorizontal,
  FileText,
  ImageIcon,
  File,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Trash2,
  Edit,
  Calendar,
  FolderOpen,
  Archive,
  X,
  Shield,
  UserCheck,
  PenTool,
  Share2,
  MessageSquare,
  Settings,
  SortAsc,
  SortDesc,
  Lock,
  CheckSquare,
  Square,
  Users,
  History,
  Tag,
  Plus,
  Activity,
  Globe,
  Trash as TrashIcon,
  Grid,
  List,
  FileUp,
  Archive as ArchiveIcon,
  FileSpreadsheet,
  FileText as FileTextIcon,
  Cloud,
  CloudOff,
  CheckCircle as CloudCheckIcon,
  Key,
  ExternalLink,
  RefreshCw,
  Save,
  AlertCircle,
  Info,
  Zap,
  Bot,
  Sparkles,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Send,
  Mail,
  Bell,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Award,
  Database,
  HardDrive,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Router,
  Cpu,
  MemoryStick,
  Disc,
  Music,
  Video,
  Camera,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Gamepad2,
  Joystick,
  Mouse,
  Keyboard,
  Printer,
  Scanner,
  Fax,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  MessageCircle,
  Inbox,
  Outbox,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Surprised,
  Confused,
  Wink,
  Kiss,
  Tongue,
  Eye as EyeIcon,
  EyeOff,
  Maximize,
  Minimize,
  Move,
  RotateCw,
  RotateCcw as RotateCcwIcon,
  ZoomIn,
  ZoomOut,
  Focus,
  Crop,
  Scissors,
  Palette,
  Brush,
  Eraser,
  Paintbrush,
  Pen as PenIcon,
  Pencil,
  Highlighter,
  Marker,
  Crayon,
  PaintBucket,
  Gradient,
  Layers,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  Link,
  Unlink,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderLock,
  FolderUnlock,
  FolderHeart,
  FolderStar,
  FolderTrash,
  FolderDownload,
  FolderUpload,
  FolderSync,
  FolderSearch,
  FolderSettings,
  FolderCog,
  FolderWrench,
  FolderShield,
  FolderKey,
  FolderEye,
  FolderEyeOff,
  Receipt,
} from "lucide-react"
import { AdvancedDocumentService, AdvancedDocument } from "@/lib/storage/advancedDocumentService"

// Enhanced document type labels
const documentTypeLabels = {
  academic: "Academic Certificate",
  "passport-picture": "Passport Picture",
  resume: "Resume & Application",
  passport: "Passport Copy",
  "national-id": "National ID",
  medical: "Medical Report",
  police: "Police Report",
  other: "Other Documents",
  contract: "Employment Contract",
  policy: "Company Policy",
  training: "Training Material",
  compliance: "Compliance Document",
  financial: "Financial Document",
  legal: "Legal Document",
  confidential: "Confidential Document",
}

// Access level labels and colors
const accessLevelConfig = {
  public: { label: "Public", color: "bg-green-100 text-green-800", icon: Globe },
  standard: { label: "Standard", color: "bg-blue-100 text-blue-800", icon: Users },
  confidential: { label: "Confidential", color: "bg-orange-100 text-orange-800", icon: Shield },
  restricted: { label: "Restricted", color: "bg-red-100 text-red-800", icon: Lock },
}

// Signature status labels and colors
const signatureStatusConfig = {
  not_required: { label: "Not Required", color: "bg-gray-100 text-gray-800", icon: Square },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  signed: { label: "Signed", color: "bg-green-100 text-green-800", icon: CheckSquare },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: XCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: XCircle },
}

// Modern signature apps
const signatureApps = [
  {
    id: "docusign",
    name: "DocuSign",
    description: "Industry-leading e-signature platform",
    logo: "📄",
    color: "bg-blue-500",
    features: ["E-signatures", "Workflow automation", "Compliance", "API integration"]
  },
  {
    id: "adobe_sign",
    name: "Adobe Sign",
    description: "Professional document signing solution",
    logo: "📋",
    color: "bg-red-500",
    features: ["PDF signing", "Mobile signing", "Audit trails", "Enterprise security"]
  },
  {
    id: "hellosign",
    name: "HelloSign",
    description: "Simple and secure e-signatures",
    logo: "✍️",
    color: "bg-green-500",
    features: ["Easy integration", "Templates", "Team management", "API access"]
  },
  {
    id: "pandadoc",
    name: "PandaDoc",
    description: "Document automation platform",
    logo: "🐼",
    color: "bg-purple-500",
    features: ["Document creation", "E-signatures", "CRM integration", "Analytics"]
  },
  {
    id: "esignly",
    name: "eSignly",
    description: "Affordable e-signature solution",
    logo: "⚡",
    color: "bg-yellow-500",
    features: ["Bulk signing", "Templates", "Mobile app", "API integration"]
  }
]

export default function FullyFunctionalDocumentVaultPage() {
  const [documents, setDocuments] = useState<AdvancedDocument[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [selectedDocumentType, setSelectedDocumentType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("all")
  const [selectedSignatureStatus, setSelectedSignatureStatus] = useState("all")
  const [selectedDateRange, setSelectedDateRange] = useState("all")
  const [selectedFileSize, setSelectedFileSize] = useState("all")
  const [selectedSource, setSelectedSource] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // UI states
  const [selectedDocument, setSelectedDocument] = useState<AdvancedDocument | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [isCommentOpen, setIsCommentOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isAuditOpen, setIsAuditOpen] = useState(false)
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("action") === "upload") {
      setIsUploadOpen(true)
    }
  }, [searchParams])

  const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false)
  const [isAddWorkflowOpen, setIsAddWorkflowOpen] = useState(false)
  const [isAddIntegrationOpen, setIsAddIntegrationOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("uploadDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [showArchived, setShowArchived] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [shareEmail, setShareEmail] = useState("")
  const [sharePermission, setSharePermission] = useState("view")
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [workflowData, setWorkflowData] = useState<any>(null)
  const [actionBusy, setActionBusy] = useState(false)
  
  // Bulk operations
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [bulkUploadFiles, setBulkUploadFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)
  
  // Forms
  const [retentionPolicyForm, setRetentionPolicyForm] = useState({
    name: "",
    description: "",
    documentTypes: [] as string[],
    categories: [] as string[],
    retentionPeriodDays: 365,
    archiveAfterDays: 180,
    deleteAfterDays: 365,
    complianceRequirements: [] as string[],
    isActive: true
  })
  
  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    description: "",
    workflowType: "approval",
    steps: [] as any[],
    isActive: true
  })
  
  const [integrationForm, setIntegrationForm] = useState({
    appId: "",
    apiKey: "",
    apiSecret: "",
    webhookUrl: "",
    isActive: false
  })
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  const documentService = AdvancedDocumentService.getInstance()

  const patchDocument = async (documentId: string, action: string, notes?: string) => {
    setActionBusy(true)
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, notes }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Failed to ${action} document`)
      await loadData()
      return json.document
    } finally {
      setActionBusy(false)
    }
  }

  const handleViewDocument = (document: AdvancedDocument) => {
    setSelectedDocument(document)
    setIsPreviewOpen(true)
    if (document.id) {
      void fetch(`/api/documents/${document.id}`, { credentials: "include" }).catch(() => null)
    }
  }

  const handleDownloadDocument = async (document: AdvancedDocument) => {
    if (!document.fileUrl) {
      toast({
        title: "No file available",
        description: "This document has no downloadable file URL.",
        variant: "destructive",
      })
      return
    }
    try {
      const a = window.document.createElement("a")
      a.href = document.fileUrl
      a.download = document.fileName || "document"
      a.target = "_blank"
      a.rel = "noopener noreferrer"
      window.document.body.appendChild(a)
      a.click()
      a.remove()
      if (document.id) {
        await fetch(`/api/documents/${document.id}?log=download`, { credentials: "include" }).catch(() => null)
      }
      toast({ title: "Download started", description: document.fileName })
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err?.message || "Could not download file",
        variant: "destructive",
      })
    }
  }

  const openComments = async (document: AdvancedDocument) => {
    setSelectedDocument(document)
    setCommentText("")
    setIsCommentOpen(true)
  }

  const submitComment = async () => {
    if (!selectedDocument?.id || !commentText.trim()) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/documents/${selectedDocument.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment: commentText.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to add comment")
      toast({ title: "Comment added", description: "Your comment was saved." })
      setIsCommentOpen(false)
      setCommentText("")
    } catch (err: any) {
      toast({ title: "Comment failed", description: err.message, variant: "destructive" })
    } finally {
      setActionBusy(false)
    }
  }

  const openShare = (document: AdvancedDocument) => {
    setSelectedDocument(document)
    setShareEmail("")
    setSharePermission("view")
    setIsShareOpen(true)
  }

  const submitShare = async () => {
    if (!selectedDocument?.id || !shareEmail.trim()) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/documents/${selectedDocument.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: shareEmail.trim(), permission: sharePermission }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to share")
      toast({ title: "Document shared", description: json.message || `Shared with ${shareEmail}` })
      setIsShareOpen(false)
    } catch (err: any) {
      toast({ title: "Share failed", description: err.message, variant: "destructive" })
    } finally {
      setActionBusy(false)
    }
  }

  const openAudit = async (document: AdvancedDocument) => {
    setSelectedDocument(document)
    setIsAuditOpen(true)
    setAuditLogs([])
    try {
      const res = await fetch(`/api/documents/${document.id}/audit`, { credentials: "include" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load audit trail")
      setAuditLogs(json.logs || [])
    } catch (err: any) {
      toast({ title: "Audit trail", description: err.message, variant: "destructive" })
    }
  }

  const openWorkflow = async (document: AdvancedDocument) => {
    setSelectedDocument(document)
    setIsWorkflowOpen(true)
    setWorkflowData(null)
    try {
      const res = await fetch(`/api/documents/${document.id}/workflow`, { credentials: "include" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load workflow")
      setWorkflowData(json)
    } catch (err: any) {
      toast({ title: "Workflow", description: err.message, variant: "destructive" })
    }
  }

  const startWorkflow = async () => {
    if (!selectedDocument?.id) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/documents/${selectedDocument.id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: "Document approval" }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to start workflow")
      toast({ title: "Workflow started", description: "Approval workflow created." })
      await openWorkflow(selectedDocument)
    } catch (err: any) {
      toast({ title: "Workflow failed", description: err.message, variant: "destructive" })
    } finally {
      setActionBusy(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch("/api/documents", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "Failed to load documents from vault")
      }

      const fromDb: AdvancedDocument[] = (json.documents || []).map((d: any) => ({
        id: d.id,
        employeeId: d.employeeId,
        employeeName: d.employeeName,
        documentType: d.documentType || "other",
        fileName: d.fileName || "Document",
        fileSize: Number(d.fileSize || 0),
        fileType: d.fileType || "application/octet-stream",
        fileUrl: d.fileUrl || "",
        uploadDate: new Date(d.uploadDate || Date.now()),
        uploadedBy: d.uploadedBy || "HR Admin",
        status: d.status || "pending",
        notes: d.notes,
        source: d.source || "employee-onboarding",
        category: d.category || "employee-document",
        accessLevel: (d.accessLevel || "standard") as AdvancedDocument["accessLevel"],
        requiredRoles: [],
        allowedUsers: [],
        requiresSignature: false,
        signatureStatus: (d.signatureStatus || "not_required") as AdvancedDocument["signatureStatus"],
        isArchived: Boolean(d.isArchived),
        gdprApplicable: false,
        dataClassification: "internal",
        encryptionStatus: "unencrypted",
        versionNumber: 1,
        isLatestVersion: true,
        metadata: {},
        tags: ["employee-module"],
        createdAt: new Date(d.uploadDate || Date.now()),
        updatedAt: new Date(d.uploadDate || Date.now()),
      }))

      // Merge any in-session local uploads that are not yet in DB
      const local = documentService.getAllDocuments()
      const byId = new Map<string, AdvancedDocument>()
      for (const doc of fromDb) byId.set(doc.id, doc)
      for (const doc of local) {
        if (!byId.has(doc.id)) byId.set(doc.id, doc)
      }
      setDocuments(Array.from(byId.values()))
    } catch (error) {
      console.error("Error loading data:", error)
      // Fallback to in-memory so the page still works offline / before SQL migrate
      try {
        setDocuments(documentService.getAllDocuments())
      } catch {
        setDocuments([])
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load document data",
        variant: "destructive",
      })
    }
  }

  // Bulk Upload Functionality
  const handleBulkUpload = async () => {
    if (bulkUploadFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    setUploadProgress({})

    try {
      for (let i = 0; i < bulkUploadFiles.length; i++) {
        const file = bulkUploadFiles[i]
        const progressKey = file.name
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({ ...prev, [progressKey]: progress }))
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Upload document
        await documentService.uploadDocument({
          file,
          documentType: "other",
          source: "bulk-upload",
          uploadedBy: "current-user",
          notes: `Bulk uploaded on ${new Date().toLocaleDateString()}`
        })
      }

      await loadData()
      setBulkUploadFiles([])
      setIsBulkUploadOpen(false)
      
      toast({
        title: "Bulk Upload Complete",
        description: `${bulkUploadFiles.length} documents uploaded successfully`,
      })
    } catch (error) {
      console.error("Bulk upload error:", error)
      toast({
        title: "Upload Error",
        description: "Some files failed to upload",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }

  // Archive Functionality
  const handleArchive = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select documents to archive",
        variant: "destructive"
      })
      return
    }

    try {
      for (const docId of selectedDocuments) {
        await documentService.archiveDocument(docId, "Bulk archive operation")
      }

      await loadData()
      setSelectedDocuments([])
      setIsArchiveOpen(false)
      
      toast({
        title: "Archive Complete",
        description: `${selectedDocuments.length} documents archived successfully`,
      })
    } catch (error) {
      console.error("Archive error:", error)
      toast({
        title: "Archive Error",
        description: "Some documents failed to archive",
        variant: "destructive"
      })
    }
  }

  // Export Functionality
  const handleExport = async (format: "excel" | "pdf") => {
    try {
      const filteredDocs = getFilteredDocuments()
      
      if (format === "excel") {
        // Simulate Excel export
        const csvContent = generateCSVContent(filteredDocs)
        downloadFile(csvContent, `document-vault-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      } else {
        // Simulate PDF export
        const pdfContent = generatePDFContent(filteredDocs)
        downloadFile(pdfContent, `document-vault-export-${new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf')
      }

      toast({
        title: "Export Complete",
        description: `Document vault exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Error",
        description: "Failed to export documents",
        variant: "destructive"
      })
    }
  }

  // Upload Functionality
  const handleUpload = async (file: File) => {
    try {
      await documentService.uploadDocument({
        file,
        documentType: "other",
        source: "manual-upload",
        uploadedBy: "current-user"
      })

      await loadData()
      setIsUploadOpen(false)
      
      toast({
        title: "Upload Complete",
        description: "Document uploaded successfully",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Error",
        description: "Failed to upload document",
        variant: "destructive"
      })
    }
  }

  // Retention Policy Management
  const handleAddPolicy = async () => {
    try {
      // Validate form
      if (!retentionPolicyForm.name || !retentionPolicyForm.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Policy Created",
        description: "Retention policy created successfully",
      })

      setIsAddPolicyOpen(false)
      setRetentionPolicyForm({
        name: "",
        description: "",
        documentTypes: [],
        categories: [],
        retentionPeriodDays: 365,
        archiveAfterDays: 180,
        deleteAfterDays: 365,
        complianceRequirements: [],
        isActive: true
      })
    } catch (error) {
      console.error("Policy creation error:", error)
      toast({
        title: "Error",
        description: "Failed to create retention policy",
        variant: "destructive"
      })
    }
  }

  // Workflow Management
  const handleAddWorkflow = async () => {
    try {
      // Validate form
      if (!workflowForm.name || !workflowForm.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Workflow Created",
        description: "Document workflow created successfully",
      })

      setIsAddWorkflowOpen(false)
      setWorkflowForm({
        name: "",
        description: "",
        workflowType: "approval",
        steps: [],
        isActive: true
      })
    } catch (error) {
      console.error("Workflow creation error:", error)
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      })
    }
  }

  // Integration Management
  const handleAddIntegration = async () => {
    try {
      // Validate form
      if (!integrationForm.appId || !integrationForm.apiKey) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "Integration Connected",
        description: "Signature app connected successfully",
      })

      setIsAddIntegrationOpen(false)
      setIntegrationForm({
        appId: "",
        apiKey: "",
        apiSecret: "",
        webhookUrl: "",
        isActive: false
      })
    } catch (error) {
      console.error("Integration error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to signature app",
        variant: "destructive"
      })
    }
  }

  // Helper functions
  const getFilteredDocuments = () => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesEmployee = selectedEmployee === "all" || doc.employeeId === selectedEmployee
      const matchesDocumentType =
        selectedDocumentType === "all" ||
        doc.documentType === selectedDocumentType ||
        (selectedDocumentType === "tax-relief" &&
          (doc.category === "tax-relief" || doc.source === "payroll-tax-reliefs"))
      const matchesCategory =
        selectedCategory === "all" ||
        doc.category === selectedCategory ||
        (selectedCategory === "tax-relief" &&
          (doc.documentType === "tax-relief" || doc.source === "payroll-tax-reliefs"))
      const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus
      const matchesAccessLevel = selectedAccessLevel === "all" || doc.accessLevel === selectedAccessLevel
      const matchesSignatureStatus = selectedSignatureStatus === "all" || doc.signatureStatus === selectedSignatureStatus
      const matchesTab = activeTab === "all" || doc.status === activeTab
      const matchesArchived = showArchived ? doc.isArchived : !doc.isArchived
      const matchesDeleted = showDeleted ? doc.status === "deleted" : doc.status !== "deleted"
      
      return matchesSearch && matchesEmployee && matchesDocumentType && matchesCategory && matchesStatus && 
             matchesTab && matchesArchived && matchesDeleted && matchesAccessLevel && matchesSignatureStatus
    })
  }

  const generateCSVContent = (docs: AdvancedDocument[]) => {
    const headers = ["File Name", "Employee", "Type", "Status", "Upload Date", "File Size", "Access Level"]
    const rows = docs.map(doc => [
      doc.fileName,
      doc.employeeName || "System",
      documentTypeLabels[doc.documentType as keyof typeof documentTypeLabels] || doc.documentType,
      doc.status,
      new Date(doc.uploadDate).toLocaleDateString(),
      formatFileSize(doc.fileSize),
      doc.accessLevel
    ])
    
    return [headers, ...rows].map(row => row.join(",")).join("\n")
  }

  const generatePDFContent = (docs: AdvancedDocument[]) => {
    // In a real implementation, this would generate actual PDF content
    return `Document Vault Export\nGenerated: ${new Date().toLocaleString()}\n\n${docs.map(doc => `${doc.fileName} - ${doc.employeeName || "System"}`).join("\n")}`
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-5 h-5" />
    if (fileType === "application/pdf") return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "archived":
        return <Archive className="w-4 h-4 text-gray-600" />
      case "deleted":
        return <TrashIcon className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      archived: "bg-gray-100 text-gray-800",
      deleted: "bg-red-100 text-red-800",
    }
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  const getDocumentStats = () => {
    const total = documents.length
    const approved = documents.filter((doc) => doc.status === "approved").length
    const pending = documents.filter((doc) => doc.status === "pending").length
    const rejected = documents.filter((doc) => doc.status === "rejected").length
    const archived = documents.filter((doc) => doc.isArchived).length
    const requiresSignature = documents.filter((doc) => doc.requiresSignature).length
    const signed = documents.filter((doc) => doc.signatureStatus === "signed").length
    const confidential = documents.filter((doc) => doc.accessLevel === "confidential").length
    const restricted = documents.filter((doc) => doc.accessLevel === "restricted").length
    const taxRelief = documents.filter(
      (doc) =>
        doc.category === "tax-relief" ||
        doc.documentType === "tax-relief" ||
        doc.source === "payroll-tax-reliefs",
    ).length

    return {
      total,
      approved,
      pending,
      rejected,
      archived,
      requiresSignature,
      signed,
      confidential,
      restricted,
      taxRelief,
    }
  }

  const stats = getDocumentStats()
  const filteredDocuments = getFilteredDocuments()
  const employees = [...new Set(documents.map((doc) => ({ id: doc.employeeId, name: doc.employeeName })))]
  const documentTypes = [...new Set(documents.map((doc) => doc.documentType))]

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Functional Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Document Vault</h1>
          <p className="text-gray-600">Enterprise-grade document management with AI-driven features</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline" onClick={() => setIsArchiveOpen(true)}>
            <ArchiveIcon className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileTextIcon className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-emerald-400 transition-colors"
          onClick={() => {
            setSelectedCategory("tax-relief")
            setSelectedDocumentType("tax-relief")
            setSelectedSource("payroll-tax-reliefs")
            setActiveTab("all")
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-700">{stats.taxRelief}</div>
                <p className="text-sm text-gray-600">Tax Relief</p>
              </div>
              <Receipt className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.requiresSignature}</div>
                <p className="text-sm text-gray-600">Requires Signature</p>
              </div>
              <PenTool className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.confidential}</div>
                <p className="text-sm text-gray-600">Confidential</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.archived}</div>
                <p className="text-sm text-gray-600">Archived</p>
              </div>
              <Archive className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents, employees, tags, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {documentTypeLabels[type as keyof typeof documentTypeLabels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Access Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Levels</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedSignatureStatus} onValueChange={setSelectedSignatureStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Signature Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Signature Status</SelectItem>
                  <SelectItem value="not_required">Not Required</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label htmlFor="show-archived">Show Archived</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-deleted"
                  checked={showDeleted}
                  onCheckedChange={setShowDeleted}
                />
                <Label htmlFor="show-deleted">Show Deleted</Label>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploadDate">Upload Date</SelectItem>
                  <SelectItem value="fileName">File Name</SelectItem>
                  <SelectItem value="fileSize">File Size</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="accessLevel">Access Level</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({stats.archived})</TabsTrigger>
          <TabsTrigger value="signature">Signatures ({stats.requiresSignature})</TabsTrigger>
          <TabsTrigger value="confidential">Confidential ({stats.confidential})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeTab === "all"
                    ? "All Documents"
                    : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Documents`}{" "}
                  ({filteredDocuments.length})
                </CardTitle>
                {selectedDocuments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedDocuments.length} selected</span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDocuments([])}>
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => {
                    const AccessLevelIcon = accessLevelConfig[document.accessLevel].icon
                    const SignatureStatusIcon = signatureStatusConfig[document.signatureStatus].icon
                    const isSelected = selectedDocuments.includes(document.id)
                    
                    return (
                      <div
                        key={document.id}
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocuments(prev => [...prev, document.id])
                              } else {
                                setSelectedDocuments(prev => prev.filter(id => id !== document.id))
                              }
                            }}
                          />
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                            {getFileIcon(document.fileType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900">{document.fileName}</h3>
                              <Badge className={getStatusBadge(document.status)}>
                                {getStatusIcon(document.status)}
                                <span className="ml-1">{document.status.charAt(0).toUpperCase() + document.status.slice(1)}</span>
                              </Badge>
                              <Badge className={accessLevelConfig[document.accessLevel].color}>
                                <AccessLevelIcon className="w-3 h-3 mr-1" />
                                {accessLevelConfig[document.accessLevel].label}
                              </Badge>
                              {document.requiresSignature && (
                                <Badge className={signatureStatusConfig[document.signatureStatus].color}>
                                  <SignatureStatusIcon className="w-3 h-3 mr-1" />
                                  {signatureStatusConfig[document.signatureStatus].label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Avatar className="w-5 h-5 mr-2">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback>
                                    {document.employeeName
                                      ? document.employeeName
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                      : "SYS"}
                                  </AvatarFallback>
                                </Avatar>
                                {document.employeeName || "System"} {document.employeeId && `(${document.employeeId})`}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <FileText className="w-4 h-4 mr-1" />
                                {documentTypeLabels[document.documentType as keyof typeof documentTypeLabels] ||
                                  document.documentType}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(document.uploadDate).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</div>
                              <Badge variant="outline" className="text-xs">
                                {document.source.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                              {document.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{document.tags.slice(0, 2).join(", ")}</span>
                                  {document.tags.length > 2 && (
                                    <span className="text-xs text-gray-400">+{document.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {document.notes && (
                              <p className="text-sm text-gray-600 mt-1 italic">Note: {document.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(document.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {document.requiresSignature && document.signatureStatus === "pending" && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedDocument(document)
                                  setIsSignatureOpen(true)
                                }}>
                                  <PenTool className="w-4 h-4 mr-2" />
                                  Sign Document
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openComments(document)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Add Comment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openShare(document)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAudit(document)}>
                                <History className="w-4 h-4 mr-2" />
                                View Audit Trail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openWorkflow(document)}>
                                <Activity className="w-4 h-4 mr-2" />
                                View Workflow
                              </DropdownMenuItem>
                              {document.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    disabled={actionBusy}
                                    onClick={async () => {
                                      try {
                                        await patchDocument(document.id, "approve")
                                        toast({
                                          title: "Document Approved",
                                          description: "Document has been approved successfully.",
                                        })
                                      } catch (err: any) {
                                        toast({
                                          title: "Approve failed",
                                          description: err.message,
                                          variant: "destructive",
                                        })
                                      }
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={actionBusy}
                                    onClick={async () => {
                                      try {
                                        await patchDocument(document.id, "reject")
                                        toast({
                                          title: "Document Rejected",
                                          description: "Document has been rejected.",
                                        })
                                      } catch (err: any) {
                                        toast({
                                          title: "Reject failed",
                                          description: err.message,
                                          variant: "destructive",
                                        })
                                      }
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {!document.isArchived && document.status !== "archived" && (
                                <DropdownMenuItem
                                  disabled={actionBusy}
                                  onClick={async () => {
                                    try {
                                      await patchDocument(document.id, "archive")
                                      toast({
                                        title: "Document Archived",
                                        description: "Document has been archived successfully.",
                                      })
                                    } catch (err: any) {
                                      toast({
                                        title: "Archive failed",
                                        description: err.message,
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                disabled={actionBusy}
                                onClick={async () => {
                                  if (!window.confirm(`Delete “${document.fileName}”?`)) return
                                  try {
                                    const res = await fetch(`/api/documents/${document.id}`, {
                                      method: "DELETE",
                                      credentials: "include",
                                    })
                                    const json = await res.json().catch(() => ({}))
                                    if (!res.ok) throw new Error(json.error || "Delete failed")
                                    await loadData()
                                    toast({
                                      title: "Document Deleted",
                                      description: "Document has been deleted successfully.",
                                    })
                                  } catch (err: any) {
                                    toast({
                                      title: "Delete failed",
                                      description: err.message,
                                      variant: "destructive",
                                    })
                                  }
                                }}
                              >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-5 h-5" />
              Bulk Upload Documents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Support for PDF, DOC, DOCX, JPG, PNG files</p>
              <input
                ref={bulkFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files) {
                    setBulkUploadFiles(Array.from(e.target.files))
                  }
                }}
                className="hidden"
              />
              <Button onClick={() => bulkFileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </Button>
            </div>

            {bulkUploadFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Selected Files ({bulkUploadFiles.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bulkUploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <File className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      {uploadProgress[file.name] !== undefined && (
                        <div className="flex items-center space-x-2">
                          <Progress value={uploadProgress[file.name]} className="w-20" />
                          <span className="text-xs text-gray-500">{uploadProgress[file.name]}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkUpload} 
                disabled={bulkUploadFiles.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {bulkUploadFiles.length} Files
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArchiveIcon className="w-5 h-5" />
              Archive Documents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to archive {selectedDocuments.length} selected documents? 
              This action will move them to the archive section.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox id="confirm-archive" />
              <Label htmlFor="confirm-archive" className="text-sm">
                I understand this action will archive the selected documents
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={selectedDocuments.length === 0}>
              <ArchiveIcon className="w-4 h-4 mr-2" />
              Archive {selectedDocuments.length} Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleUpload(e.target.files[0])
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog with Enhanced Features */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Document Vault Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Tabs defaultValue="retention" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="retention">Retention Policies</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
              
              {/* Retention Policies Tab */}
              <TabsContent value="retention" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Retention Policies</h3>
                  <Button onClick={() => setIsAddPolicyOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Policy
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Employee Records</h4>
                          <p className="text-sm text-gray-600">Standard retention for employee documents</p>
                          <p className="text-xs text-gray-500">
                            Retention: 2555 days | Archive: 1825 days | Delete: 2555 days
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Active</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Medical Records</h4>
                          <p className="text-sm text-gray-600">Medical document retention policy</p>
                          <p className="text-xs text-gray-500">
                            Retention: 1825 days | Archive: 1095 days | Delete: 1825 days
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Active</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4">
                <h3 className="text-lg font-semibold">Security Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Access Control</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Enable Audit Logging</h4>
                          <p className="text-sm text-gray-600">Log all document access and actions</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Require E-Signatures</h4>
                          <p className="text-sm text-gray-600">Require electronic signatures for sensitive documents</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-Encryption</h4>
                          <p className="text-sm text-gray-600">Automatically encrypt all uploaded documents</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Advanced Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Watermarking</h4>
                          <p className="text-sm text-gray-600">Add watermarks to sensitive documents</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Download Tracking</h4>
                          <p className="text-sm text-gray-600">Track all document downloads</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Session Timeout</h4>
                          <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI-Powered Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">AI Threat Detection</h4>
                        <p className="text-sm text-gray-600">Use AI to detect suspicious document access patterns</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Smart Access Control</h4>
                        <p className="text-sm text-gray-600">AI-driven access recommendations based on user behavior</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Automated Compliance</h4>
                        <p className="text-sm text-gray-600">AI-powered compliance monitoring and alerts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Document Workflows</h3>
                  <Button onClick={() => setIsAddWorkflowOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workflow
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Document Approval Workflow</h4>
                          <p className="text-sm text-gray-600">Standard approval process for all documents</p>
                          <p className="text-xs text-gray-500">Steps: Upload → HR Review → Manager Approval → Final Approval</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Active</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">E-Signature Workflow</h4>
                          <p className="text-sm text-gray-600">Automated e-signature collection process</p>
                          <p className="text-xs text-gray-500">Steps: Prepare → Send → Sign → Verify → Archive</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Inactive</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Signature App Integrations</h3>
                  <Button onClick={() => setIsAddIntegrationOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Integration
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signatureApps.map((app) => (
                    <Card key={app.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${app.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                              {app.logo}
                            </div>
                            <div>
                              <h4 className="font-medium">{app.name}</h4>
                              <p className="text-sm text-gray-600">{app.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Available</Badge>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {app.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Connected Integrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CloudOff className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No integrations connected yet</p>
                      <p className="text-sm text-gray-400">Connect a signature app to get started</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsSettingsOpen(false)}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Retention Policy Dialog */}
      <Dialog open={isAddPolicyOpen} onOpenChange={setIsAddPolicyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Retention Policy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policy-name">Policy Name *</Label>
                <Input
                  id="policy-name"
                  value={retentionPolicyForm.name}
                  onChange={(e) => setRetentionPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter policy name"
                />
              </div>
              <div>
                <Label htmlFor="policy-description">Description *</Label>
                <Input
                  id="policy-description"
                  value={retentionPolicyForm.description}
                  onChange={(e) => setRetentionPolicyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter policy description"
                />
              </div>
            </div>
            
            <div>
              <Label>Document Types</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(documentTypeLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`doc-type-${key}`}
                      checked={retentionPolicyForm.documentTypes.includes(key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRetentionPolicyForm(prev => ({
                            ...prev,
                            documentTypes: [...prev.documentTypes, key]
                          }))
                        } else {
                          setRetentionPolicyForm(prev => ({
                            ...prev,
                            documentTypes: prev.documentTypes.filter(t => t !== key)
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={`doc-type-${key}`} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="retention-days">Retention Period (Days) *</Label>
                <Input
                  id="retention-days"
                  type="number"
                  value={retentionPolicyForm.retentionPeriodDays}
                  onChange={(e) => setRetentionPolicyForm(prev => ({ ...prev, retentionPeriodDays: parseInt(e.target.value) || 365 }))}
                />
              </div>
              <div>
                <Label htmlFor="archive-days">Archive After (Days)</Label>
                <Input
                  id="archive-days"
                  type="number"
                  value={retentionPolicyForm.archiveAfterDays}
                  onChange={(e) => setRetentionPolicyForm(prev => ({ ...prev, archiveAfterDays: parseInt(e.target.value) || 180 }))}
                />
              </div>
              <div>
                <Label htmlFor="delete-days">Delete After (Days)</Label>
                <Input
                  id="delete-days"
                  type="number"
                  value={retentionPolicyForm.deleteAfterDays}
                  onChange={(e) => setRetentionPolicyForm(prev => ({ ...prev, deleteAfterDays: parseInt(e.target.value) || 365 }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Compliance Requirements</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["GDPR", "Labor Law", "Tax Law", "Medical Privacy", "Financial Regulations", "Training Records"].map((req) => (
                  <div key={req} className="flex items-center space-x-2">
                    <Checkbox
                      id={`compliance-${req}`}
                      checked={retentionPolicyForm.complianceRequirements.includes(req)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRetentionPolicyForm(prev => ({
                            ...prev,
                            complianceRequirements: [...prev.complianceRequirements, req]
                          }))
                        } else {
                          setRetentionPolicyForm(prev => ({
                            ...prev,
                            complianceRequirements: prev.complianceRequirements.filter(r => r !== req)
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={`compliance-${req}`} className="text-sm">{req}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="policy-active"
                checked={retentionPolicyForm.isActive}
                onCheckedChange={(checked) => setRetentionPolicyForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="policy-active">Policy is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPolicyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPolicy}>
              <Save className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Workflow Dialog */}
      <Dialog open={isAddWorkflowOpen} onOpenChange={setIsAddWorkflowOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Document Workflow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name *</Label>
                <Input
                  id="workflow-name"
                  value={workflowForm.name}
                  onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <Label htmlFor="workflow-type">Workflow Type *</Label>
                <Select value={workflowForm.workflowType} onValueChange={(value) => setWorkflowForm(prev => ({ ...prev, workflowType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approval">Approval Workflow</SelectItem>
                    <SelectItem value="signature">Signature Workflow</SelectItem>
                    <SelectItem value="review">Review Workflow</SelectItem>
                    <SelectItem value="custom">Custom Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="workflow-description">Description *</Label>
              <Textarea
                id="workflow-description"
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter workflow description"
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <Label>Workflow Steps</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div className="flex-1">
                    <Input placeholder="Step name" />
                  </div>
                  <div className="w-32">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="signature">Signature</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="workflow-active"
                checked={workflowForm.isActive}
                onCheckedChange={(checked) => setWorkflowForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="workflow-active">Workflow is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWorkflowOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWorkflow}>
              <Save className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Integration Dialog */}
      <Dialog open={isAddIntegrationOpen} onOpenChange={setIsAddIntegrationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Signature App Integration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="integration-app">Signature App *</Label>
              <Select value={integrationForm.appId} onValueChange={(value) => setIntegrationForm(prev => ({ ...prev, appId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select signature app" />
                </SelectTrigger>
                <SelectContent>
                  {signatureApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      <div className="flex items-center space-x-2">
                        <span>{app.logo}</span>
                        <span>{app.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {integrationForm.appId && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">API Configuration</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    You'll need to obtain API credentials from {signatureApps.find(app => app.id === integrationForm.appId)?.name} 
                    and configure them below.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api-key">API Key *</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={integrationForm.apiKey}
                      onChange={(e) => setIntegrationForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter API key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-secret">API Secret *</Label>
                    <Input
                      id="api-secret"
                      type="password"
                      value={integrationForm.apiSecret}
                      onChange={(e) => setIntegrationForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                      placeholder="Enter API secret"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={integrationForm.webhookUrl}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="Enter webhook URL (optional)"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="integration-active"
                    checked={integrationForm.isActive}
                    onCheckedChange={(checked) => setIntegrationForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="integration-active">Integration is active</Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddIntegrationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIntegration} disabled={!integrationForm.appId || !integrationForm.apiKey}>
              <CloudCheckIcon className="w-4 h-4 mr-2" />
              Connect Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {selectedDocument?.fileName || "Document preview"}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> {selectedDocument.employeeName || "—"}</div>
                <div><span className="text-muted-foreground">Status:</span> {selectedDocument.status}</div>
                <div><span className="text-muted-foreground">Category:</span> {selectedDocument.category || "—"}</div>
                <div><span className="text-muted-foreground">Type:</span> {selectedDocument.fileType || "—"}</div>
              </div>
              {selectedDocument.notes && (
                <p className="text-sm text-muted-foreground italic">{selectedDocument.notes}</p>
              )}
              {selectedDocument.fileUrl ? (
                selectedDocument.fileType?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(selectedDocument.fileName || "") ? (
                  <img src={selectedDocument.fileUrl} alt={selectedDocument.fileName} className="max-h-[60vh] w-auto mx-auto rounded border" />
                ) : (
                  <iframe
                    src={selectedDocument.fileUrl}
                    title={selectedDocument.fileName}
                    className="w-full h-[60vh] rounded border"
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">No file URL available for preview.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            {selectedDocument?.fileUrl && (
              <Button onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Add comment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Comment on {selectedDocument?.fileName}</Label>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentOpen(false)}>Cancel</Button>
            <Button disabled={actionBusy || !commentText.trim()} onClick={submitComment}>
              Save comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>
            <div>
              <Label>Permission</Label>
              <Select value={sharePermission} onValueChange={setSharePermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>Cancel</Button>
            <Button disabled={actionBusy || !shareEmail.trim()} onClick={submitShare}>
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit trail */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Audit trail — {selectedDocument?.fileName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded border p-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium capitalize">{log.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{log.user_name || "System"}</div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAuditOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow */}
      <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Workflow — {selectedDocument?.fileName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Document status: <strong>{workflowData?.document?.status || selectedDocument?.status}</strong>
            </p>
            {(workflowData?.workflows || []).length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No workflow started for this document.</p>
                <Button disabled={actionBusy} onClick={startWorkflow}>
                  Start approval workflow
                </Button>
              </div>
            ) : (
              (workflowData.workflows || []).map((wf: any) => (
                <div key={wf.id} className="rounded border p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{wf.name || "Workflow"}</span>
                    <Badge variant="outline">{wf.status}</Badge>
                  </div>
                  {(wf.workflow_steps || []).length > 0 ? (
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      {(wf.workflow_steps || [])
                        .slice()
                        .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
                        .map((step: any) => (
                          <li key={step.id}>
                            {step.step_name} — <span className="text-muted-foreground">{step.status}</span>
                          </li>
                        ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-muted-foreground">Steps will appear after reload.</p>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkflowOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
