"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, FileText, Calendar, MessageSquare, Eye } from "lucide-react"

export default function EmployeeDisciplinaryPage() {
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [grievanceText, setGrievanceText] = useState("")

  // Sample data for the logged-in employee
  const myCases = [
    {
      id: "DISC-2024-001",
      type: "Verbal Warning",
      subject: "Late Arrival",
      description: "Consistent late arrival to work",
      status: "Closed",
      date: "2024-05-15",
      manager: "Sarah Johnson",
      details: "Employee arrived late on 3 occasions in May 2024. Verbal warning issued with improvement plan.",
      actions: ["Verbal warning issued", "Improvement plan created", "Follow-up scheduled"],
      documents: ["Warning Letter.pdf", "Improvement Plan.pdf"],
    },
  ]

  const myGrievances = [
    {
      id: "GRIEV-2024-001",
      subject: "Workload Distribution",
      description: "Unequal distribution of tasks among team members",
      status: "Under Review",
      date: "2024-06-01",
      assignedTo: "HR Department",
      priority: "Medium",
    },
  ]

  const handleSubmitGrievance = () => {
    if (grievanceText.trim()) {
      // Add grievance submission logic here
      setGrievanceText("")
      alert("Grievance submitted successfully. You will receive a confirmation email shortly.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Cases & Grievances</h1>
        <p className="text-gray-600 mt-1">View your disciplinary cases and submit grievances</p>
      </div>

      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cases">My Cases</TabsTrigger>
          <TabsTrigger value="grievances">My Grievances</TabsTrigger>
          <TabsTrigger value="submit">Submit Grievance</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Disciplinary Cases
              </CardTitle>
              <CardDescription>View all disciplinary cases and actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              {myCases.length > 0 ? (
                <div className="space-y-4">
                  {myCases.map((case_) => (
                    <div key={case_.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{case_.subject}</h3>
                            <Badge variant={case_.status === "Closed" ? "secondary" : "destructive"}>
                              {case_.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{case_.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {case_.date}
                            </span>
                            <span>Manager: {case_.manager}</span>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{case_.subject}</DialogTitle>
                              <DialogDescription>Case ID: {case_.id}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Details</h4>
                                <p className="text-sm text-gray-600">{case_.details}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Actions Taken</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                  {case_.actions.map((action, index) => (
                                    <li key={index}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Documents</h4>
                                <div className="space-y-2">
                                  {case_.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      <span className="text-sm">{doc}</span>
                                      <Button variant="ghost" size="sm">
                                        Download
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No disciplinary cases found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grievances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                My Grievances
              </CardTitle>
              <CardDescription>Track your submitted grievances and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {myGrievances.length > 0 ? (
                <div className="space-y-4">
                  {myGrievances.map((grievance) => (
                    <div key={grievance.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{grievance.subject}</h3>
                            <Badge variant="outline">{grievance.status}</Badge>
                            <Badge variant="secondary">{grievance.priority}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{grievance.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {grievance.date}
                            </span>
                            <span>Assigned to: {grievance.assignedTo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No grievances submitted</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Grievance</CardTitle>
              <CardDescription>Submit a formal grievance following Ghana Labour Act procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="grievance">Describe your grievance in detail</Label>
                <Textarea
                  id="grievance"
                  placeholder="Please provide a detailed description of your grievance, including dates, witnesses, and any supporting information..."
                  value={grievanceText}
                  onChange={(e) => setGrievanceText(e.target.value)}
                  className="min-h-32"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Grievance Process</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your grievance will be reviewed within 5 working days</li>
                  <li>• You will receive acknowledgment and case number via email</li>
                  <li>• Investigation will be conducted as per Ghana Labour Act</li>
                  <li>• You have the right to representation during the process</li>
                </ul>
              </div>
              <Button onClick={handleSubmitGrievance} className="w-full">
                Submit Grievance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
