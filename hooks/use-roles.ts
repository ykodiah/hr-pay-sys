"use client"

import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

const DEFAULT_ROLES = ["hr-admin"]

export function useRoles() {
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const nextRoles = Array.isArray(user?.user_metadata?.roles)
          ? (user?.user_metadata?.roles as string[])
          : user?.role
            ? [user.role as string]
            : DEFAULT_ROLES
        setRoles(nextRoles)
      } catch (error) {
        console.warn("Unable to resolve user roles", error)
        setRoles(DEFAULT_ROLES)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  return { roles, isLoading }
}
