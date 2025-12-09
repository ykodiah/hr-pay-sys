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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DoorOpen,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  MessageSquare,
  Calendar,
  Package,
} from "lucide-react"

interface ExitProcess {
  id: string
  status: "not-initiated" | "initiated" | "in-progress" | "completed"
  lastWorkingDay?: string
  reason?: string
  exitInterviewCompleted: boolean
  assetsReturned: boolean
  documentsSubmitted: boolean
  finalSettlement?: number
}

interface Asset {
  id: string
  name: string
  type: string
  serialNumber: string
  returned: boolean
}

export default function ExitProcessPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showInitiateDialog, setShowInitiateDialog] = useState(false)
  const [exitFormData, setExitFormData] = useState({
    lastWorkingDay: "",
    reason: "",
    comments: "",
  })

  // Mock data
  const exitProcess: ExitProcess = {
    id: "EXIT001",
    status: "not-initiated",
    exitInterviewCompleted: false,
    assetsReturned: false,
    documentsSubmitted: false,
  }

  const assets: Asset[] = [
    {
      id: "AST001",
      name: "MacBook Pro",
      type: "Laptop",
      serialNumber: "MBP2023001",
      returned: false,
    },
    {
      id: "AST002",
      name: "iPhone 14",
      type: "Mobile Phone",
      serialNumber: "IP14001",
      returned: false,
    },
    {
      id: "AST003",
      name: "Office Key Card",
      type: "Access Card",
      serialNumber: "KEY001",
      returned: false,
    },
  ]

  const exitInterviewQuestions = [
    "What prompted your decision to leave?",
    "How would you rate your overall experience working here?",
    "Did you feel supported by your manager and team?",
    "What could the company have done to retain you?",
    "Would you recommend this company as a place to work?",
    "Any additional feedback or suggestions?",
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-initiated":
        return "bg-gray-100 text-gray-800"
      case "initiated":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleInitiateExit = () => {
    console.log("Initiating exit process:", exitFormData)
    setShowInitiateDialog(false)
    alert("Exit process initiated successfully! HR will contact you within 24 hours.")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exit Process</h1>
          <p className="text-gray-600">Manage your departure process and requirements</p>
        </div>
        {exitProcess.status === "not-initiated" && (
          <Dialog open={showInitiateDialog} onOpenChange={setShowInitiateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <DoorOpen className="w-4 h-4 mr-2" />
                Initiate Exit Process
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Initiate Exit Process</DialogTitle>
                <DialogDescription>
                  Start your departure process. HR will guide you through all necessary steps.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastWorkingDay">Intended Last Working Day</Label>
                    <Input
                      id="lastWorkingDay"
                      type="date"
                      value={exitFormData.lastWorkingDay}
                      onChange={(e) => setExitFormData({ ...exitFormData, lastWorkingDay: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Leaving</Label>
                    <Select
                      value={exitFormData.reason}
                      onValueChange={(value) => setExitFormData({ ...exitFormData, reason: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resignation">Resignation</SelectItem>
                        <SelectItem value="better-opportunity">Better Opportunity</SelectItem>
                        <SelectItem value="relocation">Relocation</SelectItem>
                        <SelectItem value="personal-reasons">Personal Reasons</SelectItem>
                        <SelectItem value="career-change">Career Change</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="comments">Additional Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={exitFormData.comments}
                    onChange={(e) => setExitFormData({ ...exitFormData, comments: e.target.value })}
                    placeholder="Any additional information you'd like to share..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowInitiateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInitiateExit} className="bg-emerald-600 hover:bg-emerald-700">
                    Initiate Process
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DoorOpen className="w-5 h-5" />
            <span>Exit Process Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={getStatusColor(exitProcess.status)}>
                {exitProcess.status.replace("-", " ").toUpperCase()}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {exitProcess.status === "not-initiated"
                  ? "You haven't initiated the exit process yet."
                  : "Your exit process is currently in progress."}
              </p>
            </div>
            {exitProcess.lastWorkingDay && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Last Working Day</p>
                <p className="text-lg font-bold text-emerald-600">
                  {new Date(exitProcess.lastWorkingDay).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exit Interview</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {exitProcess.exitInterviewCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm">{exitProcess.exitInterviewCompleted ? "Completed" : "Pending"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Return</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {exitProcess.assetsReturned ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm">{exitProcess.assetsReturned ? "Completed" : "Pending"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {exitProcess.documentsSubmitted ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm">{exitProcess.documentsSubmitted ? "Submitted" : "Pending"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Settlement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {exitProcess.finalSettlement ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm">{exitProcess.finalSettlement ? "Processed" : "Pending"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exit-interview">Exit Interview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exit Process Checklist</CardTitle>
              <CardDescription>Complete these steps for a smooth departure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox checked={exitProcess.status !== "not-initiated"} />
                  <span className="text-sm">Initiate exit process with HR</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={exitProcess.exitInterviewCompleted} />
                  <span className="text-sm">Complete exit interview</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={exitProcess.assetsReturned} />
                  <span className="text-sm">Return all company assets</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={exitProcess.documentsSubmitted} />
                  <span className="text-sm">Submit required documents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={!!exitProcess.finalSettlement} />
                  <span className="text-sm">Receive final settlement</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit-interview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exit Interview</CardTitle>
              <CardDescription>
                {exitProcess.exitInterviewCompleted
                  ? "You have completed your exit interview."
                  : "Complete your exit interview to provide valuable feedback."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!exitProcess.exitInterviewCompleted ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Please answer the following questions honestly. Your feedback helps us improve the workplace for
                    others.
                  </p>
                  {exitInterviewQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <Label>
                        {index + 1}. {question}
                      </Label>
                      <Textarea placeholder="Your response..." rows={3} />
                    </div>
                  ))}
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Submit Exit Interview</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">Interview Completed</h3>
                  <p className="text-gray-600">Thank you for your valuable feedback.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Assets</CardTitle>
              <CardDescription>Return all company property before your last working day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-gray-600">
                        {asset.type} • Serial: {asset.serialNumber}
                      </p>
                    </div>
                    <Badge className={asset.returned ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {asset.returned ? "Returned" : "Pending Return"}
                    </Badge>
                  </div>
                ))}
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">Important</p>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please return all assets to the IT department before your last working day. Contact IT at
                    it@company.com to schedule a return appointment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>Download and submit these documents as part of your exit process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Resignation Letter Template</p>
                    <p className="text-sm text-gray-600">Formal resignation letter template</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Handover Checklist</p>
                    <p className="text-sm text-gray-600">Tasks and responsibilities handover form</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Final Settlement Form</p>
                    <p className="text-sm text-gray-600">Bank details for final payment</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
