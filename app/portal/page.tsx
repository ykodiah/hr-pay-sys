import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, CreditCard, User, Download, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function PortalDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif font-bold text-3xl mb-2">Welcome back, Akosua!</h1>
            <p className="text-cyan-100 text-lg">Here's what's happening with your account today.</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-100 text-sm">Today's Date</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-cyan-600" />
              <Badge variant="secondary">Latest</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-1">December Payslip</h3>
            <p className="text-sm text-gray-600 mb-3">Net Pay: GHS 3,420</p>
            <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-green-600" />
              <Badge variant="outline">18 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-1">Annual Leave</h3>
            <p className="text-sm text-gray-600 mb-3">Remaining balance</p>
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              Request Leave
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-1">Loan Balance</h3>
            <p className="text-sm text-gray-600 mb-3">GHS 2,400 remaining</p>
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <User className="h-8 w-8 text-orange-600" />
              <Badge variant="outline">Complete</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-1">Profile</h3>
            <p className="text-sm text-gray-600 mb-3">100% completed</p>
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              Update Info
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Activity</CardTitle>
            <CardDescription>Your latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Payslip generated</p>
                  <p className="text-xs text-gray-500">December 2024 payslip is now available</p>
                  <p className="text-xs text-gray-400">2 days ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Leave request approved</p>
                  <p className="text-xs text-gray-500">Your annual leave for Dec 23-27 was approved</p>
                  <p className="text-xs text-gray-400">1 week ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Loan payment processed</p>
                  <p className="text-xs text-gray-500">Monthly loan payment of GHS 400 deducted</p>
                  <p className="text-xs text-gray-400">2 weeks ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile updated</p>
                  <p className="text-xs text-gray-500">Emergency contact information updated</p>
                  <p className="text-xs text-gray-400">3 weeks ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Notifications</CardTitle>
            <CardDescription>Important updates and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Performance Review Due</p>
                    <p className="text-xs text-blue-700">Your Q4 2024 self-assessment is due by January 15th</p>
                    <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                      Start Review
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Benefits Enrollment</p>
                    <p className="text-xs text-green-700">2025 health insurance enrollment is now open</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">Training Reminder</p>
                    <p className="text-xs text-orange-700">Complete mandatory cybersecurity training by Jan 31st</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    >
                      Start Training
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Leave Balance Overview</CardTitle>
          <CardDescription>Your current leave entitlements and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">18</div>
              <p className="text-sm text-blue-700 font-medium">Annual Leave</p>
              <p className="text-xs text-blue-600">days remaining</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">8</div>
              <p className="text-sm text-red-700 font-medium">Sick Leave</p>
              <p className="text-xs text-red-600">days remaining</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">5</div>
              <p className="text-sm text-green-700 font-medium">Study Leave</p>
              <p className="text-xs text-green-600">days remaining</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <p className="text-sm text-purple-700 font-medium">Compassionate</p>
              <p className="text-xs text-purple-600">days remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
