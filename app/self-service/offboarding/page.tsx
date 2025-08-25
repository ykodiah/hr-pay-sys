"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UserX, CheckCircle, Clock, FileText, Download, MessageSquare } from "lucide-react"

export default function EmployeeOffboardingPage() {
  const [exitInterviewCompleted, setExitInterviewCompleted] = useState(false)
  const [feedback, setFeedback] = useState("")

  // Sample offboarding data for the logged-in employee
  const offboardingStatus = {
    initiated: true,
    lastWorkingDay: "2024-07-15",
    status: "In Progress",
    completionPercentage: 65,
  }

  const checklist = [
    { id: 1, task: "Submit resignation letter", completed: true, department: "HR" },
    { id: 2, task: "Complete exit interview", completed: exitInterviewCompleted, department: "HR" },
    { id: 3, task: "Return company laptop", completed: false, department: "IT" },
    { id: 4, task: "Return office keys and access cards", completed: false, department: "Facilities" },
    { id: 5, task: "Complete knowledge transfer", completed: true, department: "Manager" },
    { id: 6, task: "Clear outstanding expenses", completed: false, department: "Finance" },
    { id: 7, task: "Update personal contact information", completed: true, department: "HR" },
    { id: 8, task: "Return company property", completed: false, department: "Admin" },
  ]

  const documents = [
    { name: "Resignation Letter", status: "Submitted", date: "2024-06-01" },
    { name: "Exit Interview Form", status: "Pending", date: "-" },
    { name: "Final Settlement Letter", status: "Pending", date: "-" },
    { name: "Experience Certificate", status: "Pending", date: "-" },
  ]

  const completedTasks = checklist.filter((item) => item.completed).length
  const progressPercentage = (completedTasks / checklist.length) * 100

  const handleExitInterviewSubmit = () => {
    if (feedback.trim()) {
      setExitInterviewCompleted(true)
      setFeedback("")
      alert("Exit interview completed successfully. Thank you for your feedback.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Exit Process</h1>
        <p className="text-gray-600 mt-1">Track your offboarding progress and complete required tasks</p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Offboarding Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Last Working Day</p>
              <p className="font-semibold">{offboardingStatus.lastWorkingDay}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant="outline">{offboardingStatus.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={progressPercentage} className="flex-1" />
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Exit Checklist</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="interview">Exit Interview</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exit Checklist</CardTitle>
              <CardDescription>Complete all required tasks before your last working day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-500" />
                      )}
                      <div>
                        <p className={`font-medium ${item.completed ? "text-green-700" : "text-gray-900"}`}>
                          {item.task}
                        </p>
                        <p className="text-sm text-gray-500">Department: {item.department}</p>
                      </div>
                    </div>
                    <Badge variant={item.completed ? "default" : "secondary"}>
                      {item.completed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Exit Documents
              </CardTitle>
              <CardDescription>View and download your exit-related documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.date !== "-" ? `Generated: ${doc.date}` : "Not yet generated"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === "Submitted" ? "default" : "secondary"}>{doc.status}</Badge>
                      {doc.status === "Submitted" && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Exit Interview
              </CardTitle>
              <CardDescription>Share your feedback about your experience with the company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!exitInterviewCompleted ? (
                <>
                  <div>
                    <Label htmlFor="feedback">Please share your feedback about your experience</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Share your thoughts about your role, team, management, company culture, suggestions for improvement, etc..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Exit Interview Guidelines</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Your feedback is confidential and will be used to improve our workplace</li>
                      <li>• Please be honest and constructive in your responses</li>
                      <li>• This interview is mandatory as per company policy</li>
                      <li>• You may request a face-to-face interview with HR if preferred</li>
                    </ul>
                  </div>
                  <Button onClick={handleExitInterviewSubmit} className="w-full">
                    Submit Exit Interview
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-semibold text-green-700 mb-2">Exit Interview Completed</h3>
                  <p className="text-gray-600">
                    Thank you for your valuable feedback. Your responses have been recorded.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
