"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      console.log("[v0] Attempting login with:", { email, hasPassword: !!password })

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("[v0] Auth error:", authError)

        if (authError.message === "Invalid login credentials") {
          if (email.includes("@akwaabahrpay.com")) {
            setError("Demo user not found. Please run the setup script or contact support.")
          } else {
            setError("Invalid email or password. Please check your credentials and try again.")
          }
        } else {
          setError(authError.message)
        }
        return
      }

      console.log("[v0] Login successful:", { user: data.user?.email })

      const { data: employee } = await supabase.from("employees").select("*").eq("email", data.user?.email).single()

      if (!employee && data.user?.email?.includes("@akwaabahrpay.com")) {
        console.log("[v0] Demo user missing employee profile, redirecting to setup")
        router.push("/auth/setup-profile")
        return
      }

      // Redirect to main app after successful login
      router.push("/app")
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      setError(error.message || "An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (type: "admin" | "employee") => {
    if (type === "admin") {
      setEmail("admin@akwaabahrpay.com")
      setPassword("demo123")
    } else {
      setEmail("employee@akwaabahrpay.com")
      setPassword("demo123")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="full" size="lg" />
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access AkwaabaHRPay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">Demo Credentials:</div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("admin")}
                  className="text-xs"
                >
                  Admin Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("employee")}
                  className="text-xs"
                >
                  Employee Demo
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
                <strong>Note:</strong> Demo users need to be created in Supabase.
                <br />
                Run the setup script or contact support if login fails.
              </div>
            </div>

            <div className="text-center space-y-2">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80">
                Forgot your password?
              </Link>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/contact" className="text-primary hover:text-primary/80 font-medium">
                  Contact Sales
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">© 2025 AkwaabaHRPay. Made with ❤️ in Ghana.</div>
      </div>
    </div>
  )
}
