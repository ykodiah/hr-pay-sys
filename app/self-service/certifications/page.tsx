"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Award, BookOpen, Calendar, Download, Upload, Plus, Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react"

const certificationsData = {
  completed: [
    {
      id: 1,
      name: "AWS Cloud Practitioner",
      issuer: "Amazon Web Services",
      issueDate: "2024-06-15",
      expiryDate: "2027-06-15",
      status: "Active",
      credentialId: "AWS-CP-2024-001",
      category: "Cloud Computing",
      documentUrl: "/certificates/aws-cp.pdf",
    },
    {
      id: 2,
      name: "Project Management Professional (PMP)",
      issuer: "Project Management Institute",
      issueDate: "2024-03-20",
      expiryDate: "2027-03-20",
      status: "Active",
      credentialId: "PMP-2024-789",
      category: "Project Management",
      documentUrl: "/certificates/pmp.pdf",
    },
    {
      id: 3,
      name: "First Aid & CPR",
      issuer: "Ghana Red Cross",
      issueDate: "2023-11-10",
      expiryDate: "2025-11-10",
      status: "Expiring Soon",
      credentialId: "GRC-FA-2023-456",
      category: "Safety",
      documentUrl: "/certificates/first-aid.pdf",
    },
  ],
  inProgress: [
    {
      id: 4,
      name: "Certified Scrum Master",
      provider: "Scrum Alliance",
      startDate: "2025-01-10",
      expectedCompletion: "2025-03-15",
      progress: 65,
      category: "Agile Methodology",
      status: "In Progress",
    },
    {
      id: 5,
      name: "Data Analytics Certificate",
      provider: "Google Career Certificates",
      startDate: "2024-12-01",
      expectedCompletion: "2025-04-30",
      progress: 40,
      category: "Data Science",
      status: "In Progress",
    },
  ],
  required: [
    {
      id: 6,
      name: "Information Security Awareness",
      description: "Annual mandatory training for all employees",
      dueDate: "2025-03-31",
      category: "Compliance",
      status: "Required",
      priority: "High",
    },
    {
      id: 7,
      name: "Ghana Labour Law Update",
      description: "Updated training on Ghana Labour Act 2003 amendments",
      dueDate: "2025-04-15",
      category: "Legal Compliance",
      status: "Required",
      priority: "Medium",
    },
  ],
}

export default function CertificationsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCert, setSelectedCert] = useState<any>(null)

  const totalCertifications = certificationsData.completed.length
  const activeCertifications = certificationsData.completed.filter((cert) => cert.status === "Active").length
  const expiringSoon = certificationsData.completed.filter((cert) => cert.status === "Expiring Soon").length
  const inProgressCount = certificationsData.inProgress.length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Expiring Soon":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "Expired":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "Required":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "Expiring Soon":
        return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
      case "Expired":
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "Required":
        return <Badge className="bg-red-100 text-red-800">Required</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
      case "Low":
        return <Badge className="bg-gray-100 text-gray-800">Low Priority</Badge>
      default:
        return null
    }
  }

  const handleDownloadCertificate = (cert: any) => {
    toast({
      title: "Download Started",
      description: `Downloading ${cert.name} certificate.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certifications & Training</h1>
          <p className="text-gray-600">Manage your professional certifications and training records</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Certification</DialogTitle>
            </DialogHeader>
            <AddCertificationForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Certifications Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCertifications}</div>
                <p className="text-sm text-gray-600">Total Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{activeCertifications}</div>
                <p className="text-sm text-gray-600">Active Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{expiringSoon}</div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{inProgressCount}</div>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="completed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="completed">My Certifications</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="required">
            Required Training
            {certificationsData.required.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{certificationsData.required.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificationsData.completed.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                        <Badge variant="outline">{cert.category}</Badge>
                        {getStatusBadge(cert.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Issued by: {cert.issuer}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                        <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                        <span>ID: {cert.credentialId}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadCertificate(cert)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress">
          <Card>
            <CardHeader>
              <CardTitle>Training in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificationsData.inProgress.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{training.name}</h3>
                        <Badge variant="outline">{training.category}</Badge>
                        {getStatusBadge(training.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Provider: {training.provider}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <span>Started: {new Date(training.startDate).toLocaleDateString()}</span>
                        <span>Expected completion: {new Date(training.expectedCompletion).toLocaleDateString()}</span>
                      </div>
                      <div className="w-64">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{training.progress}%</span>
                        </div>
                        <Progress value={training.progress} className="h-2" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Continue Training
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="required">
          <Card>
            <CardHeader>
              <CardTitle>Required Training</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificationsData.required.map((requirement) => (
                  <div
                    key={requirement.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{requirement.name}</h3>
                        <Badge variant="outline">{requirement.category}</Badge>
                        {getStatusBadge(requirement.status)}
                        {getPriorityBadge(requirement.priority)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{requirement.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {new Date(requirement.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
                        Start Training
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AddCertificationForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    category: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Certification Added",
      description: "Your certification has been added successfully.",
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Certification Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., AWS Cloud Practitioner"
            required
          />
        </div>
        <div>
          <Label htmlFor="issuer">Issuing Organization</Label>
          <Input
            id="issuer"
            value={formData.issuer}
            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
            placeholder="e.g., Amazon Web Services"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="credentialId">Credential ID</Label>
          <Input
            id="credentialId"
            value={formData.credentialId}
            onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
            placeholder="Certificate ID or number"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Cloud Computing"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about the certification"
        />
      </div>

      <div>
        <Label htmlFor="certificate">Upload Certificate</Label>
        <div className="mt-1 flex items-center space-x-2">
          <Input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" />
          <Button type="button" variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Add Certification
        </Button>
      </div>
    </form>
  )
}
