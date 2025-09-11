import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
      console.log("[v0] Middleware - Redirecting to login: protected path without access")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (isPublicPath || hasAccess) {
      return supabaseResponse
    }

    if (!hasAccess) {
      console.log("[v0] Middleware - Redirecting to login: no access to non-public path")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware - Error:", error)
    if (isPublicPath || isDemoMode) {
      return NextResponse.next({ request })
    }
    return NextResponse.next({
      request,
    })
  }
}
