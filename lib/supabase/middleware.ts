import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Simple in-memory rate limiter (per-process).
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 300
const clientHits: Map<string, { count: number; windowStart: number }> = new Map()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = clientHits.get(key)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    clientHits.set(key, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) return true
  return false
}

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
  ms = 2500,
) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ])
    if (!result) return null
    return result.data?.user ?? null
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rate limit API routes (but never block forever)
  if (pathname.startsWith("/api")) {
    const clientKey =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    if (isRateLimited(clientKey)) {
      return new NextResponse(JSON.stringify({ error: "Too many requests. Wait a moment and retry." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
        },
      })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const publicPaths = [
    "/",
    "/about",
    "/contact",
    "/careers",
    "/j",
    "/o",
    "/help",
    "/api-docs",
    "/auth",
    "/login",
    "/privacy",
    "/terms",
    "/api/careers",
    "/api/offers/public",
  ]
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  )

  if (isPublicPath) {
    return NextResponse.next({ request })
  }

  const isProtectedPath = pathname.startsWith("/app") || pathname.startsWith("/self-service")
  const isApiPath = pathname.startsWith("/api")
  const hasDemoSession = request.cookies.get("demo-session")?.value === "active"

  // Demo session: never call Supabase auth (avoids hangs on Process/Export/Reports)
  if (hasDemoSession) {
    return NextResponse.next({ request })
  }

  // API routes: do not block on auth refresh — route handlers enforce auth themselves
  if (isApiPath) {
    return NextResponse.next({ request })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedPath) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  const user = await getUserWithTimeout(supabase, 2500)

  if (isProtectedPath && !user && !hasDemoSession) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
