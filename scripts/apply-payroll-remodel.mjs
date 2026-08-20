#!/usr/bin/env node
/**
 * Apply payroll remodel + portal attendance schema migrations in order.
 * Usage: DATABASE_URL=... npm run db:migrate:payroll
 * Also accepts SUPABASE_DB_URL.
 */
import { readFile } from "node:fs/promises"
import process from "node:process"
import pg from "pg"

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error("Set DATABASE_URL or SUPABASE_DB_URL before running this migration.")
  process.exit(1)
}

const migrations = [
  "supabase/migrations/20260820164500_tenant_profiles_and_payroll_bootstrap.sql",
  "supabase/migrations/20260820170000_payroll_components_and_periods.sql",
  "supabase/migrations/20260820190000_employee_portal_attendance_geo.sql",
  "supabase/migrations/20260820210000_payroll_components_enterprise_hardening.sql",
]

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
})

try {
  await client.connect()
  for (const path of migrations) {
    const sql = await readFile(new URL(`../${path}`, import.meta.url), "utf8")
    console.log(`Applying ${path}`)
    await client.query("BEGIN")
    try {
      await client.query(sql)
      await client.query("COMMIT")
      console.log(`  OK ${path}`)
    } catch (error) {
      await client.query("ROLLBACK")
      console.error(`  FAILED ${path}`)
      throw error
    }
  }
  console.log("Payroll + attendance schema migrations applied successfully.")
} finally {
  await client.end().catch(() => undefined)
}
