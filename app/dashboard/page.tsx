import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, DollarSign, BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening at your school today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="h-3 w-3 mr-1" />
              Across all grades
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Today
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Student Management
            </CardTitle>
            <CardDescription>Manage student records, enrollment, and profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/students">View Students</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/students/admissions">New Admission</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              Academic Management
            </CardTitle>
            <CardDescription>Handle classes, subjects, timetables, and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/academic/classes">Manage Classes</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/academic/timetable">Timetable</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
              Fee Management
            </CardTitle>
            <CardDescription>Process payments, generate invoices, and track fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/finance/invoices">View Invoices</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/finance/payments">Payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Attendance Tracking
            </CardTitle>
            <CardDescription>Mark attendance and view attendance reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/attendance">Mark Attendance</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/reports">View Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
              Assessments
            </CardTitle>
            <CardDescription>Manage grades, exams, and student assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/assessments/gradebook">Gradebook</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/assessments/exams">Exams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-red-600" />
              Reports & Analytics
            </CardTitle>
            <CardDescription>Generate reports and view school performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/reports">View Reports</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/reports">Analytics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest actions in your school management system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New student admission approved</p>
                  <p className="text-xs text-gray-500">John Doe - Grade 10A</p>
                </div>
                <span className="text-xs text-gray-400">2 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Fee payment received</p>
                  <p className="text-xs text-gray-500">$450 from Sarah Smith</p>
                </div>
                <span className="text-xs text-gray-400">15 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Attendance marked</p>
                  <p className="text-xs text-gray-500">Grade 9B - 28/30 present</p>
                </div>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Important dates and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-red-600">15</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mid-term Exams Begin</p>
                  <p className="text-xs text-gray-500">All grades - Mathematics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">20</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Fee Payment Deadline</p>
                  <p className="text-xs text-gray-500">Term 2 fees due</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">25</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Parent-Teacher Conference</p>
                  <p className="text-xs text-gray-500">Grade 10 & 11</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
