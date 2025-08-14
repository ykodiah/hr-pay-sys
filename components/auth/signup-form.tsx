"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signUp } from "@/lib/actions/auth"
import { useActionState } from "react"

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Admin Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="admin@yourschool.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required placeholder="Enter password" />
          </div>
          <div>
            <Label htmlFor="schoolName">School Name</Label>
            <Input id="schoolName" name="schoolName" type="text" required placeholder="Your School Name" />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full">
            Create Admin Account
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
