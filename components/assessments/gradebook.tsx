"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Calculator } from "lucide-react"
import { bulkUpdateScores } from "@/lib/actions/assessments"

interface GradebookProps {
  assessment: any
}

export function Gradebook({ assessment }: GradebookProps) {
  const [scores, setScores] = useState<{ [key: string]: string }>(() => {
    const initialScores: { [key: string]: string } = {}
    assessment.assessment_scores?.forEach((score: any) => {
      initialScores[score.student_id] = score.raw_score?.toString() || ""
    })
    return initialScores
  })

  const [state, formAction] = useActionState(bulkUpdateScores, null)

  const students = assessment.class_subjects?.classes?.enrollments?.map((enrollment: any) => enrollment.students) || []

  const updateScore = (studentId: string, score: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: score,
    }))
  }

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

  const handleSubmit = (formData: FormData) => {
    const scoresData = students.map((student: any) => ({
      student_id: student.id,
      score: scores[student.id] || null,
    }))

    formData.append("assessment_id", assessment.id.toString())
    formData.append("scores_data", JSON.stringify(scoresData))
    formAction(formData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Gradebook - {assessment.title}
            </CardTitle>
            <CardDescription>
              {assessment.class_subjects?.classes?.grades?.name} {assessment.class_subjects?.classes?.name} -{" "}
              {assessment.class_subjects?.subjects?.name}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Max Score: {assessment.max_score}</p>
            <p className="text-sm text-gray-600">Weight: {assessment.weight_pct}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{state.error}</div>
        )}

        {state?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
            {state.success}
          </div>
        )}

        <form action={handleSubmit}>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => {
                  const score = Number.parseFloat(scores[student.id]) || 0
                  const percentage = assessment.max_score > 0 ? (score / assessment.max_score) * 100 : 0
                  const grade = scores[student.id] ? calculateGrade(score, assessment.max_score) : "-"

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.student_no}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max={assessment.max_score}
                          value={scores[student.id] || ""}
                          onChange={(e) => updateScore(student.id, e.target.value)}
                          className="w-20"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>{scores[student.id] ? `${percentage.toFixed(1)}%` : "-"}</TableCell>
                      <TableCell>{grade !== "-" && <Badge className={getGradeColor(grade)}>{grade}</Badge>}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save All Scores
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
