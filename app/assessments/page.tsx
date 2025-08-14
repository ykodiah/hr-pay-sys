import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, BarChart3 } from "lucide-react"
import { getAssessments, getClassSubjects, getCurrentTerms } from "@/lib/actions/assessments"
import { AssessmentForm } from "@/components/assessments/assessment-form"
import Link from "next/link"

async function AssessmentsList() {
  const { assessments, error } = await getAssessments()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading assessments: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Assessments</CardTitle>
        <CardDescription>{assessments.length} assessments found</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment: any) => {
            const submittedScores = assessment.assessment_scores?.length || 0
            const totalStudents = assessment.class_subjects?.classes?.enrollments?.length || 0
            const completionRate = totalStudents > 0 ? (submittedScores / totalStudents) * 100 : 0

            return (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{assessment.title}</h3>
                    <p className="text-sm text-gray-500">
                      {assessment.class_subjects?.classes?.grades?.name} {assessment.class_subjects?.classes?.name} -{" "}
                      {assessment.class_subjects?.subjects?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {assessment.terms?.academic_yr} - Term {assessment.terms?.term_no}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize">
                      {assessment.type}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {assessment.max_score} | Weight: {assessment.weight_pct}%
                    </p>
                    <p className="text-xs text-gray-500">Completion: {completionRate.toFixed(0)}%</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/assessments/${assessment.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/assessments/${assessment.id}/gradebook`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Gradebook
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}

          {assessments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessments found. Create your first assessment below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function AssessmentCreationForm() {
  const { classSubjects } = await getClassSubjects()
  const { terms } = await getCurrentTerms()

  return <AssessmentForm classSubjects={classSubjects} terms={terms} />
}

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-2">Manage tests, quizzes, and assignments</p>
        </div>
      </div>

      {/* Assessments List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading assessments...</p>
            </CardContent>
          </Card>
        }
      >
        <AssessmentsList />
      </Suspense>

      {/* Assessment Creation Form */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading form...</p>
            </CardContent>
          </Card>
        }
      >
        <AssessmentCreationForm />
      </Suspense>
    </div>
  )
}
