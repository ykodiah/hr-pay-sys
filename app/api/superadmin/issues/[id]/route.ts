import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdminToken } from '@/lib/superadmin/auth'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/superadmin/audit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifySuperAdminToken(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { status, priority, resolution_notes, assigned_to } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (resolution_notes) updates.resolution_notes = resolution_notes
    if (assigned_to) updates.assigned_to = assigned_to
    if (status === 'resolved') updates.resolved_at = new Date().toISOString()

    const { data: issue, error } = await supabase
      .from('superadmin_issues')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    await logAudit({
      userId: user.id,
      action: 'issue_updated',
      resourceType: 'issue',
      resourceId: id,
      changes: updates,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json({ issue: issue?.[0] })
  } catch (error) {
    console.error('Issue PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifySuperAdminToken(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await supabase.from('superadmin_issues').delete().eq('id', id)
    if (error) throw error

    await logAudit({
      userId: user.id,
      action: 'issue_deleted',
      resourceType: 'issue',
      resourceId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Issue DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 })
  }
}
