"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createGrade } from "@/lib/actions/academic"

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
        "Create Grade"
      )}
    </Button>
  )
}

export function GradeForm() {
  const [state, formAction] = useActionState(createGrade, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Grade</CardTitle>
        <CardDescription>Create a new grade level for your school</CardDescription>
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
              <Label htmlFor="name">Grade Name</Label>
              <Input id="name" name="name" placeholder="e.g., Grade 10, Form 4" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level_no">Level Number</Label>
              <Input id="level_no" name="level_no" type="number" placeholder="e.g., 10" required />
            </div>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
