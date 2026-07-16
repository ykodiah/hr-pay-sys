import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSuperadminUser, verifyToken } from '@/lib/superadmin/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('superadmin_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = verifyToken(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await getCurrentSuperadminUser(token)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user, authenticated: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
