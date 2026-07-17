import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdminToken } from '@/lib/superadmin/auth'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/superadmin/audit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: NextRequest) {
  try {
    const user = await verifySuperAdminToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')

    let query = supabase
      .from('superadmin_issues')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data: issues, error } = await query.limit(100)

    if (error) throw error

    return NextResponse.json({ issues })
  } catch (error) {
    console.error('Issues GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifySuperAdminToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority = 'medium', issue_type, tenant_id } = body

    if (!title || !issue_type) {
      return NextResponse.json({ error: 'Title and issue_type are required' }, { status: 400 })
    }

    const { data: issue, error } = await supabase
      .from('superadmin_issues')
      .insert([
        {
          title,
          description,
          priority,
          issue_type,
          tenant_id,
          status: 'open',
          reported_by: user.id,
        },
      ])
      .select()

    if (error) throw error

    await logAudit({
      userId: user.id,
      action: 'issue_created',
      resourceType: 'issue',
      resourceId: issue?.[0]?.id,
      changes: { title, priority, issue_type },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json({ issue: issue?.[0] })
  } catch (error) {
    console.error('Issues POST error:', error)
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 })
  }
}
