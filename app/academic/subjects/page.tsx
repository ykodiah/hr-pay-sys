import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, User } from "lucide-react"
import { getSubjects } from "@/lib/actions/academic"
import { SubjectForm } from "@/components/academic/subject-form"

async function SubjectsList() {
  const { subjects, error } = await getSubjects()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading subjects: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Subjects</CardTitle>
        <CardDescription>{subjects.length} subjects configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.map((subject: any) => (
            <div key={subject.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{subject.name}</h3>
                    <p className="text-sm text-gray-500">Code: {subject.code}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </div>

              {/* Class Assignments */}
              {subject.class_subjects && subject.class_subjects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Assigned to Classes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {subject.class_subjects.map((cs: any) => (
                      <div key={cs.id} className="bg-gray-50 rounded-lg p-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {cs.classes?.grades?.name} - {cs.classes?.name}
                          </Badge>
                          {cs.staff && (
                            <div className="flex items-center text-xs text-gray-600">
                              <User className="h-3 w-3 mr-1" />
                              {cs.staff.first_name} {cs.staff.last_name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!subject.class_subjects || subject.class_subjects.length === 0) && (
                <p className="text-sm text-gray-500">Not assigned to any classes yet</p>
              )}
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No subjects found. Create your first subject below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600 mt-2">Manage academic subjects and class assignments</p>
        </div>
      </div>

      {/* Subjects List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading subjects...</p>
            </CardContent>
          </Card>
        }
      >
        <SubjectsList />
      </Suspense>

      {/* Subject Form */}
      <SubjectForm />
    </div>
  )
}
