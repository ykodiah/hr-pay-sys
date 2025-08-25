"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Plus, FileText, Clock, CheckCircle, MessageSquare } from "lucide-react"

interface Grievance {
  id: string
  title: string
  category: string
  description: string
  status: "submitted" | "under-review" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  submittedDate: string
  lastUpdate: string
  response?: string
}

export default function GrievancesPage() {
  const [activeTab, setActiveTab] = useState("my-grievances")
  const [showNewGrievanceDialog, setShowNewGrievanceDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    priority: "medium",
  })

  // Mock data
  const grievances: Grievance[] = [
    {
      id: "GRV001",
      title: "Workplace Harassment Complaint",
      category: "Workplace Conduct",
      description: "Experiencing inappropriate behavior from a colleague during team meetings.",
      status: "under-review",
      priority: "high",
      submittedDate: "2024-01-15",
      lastUpdate: "2024-01-20",
      response:
        "Your complaint has been received and is being investigated by HR. We will contact you within 3 business days.",
    },
    {
      id: "GRV002",
      title: "Unfair Performance Evaluation",
      category: "Performance Management",
      description: "I believe my performance review was unfair and not based on actual work performance.",
      status: "resolved",
      priority: "medium",
      submittedDate: "2024-01-10",
      lastUpdate: "2024-01-25",
      response:
        "After review, we have scheduled a meeting with you and your manager to discuss the evaluation criteria and provide additional feedback.",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "under-review":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubmitGrievance = () => {
    // Handle form submission
    console.log("Submitting grievance:", formData)
    setShowNewGrievanceDialog(false)
    setFormData({ title: "", category: "", description: "", priority: "medium" })
    alert("Grievance submitted successfully! You will receive updates via email.")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grievances & Complaints</h1>
          <p className="text-gray-600">File complaints and track their resolution status</p>
        </div>
        <Dialog open={showNewGrievanceDialog} onOpenChange={setShowNewGrievanceDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              File Grievance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>File a New Grievance</DialogTitle>
              <DialogDescription>
                Submit your complaint or concern. All grievances are treated confidentially.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Grievance Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workplace-conduct">Workplace Conduct</SelectItem>
                      <SelectItem value="discrimination">Discrimination</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="performance-management">Performance Management</SelectItem>
                      <SelectItem value="compensation">Compensation & Benefits</SelectItem>
                      <SelectItem value="working-conditions">Working Conditions</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about your grievance..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewGrievanceDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitGrievance} className="bg-emerald-600 hover:bg-emerald-700">
                  Submit Grievance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grievances</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Active cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">Average time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-grievances">My Grievances</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="my-grievances" className="space-y-6">
          <div className="space-y-4">
            {grievances.map((grievance) => (
              <Card key={grievance.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{grievance.title}</CardTitle>
                      <CardDescription>
                        {grievance.category} • Submitted {new Date(grievance.submittedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority.toUpperCase()}</Badge>
                      <Badge className={getStatusColor(grievance.status)}>
                        {grievance.status.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Description:</p>
                      <p className="text-sm">{grievance.description}</p>
                    </div>
                    {grievance.response && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">HR Response</p>
                        </div>
                        <p className="text-sm text-blue-800">{grievance.response}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          Last updated: {new Date(grievance.lastUpdate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grievance Guidelines</CardTitle>
              <CardDescription>Important information about filing and resolving grievances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What is a Grievance?</h3>
                <p className="text-sm text-gray-600">
                  A grievance is a formal complaint about workplace issues, treatment, or conditions that affect your
                  employment. This includes discrimination, harassment, unfair treatment, or violations of company
                  policy.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to File a Grievance</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Click "File Grievance" to submit your complaint</li>
                  <li>Provide detailed information about the incident</li>
                  <li>Select appropriate category and priority level</li>
                  <li>Submit supporting documents if available</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Resolution Process</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>HR will acknowledge receipt within 24 hours</li>
                  <li>Investigation begins within 3 business days</li>
                  <li>You will be contacted for additional information if needed</li>
                  <li>Resolution typically takes 7-14 business days</li>
                  <li>You will receive written notification of the outcome</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Confidentiality</h3>
                <p className="text-sm text-gray-600">
                  All grievances are treated with strict confidentiality. Information is only shared with individuals
                  directly involved in the investigation and resolution process.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
