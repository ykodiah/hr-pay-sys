import { NextRequest, NextResponse } from 'next/server'
import { loginSuperadmin, setAuthCookie, generateToken } from '@/lib/superadmin/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const result = await loginSuperadmin(email, password)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    const { user, token } = result

    // Set secure HTTP-only cookie
    const response = NextResponse.json({ user, token })
    response.cookies.set('superadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours in seconds
      path: '/', // Must be '/' so the cookie is sent to /api/superadmin/* verify calls
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
