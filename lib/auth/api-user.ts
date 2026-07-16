import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type ApiUser = {
  id: string
  isDemo: boolean
}

/** Resolve authenticated Supabase user, or allow demo-session cookie for local demos. */
export async function requireApiUser(): Promise<ApiUser | null> {
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (user) return { id: user.id, isDemo: false }

  const cookieStore = await cookies()
  if (cookieStore.get("demo-session")?.value === "active") {
    return { id: "demo-user", isDemo: true }
  }

  return null
}
