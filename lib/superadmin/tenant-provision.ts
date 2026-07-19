import type { SupabaseClient } from "@supabase/supabase-js"
import { slugify } from "@/lib/superadmin/db"

export type ProvisionTenantInput = {
  name: string
  slug?: string
  description?: string | null
  plan?: string
  status?: string
  /** When true, mark as demo and keep linking an existing company if found. */
  isDemo?: boolean
  /** Optional existing companies.id to link instead of creating a new empty company. */
  companyId?: string | null
  contactEmail?: string | null
}

/**
 * Create (or link) an empty HR company for a superadmin tenant.
 * New tenants get a blank companies + company_settings row — no seed/demo data.
 */
export async function provisionEmptyCompany(
  client: SupabaseClient,
  opts: {
    name: string
    contactEmail?: string | null
    existingCompanyId?: string | null
  },
): Promise<{ companyId: string; created: boolean }> {
  if (opts.existingCompanyId) {
    const { data: existing } = await client
      .from("companies")
      .select("id")
      .eq("id", opts.existingCompanyId)
      .maybeSingle()
    if (existing?.id) {
      await ensureEmptyCompanySettings(client, existing.id, opts.name)
      return { companyId: existing.id, created: false }
    }
  }

  const now = new Date().toISOString()
  const insertPayload: Record<string, unknown> = {
    name: opts.name,
    email_address: opts.contactEmail || null,
    divisions: [],
    departments: [],
    locations: [],
    created_at: now,
    updated_at: now,
  }

  let created: any = null
  let createError: any = null
  ;({ data: created, error: createError } = await client
    .from("companies")
    .insert(insertPayload)
    .select("id")
    .single())

  if (createError) {
    // Minimal fallback for schemas without optional columns
    ;({ data: created, error: createError } = await client
      .from("companies")
      .insert({ name: opts.name, created_at: now, updated_at: now })
      .select("id")
      .single())
  }

  if (createError || !created?.id) {
    throw new Error(createError?.message || "Failed to create companies row for tenant")
  }

  await ensureEmptyCompanySettings(client, created.id, opts.name)
  return { companyId: created.id, created: true }
}

async function ensureEmptyCompanySettings(client: SupabaseClient, companyId: string, companyName: string) {
  const now = new Date().toISOString()
  const settingsData = {
    name: companyName,
    industry: "",
    tax_id: "",
    ssnit_number: "",
    email_address: "",
    phone_number: "",
    address: "",
    divisions: [] as string[],
    departments: [] as string[],
    locations: [] as string[],
    logo_url: null as string | null,
  }

  const { data: existing } = await client
    .from("company_settings")
    .select("id")
    .eq("company_id", companyId)
    .maybeSingle()

  if (existing?.id) return

  await client.from("company_settings").upsert(
    {
      company_id: companyId,
      settings_data: settingsData,
      fiscal_year_start: "January",
      default_currency: "GHS",
      timezone: "Africa/Accra",
      language: "en",
      created_at: now,
      updated_at: now,
    },
    { onConflict: "company_id" },
  )
}

/**
 * Create a superadmin tenant linked to a real (empty) companies row.
 */
export async function createProvisionedTenant(client: SupabaseClient, input: ProvisionTenantInput) {
  const name = String(input.name || "").trim()
  if (!name) throw new Error("Tenant name is required")

  let slug = slugify(input.slug || name)
  if (!slug) slug = `tenant-${Date.now().toString(36)}`

  // Ensure unique slug
  const { data: slugClash } = await client.from("superadmin_tenants").select("id").eq("slug", slug).maybeSingle()
  if (slugClash?.id) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }

  const { companyId } = await provisionEmptyCompany(client, {
    name,
    contactEmail: input.contactEmail || null,
    existingCompanyId: input.companyId || null,
  })

  const schemaName = `schema_${slug.replace(/-/g, "_")}`.slice(0, 60)

  const { data: tenant, error } = await client
    .from("superadmin_tenants")
    .insert({
      name,
      slug,
      description: input.description || (input.isDemo ? "Demo tenant (persisted)" : null),
      plan: input.plan || "basic",
      status: input.status || "active",
      subscription_status: "active",
      company_id: companyId,
      database_schema_name: schemaName,
    })
    .select("*")
    .single()

  if (error || !tenant) {
    throw new Error(error?.message || "Failed to create superadmin tenant")
  }

  // Enable active modules (catalog only — does not seed HR payroll/employee data)
  const { data: modules } = await client.from("superadmin_modules").select("id").eq("is_active", true)
  if (modules?.length) {
    await client.from("superadmin_tenant_modules").insert(
      modules.map((m) => ({
        tenant_id: tenant.id,
        module_id: m.id,
        status: "enabled",
        enabled_at: new Date().toISOString(),
      })),
    )
  }

  return tenant
}

