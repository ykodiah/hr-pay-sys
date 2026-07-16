import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type ApiUser = {
  id: string
  isDemo: boolean
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
 */
export async function requireApiUser(): Promise<ApiUser | null> {
  const cookieStore = await cookies()
  const demo = cookieStore.get("demo-session")?.value === "active"
  if (demo) {
    return { id: "demo-user", isDemo: true }
  }

  try {
    const client = await createClient()
    const result = await withTimeout(client.auth.getUser(), 2500)
    const user = result.data?.user
    if (user) return { id: user.id, isDemo: false }
  } catch (err) {
    console.warn(
      "[auth] getUser failed/timed out:",
      err instanceof Error ? err.message : err,
    )
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
