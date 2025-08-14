import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, FileText } from "lucide-react"
import { getAssessments } from "@/lib/actions/assessments"
import Link from "next/link"

export default async function GradebookOverviewPage() {
  const { assessments, error } = await getAssessments()

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-gray-600 mt-2">Access gradebooks for all assessments</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading assessments: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
        <p className="text-gray-600 mt-2">Access gradebooks for all assessments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Gradebooks</CardTitle>
          <CardDescription>Select an assessment to enter or view grades</CardDescription>
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
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {assessment.type}
                        </Badge>
                        <span className="text-xs text-gray-500">Completion: {completionRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Max: {assessment.max_score}</p>
                      <p className="text-xs text-gray-500">Weight: {assessment.weight_pct}%</p>
                    </div>
                    <Button asChild>
                      <Link href={`/assessments/${assessment.id}/gradebook`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Open Gradebook
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}

            {assessments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No assessments found. Create assessments to access gradebooks.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
