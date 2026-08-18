import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { requireApiUser } from "@/lib/auth/api-user"
import { isUnresolvedTenant, resolveTenantContext } from "@/lib/settings/resolve-tenant"

export const dynamic = "force-dynamic"

async function context(req: NextRequest) {
  const user = await requireApiUser()
  if (!user || user.isDemo) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const tenant = await resolveTenantContext(req)
  if (tenant instanceof NextResponse) return { response: tenant }
  if (isUnresolvedTenant(tenant)) {
    return { response: NextResponse.json({ error: "Company not resolved" }, { status: 400 }) }
  }
  return { user, tenant }
}

export async function GET(req: NextRequest) {
  const resolved = await context(req)
  if ("response" in resolved) return resolved.response
  const { user, tenant } = resolved

  const [profileRes, employeeProfileRes, companyRes] = await Promise.all([
    tenant.service
      .from("tenant_user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", tenant.companyId)
      .maybeSingle(),
    tenant.service
      .from("employee_profiles")
      .select("employee_id")
      .eq("id", user.id)
      .maybeSingle(),
    tenant.service.from("companies").select("id, name").eq("id", tenant.companyId).maybeSingle(),
  ])

  let employee: any = null
  if (employeeProfileRes.data?.employee_id) {
    const { data } = await tenant.service
      .from("employees")
      .select("id, employee_id, full_name, first_name, last_name, position, department, profile_picture")
      .eq("id", employeeProfileRes.data.employee_id)
      .eq("company_id", tenant.companyId)
      .maybeSingle()
    employee = data
  }
  if (!employee && user.email) {
    const { data } = await tenant.service
      .from("employees")
      .select("id, employee_id, full_name, first_name, last_name, position, department, profile_picture")
      .eq("company_id", tenant.companyId)
      .or(`corporate_email.eq.${user.email},personal_email.eq.${user.email},email.eq.${user.email}`)
      .limit(1)
      .maybeSingle()
    employee = data
  }

  const profile = profileRes.data || {}
  const displayName =
    profile.display_name ||
    user.user_metadata?.full_name ||
    employee?.full_name ||
    `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
    user.email
  const linked = Boolean(employee?.id)
  return NextResponse.json({
    profile: {
      ...profile,
      display_name: displayName,
      job_title: profile.job_title || employee?.position || "Administrator",
      avatar_url: profile.avatar_url || employee?.profile_picture || null,
      role_label: profile.role_label || user.user_metadata?.role || "Administrator",
      email: user.email,
      company_name: companyRes.data?.name || null,
      employee_id: employee?.id || null,
      employee_code: employee?.employee_id || null,
      department: employee?.department || null,
    },
    can_access_employee_portal: linked,
  })
}

export async function PATCH(req: NextRequest) {
  const resolved = await context(req)
  if ("response" in resolved) return resolved.response
  const { user, tenant } = resolved
  const body = await req.json().catch(() => ({}))
  const payload = {
    user_id: user.id,
    company_id: tenant.companyId,
    employee_id: body.employee_id || null,
    display_name: String(body.display_name || "").trim() || null,
    job_title: String(body.job_title || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    avatar_url: String(body.avatar_url || "").trim() || null,
    role_label: String(body.role_label || "Administrator").trim(),
    bio: String(body.bio || "").trim() || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await tenant.service
    .from("tenant_user_profiles")
    .upsert(payload, { onConflict: "user_id,company_id" })
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await tenant.service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...(user.user_metadata || {}), full_name: payload.display_name },
  })
  return NextResponse.json({ success: true, profile: data })
}

export async function POST(req: NextRequest) {
  const resolved = await context(req)
  if ("response" in resolved) return resolved.response
  const { user, tenant } = resolved
  const body = await req.json().catch(() => ({}))
  const current = String(body.current_password || "")
  const next = String(body.new_password || "")
  if (!user.email || !current) return NextResponse.json({ error: "Current password is required" }, { status: 400 })
  if (next.length < 10) return NextResponse.json({ error: "New password must be at least 10 characters" }, { status: 400 })
  if (current === next) return NextResponse.json({ error: "Choose a different password" }, { status: 400 })

  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: current })
  if (verifyError) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  const { error } = await tenant.service.auth.admin.updateUserById(user.id, { password: next })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, message: "Password updated" })
}
