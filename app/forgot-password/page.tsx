"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

      if (resetError) {
        const message = resetError.message.toLowerCase()
        if (message.includes("rate") || message.includes("too many")) {
          setError("Too many requests. Please wait a few minutes and try again.")
        } else if (message.includes("invalid") || message.includes("email")) {
          setError("Enter a valid email address and try again.")
        } else {
          setError("We could not send the reset email. Please try again.")
        }
        return
      }

      setSent(true)
    } catch {
      setError("We could not send the reset email. Please try again.")
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
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>We&apos;ll send a secure link to the email address on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Check your email for a password reset link. The link may expire for your security.</AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/login">Return to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" placeholder="you@company.com" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Sending link..." : "Email me a reset link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
