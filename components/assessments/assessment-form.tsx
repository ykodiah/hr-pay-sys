"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createAssessment } from "@/lib/actions/assessments"

interface AssessmentFormProps {
  classSubjects: any[]
  terms: any[]
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Assessment"
      )}
    </Button>
  )
}

export function AssessmentForm({ classSubjects, terms }: AssessmentFormProps) {
  const [state, formAction] = useActionState(createAssessment, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Assessment</CardTitle>
        <CardDescription>Add a new test, quiz, or assignment</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{state.error}</div>
          )}

          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {state.success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title</Label>
              <Input id="title" name="title" placeholder="e.g., Mid-term Math Test" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Assessment Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class_subject_id">Class & Subject</Label>
              <Select name="class_subject_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class and subject" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects.map((cs) => (
                    <SelectItem key={cs.id} value={cs.id.toString()}>
                      {cs.classes?.grades?.name} {cs.classes?.name} - {cs.subjects?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="term_id">Term</Label>
              <Select name="term_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()}>
                      {term.academic_yr} - Term {term.term_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_score">Maximum Score</Label>
              <Input id="max_score" name="max_score" type="number" step="0.1" placeholder="e.g., 100" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_pct">Weight Percentage</Label>
              <Input
                id="weight_pct"
                name="weight_pct"
                type="number"
                step="0.1"
                placeholder="e.g., 20"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
