import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Simple in-memory rate limiter (per-process). For distributed rate limiting,
// replace with a shared store such as Upstash Redis.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 60
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

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware - Request start:", {
    path: request.nextUrl.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
  })

  // Basic per-IP rate limit for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const clientKey = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    if (isRateLimited(clientKey)) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
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

  console.log("[v0] Middleware - Environment check:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    urlValue: supabaseUrl?.substring(0, 20) + "...",
    keyValue: supabaseAnonKey?.substring(0, 20) + "...",
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Middleware - Supabase not configured, allowing access")
    return NextResponse.next({ request })
  }

  const publicPaths = ["/", "/about", "/contact", "/careers", "/demo", "/help", "/api-docs", "/auth", "/login"]

  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/"),
  )

  const demoSession = request.cookies.get("demo-session")?.value
  const isDemoMode = demoSession === "active"

  console.log("[v0] Middleware - Demo session check:", {
    demoSession,
    isDemoMode,
    path: request.nextUrl.pathname,
    cookies: request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
  })

  if (isDemoMode) {
    const isProtectedPath =
      request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/self-service")

    if (isProtectedPath) {
      console.log("[v0] Middleware - Demo mode access granted:", {
        path: request.nextUrl.pathname,
        isDemoMode: true,
      })
      // Harden demo cookie when present
      const response = NextResponse.next({ request })
      response.cookies.set("demo-session", "active", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      })
      return response
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Middleware - User check:", {
      hasUser: !!user,
      path: request.nextUrl.pathname,
    })

    const hasAccess = user || isDemoMode

    console.log("[v0] Middleware - Auth check:", {
      hasUser: !!user,
      isDemoMode,
      hasAccess,
      path: request.nextUrl.pathname,
      isPublicPath,
    })

    const isProtectedPath =
      request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/self-service")

    if (isProtectedPath && !hasAccess) {
      console.log("[v0] Middleware - Redirecting to login:", {
        reason: "protected path without access",
        path: request.nextUrl.pathname,
        hasAccess,
        isDemoMode,
      })
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (isPublicPath || hasAccess) {
      console.log("[v0] Middleware - Access granted:", {
        path: request.nextUrl.pathname,
        isPublicPath,
        hasAccess,
      })
      return supabaseResponse
    }

    if (!hasAccess) {
      console.log("[v0] Middleware - Redirecting to login:", {
        reason: "no access to non-public path",
        path: request.nextUrl.pathname,
        hasAccess,
        isDemoMode,
      })
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware - Error:", error)
    if (isPublicPath || isDemoMode) {
      console.log("[v0] Middleware - Error fallback: allowing access due to public path or demo mode")
      return NextResponse.next({ request })
    }
    return NextResponse.next({
      request,
    })
  }
}
