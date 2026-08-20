import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET || 'dev-secret-change-in-production'
const SALT_ROUNDS = 12

export interface SuperadminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'support' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastLoginAt?: string
}

export interface SuperadminSession {
  userId: string
  email: string
  role: string
  expiresAt: number
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain password with a bcrypt hash
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Generate a JWT token for superadmin
 */
export function generateToken(user: SuperadminUser, expiresIn: string = '24h'): string {
  const payload: SuperadminSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  return jwt.sign(payload, SUPERADMIN_JWT_SECRET, { expiresIn })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SuperadminSession | null {
  try {
    const decoded = jwt.verify(token, SUPERADMIN_JWT_SECRET) as SuperadminSession
    return decoded
  } catch (err) {
    return null
  }
}

/**
 * Login superadmin user with email and password
 */
export async function loginSuperadmin(
  email: string,
  password: string
): Promise<{ user: SuperadminUser; token: string } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceKey) {
    return {
      error:
        'Superadmin database is not configured (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).',
    }
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const normalizedEmail = String(email || '').trim().toLowerCase()
  const plainPassword = String(password || '')

  try {
    // Auto-seed default admin when missing so first login always works.
    const { ensureSeedSuperadmin } = await import(
      '@/lib/superadmin/ensure-seed'
    )
    const seed = await ensureSeedSuperadmin(supabase)

    if (seed.error && /table is missing/i.test(seed.error)) {
      return { error: seed.error }
    }

    // Fetch superadmin user (case-insensitive)
    let { data: user, error } = await supabase
      .from('superadmin_users')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (error || !user) {
      return { error: 'Invalid email or password' }
    }

    if (user.status !== 'active') {
      return { error: 'Account is not active' }
    }

    // Verify password
    const passwordMatch = await verifyPassword(plainPassword, user.password_hash)

    if (!passwordMatch) {
      return { error: 'Invalid email or password' }
    }

    // Update last login
    await supabase
      .from('superadmin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Create response user object
    const responseUser: SuperadminUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString(),
    }

    // Generate token
    const token = generateToken(responseUser)

    return { user: responseUser, token }
  } catch (err: any) {
    console.error('[v0] Superadmin login failed:', err)
    return { error: err?.message || 'Login failed' }
  }
}

/**
 * Get current superadmin user from token
 */
export async function getCurrentSuperadminUser(
  token: string
): Promise<SuperadminUser | null> {
  const session = verifyToken(token)
  if (!session) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: user } = await supabase
      .from('superadmin_users')
      .select('*')
      .eq('id', session.userId)
      .single()

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    }
  } catch (err) {
    return null
  }
}

/**
 * Verify superadmin token from request cookies or Authorization header.
 * Returns a merged session+user object usable with both call patterns:
 *   const user = await verifySuperAdminToken(req)  → returns object with .id, .email, .role
 *   const auth = await verifySuperAdminToken(req)  → object also has .valid and .userId
 * Returns null if token is missing or invalid.
 */
export async function verifySuperAdminToken(
  request: Pick<Request, 'headers'> & { cookies: { get: (name: string) => { value: string } | undefined } }
): Promise<(SuperadminSession & { id: string; valid: true; userId: string }) | null> {
  const cookieToken = request.cookies.get('superadmin_token')?.value
  const authHeader = (request.headers as Headers).get?.('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = cookieToken || bearerToken

  if (!token) return null

  const session = verifyToken(token)
  if (!session) return null

  return {
    ...session,
    id: session.userId,
    valid: true,
    userId: session.userId,
  }
}

/**
 * Set JWT token in HTTP-only cookie on a NextResponse object
 */
export function setAuthCookie(
  response: { cookies: { set: (name: string, value: string, options: object) => void } },
  token: string
): void {
  response.cookies.set('superadmin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  })
}

/**
 * Get auth token from Next.js cookie store (Server Components / Route Handlers)
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('superadmin_token')?.value || null
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('superadmin_token')
}

/**
 * Register new superadmin user (admin only)
 */
export async function registerSuperadmin(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'admin' | 'support' | 'viewer' = 'support'
): Promise<{ user: SuperadminUser } | { error: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const { data: user, error } = await supabase
      .from('superadmin_users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        status: 'active',
      })
      .select()
      .single()

    if (error || !user) {
      return { error: error?.message || 'Failed to create user' }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
      },
    }
  } catch (err: any) {
    return { error: err.message || 'Registration failed' }
  }
}
