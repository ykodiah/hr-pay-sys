"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Scale, Calendar, FileText, CheckCircle, XCircle, AlertTriangle, Eye, Download } from "lucide-react"

interface DisciplinaryAction {
  id: string
  type:
    | "verbal_warning"
    | "written_warning"
    | "final_warning"
    | "suspension"
    | "termination"
    | "counseling"
    | "training"
  date: Date
  description: string
  issuedBy: string
  acknowledged: boolean
  acknowledgedDate?: Date
  followUpRequired: boolean
  followUpDate?: Date
  ghanaLabourActReference?: string
}

interface DisciplinaryCase {
  id: string
  category: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "investigating" | "hearing_scheduled" | "resolved" | "closed"
  title: string
  description: string
  reportedDate: Date
  actions: DisciplinaryAction[]
  complianceNotes?: string
}

export default function MyDisciplinaryCasesPage() {
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [disciplinaryCases] = useState<DisciplinaryCase[]>([
    {
      id: "DISC-001",
      category: "Attendance",
      severity: "medium",
      status: "resolved",
      title: "Unauthorized Absence",
      description: "Absent for 2 consecutive days without prior notice in December 2024",
      reportedDate: new Date("2024-12-15"),
      actions: [
        {
          id: "ACT-001",
          type: "verbal_warning",
          date: new Date("2024-12-16"),
          description: "Verbal warning issued regarding attendance policy compliance",
          issuedBy: "Jane Smith (HR Manager)",
          acknowledged: true,
          acknowledgedDate: new Date("2024-12-16"),
          followUpRequired: true,
          followUpDate: new Date("2025-01-16"),
          ghanaLabourActReference: "Section 62 - Grounds for Termination",
        },
      ],
      complianceNotes: "Case handled in accordance with Ghana Labour Act 2003, Section 62",
    },
  ])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "investigating":
        return "bg-yellow-100 text-yellow-800"
      case "hearing_scheduled":
        return "bg-purple-100 text-purple-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionTypeLabel = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const handleAcknowledgeAction = (actionId: string) => {
    // In a real app, this would make an API call
    console.log(`Acknowledging action ${actionId}`)
    alert("Action acknowledged successfully!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Disciplinary Cases</h1>
          <p className="text-gray-600">View your disciplinary cases and acknowledge required actions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{disciplinaryCases.length}</p>
              </div>
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-orange-600">
                  {disciplinaryCases.filter((c) => c.status !== "resolved" && c.status !== "closed").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Cases</p>
                <p className="text-2xl font-bold text-green-600">
                  {disciplinaryCases.filter((c) => c.status === "resolved").length}
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
                <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold text-red-600">
                  {disciplinaryCases.flatMap((c) => c.actions).filter((a) => !a.acknowledged).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Disciplinary Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {disciplinaryCases.map((case_) => (
              <div
                key={case_.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCase(case_)
                  setIsDetailOpen(true)
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {case_.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{case_.category}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {case_.reportedDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {case_.actions.length} actions
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getSeverityColor(case_.severity)}>{case_.severity.toUpperCase()}</Badge>
                  <Badge className={getStatusColor(case_.status)}>{case_.status.replace("_", " ").toUpperCase()}</Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Case Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.id}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6">
              {/* Case Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Case Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{selectedCase.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <Badge className={getSeverityColor(selectedCase.severity)}>
                        {selectedCase.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedCase.status)}>
                        {selectedCase.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reported Date:</span>
                      <span>{selectedCase.reportedDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{selectedCase.description}</p>
                </div>
              </div>

              {/* Disciplinary Actions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Disciplinary Actions</h4>
                <div className="space-y-4">
                  {selectedCase.actions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{getActionTypeLabel(action.type)}</Badge>
                          <span className="text-sm text-gray-600">{action.date.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {action.acknowledged ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAcknowledgeAction(action.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Issued by:</span> {action.issuedBy}
                        </div>
                        {action.acknowledgedDate && (
                          <div>
                            <span className="font-medium">Acknowledged:</span>{" "}
                            {action.acknowledgedDate.toLocaleDateString()}
                          </div>
                        )}
                        {action.followUpRequired && action.followUpDate && (
                          <div>
                            <span className="font-medium">Follow-up due:</span>{" "}
                            {action.followUpDate.toLocaleDateString()}
                          </div>
                        )}
                        {action.ghanaLabourActReference && (
                          <div>
                            <span className="font-medium">Legal Reference:</span> {action.ghanaLabourActReference}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Notes */}
              {selectedCase.complianceNotes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Compliance Notes</h4>
                  <p className="text-sm text-blue-800">{selectedCase.complianceNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Case Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
