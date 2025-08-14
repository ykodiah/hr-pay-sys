import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Edit, BarChart3, Users, Calendar } from "lucide-react"
import { getAssessmentById } from "@/lib/actions/assessments"
import Link from "next/link"

interface AssessmentDetailPageProps {
  params: {
    id: string
  }
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { assessment, error } = await getAssessmentById(params.id)

  if (error || !assessment) {
    notFound()
  }

  const students = assessment.class_subjects?.classes?.enrollments?.map((enrollment: any) => enrollment.students) || []
  const submittedScores = assessment.assessment_scores || []
  const completionRate = students.length > 0 ? (submittedScores.length / students.length) * 100 : 0

  const calculateGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "C":
        return "bg-yellow-100 text-yellow-800"
      case "D":
        return "bg-orange-100 text-orange-800"
      case "F":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const averageScore =
    submittedScores.length > 0
      ? submittedScores.reduce((sum: number, score: any) => sum + (score.raw_score || 0), 0) / submittedScores.length
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-gray-600">
              {assessment.class_subjects?.classes?.grades?.name} {assessment.class_subjects?.classes?.name} -{" "}
              {assessment.class_subjects?.subjects?.name}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {assessment.type}
              </Badge>
              <Badge variant={assessment.moderation_status === "approved" ? "default" : "secondary"}>
                {assessment.moderation_status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/assessments/${assessment.id}/gradebook`}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Gradebook
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/assessments/${assessment.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Assessment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maximum Score</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment.max_score}</div>
            <p className="text-xs text-muted-foreground">Points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment.weight_pct}%</div>
            <p className="text-xs text-muted-foreground">Of total grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {submittedScores.length} of {students.length} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {assessment.max_score > 0 ? `${((averageScore / assessment.max_score) * 100).toFixed(1)}%` : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Student Scores</CardTitle>
          <CardDescription>Individual student performance on this assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Raw Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => {
                const studentScore = submittedScores.find((score: any) => score.student_id === student.id)
                const rawScore = studentScore?.raw_score || 0
                const percentage = assessment.max_score > 0 ? (rawScore / assessment.max_score) * 100 : 0
                const grade = studentScore ? calculateGrade(rawScore, assessment.max_score) : "-"

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.student_no}</TableCell>
                    <TableCell>{studentScore ? `${rawScore}/${assessment.max_score}` : "-"}</TableCell>
                    <TableCell>{studentScore ? `${percentage.toFixed(1)}%` : "-"}</TableCell>
                    <TableCell>{grade !== "-" && <Badge className={getGradeColor(grade)}>{grade}</Badge>}</TableCell>
                    <TableCell>
                      <Badge variant={studentScore ? "default" : "secondary"}>
                        {studentScore ? "Submitted" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
