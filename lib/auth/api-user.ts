import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type ApiUser = {
  id: string
  isDemo: boolean
  email?: string | null
  app_metadata?: Record<string, unknown> | null
  user_metadata?: Record<string, unknown> | null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`auth_timeout_${ms}`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Resolve authenticated Supabase user, or allow demo-session cookie.
 * Checks demo cookie FIRST so Process/Export never hang on a slow Supabase auth call.
 *
 * Note: a stale demo-session cookie on a real Supabase deployment will intentionally
 * fail closed for tenant resolution (no "first company" fallback). Clear the cookie
 * when a real auth session is present.
 */
export async function requireApiUser(): Promise<ApiUser | null> {
  const cookieStore = await cookies()
  const demo = cookieStore.get("demo-session")?.value === "active"

  try {
    const client = await createClient()
    const result: any = await withTimeout(client.auth.getUser(), 2500)
    const user = result.data?.user
    if (user) {
      // Prefer real auth over a leftover demo cookie
      return {
        id: user.id,
        isDemo: false,
        email: user.email,
        app_metadata: (user.app_metadata as Record<string, unknown>) || null,
        user_metadata: (user.user_metadata as Record<string, unknown>) || null,
      }
    }
  } catch (err) {
    console.warn(
      "[auth] getUser failed/timed out:",
      err instanceof Error ? err.message : err,
    )
  }

  const syntheticDemoAllowed =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_ENABLE_SYNTHETIC_DEMO === "true"
  if (demo && syntheticDemoAllowed) {
    return { id: "demo-user", isDemo: true }
  }

  return null
}

/** Soft auth for payroll/report writes: prefer real/demo user, else allow guest processing. */
export async function requireApiUserOrGuest(): Promise<ApiUser> {
  const user = await requireApiUser()
  if (user) return user
  // Allow payroll pipeline to proceed when session cookie was not set (common in demos)
  return { id: "guest-user", isDemo: true }
}
