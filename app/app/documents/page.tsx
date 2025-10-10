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
} from "lucide-react"
import { CentralDocumentService } from "@/lib/storage/centralDocumentService"

// Mock data for demonstration
const documentTypeLabels = {
  academic: "Academic Certificate",
  "passport-picture": "Passport Picture",
  resume: "Resume & Application",
  passport: "Passport Copy",
  "national-id": "National ID",
  medical: "Medical Report",
  police: "Police Report",
  other: "Other Documents",
}

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [selectedDocumentType, setSelectedDocumentType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const documentService = CentralDocumentService.getInstance()
    const allDocuments = documentService.getAllDocuments()
    setDocuments(allDocuments)
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmployee = selectedEmployee === "all" || doc.employeeId === selectedEmployee
    const matchesDocumentType = selectedDocumentType === "all" || doc.documentType === selectedDocumentType
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus
    const matchesTab = activeTab === "all" || doc.status === activeTab

    return matchesSearch && matchesEmployee && matchesDocumentType && matchesStatus && matchesTab
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
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
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

  const handleDownload = (document: any) => {
    // In production, this would trigger actual file download
    console.log("[v0] Downloading document:", document.fileName)
    toast({
      title: "Download Started",
      description: `${document.fileName} is being downloaded.`,
    })
  }

  const handlePreview = (document: any) => {
    setSelectedDocument(document)
    setIsPreviewOpen(true)
  }

  const handleStatusUpdate = (documentId: string, newStatus: string, notes?: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === documentId ? { ...doc, status: newStatus, notes: notes || doc.notes } : doc)),
    )
    toast({
      title: "Status Updated",
      description: `Document status changed to ${newStatus}.`,
    })
  }

  const handleDelete = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
    toast({
      title: "Document Deleted",
      description: "Document has been permanently removed.",
      variant: "destructive",
    })
  }

  const getDocumentStats = () => {
    const total = documents.length
    const approved = documents.filter((doc) => doc.status === "approved").length
    const pending = documents.filter((doc) => doc.status === "pending").length
    const rejected = documents.filter((doc) => doc.status === "rejected").length
    return { total, approved, pending, rejected }
  }

  const stats = getDocumentStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-gray-600">Centralized document management for all employees</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name, document name, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full lg:w-48">
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
              <SelectTrigger className="w-full lg:w-48">
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
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Documents ({stats.total})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
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
                  filteredDocuments.map((document) => (
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
                              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Avatar className="w-5 h-5 mr-2">
                                <AvatarImage src={document.avatar || "/placeholder.svg"} />
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
                            <DropdownMenuItem onClick={() => handlePreview(document)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(document)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {document.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(document.id, "approved")}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(document.id, "rejected", "Requires revision")}
                                >
                                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(document.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
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
                    <span className="text-sm text-gray-600">{formatFileSize(selectedDocument.fileSize)}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedDocument.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedDocument.employeeName
                            ? selectedDocument.employeeName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : "SYS"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedDocument.employeeName || "System"}</p>
                        <p className="text-sm text-gray-600">{selectedDocument.employeeId}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Document Details</h4>
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
                  </div>
                </div>
              </div>

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
                <Button variant="outline" onClick={() => handleDownload(selectedDocument)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {selectedDocument.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedDocument.id, "approved")
                        setIsPreviewOpen(false)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleStatusUpdate(selectedDocument.id, "rejected", "Requires revision")
                        setIsPreviewOpen(false)
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
