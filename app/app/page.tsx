import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calculator,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  UserCheck,
  GraduationCap,
  Target,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  Briefcase,
} from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll Dashboard</h1>
          <p className="text-gray-600">Welcome back, Kwame. Here's your complete organizational overview.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            January 2025
          </Badge>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Process Payroll</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">247</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12 this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Payroll</CardTitle>
            <Calculator className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">GHS 485,200</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Positions</CardTitle>
            <Briefcase className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />3 new this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Employee Management */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-600" />
              Employee Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Employees</span>
              <span className="font-medium">247</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">On Probation</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Departments</span>
              <span className="font-medium">8</span>
            </div>
          </CardContent>
        </Card>

        {/* Recruitment */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
              Recruitment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Open Positions</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Applications</span>
              <span className="font-medium">156</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Interviews Scheduled</span>
              <span className="font-medium">24</span>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Goals</span>
              <span className="font-medium">342</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reviews Due</span>
              <span className="font-medium">18</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Rating</span>
              <span className="font-medium">4.2/5</span>
            </div>
          </CardContent>
        </Card>

        {/* Learning */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
              Learning & Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Courses</span>
              <span className="font-medium">45</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Enrollments</span>
              <span className="font-medium">189</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-medium">87%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
              <Calculator className="w-4 h-4 mr-2" />
              Process Payroll
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Users className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Briefcase className="w-4 h-4 mr-2" />
              Post Job Opening
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              Approve Requests
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <FileText className="w-4 h-4 mr-2" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Payroll processed for December 2024</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Completed
                </Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New job application received for Software Engineer
                  </p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Performance review due for 5 employees</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  Due Soon
                </Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Training course "Leadership Skills" completed by 12 employees
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-emerald-600" />
            Compliance & System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">PAYE Calculations</p>
                <p className="text-sm text-gray-600">Up to date with 2025 rates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">SSNIT Contributions</p>
                <p className="text-sm text-gray-600">All submissions current</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Data Security</p>
                <p className="text-sm text-gray-600">All systems secure</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">Audit Trail</p>
                <p className="text-sm text-gray-600">3 items need review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
