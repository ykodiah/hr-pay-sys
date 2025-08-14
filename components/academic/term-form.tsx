"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { createTerm } from "@/lib/actions/academic"

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
        "Create Term"
      )}
    </Button>
  )
}

export function TermForm() {
  const [state, formAction] = useActionState(createTerm, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Term</CardTitle>
        <CardDescription>Create a new academic term</CardDescription>
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
              <Label htmlFor="academic_yr">Academic Year</Label>
              <Input id="academic_yr" name="academic_yr" placeholder="e.g., 2024/2025" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term_no">Term Number</Label>
              <Select name="term_no" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_on">Start Date</Label>
              <Input id="starts_on" name="starts_on" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_on">End Date</Label>
              <Input id="ends_on" name="ends_on" type="date" required />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="is_current" name="is_current" value="true" />
            <Label htmlFor="is_current">Set as current term</Label>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
