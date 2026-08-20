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
import { Eye, EyeOff, Mail, Lock, AlertCircle, Zap, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const DEMO_PASSWORD = "demo123"
const DEMO_ADMIN_EMAIL = "admin@akwaabahrpay.com"
const DEMO_EMPLOYEE_EMAIL = "employee@akwaabahrpay.com"

function setDemoSessionCookie() {
  document.cookie = "demo-session=active; path=/; max-age=86400; SameSite=Lax"
}

function clearDemoSession() {
  document.cookie = "demo-session=; path=/; max-age=0; SameSite=Lax"
  localStorage.removeItem("demo_user")
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const enterDemoMode = (userType: "admin" | "employee", demoEmail: string, fullName: string) => {
    localStorage.setItem(
      "demo_user",
      JSON.stringify({
        email: demoEmail,
        type: userType,
        name: fullName,
      }),
    )
    setDemoSessionCookie()
    router.push(userType === "admin" ? "/app" : "/self-service")
  }

  const handleDemoBypass = async (userType: "admin" | "employee") => {
    setIsLoading(true)
    setError("")

    const isAdmin = userType === "admin"
    const demoEmail = isAdmin ? DEMO_ADMIN_EMAIL : DEMO_EMPLOYEE_EMAIL
    const fullName = isAdmin ? "Admin User" : "Demo Employee"

    try {
      const supabase = createClient()

      // Prefer a real Supabase Auth session when demo users exist
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: DEMO_PASSWORD,
      })

      if (!authError && authData.user) {
        clearDemoSession()
        router.push(isAdmin ? "/app" : "/self-service")
        return
      }

      // Fall back to cookie-based demo access when Auth users are not seeded
      try {
        let { data: company } = await supabase.from("companies").select("id").eq("name", "Akwaaba HR Pay Demo").single()

        if (!company) {
          const { data: newCompany } = await supabase
            .from("companies")
            .insert({
              name: "Akwaaba HR Pay Demo",
              industry: "Technology",
              address: "Accra, Ghana",
              phone: "+233 20 123 4567",
              email: "demo@akwaabahrpay.com",
            })
            .select("id")
            .single()
          company = newCompany
        }

        if (company?.id) {
          await supabase.from("employees").upsert(
            {
              employee_id: isAdmin ? "EMP001" : "EMP002",
              first_name: isAdmin ? "Admin" : "Demo",
              last_name: isAdmin ? "User" : "Employee",
              full_name: fullName,
              phone: "+233 20 123 4567",
              department: isAdmin ? "Administration" : "Human Resources",
              position: isAdmin ? "System Administrator" : "HR Assistant",
              location: "Accra Office",
              company_id: company.id,
              corporate_email: demoEmail,
              status: "active",
              hire_date: new Date().toISOString().split("T")[0],
              salary: isAdmin ? 8000 : 3500,
              currency: "GHS",
            },
            { onConflict: "corporate_email" },
          )
        }
      } catch (profileError) {
        console.warn("[v0] Demo profile setup skipped:", profileError)
      }

      enterDemoMode(userType, demoEmail, fullName)
    } catch (error: any) {
      console.error("[v0] Demo bypass error:", error)
      // Still allow demo entry if Supabase client/env issues block profile setup
      enterDemoMode(userType, demoEmail, fullName)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (
          authError.message === "Invalid login credentials" &&
          (email === DEMO_ADMIN_EMAIL || email === DEMO_EMPLOYEE_EMAIL) &&
          password === DEMO_PASSWORD
        ) {
          // Known demo accounts: fall back to cookie demo when Auth users are not seeded
          const userType = email === DEMO_ADMIN_EMAIL ? "admin" : "employee"
          enterDemoMode(userType, email, userType === "admin" ? "Admin User" : "Demo Employee")
          return
        }
        if (authError.message === "Invalid login credentials") {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setError(authError.message)
        }
        return
      }

      const authUser = data.user
      clearDemoSession()
      let employee: any = null

      if (authUser?.email) {
        const byEmail = await supabase
          .from("employees")
          .select("*")
          .or(`corporate_email.eq.${authUser.email},personal_email.eq.${authUser.email},email.eq.${authUser.email}`)
          .limit(1)
          .maybeSingle()
        employee = byEmail.data

        if (!employee) {
          const { data: profile } = await supabase
            .from("employee_profiles")
            .select("employee_id")
            .eq("id", authUser.id)
            .maybeSingle()
          if (profile?.employee_id) {
            const { data: byProfile } = await supabase
              .from("employees")
              .select("*")
              .eq("id", profile.employee_id)
              .maybeSingle()
            employee = byProfile
          }
        }
      }

      if (!employee && authUser?.email?.includes("@akwaabahrpay.com")) {
        router.push("/auth/setup-profile")
        return
      }

      const { resolvePostLoginPath } = await import("@/lib/auth/resolve-portal")
      const dest = resolvePostLoginPath({
        userMetadata: (authUser?.user_metadata as any) || null,
        appMetadata: (authUser?.app_metadata as any) || null,
        employee,
      })
      router.push(dest)
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      setError(error.message || "An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (type: "admin" | "employee") => {
    if (type === "admin") {
      setEmail(DEMO_ADMIN_EMAIL)
      setPassword(DEMO_PASSWORD)
    } else {
      setEmail(DEMO_EMPLOYEE_EMAIL)
      setPassword(DEMO_PASSWORD)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

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
            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  <Zap className="h-4 w-4" />
                  Quick Demo Access
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Skip setup and access the system instantly
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => handleDemoBypass("admin")}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-10"
                >
                  {isLoading ? "Setting up..." : "Admin Demo"}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDemoBypass("employee")}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-10"
                >
                  {isLoading ? "Setting up..." : "Employee Demo"}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with login</span>
              </div>
            </div>

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
                  <div className="whitespace-pre-line">{error}</div>
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
              <div className="text-center text-sm text-muted-foreground">Manual Demo Credentials:</div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("admin")}
                  className="text-xs"
                >
                  Fill Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("employee")}
                  className="text-xs"
                >
                  Fill Employee
                </Button>
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
