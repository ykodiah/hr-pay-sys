"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Calendar,
  CreditCard,
  DollarSign,
  AlertCircle,
  User,
  Settings,
  GraduationCap,
  Target,
  Award,
  Bell,
} from "lucide-react"

export default function SelfServiceDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Kwame!</h1>
          <p className="text-gray-600">Here's your personal HR dashboard with all your information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            January 2025
          </Badge>
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />3 Notifications
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">85%</div>
                <p className="text-sm text-gray-600">Goal Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <p className="text-sm text-gray-600">Courses Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col space-y-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
              <a href="/self-service/leave">
                <Calendar className="w-6 h-6" />
                <span>Request Leave</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/payslips">
                <FileText className="w-6 h-6" />
                <span>View Payslips</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/loans">
                <CreditCard className="w-6 h-6" />
                <span>Apply for Loan</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/profile">
                <User className="w-6 h-6" />
                <span>Update Profile</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/goals">
                <Target className="w-6 h-6" />
                <span>View Goals</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/courses">
                <GraduationCap className="w-6 h-6" />
                <span>Browse Courses</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/performance">
                <Award className="w-6 h-6" />
                <span>Performance</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
              <a href="/self-service/settings">
                <Settings className="w-6 h-6" />
                <span>Settings</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
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
                  <p className="text-xs text-gray-500">Total Allowances: GHS 1,200</p>
                  <p className="text-xs text-gray-500">PF Total: GHS 1,456</p>
                  <p className="text-xs text-gray-500">Total Deductions: GHS 2,890</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = "#"
                    link.download = "Payslip_January_2025.pdf"
                    link.click()
                    alert("Payslip downloaded successfully!")
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">December 2024</p>
                  <p className="text-sm text-gray-600">Net Pay: GHS 7,285</p>
                  <p className="text-xs text-gray-500">Total Allowances: GHS 1,150</p>
                  <p className="text-xs text-gray-500">PF Total: GHS 1,398</p>
                  <p className="text-xs text-gray-500">Total Deductions: GHS 2,765</p>
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
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance & Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Performance & Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">Q1 2025 Goals</p>
                  <Badge className="bg-purple-100 text-purple-800">85% Complete</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">4.2</p>
                  <p className="text-xs text-gray-600">Performance Rating</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">3</p>
                  <p className="text-xs text-gray-600">Goals Achieved</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning & Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Learning Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">Leadership Skills</p>
                  <Badge className="bg-indigo-100 text-indigo-800">In Progress</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">60% Complete</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">2</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xl font-bold text-orange-600">1</p>
                  <p className="text-xs text-gray-600">In Progress</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
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
              <div>
                <p className="text-sm font-medium text-gray-500">Years of Service</p>
                <p className="text-lg font-semibold text-gray-900">3.2 years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Employment Status</p>
                <p className="text-lg font-semibold text-emerald-600">Active</p>
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
    </div>
  )
}
