import type { SupabaseClient } from "@supabase/supabase-js"
import { hashPassword } from "@/lib/superadmin/auth"

export const SEED_SUPERADMIN_EMAIL = "admin@akwaabahrpay.com"
export const SEED_SUPERADMIN_PASSWORD = "Demo@12345"

/**
 * Ensure the default superadmin user exists with a working password.
 * - Creates the user when missing
 * - Optionally resets password when `resetPassword` is true
 */
export async function ensureSeedSuperadmin(
  client: SupabaseClient,
  options?: { resetPassword?: boolean; email?: string; password?: string },
): Promise<{
  created: boolean
  reset: boolean
  email: string
  id?: string
  error?: string
}> {
  const email = (options?.email || SEED_SUPERADMIN_EMAIL).trim().toLowerCase()
  const password = options?.password || SEED_SUPERADMIN_PASSWORD

  try {
    const { data: existing, error: lookupError } = await client
      .from("superadmin_users")
      .select("id, email, status")
      .eq("email", email)
      .maybeSingle()

    // Table missing / schema not migrated
    if (lookupError && /relation|does not exist|schema cache/i.test(lookupError.message || "")) {
      return {
        created: false,
        reset: false,
        email,
        error:
          "superadmin_users table is missing. Run migration 20260716120000_superadmin_portal_schema.sql (or scripts/071_ensure_superadmin_seed.sql).",
      }
    }

    if (existing?.id) {
      if (!options?.resetPassword) {
        return { created: false, reset: false, email, id: existing.id }
      }
      const password_hash = await hashPassword(password)
      const { error: updateError } = await client
        .from("superadmin_users")
        .update({
          password_hash,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (updateError) {
        return { created: false, reset: false, email, id: existing.id, error: updateError.message }
      }
      return { created: false, reset: true, email, id: existing.id }
    }

    const password_hash = await hashPassword(password)
    const { data: created, error: insertError } = await client
      .from("superadmin_users")
      .insert({
        email,
        password_hash,
        first_name: "System",
        last_name: "Admin",
        role: "admin",
        status: "active",
      })
      .select("id")
      .single()

    if (insertError) {
      return { created: false, reset: false, email, error: insertError.message }
    }

    return { created: true, reset: false, email, id: created?.id }
  } catch (err: any) {
    return {
      created: false,
      reset: false,
      email,
      error: err?.message || "Failed to ensure seed superadmin",
    }
  }
}
