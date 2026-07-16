import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import { redirect } from 'next/navigation'

export async function requireSuperadminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('superadmin_token')?.value

  if (!token) {
    redirect('/superadmin/login')
  }

  const session = verifyToken(token)
  if (!session) {
    redirect('/superadmin/login')
  }

  return session
}

export async function getSuperadminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('superadmin_token')?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}
