"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/auth/login" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const isMock = Boolean((supabase as any).__isMock)

    if (isMock) {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setIsAuthenticated(!!user)

        if (requireAuth && !user) {
          router.push(redirectTo)
          return
        }

        if (!requireAuth && user) {
          router.push("/app")
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
        if (requireAuth) {
          router.push(redirectTo)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)

      if (requireAuth && !session?.user) {
        router.push(redirectTo)
      } else if (!requireAuth && session?.user) {
        router.push("/app")
      }
    })

    return () => subscription.unsubscribe()
  }, [redirectTo, requireAuth, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}
