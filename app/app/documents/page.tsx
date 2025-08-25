"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Eye,
  Search,
  Upload,
  Calendar,
  User,
  Building,
  FolderOpen,
  File,
  ImageIcon,
  FileSpreadsheet,
  Archive,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

// Mock data for documents
const mockDocuments = [
  {
    id: 1,
    name: "Academic Certificate - Computer Science Degree",
    type: "Academic Certificate",
    employeeName: "John Doe",
    employeeId: "EMP-001",
    department: "Technology",
    uploadDate: "2024-03-15",
    fileSize: "2.4 MB",
    fileType: "PDF",
    status: "Verified",
    uploadedBy: "HR Manager",
    category: "academic",
    tags: ["degree", "computer-science", "university"],
  },
  {
    id: 2,
    name: "Passport Photo - Sarah Johnson",
    type: "Passport Picture",
    employeeName: "Sarah Johnson",
    employeeId: "EMP-002",
    department: "Human Resources",
    uploadDate: "2024-03-14",
    fileSize: "1.2 MB",
    fileType: "JPG",
    status: "Approved",
    uploadedBy: "Sarah Johnson",
    category: "identification",
    tags: ["passport-photo", "identification"],
  },
  {
    id: 3,
    name: "Resume & Cover Letter - Michael Brown",
    type: "Resume & Application Letter",
    employeeName: "Michael Brown",
    employeeId: "EMP-003",
    department: "Finance",
    uploadDate: "2024-03-13",
    fileSize: "856 KB",
    fileType: "PDF",
    status: "Pending Review",
    uploadedBy: "Michael Brown",
    category: "application",
    tags: ["resume", "cover-letter", "application"],
  },
  {
    id: 4,
    name: "Ghana Card - Ama Osei",
    type: "National ID",
    employeeName: "Ama Osei",
    employeeId: "EMP-004",
    department: "Marketing",
    uploadDate: "2024-03-12",
    fileSize: "1.8 MB",
    fileType: "PDF",
    status: "Verified",
    uploadedBy: "HR Assistant",
    category: "identification",
    tags: ["ghana-card", "national-id", "identification"],
  },
  {
    id: 5,
    name: "Medical Report - Kwame Asante",
    type: "Medical Report",
    employeeName: "Kwame Asante",
    employeeId: "EMP-005",
    department: "Operations",
    uploadDate: "2024-03-11",
    fileSize: "3.2 MB",
    fileType: "PDF",
    status: "Confidential",
    uploadedBy: "Medical Officer",
    category: "medical",
    tags: ["medical", "health-clearance", "confidential"],
  },
]

const documentCategories = [
  { value: "all", label: "All Documents", count: mockDocuments.length },
  {
    value: "academic",
    label: "Academic Certificates",
    count: mockDocuments.filter((d) => d.category === "academic").length,
  },
  {
    value: "identification",
    label: "Identification",
    count: mockDocuments.filter((d) => d.category === "identification").length,
  },
  {
    value: "application",
    label: "Applications",
    count: mockDocuments.filter((d) => d.category === "application").length,
  },
  { value: "medical", label: "Medical Reports", count: mockDocuments.filter((d) => d.category === "medical").length },
]

const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return <FileText className="w-5 h-5 text-red-500" />
    case "jpg":
    case "jpeg":
    case "png":
      return <ImageIcon className="w-5 h-5 text-blue-500" />
    case "xlsx":
    case "xls":
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />
    default:
      return <File className="w-5 h-5 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "verified":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      )
    case "pending review":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case "confidential":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <AlertCircle className="w-3 h-3 mr-1" />
          Confidential
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState(mockDocuments)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [sortBy, setSortBy] = useState("uploadDate")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDownload = (document: any) => {
    // Simulate file download
    console.log(`Downloading ${document.name}`)
    // In a real app, this would trigger the actual file download
  }

  const handlePreview = (document: any) => {
    setSelectedDocument(document)
  }

  const handleShare = (document: any) => {
    // Simulate sharing functionality
    console.log(`Sharing ${document.name}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-gray-600">Centralized repository for all employee documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter((d) => d.status === "Verified").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {documents.filter((d) => d.status === "Pending Review").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">24.8 GB</p>
              </div>
              <Archive className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search documents, employees, or document types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploadDate">Upload Date</SelectItem>
                <SelectItem value="name">Document Name</SelectItem>
                <SelectItem value="employeeName">Employee Name</SelectItem>
                <SelectItem value="fileSize">File Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getFileIcon(document.fileType)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">{document.name}</CardTitle>
                    <CardDescription className="text-xs">{document.type}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(document.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3" />
                  <span>
                    {document.employeeName} ({document.employeeId})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-3 h-3" />
                  <span>{document.department}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{document.uploadDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    {document.fileSize} • {document.fileType}
                  </span>
                  <span className="text-gray-500">by {document.uploadedBy}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handlePreview(document)} className="h-8 px-2">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(document)} className="h-8 px-2">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShare(document)} className="h-8 px-2">
                    <Share2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {document.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{document.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedDocument && getFileIcon(selectedDocument.fileType)}
              <span>{selectedDocument?.name}</span>
            </DialogTitle>
            <DialogDescription>Document preview and details for {selectedDocument?.employeeName}</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Employee:</strong> {selectedDocument.employeeName} ({selectedDocument.employeeId})
                </div>
                <div>
                  <strong>Department:</strong> {selectedDocument.department}
                </div>
                <div>
                  <strong>Document Type:</strong> {selectedDocument.type}
                </div>
                <div>
                  <strong>Upload Date:</strong> {selectedDocument.uploadDate}
                </div>
                <div>
                  <strong>File Size:</strong> {selectedDocument.fileSize}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusBadge(selectedDocument.status)}
                </div>
                <div>
                  <strong>Uploaded By:</strong> {selectedDocument.uploadedBy}
                </div>
                <div>
                  <strong>Tags:</strong> {selectedDocument.tags.join(", ")}
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Document preview would appear here</p>
                <p className="text-sm text-gray-500">
                  In a real application, this would show the actual document content
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleDownload(selectedDocument)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => handleShare(selectedDocument)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Documents uploaded by employees will appear here"}
            </p>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
