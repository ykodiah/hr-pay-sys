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

    const { data: backups, error } = await supabase
      .from('superadmin_backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ backups })
  } catch (error) {
    console.error('Backups GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifySuperAdminToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { backup_type = 'full', tenant_id } = body

    const backup_file_name = `backup_${backup_type}_${Date.now()}.tar.gz`
    const s3_path = `backups/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${backup_file_name}`
    const retention_until = new Date()
    retention_until.setDate(retention_until.getDate() + 90)

    const { data: backup, error } = await supabase
      .from('superadmin_backups')
      .insert([
        {
          backup_type,
          tenant_id,
          status: 'in_progress',
          s3_path,
          backup_file_name,
          created_by: user.id,
          retention_until: retention_until.toISOString().split('T')[0],
          scheduled_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error

    // Log audit
    await logAudit({
      userId: user.id,
      action: 'backup_created',
      resourceType: 'backup',
      resourceId: backup?.[0]?.id,
      changes: { backup_type, tenant_id },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json({ backup: backup?.[0] })
  } catch (error) {
    console.error('Backups POST error:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
