import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calculator, Calendar, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif font-bold text-3xl text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your HR operations.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 892,450</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Requests awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 156,800</div>
            <p className="text-xs text-muted-foreground">Across 34 employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start bg-cyan-600 hover:bg-cyan-700">
              <Calculator className="mr-2 h-4 w-4" />
              Run Monthly Payroll
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Users className="mr-2 h-4 w-4" />
              Add New Employee
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              Review Leave Requests
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Payroll processed successfully</p>
                  <p className="text-xs text-gray-500">December 2024 payroll completed for 247 employees</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Leave request pending approval</p>
                  <p className="text-xs text-gray-500">Akosua Mensah requested 5 days annual leave</p>
                  <p className="text-xs text-gray-400">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New employee onboarded</p>
                  <p className="text-xs text-gray-500">Kwame Asante joined the IT department</p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Loan application approved</p>
                  <p className="text-xs text-gray-500">GHS 5,000 loan approved for Ama Osei</p>
                  <p className="text-xs text-gray-400">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Upcoming Tasks</CardTitle>
          <CardDescription>Important deadlines and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">SSNIT Remittance Due</p>
                  <p className="text-xs text-gray-600">Submit December 2024 contributions</p>
                </div>
              </div>
              <Badge variant="destructive">Due in 2 days</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">PAYE Filing</p>
                  <p className="text-xs text-gray-600">Submit monthly PAYE returns</p>
                </div>
              </div>
              <Badge variant="secondary">Due in 5 days</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Performance Reviews</p>
                  <p className="text-xs text-gray-600">Q4 2024 performance evaluations</p>
                </div>
              </div>
              <Badge variant="outline">Due in 1 week</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
