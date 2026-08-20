import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { changeAuthenticatedPassword } from "@/lib/auth/change-password"
import { isUnresolvedTenant, resolveTenantContext } from "@/lib/settings/resolve-tenant"

export const dynamic = "force-dynamic"

async function context(req: NextRequest) {
  const user = await requireApiUser()
  if (!user) return { response: NextResponse.json({ error: "Unauthorized. Sign in again." }, { status: 401 }) }
  if (user.isDemo) {
    return {
      response: NextResponse.json(
        { error: "Password cannot be changed in demo mode. Sign in with your real administrator account." },
        { status: 400 },
      ),
    }
  }
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
    can_access_employee_portal: Boolean(employee?.id),
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
  try {
    await tenant.service.auth.admin.updateUserById(user.id, {
      user_metadata: { ...(user.user_metadata || {}), full_name: payload.display_name },
    })
  } catch {
    // Profile row is already saved.
  }
  return NextResponse.json({ success: true, profile: data })
}

export async function POST(req: NextRequest) {
  const resolved = await context(req)
  if ("response" in resolved) return resolved.response
  const { user, tenant } = resolved
  const body = await req.json().catch(() => ({}))
  if (!user.email) return NextResponse.json({ error: "No login email on file" }, { status: 400 })

  const { data: policy } = await tenant.service
    .from("access_control_settings")
    .select("password_min_length, password_require_uppercase, password_require_lowercase, password_require_numbers, password_require_special")
    .eq("company_id", tenant.companyId)
    .maybeSingle()

  const result = await changeAuthenticatedPassword(
    {
      email: user.email,
      userId: user.id,
      currentPassword: String(body.current_password || ""),
      newPassword: String(body.new_password || ""),
      confirmPassword: String(body.confirm_password || ""),
      userMetadata: user.user_metadata,
      companyId: tenant.companyId,
      clearPortalFlag: true,
    },
    policy,
  )
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, message: "Password updated" })
}
