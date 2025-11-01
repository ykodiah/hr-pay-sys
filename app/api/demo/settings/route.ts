import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

type DemoResourceValue =
  | "company"
  | "employees"
  | "subsidiaries"
  | "roles"
  | "subsidiary-employees"

function missingConfigResponse() {
  return NextResponse.json(
    {
      error: "Supabase service role key is not configured",
    },
    { status: 500 },
  )
}

function getServiceClient() {
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

async function resolveDemoCompany(client: ReturnType<typeof createClient>) {
  // Try to find the explicit demo company first
  const { data: demoCompany, error: demoError } = await client
    .from("companies")
    .select("*")
    .eq("name", "Akwaaba HR Pay Demo")
    .maybeSingle()

  if (demoError) {
    console.warn("[demo/settings] Failed to lookup named demo company", demoError.message)
  }

  if (demoCompany) {
    return demoCompany
  }

  const { data: fallbackCompany, error: fallbackError } = await client
    .from("companies")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (fallbackError) {
    console.error("[demo/settings] Failed to resolve fallback company", fallbackError.message)
    return null
  }

  return fallbackCompany
}

async function fetchWithCompanyGuard<T>(
  client: ReturnType<typeof createClient>,
  companyId: string,
  callback: (id: string) => Promise<{ data: T | null; error: any }>,
) {
  try {
    return await callback(companyId)
  } catch (error: any) {
    console.error("[demo/settings] Unhandled fetch error", error)
    return { data: null, error }
  }
}

export async function GET(request: NextRequest) {
  const resource = (new URL(request.url).searchParams.get("resource") as DemoResourceValue) || "company"
  const subsidiaryId = new URL(request.url).searchParams.get("subsidiaryId")

  const client = getServiceClient()
  if (!client) {
    return missingConfigResponse()
  }

  try {
    switch (resource) {
      case "company": {
        const company = await resolveDemoCompany(client)
        if (!company) {
          return NextResponse.json({ error: "No company records available" }, { status: 404 })
        }

        const { data: settings, error: settingsError } = await client
          .from("company_settings")
          .select("*")
          .eq("company_id", company.id)
          .maybeSingle()

        if (settingsError && settingsError.code !== "PGRST116") {
          // Ignore "Results contain 0 rows" error, log others
          console.warn("[demo/settings] company_settings fetch warning", settingsError.message)
        }

        return NextResponse.json({ data: { company, settings: settings ?? null } })
      }

      case "employees": {
        const company = await resolveDemoCompany(client)
        if (!company) {
          return NextResponse.json({ data: [] })
        }

        let { data, error } = await fetchWithCompanyGuard(client, company.id, (companyId) =>
          client
            .from("employees")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(200),
        )

        if (error) {
          console.warn("[demo/settings] employees fetch with company filter failed, retrying without filter", error.message)
          const fallback = await client
            .from("employees")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200)
          data = fallback.data
          error = fallback.error
        }

        if (error) {
          return NextResponse.json({ error: error.message || "Failed to load employees" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
      }

      case "subsidiaries": {
        const company = await resolveDemoCompany(client)
        if (!company) {
          return NextResponse.json({ data: [] })
        }

        let { data, error } = await fetchWithCompanyGuard(client, company.id, (companyId) =>
          client
            .from("subsidiaries")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
        )

        if (error) {
          console.warn("[demo/settings] subsidiaries fetch with company filter failed, retrying without filter", error.message)
          const fallback = await client.from("subsidiaries").select("*").order("created_at", { ascending: false })
          data = fallback.data
          error = fallback.error
        }

        if (error) {
          return NextResponse.json({ error: error.message || "Failed to load subsidiaries" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
      }

      case "roles": {
        const company = await resolveDemoCompany(client)
        if (!company) {
          return NextResponse.json({ data: [] })
        }

        let { data, error } = await fetchWithCompanyGuard(client, company.id, (companyId) =>
          client
            .from("roles")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
        )

        if (error) {
          console.warn("[demo/settings] roles fetch with company filter failed, retrying without filter", error.message)
          const fallback = await client.from("roles").select("*").order("created_at", { ascending: false })
          data = fallback.data
          error = fallback.error
        }

        if (error) {
          return NextResponse.json({ error: error.message || "Failed to load roles" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
      }

      case "subsidiary-employees": {
        if (!subsidiaryId) {
          return NextResponse.json({ error: "subsidiaryId is required" }, { status: 400 })
        }

        const { data, error } = await client
          .from("employees")
          .select("*")
          .eq("subsidiary_id", subsidiaryId)
          .order("created_at", { ascending: false })

        if (error) {
          return NextResponse.json({ error: error.message || "Failed to load subsidiary employees" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
      }

      default:
        return NextResponse.json({ error: "Unsupported resource" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[demo/settings] Unhandled error", error)
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 })
  }
}
