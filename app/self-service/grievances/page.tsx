"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { MessageSquare, Plus, Calendar, CheckCircle, AlertCircle, Eye, User } from "lucide-react"

interface GrievanceCase {
  id: string
  title: string
  grievanceType: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "submitted" | "acknowledged" | "investigating" | "mediation" | "hearing" | "resolved" | "closed"
  description: string
  submittedDate: Date
  desiredOutcome: string
  investigator?: string
  resolution?: string
  satisfactionRating?: number
}

export default function MyGrievancesPage() {
  const [isNewGrievanceOpen, setIsNewGrievanceOpen] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceCase | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [grievances, setGrievances] = useState<GrievanceCase[]>([
    {
      id: "GRIEV-001",
      title: "Overtime Payment Dispute",
      grievanceType: "Compensation Dispute",
      priority: "medium",
      status: "investigating",
      description:
        "I have not received payment for overtime hours worked in December 2024. I worked 15 hours of overtime but only received payment for 10 hours.",
      submittedDate: new Date("2024-01-15"),
      desiredOutcome: "Payment of outstanding overtime compensation (5 hours at overtime rate)",
      investigator: "HR Manager",
    },
    {
      id: "GRIEV-002",
      title: "Workplace Harassment Concern",
      grievanceType: "Workplace Harassment",
      priority: "high",
      status: "mediation",
      description:
        "Experiencing inappropriate comments and behavior from a colleague that makes me uncomfortable in the workplace.",
      submittedDate: new Date("2024-01-10"),
      desiredOutcome: "Investigation and appropriate action to ensure a safe work environment",
      investigator: "External HR Consultant",
    },
  ])

  const handleNewGrievance = (grievanceData: any) => {
    const newGrievance: GrievanceCase = {
      id: `GRIEV-${String(grievances.length + 1).padStart(3, "0")}`,
      ...grievanceData,
      submittedDate: new Date(),
      status: "submitted" as const,
    }
    setGrievances([...grievances, newGrievance])
    setIsNewGrievanceOpen(false)
    toast({
      title: "Grievance Submitted Successfully",
      description: `Your grievance ${newGrievance.id} has been submitted and will be reviewed by HR within 2 business days.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800"
      case "investigating":
        return "bg-orange-100 text-orange-800"
      case "mediation":
        return "bg-purple-100 text-purple-800"
      case "hearing":
        return "bg-red-100 text-red-800"
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
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Grievances</h1>
          <p className="text-gray-600">Submit and track your workplace grievances and concerns</p>
        </div>
        <Dialog open={isNewGrievanceOpen} onOpenChange={setIsNewGrievanceOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Submit New Grievance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit New Grievance</DialogTitle>
            </DialogHeader>
            <NewGrievanceForm onSubmit={handleNewGrievance} onClose={() => setIsNewGrievanceOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Grievances</p>
                <p className="text-2xl font-bold text-gray-900">{grievances.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Investigation</p>
                <p className="text-2xl font-bold text-orange-600">
                  {grievances.filter((g) => g.status === "investigating").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {grievances.filter((g) => g.status === "resolved").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {grievances.filter((g) => g.priority === "high" || g.priority === "urgent").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grievances List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Grievances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grievances.map((grievance) => (
              <div
                key={grievance.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedGrievance(grievance)
                  setIsDetailOpen(true)
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{grievance.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {grievance.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{grievance.grievanceType}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {grievance.submittedDate.toLocaleDateString()}
                    </div>
                    {grievance.investigator && (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {grievance.investigator}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getPriorityColor(grievance.priority)}>{grievance.priority.toUpperCase()}</Badge>
                  <Badge className={getStatusColor(grievance.status)}>
                    {grievance.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grievance Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grievance Details - {selectedGrievance?.id}</DialogTitle>
          </DialogHeader>
          {selectedGrievance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge className={getStatusColor(selectedGrievance.status)}>
                    {selectedGrievance.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Priority</Label>
                  <Badge className={getPriorityColor(selectedGrievance.priority)}>
                    {selectedGrievance.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Grievance Type</Label>
                <p className="text-sm text-gray-900">{selectedGrievance.grievanceType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm text-gray-900">{selectedGrievance.description}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Desired Outcome</Label>
                <p className="text-sm text-gray-900">{selectedGrievance.desiredOutcome}</p>
              </div>
              {selectedGrievance.investigator && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned Investigator</Label>
                  <p className="text-sm text-gray-900">{selectedGrievance.investigator}</p>
                </div>
              )}
              {selectedGrievance.resolution && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Resolution</Label>
                  <p className="text-sm text-gray-900">{selectedGrievance.resolution}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewGrievanceForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    grievanceType: "",
    priority: "medium",
    description: "",
    desiredOutcome: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Grievance Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Brief title describing your grievance"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grievanceType">Grievance Type *</Label>
          <Select
            value={formData.grievanceType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, grievanceType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Workplace Harassment">Workplace Harassment</SelectItem>
              <SelectItem value="Compensation Dispute">Compensation Dispute</SelectItem>
              <SelectItem value="Working Conditions">Working Conditions</SelectItem>
              <SelectItem value="Discrimination">Discrimination</SelectItem>
              <SelectItem value="Policy Violation">Policy Violation</SelectItem>
              <SelectItem value="Management Issues">Management Issues</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of your grievance"
          rows={4}
          required
        />
      </div>
      <div>
        <Label htmlFor="desiredOutcome">Desired Outcome *</Label>
        <Textarea
          id="desiredOutcome"
          value={formData.desiredOutcome}
          onChange={(e) => setFormData((prev) => ({ ...prev, desiredOutcome: e.target.value }))}
          placeholder="What outcome are you seeking?"
          rows={3}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Submit Grievance
        </Button>
      </div>
    </form>
  )
}
