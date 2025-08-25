"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  ExternalLink,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Package,
  MessageSquare,
  Download,
  AlertCircle,
} from "lucide-react"

interface ExitProcess {
  id: string
  status: "not_initiated" | "initiated" | "in_progress" | "completed"
  lastWorkingDay?: string
  reason?: string
  exitInterviewCompleted: boolean
  exitInterviewDate?: string
  assetsReturned: boolean
  finalSettlement?: number
  progressPercentage: number
}

interface Asset {
  id: string
  name: string
  type: string
  serialNumber: string
  returned: boolean
  returnDate?: string
}

export default function ExitProcessPage() {
  const [isExitInterviewOpen, setIsExitInterviewOpen] = useState(false)
  const [exitFeedback, setExitFeedback] = useState({
    overallSatisfaction: "",
    reasonForLeaving: "",
    workEnvironment: "",
    management: "",
    compensation: "",
    recommendations: "",
  })

  // Mock data - in real app this would come from API
  const [exitProcess] = useState<ExitProcess>({
    id: "EXIT-001",
    status: "not_initiated",
    exitInterviewCompleted: false,
    assetsReturned: false,
    progressPercentage: 0,
  })

  const [assets] = useState<Asset[]>([
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
      name: "Office Access Card",
      type: "Access Card",
      serialNumber: "ACC001",
      returned: false,
    },
  ])

  const handleInitiateExit = () => {
    toast({
      title: "Exit Process Initiated",
      description:
        "Your exit process has been initiated. HR will contact you within 24 hours to schedule your exit interview.",
    })
  }

  const handleExitInterviewSubmit = () => {
    setIsExitInterviewOpen(false)
    toast({
      title: "Exit Interview Completed",
      description:
        "Thank you for your feedback. Your responses have been recorded and will help us improve our workplace.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_initiated":
        return "bg-gray-100 text-gray-800"
      case "initiated":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exit Process</h1>
          <p className="text-gray-600">Manage your departure process and complete required tasks</p>
        </div>
        {exitProcess.status === "not_initiated" && (
          <Button onClick={handleInitiateExit} className="bg-emerald-600 hover:bg-emerald-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            Initiate Exit Process
          </Button>
        )}
      </div>

      {/* Process Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exit Process Status</CardTitle>
            <Badge className={getStatusColor(exitProcess.status)}>
              {exitProcess.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{exitProcess.progressPercentage}%</span>
              </div>
              <Progress value={exitProcess.progressPercentage} className="w-full" />
            </div>
            {exitProcess.lastWorkingDay && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Last Working Day:</span>
                  <p>{new Date(exitProcess.lastWorkingDay).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Reason:</span>
                  <p>{exitProcess.reason}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exit Checklist */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Exit Interview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Exit Interview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exit Interview</p>
                  <p className="text-sm text-gray-600">
                    {exitProcess.exitInterviewCompleted ? "Completed" : "Required"}
                  </p>
                </div>
                <div className="flex items-center">
                  {exitProcess.exitInterviewCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-orange-600" />
                  )}
                </div>
              </div>
              {!exitProcess.exitInterviewCompleted && (
                <Dialog open={isExitInterviewOpen} onOpenChange={setIsExitInterviewOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Complete Exit Interview</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Exit Interview</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Overall Satisfaction with the Company</Label>
                        <Select
                          value={exitFeedback.overallSatisfaction}
                          onValueChange={(value) =>
                            setExitFeedback((prev) => ({ ...prev, overallSatisfaction: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="very_satisfied">Very Satisfied</SelectItem>
                            <SelectItem value="satisfied">Satisfied</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="dissatisfied">Dissatisfied</SelectItem>
                            <SelectItem value="very_dissatisfied">Very Dissatisfied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Primary Reason for Leaving</Label>
                        <Textarea
                          value={exitFeedback.reasonForLeaving}
                          onChange={(e) => setExitFeedback((prev) => ({ ...prev, reasonForLeaving: e.target.value }))}
                          placeholder="Please explain your primary reason for leaving"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Work Environment Feedback</Label>
                        <Textarea
                          value={exitFeedback.workEnvironment}
                          onChange={(e) => setExitFeedback((prev) => ({ ...prev, workEnvironment: e.target.value }))}
                          placeholder="How would you describe the work environment?"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Management Feedback</Label>
                        <Textarea
                          value={exitFeedback.management}
                          onChange={(e) => setExitFeedback((prev) => ({ ...prev, management: e.target.value }))}
                          placeholder="How would you rate your management experience?"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Compensation & Benefits Feedback</Label>
                        <Textarea
                          value={exitFeedback.compensation}
                          onChange={(e) => setExitFeedback((prev) => ({ ...prev, compensation: e.target.value }))}
                          placeholder="How satisfied were you with compensation and benefits?"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Recommendations for Improvement</Label>
                        <Textarea
                          value={exitFeedback.recommendations}
                          onChange={(e) => setExitFeedback((prev) => ({ ...prev, recommendations: e.target.value }))}
                          placeholder="What recommendations do you have for improving the company?"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsExitInterviewOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleExitInterviewSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                          Submit Interview
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Final Settlement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Final Settlement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Settlement Calculation</p>
                  <p className="text-sm text-gray-600">
                    {exitProcess.finalSettlement ? `GHS ${exitProcess.finalSettlement.toLocaleString()}` : "Pending"}
                  </p>
                </div>
                <div className="flex items-center">
                  {exitProcess.finalSettlement ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-orange-600" />
                  )}
                </div>
              </div>
              {exitProcess.finalSettlement && (
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download Settlement Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Return */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Asset Return</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-gray-600">
                    {asset.type} • Serial: {asset.serialNumber}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {asset.returned ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Returned
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pending Return
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Asset Return Required</p>
                  <p className="text-sm text-yellow-700">
                    Please return all company assets to HR before your last working day. Contact HR to schedule asset
                    return.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Important Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Ghana Labour Act Compliance</h4>
              <p className="text-sm text-blue-800">
                Your exit process follows Ghana Labour Act 2003 requirements including proper notice periods, final
                settlement calculations, and documentation procedures.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Next Steps:</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• Complete exit interview</li>
                  <li>• Return all company assets</li>
                  <li>• Handover responsibilities</li>
                  <li>• Collect final settlement</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Contact Information:</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• HR Department: hr@company.com</li>
                  <li>• Phone: +233 20 123 4567</li>
                  <li>• Office Hours: 8:00 AM - 5:00 PM</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