/**
 * Ensure the demo HR company appears as a managed tenant in the superadmin portal.
 * Idempotent — links existing company or creates a blank demo company once.
 */
export async function ensureDemoTenantPersisted(client: SupabaseClient) {
  const DEMO_SLUG = "akwaaba-demo"

  const { data: existingTenant } = await client
    .from("superadmin_tenants")
    .select("*")
    .eq("slug", DEMO_SLUG)
    .maybeSingle()

  if (existingTenant?.id) {
    // Repair missing company link
    if (!existingTenant.company_id) {
      const { companyId } = await provisionEmptyCompany(client, {
        name: existingTenant.name || "Akwaaba Demo",
        contactEmail: "admin@akwaabahrpay.com",
      })
      const { data: updated } = await client
        .from("superadmin_tenants")
        .update({ company_id: companyId, updated_at: new Date().toISOString() })
        .eq("id", existingTenant.id)
        .select("*")
        .single()
      return updated || existingTenant
    }
    return existingTenant
  }

  // Prefer linking an existing demo-ish company rather than fabricating fake employees.
  let companyId: string | null = null
  try {
    const { data: byEmail } = await client
      .from("companies")
      .select("id, name")
      .or("email_address.eq.admin@akwaabahrpay.com,email.eq.admin@akwaabahrpay.com")
      .limit(1)
      .maybeSingle()
    if (byEmail?.id) companyId = byEmail.id
  } catch {
    // ignore
  }

  if (!companyId) {
    try {
      const { data: byName } = await client
        .from("companies")
        .select("id, name")
        .ilike("name", "%akwaaba%")
        .limit(1)
        .maybeSingle()
      if (byName?.id) companyId = byName.id
    } catch {
      // ignore
    }
  }

  return createProvisionedTenant(client, {
    name: "Akwaaba Demo Tenant",
    slug: DEMO_SLUG,
    description: "Persisted demo tenant for platform testing. New customer tenants are created empty.",
    plan: "enterprise",
    status: "active",
    isDemo: true,
    companyId,
    contactEmail: "admin@akwaabahrpay.com",
  })
}

/**
 * Create a tenant admin: portal record + optional Supabase Auth user bound to company_id.
 */
export async function createTenantAdminUser(
  client: SupabaseClient,
  opts: {
    tenantId: string
    companyId: string | null
    email: string
    password: string
    firstName: string
    lastName: string
    role?: "owner" | "admin" | "user"
    createAuthUser?: boolean
  },
) {
  const bcrypt = await import("bcrypt")
  const password_hash = await bcrypt.hash(opts.password, 12)
  const role = opts.role || "admin"

  const { data: portalUser, error } = await client
    .from("superadmin_tenant_users")
    .insert({
      tenant_id: opts.tenantId,
      email: opts.email.trim().toLowerCase(),
      password_hash,
      first_name: opts.firstName,
      last_name: opts.lastName,
      role,
      status: "active",
    })
    .select("id, email, first_name, last_name, role, status, created_at")
    .single()

  if (error || !portalUser) {
    throw new Error(error?.message || "Failed to create tenant admin")
  }

  let authUserId: string | null = null
  if (opts.createAuthUser !== false) {
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: opts.email.trim().toLowerCase(),
      password: opts.password,
      email_confirm: true,
      user_metadata: {
        company_id: opts.companyId,
        first_name: opts.firstName,
        last_name: opts.lastName,
        role,
        tenant_id: opts.tenantId,
      },
      app_metadata: {
        company_id: opts.companyId,
        tenant_id: opts.tenantId,
      },
    })

    if (authError) {
      // Portal user already created — surface warning but keep portal record
      return {
        user: portalUser,
        authUserId: null,
        warning: `Tenant admin saved in portal, but Auth user failed: ${authError.message}`,
      }
    }

    authUserId = authData.user?.id || null
    if (authUserId && opts.companyId) {
      try {
        await client.from("users").upsert(
          {
            id: authUserId,
            email: opts.email.trim().toLowerCase(),
            company_id: opts.companyId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
      } catch {
        // users table optional
      }
    }
  }

  return { user: portalUser, authUserId, warning: null as string | null }
}
