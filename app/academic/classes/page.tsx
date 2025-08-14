import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap } from "lucide-react"
import { getClasses, getGrades, getTeachers } from "@/lib/actions/academic"
import { GradeForm } from "@/components/academic/grade-form"
import { ClassForm } from "@/components/academic/class-form"

async function ClassesList() {
  const { classes, error } = await getClasses()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading classes: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Classes</CardTitle>
        <CardDescription>{classes.length} classes configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes.map((classItem: any) => {
            const activeEnrollments = classItem.enrollments?.filter((e: any) => e.status === "active").length || 0
            const tutorName = classItem.staff
              ? `${classItem.staff.first_name} ${classItem.staff.last_name}`
              : "No tutor assigned"

            return (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {classItem.grades?.name} - {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-500">Tutor: {tutorName}</p>
                    <p className="text-xs text-gray-400">
                      Capacity: {activeEnrollments}/{classItem.capacity} students
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      {activeEnrollments} enrolled
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            )
          })}

          {classes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No classes found. Create your first class below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function GradesList() {
  const { grades, error } = await getGrades()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading grades: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Levels</CardTitle>
        <CardDescription>{grades.length} grade levels configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grades.map((grade: any) => (
            <div key={grade.id} className="border rounded-lg p-4 text-center">
              <h3 className="font-medium">{grade.name}</h3>
              <p className="text-sm text-gray-500">Level {grade.level_no}</p>
            </div>
          ))}

          {grades.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No grades found. Create your first grade below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function ClassManagementForms() {
  const { grades } = await getGrades()
  const { teachers } = await getTeachers()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GradeForm />
      <ClassForm grades={grades} teachers={teachers} />
    </div>
  )
}

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes & Grades</h1>
          <p className="text-gray-600 mt-2">Manage grade levels and class sections</p>
        </div>
      </div>

      {/* Grades Overview */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading grades...</p>
            </CardContent>
          </Card>
        }
      >
        <GradesList />
      </Suspense>

      {/* Classes List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading classes...</p>
            </CardContent>
          </Card>
        }
      >
        <ClassesList />
      </Suspense>

      {/* Forms */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <p>Loading forms...</p>
              </CardContent>
            </Card>
          </div>
        }
      >
        <ClassManagementForms />
      </Suspense>
    </div>
  )
}
