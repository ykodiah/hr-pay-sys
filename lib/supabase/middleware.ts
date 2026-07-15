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
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const clientKey = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
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

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const publicPaths = ["/", "/about", "/contact", "/careers", "/help", "/api-docs", "/auth", "/login", "/privacy", "/terms"]
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/"),
  )

  if (isPublicPath) {
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
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedPath =
    request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/self-service")

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
