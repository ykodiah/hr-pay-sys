import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Filter, Download, Eye } from "lucide-react"
import { getStudents } from "@/lib/actions/students"
import Link from "next/link"

async function StudentsList({ searchTerm }: { searchTerm?: string }) {
  const { students, error } = await getStudents(searchTerm)

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading students: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Students</CardTitle>
        <CardDescription>{students.length} students found</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student: any) => {
            const fullName = `${student.first_name} ${student.last_name}`
            const initials = `${student.first_name[0]}${student.last_name[0]}`
            const currentEnrollment = student.enrollments?.find((e: any) => e.terms?.is_current)
            const primaryGuardian = student.student_guardians?.find((sg: any) => sg.is_primary)

            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt={fullName} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{fullName}</h3>
                    <p className="text-sm text-gray-500">Student ID: {student.student_no}</p>
                    {primaryGuardian && (
                      <p className="text-xs text-gray-400">
                        Guardian: {primaryGuardian.guardians.first_name} {primaryGuardian.guardians.last_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {currentEnrollment && (
                    <Badge variant="secondary">
                      {currentEnrollment.classes?.grades?.name} - {currentEnrollment.classes?.name}
                    </Badge>
                  )}
                  <Badge
                    variant={student.status === "active" ? "default" : "outline"}
                    className={student.status === "active" ? "text-green-600 border-green-200" : ""}
                  >
                    {student.status}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/students/${student.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}

          {students.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function StudentsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage student records and information</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/students/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Search students by name, ID, or class..."
                  className="pl-10"
                  defaultValue={searchParams.search || ""}
                />
              </div>
            </div>
            <Button type="submit" variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Students List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading students...</p>
            </CardContent>
          </Card>
        }
      >
        <StudentsList searchTerm={searchParams.search} />
      </Suspense>
    </div>
  )
}
