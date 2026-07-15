"use client"

import React, { type ReactNode } from "react"

import { Loader2, ShieldAlert } from "lucide-react"

import { useRoles } from "@/hooks/use-roles"

type RoleGuardProps = {
  requiredRoles: string[]
  children?: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ requiredRoles, children, fallback }: RoleGuardProps): React.JSX.Element {
  const { roles, isLoading } = useRoles()

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving access…
      </div>
    )
  }

  const hasAccess = requiredRoles.length === 0 || requiredRoles.some((role) => roles.includes(role))

  if (!hasAccess) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center space-y-2 rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {fallback ?? (
          <>
            <ShieldAlert className="h-5 w-5" />
            <p>Access denied. Contact your administrator to request the appropriate permissions.</p>
          </>
        )}
      </div>
    )
  }

  return <>{children}</>
}
