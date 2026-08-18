"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

const MIN_PASSWORD_LENGTH = 10

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [ready, setReady] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === "PASSWORD_RECOVERY" || session) setReady(true)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use at least one lowercase letter, uppercase letter, number, and special character.")
      return
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message.toLowerCase().includes("expired") ? "This reset link has expired. Request a new one." : "We could not update your password. Request a new link and try again.")
        return
      }
      setCompleted(true)
      window.setTimeout(() => router.push("/self-service"), 1200)
    } catch {
      setError("We could not update your password. Request a new link and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <Link href="/login" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Use a strong password with at least 10 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          {completed ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Password updated. Taking you to your portal...</AlertDescription>
            </Alert>
          ) : !ready ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>This reset link is invalid or expired. Request a new link to continue.</AlertDescription>
              </Alert>
              <Button asChild className="w-full"><Link href="/forgot-password">Request a new reset link</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert> : null}
              <div className="space-y-2">
                <Label htmlFor="reset-password">New password</Label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="reset-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password">Confirm new password</Label>
                <Input id="reset-confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{isLoading ? "Updating password..." : "Update password"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
