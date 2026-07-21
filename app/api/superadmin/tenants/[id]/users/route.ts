import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"
import { logAudit } from "@/lib/superadmin/audit"
import { createTenantAdminUser } from "@/lib/superadmin/tenant-provision"
import bcrypt from "bcrypt"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = getSuperadminDb()
    const { data: users, error } = await client
      .from("superadmin_tenant_users")
      .select("id, email, first_name, last_name, role, status, created_at, last_login_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ users: users || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const {
      email,
      password,
      first_name,
      last_name,
      role = "admin",
      create_auth_user = true,
    } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = getSuperadminDb()
    const { data: tenant } = await client
      .from("superadmin_tenants")
      .select("id, company_id, status")
      .eq("id", id)
      .maybeSingle()

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    if (tenant.status === "inactive") {
      return NextResponse.json({ error: "Cannot add users to a deactivated tenant" }, { status: 400 })
    }

    const result = await createTenantAdminUser(client, {
      tenantId: id,
      companyId: tenant.company_id,
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      role: role === "owner" || role === "user" ? role : "admin",
      createAuthUser: create_auth_user !== false,
    })

    await logAudit({
      userId: auth.userId,
      action: "tenant_user_created",
      resourceType: "tenant_user",
      resourceId: result.user.id,
      tenantId: id,
      changes: { email, first_name, last_name, role, auth_user_id: result.authUserId },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json(
      { user: result.user, auth_user_id: result.authUserId, warning: result.warning },
      { status: 201 },
    )
  } catch (err: any) {
    console.error("[v0] Tenant user POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { user_id, status, role, password, first_name, last_name } = body

    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 })

    const client = getSuperadminDb()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (role) updates.role = role
    if (first_name) updates.first_name = first_name
    if (last_name) updates.last_name = last_name
    if (password) updates.password_hash = await bcrypt.hash(password, 12)
    if (body.action === "deactivate") updates.status = "inactive"
    if (body.action === "activate") updates.status = "active"

    const { data: user, error } = await client
      .from("superadmin_tenant_users")
      .update(updates)
      .eq("id", user_id)
      .eq("tenant_id", id)
      .select("id, email, first_name, last_name, role, status, created_at")
      .single()

    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "tenant_user_updated",
      resourceType: "tenant_user",
      resourceId: user_id,
      tenantId: id,
      changes: updates,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
