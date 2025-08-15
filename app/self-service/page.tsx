"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react"

export default function SelfServiceDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Kwame!</h1>
          <p className="text-gray-600">Here's your personal HR dashboard</p>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
          January 2025
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS 7,372</div>
                <p className="text-sm text-gray-600">Last Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">18</div>
                <p className="text-sm text-gray-600">Leave Days Left</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">1</div>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">3.2</div>
                <p className="text-sm text-gray-600">Years of Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
              <Calendar className="w-6 h-6" />
              <span>Request Leave</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <FileText className="w-6 h-6" />
              <span>View Payslips</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <CreditCard className="w-6 h-6" />
              <span>Apply for Loan</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <CheckCircle className="w-6 h-6" />
              <span>Update Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Current Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payslips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Recent Payslips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">January 2025</p>
                  <p className="text-sm text-gray-600">Net Pay: GHS 7,372</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => {
                    // Simulate PDF download
                    const link = document.createElement("a")
                    link.href = "#"
                    link.download = "Payslip_January_2025.pdf"
                    link.click()
                    // Show success message
                    alert("Payslip downloaded successfully!")
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">December 2024</p>
                  <p className="text-sm text-gray-600">Net Pay: GHS 7,285</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = "#"
                    link.download = "Payslip_December_2024.pdf"
                    link.click()
                    alert("Payslip downloaded successfully!")
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">November 2024</p>
                  <p className="text-sm text-gray-600">Net Pay: GHS 7,156</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = "#"
                    link.download = "Payslip_November_2024.pdf"
                    link.click()
                    alert("Payslip downloaded successfully!")
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Leave Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Annual Leave Request</p>
                    <p className="text-sm text-gray-600">Feb 15-22, 2025 (6 days)</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">21</p>
                  <p className="text-xs text-gray-600">Total Annual</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">3</p>
                  <p className="text-xs text-gray-600">Used</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">18</p>
                  <p className="text-xs text-gray-600">Remaining</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Employee ID</p>
              <p className="text-lg font-semibold text-gray-900">EMP-001</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-lg font-semibold text-gray-900">Technology</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Position</p>
              <p className="text-lg font-semibold text-gray-900">Senior Software Engineer</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="text-lg font-semibold text-gray-900">March 15, 2022</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
