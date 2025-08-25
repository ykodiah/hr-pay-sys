"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

// Mock document data
const mockDocuments = [
  {
    id: "DOC-001",
    name: "Employee Handbook 2024.pdf",
    type: "application/pdf",
    size: 2048576, // 2MB
    category: "policies",
    uploadedBy: "HR Admin",
    uploadedAt: new Date("2024-01-15"),
    accessLevel: "internal",
    tags: ["handbook", "policies", "2024"],
    isConfidential: false,
    employeeId: null,
    department: "Human Resources",
    expiryDate: new Date("2024-12-31"),
    version: 1,
    downloadCount: 45,
  },
  {
    id: "DOC-002",
    name: "Employment Contract - Kwame Asante.pdf",
    type: "application/pdf",
    size: 512000, // 500KB
    category: "contracts",
    uploadedBy: "HR Manager",
    uploadedAt: new Date("2024-02-10"),
    accessLevel: "confidential",
    tags: ["contract", "employment"],
    isConfidential: true,
    employeeId: "EMP001",
    department: "Technology",
    expiryDate: null,
    version: 2,
    downloadCount: 3,
  },
  {
    id: "DOC-003",
    name: "Safety Certificate 2024.jpg",
    type: "image/jpeg",
    size: 1024000, // 1MB
    category: "certificates",
    uploadedBy: "Safety Officer",
    uploadedAt: new Date("2024-01-20"),
    accessLevel: "public",
    tags: ["safety", "certificate", "compliance"],
    isConfidential: false,
    employeeId: null,
    department: "Operations",
    expiryDate: new Date("2025-01-20"),
    version: 1,
    downloadCount: 12,
  },
  {
    id: "DOC-004",
    name: "Payroll Report January 2024.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 3072000, // 3MB
    category: "payroll",
    uploadedBy: "Payroll Admin",
    uploadedAt: new Date("2024-02-01"),
    accessLevel: "restricted",
    tags: ["payroll", "january", "2024", "report"],
    isConfidential: true,
    employeeId: null,
    department: "Finance",
    expiryDate: new Date("2031-02-01"), // 7 years retention
    version: 1,
    downloadCount: 8,
  },
]

const mockCategories = [
  {
    id: "contracts",
    name: "Employment Contracts",
    description: "Employee contracts and agreements",
    allowedFileTypes: ["pdf", "doc", "docx"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    retentionPeriod: 2555, // 7 years
    isActive: true,
    documentCount: 15,
  },
  {
    id: "policies",
    name: "HR Policies",
    description: "Company policies and procedures",
    allowedFileTypes: ["pdf", "doc", "docx"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    isActive: true,
    documentCount: 8,
  },
  {
    id: "certificates",
    name: "Certificates & Licenses",
    description: "Professional certificates and licenses",
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    retentionPeriod: 1825, // 5 years
    isActive: true,
    documentCount: 23,
  },
  {
    id: "payroll",
    name: "Payroll Documents",
    description: "Payslips, tax documents, and payroll records",
    allowedFileTypes: ["pdf", "xlsx", "csv"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    retentionPeriod: 2555, // 7 years
    isActive: true,
    documentCount: 156,
  },
]

const accessLevelColors = {
  public: "bg-green-100 text-green-800",
  internal: "bg-blue-100 text-blue-800",
  confidential: "bg-yellow-100 text-yellow-800",
  restricted: "bg-red-100 text-red-800",
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return "📄"
  if (type.includes("image")) return "🖼️"
  if (type.includes("spreadsheet") || type.includes("excel")) return "📊"
  if (type.includes("document") || type.includes("word")) return "📝"
  return "📁"
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(mockDocuments)
  const [categories, setCategories] = useState(mockCategories)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("documents")

  const [uploadForm, setUploadForm] = useState({
    category: "",
    accessLevel: "internal",
    tags: "",
    employeeId: "",
    department: "",
    isConfidential: false,
    expiryDate: ""
  })

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesAccessLevel = selectedAccessLevel === "all" || doc.accessLevel === selectedAccessLevel

    return matchesSearch && matchesCategory && matchesAccessLevel
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Simulate file upload
    const newDocument = {
      id: `DOC-${String(documents.length + 1).padStart(3, '0')}`,
      name: file.name,
      type: file.type,
      size: file.size,
      category: uploadForm.category,
      uploadedBy: "Current User",
      uploadedAt: new Date(),
      accessLevel: uploadForm.accessLevel,
      tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isConfidential: uploadForm.isConfidential,
      employeeId: uploadForm.employeeId || null,
      department: uploadForm.department,
      expiryDate: uploadForm.expiryDate ? new Date(uploadForm.expiryDate) : null,
      version: 1,
      downloadCount: 0
    }

    setDocuments([...documents, newDocument])
    setIsUploadOpen(false)
    setUploadForm({
      category: "",
      accessLevel: "internal",
      tags: "",
      employeeId: "",
      department: "",
      isConfidential: false,
      expiryDate: ""
    })
    toast({
      title: "Document Uploaded",
      description: `${file.name} has been uploaded successfully.`
    })
  }

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(documents.filter(doc => doc.id !== documentId))
    toast({
      title: "Document Deleted",
      description: "Document has been deleted successfully."
    })
  }

  const getDocumentStats = () => {
    const totalDocuments = documents.length
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0)
    const confidentialDocs = documents.filter(doc => doc.isConfidential).length
    const expiringDocs = documents.filter(doc => {
      if (!doc.expiryDate) return false
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return doc.expiryDate <= thirtyDaysFromNow
    }).length

    return { totalDocuments, totalSize, confidentialDocs, expiringDocs }
  }

  const stats = getDocumentStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-gray-600">Secure document storage and management system</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={uploadForm.category} onValueChange={(value) => setUploadForm({...uploadForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Select value={uploadForm.accessLevel} onValueChange={(value) => setUploadForm({...uploadForm, accessLevel: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID (Optional)</Label>
                    <Input
                      id="employeeId"
                      placeholder="EMP001"
                      value={uploadForm.employeeId}
                      onChange={(e) => set
