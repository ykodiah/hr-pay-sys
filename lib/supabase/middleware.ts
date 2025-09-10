import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log("[v0] Middleware - Environment check:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    urlValue: supabaseUrl?.substring(0, 20) + "...",
    keyValue: supabaseAnonKey?.substring(0, 20) + "...",
  })

  const publicPaths = ["/", "/about", "/contact", "/careers", "/demo", "/help", "/api-docs", "/auth", "/login"]

  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/"),
  )

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Middleware - Missing Supabase environment variables")
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    // With Fluid compute, don't put this client in a global environment
    // variable. Always create a new one on each request.
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

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: If you remove getUser() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Middleware - User check:", {
      hasUser: !!user,
      path: request.nextUrl.pathname,
      isPublicPath,
    })

    if (!user && !isPublicPath && !request.nextUrl.pathname.startsWith("/app")) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      console.log("[v0] Middleware - Redirecting to login")
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith("/app") && !user) {
      // Check if demo mode is enabled (this will be handled client-side)
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      console.log("[v0] Middleware - Redirecting protected route to login")
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware - Error:", error)
    // Allow requests to continue on error
    return NextResponse.next({
      request,
    })
  }
}
