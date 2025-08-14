import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, FileText, TrendingUp } from "lucide-react"
import {
  getStudentEnrollmentStats,
  getFinancialStats,
  getAcademicPerformanceStats,
  getCommunicationStats,
} from "@/lib/actions/reports"
import { EnrollmentChart } from "@/components/reports/enrollment-chart"
import { FinancialChart } from "@/components/reports/financial-chart"
import { PerformanceChart } from "@/components/reports/performance-chart"

async function EnrollmentReports() {
  const { totalStudents, newEnrollments, gradeStats, error } = await getStudentEnrollmentStats()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading enrollment data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return <EnrollmentChart data={gradeStats} totalStudents={totalStudents} newEnrollments={newEnrollments} />
}

async function FinancialReports() {
  const { monthlyRevenue, outstandingBalance, monthlyTrends, error } = await getFinancialStats()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading financial data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <FinancialChart
      monthlyRevenue={monthlyRevenue}
      outstandingBalance={outstandingBalance}
      monthlyTrends={monthlyTrends}
    />
  )
}

async function AcademicReports() {
  const { subjectAverages, recentAssessments, error } = await getAcademicPerformanceStats()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading academic data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return <PerformanceChart subjectAverages={subjectAverages} recentAssessments={recentAssessments} />
}

async function CommunicationReports() {
  const { totalMessages, totalAnnouncements, weeklyMessages, error } = await getCommunicationStats()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading communication data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalMessages}</p>
              <p className="text-sm text-gray-600">Total Messages</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalAnnouncements}</p>
              <p className="text-sm text-gray-600">Announcements</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{weeklyMessages}</p>
              <p className="text-sm text-gray-600">This Week</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into school performance and operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Student Enrollment Reports */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Student Enrollment</h2>
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <p>Loading enrollment data...</p>
              </CardContent>
            </Card>
          }
        >
          <EnrollmentReports />
        </Suspense>
      </div>

      {/* Financial Reports */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Financial Performance</h2>
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <p>Loading financial data...</p>
              </CardContent>
            </Card>
          }
        >
          <FinancialReports />
        </Suspense>
      </div>

      {/* Academic Performance Reports */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Academic Performance</h2>
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <p>Loading academic data...</p>
              </CardContent>
            </Card>
          }
        >
          <AcademicReports />
        </Suspense>
      </div>

      {/* Communication Reports */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Communication Activity</h2>
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <p>Loading communication data...</p>
              </CardContent>
            </Card>
          }
        >
          <CommunicationReports />
        </Suspense>
      </div>
    </div>
  )
}
