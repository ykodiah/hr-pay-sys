"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
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

export default function SimpleEnhancedDocumentVaultPage() {
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
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("uploadDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [showArchived, setShowArchived] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)

  const documentService = AdvancedDocumentService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const docs = documentService.getAllDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load document data",
        variant: "destructive"
      })
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesEmployee = selectedEmployee === "all" || doc.employeeId === selectedEmployee
    const matchesDocumentType = selectedDocumentType === "all" || doc.documentType === selectedDocumentType
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus
    const matchesAccessLevel = selectedAccessLevel === "all" || doc.accessLevel === selectedAccessLevel
    const matchesSignatureStatus = selectedSignatureStatus === "all" || doc.signatureStatus === selectedSignatureStatus
    const matchesTab = activeTab === "all" || doc.status === activeTab
    const matchesArchived = showArchived ? doc.isArchived : !doc.isArchived
    const matchesDeleted = showDeleted ? doc.status === "deleted" : doc.status !== "deleted"
    
    // Date range filtering
    const matchesDateRange = (() => {
      if (selectedDateRange === "all") return true
      const now = new Date()
      const docDate = new Date(doc.uploadDate)
      
      switch (selectedDateRange) {
        case "today":
          return docDate.toDateString() === now.toDateString()
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return docDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return docDate >= monthAgo
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          return docDate >= quarterAgo
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          return docDate >= yearAgo
        default:
          return true
      }
    })()
    
    // File size filtering
    const matchesFileSize = (() => {
      if (selectedFileSize === "all") return true
      const sizeInMB = doc.fileSize / (1024 * 1024)
      
      switch (selectedFileSize) {
        case "small":
          return sizeInMB < 1
        case "medium":
          return sizeInMB >= 1 && sizeInMB <= 10
        case "large":
          return sizeInMB > 10
        default:
          return true
      }
    })()
    
    // Source filtering
    const matchesSource = selectedSource === "all" || doc.source === selectedSource
    
    // Category filtering
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory

    return matchesSearch && matchesEmployee && matchesDocumentType && matchesStatus && 
           matchesTab && matchesDateRange && matchesFileSize && matchesSource && 
           matchesCategory && matchesAccessLevel && matchesSignatureStatus && 
           matchesArchived && matchesDeleted
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof AdvancedDocument]
    const bValue = b[sortBy as keyof AdvancedDocument]
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const employees = [...new Set(documents.map((doc) => ({ id: doc.employeeId, name: doc.employeeName })))]
  const documentTypes = [...new Set(documents.map((doc) => doc.documentType))]

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDocumentAction = async (documentId: string, action: string, data?: any) => {
    try {
      await documentService.logDocumentAccess(documentId, action, data)
      
      switch (action) {
        case "view":
          const doc = documents.find(d => d.id === documentId)
          if (doc) {
            setSelectedDocument(doc)
            setIsPreviewOpen(true)
          }
          break
        case "download":
          toast({
            title: "Download Started",
            description: "Document is being downloaded...",
          })
          break
        case "sign":
          const signDoc = documents.find(d => d.id === documentId)
          if (signDoc) {
            setSelectedDocument(signDoc)
            setIsSignatureOpen(true)
          }
          break
        case "comment":
          const commentDoc = documents.find(d => d.id === documentId)
          if (commentDoc) {
            setSelectedDocument(commentDoc)
            setIsCommentOpen(true)
          }
          break
        case "share":
          const shareDoc = documents.find(d => d.id === documentId)
          if (shareDoc) {
            setSelectedDocument(shareDoc)
            setIsShareOpen(true)
          }
          break
        case "audit":
          const auditDoc = documents.find(d => d.id === documentId)
          if (auditDoc) {
            setSelectedDocument(auditDoc)
            setIsAuditOpen(true)
          }
          break
        case "workflow":
          const workflowDoc = documents.find(d => d.id === documentId)
          if (workflowDoc) {
            setSelectedDocument(workflowDoc)
            setIsWorkflowOpen(true)
          }
          break
        case "approve":
          documentService.updateDocumentStatus(documentId, "approved", "Approved by user")
          await loadData()
          toast({
            title: "Document Approved",
            description: "Document has been approved successfully.",
          })
          break
        case "reject":
          documentService.updateDocumentStatus(documentId, "rejected", "Rejected by user")
          await loadData()
          toast({
            title: "Document Rejected",
            description: "Document has been rejected.",
          })
          break
        case "archive":
          await documentService.archiveDocument(documentId, "Manual archive")
          await loadData()
          toast({
            title: "Document Archived",
            description: "Document has been archived successfully.",
          })
          break
        case "delete":
          await documentService.deleteDocument(documentId, "Manual delete")
          await loadData()
          toast({
            title: "Document Deleted",
            description: "Document has been deleted successfully.",
          })
          break
      }
    } catch (error) {
      console.error("Error performing action:", error)
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      })
    }
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
    
    return { total, approved, pending, rejected, archived, requiresSignature, signed, confidential, restricted }
  }

  const stats = getDocumentStats()

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Document Vault</h1>
          <p className="text-gray-600">Enterprise-grade document management with RBAC, audit trails, and e-signatures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
            
            {/* Filter Row 2 - Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedFileSize} onValueChange={setSelectedFileSize}>
                <SelectTrigger>
                  <SelectValue placeholder="File size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
                  <SelectItem value="medium">Medium (1-10MB)</SelectItem>
                  <SelectItem value="large">Large (&gt; 10MB)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Upload source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="employee-onboarding">Employee Onboarding</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="recruitment">Recruitment</SelectItem>
                  <SelectItem value="manual-upload">Manual Upload</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="employee-document">Employee Documents</SelectItem>
                  <SelectItem value="company-asset">Company Assets</SelectItem>
                  <SelectItem value="system-data">System Data</SelectItem>
                  <SelectItem value="training-content">Training Content</SelectItem>
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
              <CardTitle>
                {activeTab === "all"
                  ? "All Documents"
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Documents`}{" "}
                ({filteredDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => {
                    const AccessLevelIcon = accessLevelConfig[document.accessLevel].icon
                    const SignatureStatusIcon = signatureStatusConfig[document.signatureStatus].icon
                    
                    return (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
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
                              <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "view")}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "download")}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {document.requiresSignature && document.signatureStatus === "pending" && (
                                <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "sign")}>
                                  <PenTool className="w-4 h-4 mr-2" />
                                  Sign Document
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "comment")}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Add Comment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "share")}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "audit")}>
                                <History className="w-4 h-4 mr-2" />
                                View Audit Trail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "workflow")}>
                                <Activity className="w-4 h-4 mr-2" />
                                View Workflow
                              </DropdownMenuItem>
                              {document.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "approve")}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "reject")}>
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {!document.isArchived && (
                                <DropdownMenuItem onClick={() => handleDocumentAction(document.id, "archive")}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDocumentAction(document.id, "delete")}>
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

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg">
                  {getFileIcon(selectedDocument.fileType)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDocument.fileName}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={getStatusBadge(selectedDocument.status)}>
                      {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                    </Badge>
                    <Badge className={accessLevelConfig[selectedDocument.accessLevel].color}>
                      {accessLevelConfig[selectedDocument.accessLevel].label}
                    </Badge>
                    <span className="text-sm text-gray-600">{formatFileSize(selectedDocument.fileSize)}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Document Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>
                        {documentTypeLabels[selectedDocument.documentType as keyof typeof documentTypeLabels] ||
                          selectedDocument.documentType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uploaded by:</span>
                      <span>{selectedDocument.uploadedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">File type:</span>
                      <span>{selectedDocument.fileType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span>{selectedDocument.source.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{selectedDocument.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span>{selectedDocument.versionNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Encryption:</span>
                      <span className="flex items-center">
                        <Shield className="w-4 h-4 mr-1 text-green-600" />
                        {selectedDocument.encryptionStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Access & Security</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Access Level:</span>
                      <Badge className={accessLevelConfig[selectedDocument.accessLevel].color}>
                        {accessLevelConfig[selectedDocument.accessLevel].label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Classification:</span>
                      <span>{selectedDocument.dataClassification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GDPR Applicable:</span>
                      <span className={selectedDocument.gdprApplicable ? "text-red-600" : "text-green-600"}>
                        {selectedDocument.gdprApplicable ? "Yes" : "No"}
                      </span>
                    </div>
                    {selectedDocument.requiresSignature && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signature Status:</span>
                          <Badge className={signatureStatusConfig[selectedDocument.signatureStatus].color}>
                            {signatureStatusConfig[selectedDocument.signatureStatus].label}
                          </Badge>
                        </div>
                        {selectedDocument.signatureDeadline && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Signature Deadline:</span>
                            <span>{new Date(selectedDocument.signatureDeadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedDocument.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedDocument.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleDocumentAction(selectedDocument.id, "download")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {selectedDocument.requiresSignature && selectedDocument.signatureStatus === "pending" && (
                  <Button onClick={() => handleDocumentAction(selectedDocument.id, "sign")}>
                    <PenTool className="w-4 h-4 mr-2" />
                    Sign Document
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Signature Dialog */}
      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>E-Signature</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              <div className="text-center">
                <PenTool className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold">Sign Document</h3>
                <p className="text-gray-600">{selectedDocument.fileName}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signature-type">Signature Type</Label>
                  <Select defaultValue="electronic">
                    <SelectTrigger>
                      <SelectValue placeholder="Select signature type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronic">Electronic Signature</SelectItem>
                      <SelectItem value="digital">Digital Signature</SelectItem>
                      <SelectItem value="wet_signature">Wet Signature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="signature-canvas">Draw Your Signature</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Signature canvas would be here</p>
                    <p className="text-sm text-gray-400 mt-2">Draw your signature using mouse or touch</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="signature-agreement" />
                  <Label htmlFor="signature-agreement" className="text-sm">
                    I agree to the terms and conditions and confirm this is my electronic signature
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsSignatureOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleDocumentAction(selectedDocument.id, "sign", { signatureType: "electronic" })
                  setIsSignatureOpen(false)
                }}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="comment-type">Comment Type</Label>
                <Select defaultValue="general">
                  <SelectTrigger>
                    <SelectValue placeholder="Select comment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Comment</SelectItem>
                    <SelectItem value="review">Review Comment</SelectItem>
                    <SelectItem value="approval">Approval Comment</SelectItem>
                    <SelectItem value="rejection">Rejection Comment</SelectItem>
                    <SelectItem value="annotation">Annotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="comment-text">Comment</Label>
                <Textarea
                  id="comment-text"
                  placeholder="Enter your comment..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="internal-comment" defaultChecked />
                <Label htmlFor="internal-comment" className="text-sm">
                  Internal comment (not visible to employee)
                </Label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsCommentOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleDocumentAction(selectedDocument.id, "comment")
                  setIsCommentOpen(false)
                }}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-user">Share with User</Label>
                <Input
                  id="share-user"
                  placeholder="Enter user email or ID"
                />
              </div>
              
              <div>
                <Label htmlFor="permission-level">Permission Level</Label>
                <Select defaultValue="view">
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="comment">View & Comment</SelectItem>
                    <SelectItem value="edit">View, Comment & Edit</SelectItem>
                    <SelectItem value="admin">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                <Input
                  id="expiry-date"
                  type="date"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsShareOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleDocumentAction(selectedDocument.id, "share")
                  setIsShareOpen(false)
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Trail</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                  {getFileIcon(selectedDocument.fileType)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedDocument.fileName}</h3>
                  <p className="text-sm text-gray-600">Complete access history</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Document Uploaded</p>
                      <p className="text-sm text-gray-600">User: {selectedDocument.uploadedBy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{new Date(selectedDocument.uploadDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsAuditOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Dialog */}
      <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Workflow</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                  {getFileIcon(selectedDocument.fileType)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedDocument.fileName}</h3>
                  <p className="text-sm text-gray-600">Workflow progress and steps</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Document Uploaded</p>
                    <p className="text-sm text-gray-600">Document uploaded and ready for review</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">HR Review</p>
                    <p className="text-sm text-gray-600">Awaiting HR specialist review</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Square className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Manager Approval</p>
                    <p className="text-sm text-gray-600">Pending manager approval</p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsWorkflowOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Vault Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Tabs defaultValue="retention" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="retention">Retention Policies</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="retention" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Retention Policies</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
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
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Settings</h3>
                  <div className="space-y-4">
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
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="workflows" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Workflow Settings</h3>
                  <p className="text-gray-600">Configure document approval workflows and automation rules.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="integrations" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Integrations</h3>
                  <p className="text-gray-600">Connect with external services and APIs.</p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsSettingsOpen(false)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
